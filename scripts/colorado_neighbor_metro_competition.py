#!/usr/bin/env python3
"""Unapproved interstate metro-source subset; never global winner certification."""
import argparse
import csv
import gc
import hashlib
import io
import json
import math
from pathlib import Path
import resource

import networkx as nx

from colorado_adjacent_route_witnesses import CorridorWays, PROBES, build_graph
from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_metro_winners import read_metros, snap_candidates
from colorado_origin_scenarios import CENSUS_SCENARIO, lonlat
from colorado_road_subdivision_preservation import baseline_snapshot, verify_expansion
from road_spike import assign

SELECTED_CBSAS = {"10740", "22140", "39380", "42140"}
BOUNDS = (-109.1, 35., -102., 38.4)
WAY_BUDGET, NODE_BUDGET = 350000, 650000
PROBE_PLACES = {"0802355":"Antonito town", "0838535":"Ignacio town", "0868105":"San Luis town"}


def select_probe_places(rows):
    by_id={}
    for row in rows:
        geoid=row["GEOID"]
        if geoid in by_id:raise ValueError("Duplicate Census probe place identity")
        by_id[geoid]=row
    result=[]
    for geoid,name in sorted(PROBE_PLACES.items()):
        row=by_id.get(geoid)
        if row is None or row["NAME"]!=name or row["USPS"]!="CO" or row["LSAD"]!="43" or row["FUNCSTAT"]!="A":
            raise ValueError("Missing or mismatched official Colorado town probe")
        coord=lonlat(row["INTPTLONG"],row["INTPTLAT"])
        result.append({"cbsa":"diagnostic-place:"+geoid,"name":name,"lon":coord[0],"lat":coord[1],"place_geoid":geoid})
    return result


def validate_inventory(domains, metros, selected_ids):
    for flag in ("release_eligible", "access_certified", "road_coverage_certified", "complete_global_competition"):
        if domains.get(flag) is not False:
            raise ValueError("Research source-domain safety mismatch")
    ids = domains["source_qualifying_cbsa_ids"]
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("Missing or duplicate full supplied-source inventory")
    records = {r["cbsa"]: r for r in domains["domains"]}
    if len(records) != len(domains["domains"]) or set(records) != set(ids):
        raise ValueError("Incomplete source-domain inventory")
    eligible = [m for m in metros if m["population"] >= 100000]
    legacy = {m["cbsa"]: m for m in eligible}
    if len(legacy) != len(eligible) or sorted(legacy) != domains["existing_csv_cbsa_ids"] or not set(legacy) <= set(ids):
        raise ValueError("Legacy CSV source identity inventory mismatch")
    if not selected_ids or len(selected_ids)!=len(set(selected_ids)) or len(set(selected_ids))<2 or not set(selected_ids)<=set(legacy):
        raise ValueError("Missing or nonqualifying selected diagnostic metro")
    for m in eligible:
        r = records[m["cbsa"]]
        if (r["name"] != m["name"] or r["source_population"] != m["population"] or
                r["native_representative_lonlat"] != [m["lon"],m["lat"]]):
            raise ValueError("Census source name/population/representative point mismatch")
    return [legacy[cbsa] for cbsa in sorted(selected_ids)]


def baseline_origin_coverage(sources, retained_rows, baseline_nodes):
    wanted={s["node"] for s in sources}
    raw={node for _,points in retained_rows.values() for node,_,_ in points if node in wanted}
    return [{"cbsa":s["cbsa"],"node":s["node"],
             "retained_raw_source_geometry_present":s["node"] in raw,
             "retained_contracted_source_node_present":s["node"] in baseline_nodes}
            for s in sorted(sources,key=lambda s:s["cbsa"])]


def audit_competition(graph, sources, probes, eligible_ids):
    ids,probes=list(eligible_ids),list(probes)
    selected={s["cbsa"] for s in sources}
    if (not graph.is_directed() or not graph.is_multigraph() or len(ids)!=len(set(ids)) or
            len(sources)<2 or len(selected)!=len(sources) or not selected<=set(ids) or
            not probes or len(probes)!=len(set(probes)) or
            any(n not in graph for n in probes+[s["node"] for s in sources])):
        raise ValueError("Explicit complete inventory, distinct sources and present probes required")
    for _,_,d in graph.edges(data=True):
        for metric in ("length","travel_time"):
            value=d.get(metric)
            if isinstance(value,bool) or not isinstance(value,(int,float)) or not math.isfinite(value) or value<0:
                raise ValueError("Finite explicit directed costs required")
    rows,independent_costs,budget_checks=[],0,0
    for orientation in ("metro-to-location","location-to-metro"):
        oriented=graph if orientation=="metro-to-location" else graph.reverse(copy=False)
        for metric,budget in (("length",100000),("travel_time",3600)):
            truth={p:[] for p in probes}
            for source in sources:
                distances=nx.single_source_dijkstra_path_length(oriented,source["node"],weight=metric)
                isochrone=assign(graph,[source],metric,orientation=orientation,max_cost=budget)
                for probe in probes:
                    cost=distances.get(probe)
                    truth[probe].append({"cbsa":source["cbsa"],"cost":cost,
                                         "status":"reachable" if cost is not None else "unreachable_in_selected_directed_graph"})
                    independent_costs+=1
                    if (str(probe) in isochrone)!=(cost is not None and cost<=budget):
                        raise ValueError("Independent directed isochrone budget disagreement")
                    budget_checks+=1
                del distances,isochrone
            labels=assign(graph,sources,metric,orientation=orientation)
            for probe in probes:
                options=truth[probe]
                reachable=[(r["cost"],r["cbsa"]) for r in options if r["cost"] is not None]
                actual=labels.get(str(probe))
                if not reachable:
                    if actual is not None:raise ValueError("Allocator reached oracle-unreachable probe")
                    tied,best=[],None
                else:
                    best=min(c for c,_ in reachable)
                    tied=sorted(cbsa for cost,cbsa in reachable if abs(cost-best)<=max(.002,abs(best)*1e-9))
                    if actual is None or actual["cbsa"] not in tied or not math.isclose(actual["cost"],best,rel_tol=1e-9,abs_tol=.002):
                        raise ValueError("Independent directed metro-subset winner/cost disagreement")
                rows.append({"probe":str(probe),"orientation":orientation,"metric":metric,
                             "subset_winner_ids":tied,"best_subset_cost":best,"source_costs":options})
            del labels
    return {"release_eligible":False,"access_certified":False,"complete_global_competition":False,
            "road_coverage_certified":False,"datum_alignment_verified":False,
            "source_qualifying_cbsa_ids":sorted(ids),"diagnostic_source_cbsa_ids":sorted(selected),
            "unrepresented_source_qualifying_cbsa_ids":sorted(set(ids)-selected),
            "applied_source_exclusions":[],"origin_policy":CENSUS_SCENARIO,
            "origin_contract":"Unapproved nearest contracted-node leads from Census representative points. Connector costs excluded; no named-city substitution or physical/legal access claim.",
            "sources":sources,"probes":rows,
            "probe_coordinates_lonlat":{str(n):[graph.nodes[n]["x"],graph.nodes[n]["y"]] for n in probes},
            "independent_source_costs_checked":independent_costs,"single_source_isochrone_probe_checks":budget_checks,
            "oracle_disagreements":0,
            "isochrone_contract":"Directed graph-vertex reachability only, 100000 meters /3600 seconds; distinct from competition, no continuous polygon or access claim",
            "metric_units":{"length":"meters","travel_time":"seconds"},
            "warning":"Conditional competition among selected diagnostic sources only. Unrepresented eligible IDs remain unknown, never excluded; graph and connector completeness unresolved."}


def main():
    p=argparse.ArgumentParser(description=__doc__)
    for arg in ("interfaces","domains","metros","places","output"):
        p.add_argument("--"+arg,type=Path,required=True)
    p.add_argument("--parent-osm",type=Path,nargs="+",required=True)
    args=p.parse_args()
    domains=json.loads(args.domains.read_text())
    if hashlib.sha256(args.metros.read_bytes()).hexdigest()!=domains["source_provenance"]["metros_csv_sha256"]:
        raise ValueError("Census CSV provenance mismatch")
    metros=validate_inventory(domains,read_metros(args.metros),SELECTED_CBSAS)
    selection=json.loads(Path(__file__).with_name("colorado_origin_scenario_places.json").read_text())
    raw_places=args.places.read_bytes()
    if hashlib.sha256(raw_places).hexdigest()!=selection["gazetteer_sha256"]:
        raise ValueError("Gazetteer source changed; review and version before reuse")
    place_rows=[{k.strip():v.strip() for k,v in row.items()} for row in csv.DictReader(io.StringIO(raw_places.decode("utf-8-sig")),delimiter="|")]
    probe_places=select_probe_places(place_rows)
    sources_meta=[source_metadata(path) for path in args.parent_osm]
    validate_sources(sources_meta)
    interface=json.loads(args.interfaces.read_text())
    if (interface.get("method")!="snapshot-consistent-supplied-source-union-raw-interfaces-v1" or
            interface.get("release_eligible") is not False or interface.get("access_certified") is not False or
            len(interface["sources"])!=len(sources_meta) or
            any(any(s[k]!=r[k] for k in s) for s,r in zip(sources_meta,interface["sources"]))):
        raise ValueError("Exact source union provenance/safety mismatch")
    collector=CorridorWays(BOUNDS,max_ways=WAY_BUDGET)
    HighwayReader(collector).apply_file(str(args.parent_osm[0]),locations=True,idx="sparse_mem_array")
    retained_rows=dict(collector.rows)
    baseline=build_graph(retained_rows,max_nodes=NODE_BUDGET)
    baseline_nodes=set(baseline)
    snapshot=baseline_snapshot(baseline)
    print(f"[neighbor metros] baseline {len(retained_rows)} ways /{len(baseline)} nodes",flush=True)
    del baseline
    gc.collect()
    for path in args.parent_osm[1:]:
        HighwayReader(collector).apply_file(str(path),locations=True,idx="sparse_mem_array")
    graph=build_graph(collector.rows,max_nodes=NODE_BUDGET)
    preservation=verify_expansion(snapshot,graph)
    del snapshot
    gc.collect()
    sources,rejected=snap_candidates(graph,metros,max_snap_m=25000)
    if rejected or {s["cbsa"] for s in sources}!=SELECTED_CBSAS:
        raise ValueError("Missing selected diagnostic origin; no silent source omission")
    wanted={s["node"] for s in sources}
    coverage=baseline_origin_coverage(sources,retained_rows,baseline_nodes)
    for source in sources:
        source.update(access_verified=False,connector_costs_included=False,
                      node_lonlat=[graph.nodes[source["node"]]["x"],graph.nodes[source["node"]]["y"]])
    place_candidates,missing_places=snap_candidates(graph,probe_places,max_snap_m=500)
    if missing_places or len(place_candidates)!=len(PROBE_PLACES):
        raise ValueError("Missing bounded town query lead; no geometric fallback")
    place_probes=[{"place_geoid":q["place_geoid"],"place_name":q["name"],"source_state":"CO",
                   "query_representative_lonlat":[q["lon"],q["lat"]],"road_node":q["node"],
                   "road_node_lonlat":[graph.nodes[q["node"]]["x"],graph.nodes[q["node"]]["y"]],
                   "diagnostic_gap_m":q["snap_m"],"destination_connector_verified":False,
                   "destination_connector_costs_included":False} for q in place_candidates]
    selected_way_count=len(collector.rows)
    del retained_rows,collector,baseline_nodes
    gc.collect()
    probes=sorted(set(PROBES)|wanted|{q["road_node"] for q in place_probes})
    print(f"[neighbor metros] union {selected_way_count} ways /{len(graph)} nodes /{graph.number_of_edges()} edges",flush=True)
    result=audit_competition(graph,sources,probes,domains["source_qualifying_cbsa_ids"])
    result.update({"source_provenance":sources_meta,"census_source_provenance":domains["source_provenance"],
                   "domains_sha256":hashlib.sha256(args.domains.read_bytes()).hexdigest(),
                   "interface_report_sha256":hashlib.sha256(args.interfaces.read_bytes()).hexdigest(),
                   "legacy_csv_cbsa_ids":domains["existing_csv_cbsa_ids"],"selection_bbox":BOUNDS,
                   "town_probe_leads":place_probes,"gazetteer_sha256":selection["gazetteer_sha256"],"gazetteer_url":selection["gazetteer_url"],
                   "selected_ways":selected_way_count,"graph_nodes":len(graph),"graph_edges":graph.number_of_edges(),
                   "resource_limits":{"ways":WAY_BUDGET,"nodes":NODE_BUDGET},
                   "peak_process_rss_kib":resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                   "baseline_source_coverage":coverage,"baseline_path_preservation":preservation,
                   "missing_baseline_raw_source_cbsa_ids":sorted(q["cbsa"] for q in coverage if not q["retained_raw_source_geometry_present"]),
                   "baseline_sources_requiring_junction_promotion":sorted(q["cbsa"] for q in coverage if q["retained_raw_source_geometry_present"] and not q["retained_contracted_source_node_present"]),
                   "origin_coordinates_native_crs":domains["native_crs"],"source_projection":domains["source_projection"],"routing_model":dict(graph.graph),
                   "baseline_selected_source_competition_computed":False,
                   "baseline_comparison_status":"Diagnostic raw/node coverage only; no baseline competing winners computed while source coverage and junction promotion remain unresolved"})
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,sort_keys=True,indent=2)+"\n")
    print(json.dumps({k:result[k] for k in ("diagnostic_source_cbsa_ids","independent_source_costs_checked","single_source_isochrone_probe_checks","peak_process_rss_kib","release_eligible")},indent=2))


if __name__=="__main__":main()
