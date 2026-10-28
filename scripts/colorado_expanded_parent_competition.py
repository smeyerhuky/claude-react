#!/usr/bin/env python3
"""Expand an unapproved metro subset on exact supplied primitive parent roads."""
import argparse
import gc
import hashlib
import json
import math
from pathlib import Path
import resource
import time

import numpy as np
from scipy.sparse.csgraph import dijkstra

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_neighbor_metro_competition import validate_inventory
from colorado_metro_winners import read_metros
from colorado_sparse_parent_oracle import trace_path
from road_primitive_sparse import PrimitiveSparseBuilder
from stream_osm_roads import meters

EXPANDED_IDS = {"10740", "14500", "17820", "19740", "22140", "22660",
                "24300", "24540", "39380", "42140"}
FLAGS = ("release_eligible", "access_certified", "complete_global_competition", "road_coverage_certified")


def nearest_primitive_lead(parent, coordinate, max_gap_m=25000):
    """Spherical nearest stored vertex, OSM-ID tie break; never an access snap."""
    lon, lat = coordinate
    if (not all(math.isfinite(x) for x in coordinate) or not -180 <= lon <= 180 or
            not -85 < lat < 85 or not 0 < max_gap_m <= 25000):
        raise ValueError("Invalid bounded source investigation")
    a = (np.sin(np.radians(parent.latitude-lat)/2)**2 + math.cos(math.radians(lat)) *
         np.cos(np.radians(parent.latitude)) * np.sin(np.radians(parent.longitude-lon)/2)**2)
    if not len(a) or not np.all(np.isfinite(a)):
        raise ValueError("Missing finite primitive source geometry")
    candidates = np.flatnonzero(a == a.min())
    index = int(min(candidates, key=lambda n: int(parent.osm_ids[n])))
    node_point = [float(parent.longitude[index]), float(parent.latitude[index])]
    gap = meters(coordinate, node_point)
    if gap > max_gap_m:
        raise ValueError("Missing primitive origin lead within declared radius; no source omission")
    return {"node": int(parent.osm_ids[index]), "node_lonlat": node_point, "diagnostic_gap_m": gap}


def winners(options, field):
    finite = [(r[field], r["cbsa"]) for r in options if r[field] is not None]
    best = min((cost for cost, _ in finite), default=None)
    return ([] if best is None else sorted(cbsa for cost, cbsa in finite
            if abs(cost-best) <= max(.002, abs(best)*1e-9))), best


def expand_competition(parent, domains, regional, reference, selected_ids):
    selected = set(selected_ids)
    ids = domains["source_qualifying_cbsa_ids"]
    records = {r["cbsa"]: r for r in domains["domains"]}
    for report in (domains, regional, reference):
        if any(report.get(flag) is not False for flag in FLAGS):
            raise ValueError("Research safety mismatch")
    if (not ids or len(set(ids)) != len(ids) or len(records) != len(domains["domains"]) or
            set(records) != set(ids) or not 2 <= len(selected) <= 16 or
            len(selected) != len(selected_ids) or not selected <= set(ids) or
            regional["source_qualifying_cbsa_ids"] != ids or reference["source_qualifying_cbsa_ids"] != ids):
        raise ValueError("Complete unique matching source inventory required")
    if reference["source_provenance"] != regional["source_provenance"]:
        raise ValueError("Reference source provenance mismatch")
    if parent.report != reference["primitive_parent_graph"]:
        raise ValueError("Primitive reference graph/model mismatch")
    baseline = {s["cbsa"]: s for s in regional["sources"]}
    if (len(baseline) != len(regional["sources"]) or not baseline or not set(baseline) < selected or
            sorted(baseline) != reference["diagnostic_source_cbsa_ids"]):
        raise ValueError("Expanded sources must preserve every original source")
    sources = []
    for cbsa in sorted(selected):
        coordinate = records[cbsa]["native_representative_lonlat"]
        if cbsa in baseline:
            old = baseline[cbsa]
            if (coordinate != [old["lon"], old["lat"]] or old["access_verified"] is not False or
                    old["connector_costs_included"] is not False or old["node"] not in parent.node_index):
                raise ValueError("Original origin scenario or primitive node mismatch")
            index = parent.node_index[old["node"]]
            point = [float(parent.longitude[index]), float(parent.latitude[index])]
            if point != old["node_lonlat"]:
                raise ValueError("Original source node coordinate mismatch")
            lead = {"node": old["node"], "node_lonlat": point, "diagnostic_gap_m": meters(coordinate, point)}
            policy = "preserved-original-contracted-vertex-lead"
        else:
            lead = nearest_primitive_lead(parent, coordinate)
            policy = "additional-nearest-primitive-vertex-lead"
        sources.append({"cbsa": cbsa, "native_origin_lonlat": coordinate, **lead,
                        "lead_policy": policy, "access_verified": False, "connector_costs_included": False})
    coordinates = regional["probe_coordinates_lonlat"]
    if not coordinates or len(coordinates) > 100:
        raise ValueError("Bounded nonempty probes required")
    for probe, point in coordinates.items():
        if str(int(probe)) != probe or int(probe) not in parent.node_index:
            raise ValueError("Missing primitive probe")
        i = parent.node_index[int(probe)]
        if point != [float(parent.longitude[i]), float(parent.latitude[i])]:
            raise ValueError("Probe coordinate mismatch")
    expected = {(o, m, p) for o in ("metro-to-location", "location-to-metro")
                for m in ("length", "travel_time") for p in coordinates}
    refs = {(r["orientation"], r["metric"], r["probe"]): r for r in reference["comparisons"]}
    if len(refs) != len(reference["comparisons"]) or set(refs) != expected:
        raise ValueError("Missing or duplicate baseline reference cases")
    cases, replays, baseline_checks = [], 0, 0
    for orientation in ("metro-to-location", "location-to-metro"):
        for metric in ("length", "travel_time"):
            matrix = getattr(parent, metric)
            if orientation == "location-to-metro":
                matrix = matrix.transpose().tocsr()
            costs = {probe: [] for probe in coordinates}
            for source in sources:
                start = parent.node_index[source["node"]]
                labels, predecessors = dijkstra(matrix, directed=True, indices=start, return_predecessors=True)
                for probe in coordinates:
                    label = float(labels[parent.node_index[int(probe)]])
                    if math.isnan(label) or label < 0:
                        raise ValueError("Invalid primitive route label")
                    cost, exact = (label if math.isfinite(label) else None), None
                    if cost is not None:
                        _, total = trace_path(matrix, predecessors, start, parent.node_index[int(probe)])
                        if not math.isclose(float(total), cost, abs_tol=.002, rel_tol=1e-9):
                            raise ValueError("Primitive path replay mismatch")
                        exact = [str(total.numerator), str(total.denominator)]
                        replays += 1
                    if source["cbsa"] in baseline:
                        options = refs[(orientation, metric, probe)]["source_costs"]
                        if len(options) != len(baseline) or {r["cbsa"] for r in options} != set(baseline):
                            raise ValueError("Incomplete baseline source cost inventory")
                        old = next(r["primitive_parent_cost"] for r in options if r["cbsa"] == source["cbsa"])
                        if ((old is None) != (cost is None) or old is not None and
                                (isinstance(old, bool) or not math.isfinite(old) or old < 0 or
                                 not math.isclose(old, cost, abs_tol=.002, rel_tol=1e-9))):
                            raise ValueError("Preserved baseline source cost changed")
                        baseline_checks += 1
                    costs[probe].append({"cbsa": source["cbsa"], "graph_only_cost": cost,
                                         "exact_stored_path_cost": exact})
                del labels, predecessors
            for probe, options in costs.items():
                tied, best = winners(options, "graph_only_cost")
                previous, _ = winners([r for r in options if r["cbsa"] in baseline], "graph_only_cost")
                cases.append({"orientation": orientation, "metric": metric, "probe": probe,
                              "source_costs": options, "expanded_subset_winner_ids": tied,
                              "baseline_subset_winner_ids": previous, "best_graph_only_cost": best,
                              "subset_winner_changed": tied != previous})
            del matrix
            gc.collect()
    return {**{flag: False for flag in FLAGS}, "parent_exterior_coverage_certified": False,
            "datum_alignment_verified": False, "applied_source_exclusions": [],
            "source_qualifying_cbsa_ids": ids, "diagnostic_source_cbsa_ids": sorted(selected),
            "unrepresented_source_qualifying_cbsa_ids": sorted(set(ids)-selected),
            "sources": sources, "comparisons": cases, "baseline_source_costs_checked": baseline_checks,
            "probe_coordinates_lonlat": coordinates, "town_probe_leads": regional.get("town_probe_leads", []),
            "source_costs_computed": len(cases)*len(sources), "primitive_paths_replayed": replays,
            "changed_subset_winner_cases": sum(r["subset_winner_changed"] for r in cases),
            "primitive_parent_graph": parent.report,
            "warning": "Graph-only exploratory source expansion. Original source leads preserved; added sources use explicitly different nearest-primitive leads at unchanged native Census origins. No directed connector costs, physical/legal entry, turn/grade evidence, datum alignment, global competition, land/water or exterior closure. Path replay is not a second shortest-path solver."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ("domains", "regional-report", "parent-report", "metros", "output"):
        parser.add_argument("--"+name, type=Path, required=True)
    parser.add_argument("--parent-osm", type=Path, nargs="+", required=True)
    args = parser.parse_args()
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    domains = json.loads(args.domains.read_text())
    regional = json.loads(args.regional_report.read_text())
    reference = json.loads(args.parent_report.read_text())
    if (regional["domains_sha256"] != digest(args.domains) or
            reference["regional_report_sha256"] != digest(args.regional_report) or
            domains["source_provenance"]["metros_csv_sha256"] != digest(args.metros)):
        raise ValueError("Exact domains/regional/parent/CSV binding mismatch")
    validate_inventory(domains, read_metros(args.metros), EXPANDED_IDS)
    metadata = [source_metadata(path) for path in args.parent_osm]
    validate_sources(metadata)
    if metadata != regional["source_provenance"] or metadata != reference["source_provenance"]:
        raise ValueError("Exact parent source mismatch")
    began = time.monotonic()
    builder = PrimitiveSparseBuilder()
    for path in args.parent_osm:
        HighwayReader(builder).apply_file(str(path), locations=True, idx="sparse_mem_array")
        print(f"[expanded parent] {path.name}: {len(builder.ids)} nodes", flush=True)
    parent = builder.finish()
    del builder
    result = expand_competition(parent, domains, regional, reference, sorted(EXPANDED_IDS))
    result.update(source_provenance=metadata, domains_sha256=digest(args.domains),
                  regional_report_sha256=digest(args.regional_report), parent_report_sha256=digest(args.parent_report),
                  elapsed_seconds=time.monotonic()-began,
                  peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({k: result[k] for k in ("source_costs_computed", "baseline_source_costs_checked",
                     "primitive_paths_replayed", "changed_subset_winner_cases", "release_eligible")}))


if __name__ == "__main__":
    main()
