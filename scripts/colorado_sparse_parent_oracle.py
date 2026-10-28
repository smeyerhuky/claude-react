#!/usr/bin/env python3
"""Independent primitive-CSR costs across all supplied parent road sources."""
import argparse
from fractions import Fraction
import gc
import hashlib
import json
import math
from pathlib import Path
import resource
import time

import numpy as np
import scipy
from scipy.sparse.csgraph import dijkstra

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from road_primitive_sparse import PrimitiveSparseBuilder


def trace_path(matrix, predecessors, source, target):
    backwards=[]
    seen=set()
    current=target
    while current!=source:
        if current<0 or current in seen or len(backwards)>=matrix.shape[0]:
            raise ValueError("Invalid or cyclic primitive predecessor path")
        seen.add(current);backwards.append(current)
        current=int(predecessors[current])
    path=list(reversed(backwards+[source]))
    exact=Fraction(0)
    for u,v in zip(path,path[1:]):
        left,right=matrix.indptr[u:u+2]
        offset=int(np.searchsorted(matrix.indices[left:right],v))
        if left+offset>=right or matrix.indices[left+offset]!=v:
            raise ValueError("Predecessor path uses missing directed arc")
        exact+=Fraction.from_float(float(matrix.data[left+offset]))
    return path,exact


def compare_parent(parent, regional):
    for flag in ("release_eligible","access_certified","complete_global_competition","road_coverage_certified"):
        if regional.get(flag) is not False:
            raise ValueError("Regional source report safety mismatch")
    ids=regional["source_qualifying_cbsa_ids"]
    sources=regional["sources"]
    selected={s["cbsa"] for s in sources}
    coords=regional["probe_coordinates_lonlat"]
    if (not ids or len(ids)!=len(set(ids)) or not 2<=len(sources)<=16 or
            len(selected)!=len(sources) or not selected<=set(ids) or
            sorted(set(ids)-selected)!=regional["unrepresented_source_qualifying_cbsa_ids"]):
        raise ValueError("Incomplete or duplicate metro source inventory")
    probes=sorted(map(int,coords))
    if len(probes)!=len(set(probes)) or set(coords)!={str(n) for n in probes} or any(n not in parent.node_index for n in probes):
        raise ValueError("Missing or ambiguous primitive probe identity")
    for n in probes:
        index=parent.node_index[n]
        if coords[str(n)] != [float(parent.longitude[index]),float(parent.latitude[index])]:
            raise ValueError("Source probe coordinate mismatch")
    if any(type(s["node"]) is not int or s["node"] not in parent.node_index or str(s["node"]) not in coords for s in sources):
        raise ValueError("Missing full-parent source node")
    bounds=regional["selection_bbox"]
    if len(bounds)!=4 or not bounds[0]<bounds[2] or not bounds[1]<bounds[3]:
        raise ValueError("Explicit regional selection rectangle required")
    rows=regional["probes"]
    by_case={(r["orientation"],r["metric"],r["probe"]):r for r in rows}
    expected={(o,m,str(n)) for o in ("metro-to-location","location-to-metro") for m in ("length","travel_time") for n in probes}
    if len(by_case)!=len(rows) or set(by_case)!=expected:
        raise ValueError("Incomplete/duplicate regional directed comparisons")
    result,witnesses,checked,improvements,budget_changes=[],[],0,0,0
    for orientation in ("metro-to-location","location-to-metro"):
        for metric,budget in (("length",100000),("travel_time",3600)):
            matrix=getattr(parent,metric)
            if orientation=="location-to-metro":matrix=matrix.transpose().tocsr()
            costs_by_probe={n:[] for n in probes}
            for source in sources:
                start=parent.node_index[source["node"]]
                distances,predecessors=dijkstra(matrix,directed=True,indices=start,return_predecessors=True)
                for probe in probes:
                    row=by_case[(orientation,metric,str(probe))]
                    options=row["source_costs"]
                    if len(options)!=len(selected) or {x["cbsa"] for x in options}!=selected:
                        raise ValueError("Incomplete source-cost inventory")
                    old=next(x["cost"] for x in options if x["cbsa"]==source["cbsa"])
                    if old is not None and (isinstance(old,bool) or not isinstance(old,(int,float)) or not math.isfinite(old) or old<0):
                        raise ValueError("Invalid regional route cost")
                    value=float(distances[parent.node_index[probe]])
                    if math.isnan(value) or value<0:
                        raise ValueError("Invalid primitive oracle cost label")
                    new=value if math.isfinite(value) else None
                    tolerance=max(.002,(old or 0)*1e-9)
                    if old is not None and (new is None or new>old+tolerance):
                        raise ValueError("Primitive parent lost a regional modeled path or increased its cost")
                    improved=new is not None and (old is None or new<old-tolerance)
                    improvements+=improved
                    changed_budget=(old is not None and old<=budget)!=(new is not None and new<=budget)
                    budget_changes+=changed_budget
                    checked+=1
                    costs_by_probe[probe].append({"cbsa":source["cbsa"],"regional_cost":old,"primitive_parent_cost":new,
                                                  "improved":improved,"budget_reachability_changed":changed_budget})
                    if improved and len(witnesses)<12:
                        path,exact=trace_path(matrix,predecessors,start,parent.node_index[probe])
                        if not math.isclose(float(exact),new,rel_tol=1e-9,abs_tol=.002):
                            raise ValueError("Exact primitive witness cost disagrees with oracle label")
                        outside=sum(not(bounds[0]<=parent.longitude[n]<=bounds[2] and bounds[1]<=parent.latitude[n]<=bounds[3]) for n in path)
                        actual_path=path if orientation=="metro-to-location" else list(reversed(path))
                        witnesses.append({"source_cbsa":source["cbsa"],"probe":str(probe),"orientation":orientation,"metric":metric,
                            "outside_regional_rectangle_vertices":outside,"raw_osm_node_path":[int(parent.osm_ids[n]) for n in actual_path],
                            "exact_modeled_path_cost":[str(exact.numerator),str(exact.denominator)],
                            "interpretation":"Exterior-route lead" if outside else "Inside-region contraction/zero-arc model discrepancy: investigate before any completeness claim"})
                del distances,predecessors
            for probe,options in costs_by_probe.items():
                finite=[(o["primitive_parent_cost"],o["cbsa"]) for o in options if o["primitive_parent_cost"] is not None]
                best=min((c for c,_ in finite),default=None)
                tied=[] if best is None else sorted(cbsa for cost,cbsa in finite if abs(cost-best)<=max(.002,best*1e-9))
                previous=by_case[(orientation,metric,str(probe))]["subset_winner_ids"]
                result.append({"probe":str(probe),"metric":metric,"orientation":orientation,"source_costs":options,
                               "regional_subset_winner_ids":previous,"primitive_parent_subset_winner_ids":tied,
                               "subset_winner_changed":previous!=tied,"best_parent_cost":best})
            del matrix
            gc.collect()
    return {"release_eligible":False,"access_certified":False,"complete_global_competition":False,"road_coverage_certified":False,
            "parent_exterior_coverage_certified":False,"source_qualifying_cbsa_ids":sorted(ids),
            "diagnostic_source_cbsa_ids":sorted(selected),"unrepresented_source_qualifying_cbsa_ids":sorted(set(ids)-selected),
            "applied_source_exclusions":[],"independent_primitive_source_costs_checked":checked,
            "improved_source_cost_cases":improvements,"changed_isochrone_budget_cases":budget_changes,
            "changed_subset_winner_cases":sum(r["subset_winner_changed"] for r in result),"comparisons":result,
            "changed_route_witnesses":witnesses,"witness_limit":12,"primitive_parent_graph":parent.report,
            "origin_contract":regional["origin_contract"],"metric_units":regional["metric_units"],
            "warning":"Independent primitive graph for all supplied PBF roads only, not global source/road closure. Zero arcs are retained and parallels use metric-specific minima under a node-state model without turn penalties. Node-path witnesses do not retain parallel-way identity and are not legal-access evidence."}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument("--regional-report",type=Path,required=True)
    p.add_argument("--parent-osm",type=Path,nargs="+",required=True)
    p.add_argument("--output",type=Path,required=True)
    args=p.parse_args()
    regional=json.loads(args.regional_report.read_text())
    sources=[source_metadata(path) for path in args.parent_osm]
    validate_sources(sources)
    if sources!=regional["source_provenance"]:
        raise ValueError("Exact parent/regional source bytes or timestamps mismatch")
    began=time.monotonic()
    builder=PrimitiveSparseBuilder()
    for path in args.parent_osm:
        HighwayReader(builder).apply_file(str(path),locations=True,idx="sparse_mem_array")
        print(f"[primitive parent] {path.name}: {len(builder.ids)} nodes /{len(builder.u)} directed arcs",flush=True)
    parent=builder.finish()
    print(f"[primitive parent] CSR ready: {parent.report}",flush=True)
    result=compare_parent(parent,regional)
    result.update(source_provenance=sources,regional_report_sha256=hashlib.sha256(args.regional_report.read_bytes()).hexdigest(),
                  scipy_version=scipy.__version__,elapsed_seconds=time.monotonic()-began,
                  peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k:result[k] for k in ("independent_primitive_source_costs_checked","improved_source_cost_cases","changed_subset_winner_cases","peak_process_rss_kib","release_eligible")},indent=2))


if __name__=="__main__":main()
