#!/usr/bin/env python3
"""Real parent-relative cut bounds; not global competition or access approval."""
import argparse
from fractions import Fraction
import gc
import hashlib
import json
from pathlib import Path

import networkx as nx

from colorado_metro_winners import read_metros
from colorado_road_subdivision_preservation import baseline_snapshot, verify_expansion
from road_boundary_relaxation import conditional_cut_bounds, promote_raw_ports
from road_spike import assign
from stream_osm_roads import load_pbf, meters

FIXED_SOURCES = {"14500": 176404071, "17820": 4152315425, "19740": 6350018589}


def digest(path):
    with path.open("rb") as handle:
        return hashlib.file_digest(handle, "sha256").hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--extract-osm", type=Path, required=True)
    p.add_argument("--parent-osm", type=Path, required=True)
    p.add_argument("--interfaces", type=Path, required=True)
    p.add_argument("--metros", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    interface = json.loads(args.interfaces.read_text())
    matches = [r for r in interface["extracts"] if r["name"] == args.extract_osm.name]
    if (len(matches) != 1 or interface["parent_osm_sha256"] != digest(args.parent_osm) or
            matches[0]["osm_sha256"] != digest(args.extract_osm) or
            interface["routing_model"] != "static-passenger-car-v2:raw-topology" or
            interface["release_eligible"] is not False or interface["extract_coverage_certified"] is not False or
            matches[0]["way_reference_tag_coordinate_inclusion_verified"] is not True):
        raise ValueError("Interface source/model/safety mismatch")
    ports = matches[0]["raw_interface_nodes"]
    if len(ports) != matches[0]["retained_raw_interface_node_count"] or not ports:
        raise ValueError("Incomplete or empty interface nodes")
    eligible = [m for m in read_metros(args.metros) if m["population"] >= 100000]
    ids = [m["cbsa"] for m in eligible]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate qualifying CBSA")
    sources = [{**m, "node": FIXED_SOURCES[m["cbsa"]]} for m in eligible if m["cbsa"] in FIXED_SOURCES]
    sources.sort(key=lambda s: s["cbsa"])
    if {s["cbsa"] for s in sources} != set(FIXED_SOURCES):
        raise ValueError("Missing fixed research source")
    probes = sorted(set(FIXED_SOURCES.values()) | {176941993, 176985903})
    graph, _ = load_pbf(args.extract_osm)
    if graph.graph.get("routing_model") != "static-passenger-car-v2":
        raise ValueError("Review cut assumptions after routing model change")
    if any(n not in graph for n in probes):
        raise ValueError("Fixed real-data probe/source disappeared")
    for source in sources:
        node = graph.nodes[source["node"]]
        if meters((source["lon"], source["lat"]), (node["x"], node["y"])) > 25000:
            raise ValueError("Fixed research source no longer a bounded origin lead")
    snapshot = baseline_snapshot(graph)
    extract_model = dict(graph.graph)
    promotion = promote_raw_ports(graph, ports)
    preservation = verify_expansion(snapshot, graph)
    exits = {p["osm_node_id"] for p in ports if p["can_exit_retained_way_set"]}
    entries = {p["osm_node_id"] for p in ports if p["can_enter_retained_way_set"]}
    bounds = {}
    for orientation in ("metro-to-location", "location-to-metro"):
        bounds[orientation] = {}
        for metric in ("length", "travel_time"):
            print(f"[cut] {orientation} {metric}", flush=True)
            bounds[orientation][metric] = conditional_cut_bounds(graph, sources, probes, exits, entries,
                metric=metric, orientation=orientation, margin=1 if metric == "length" else .1)
    del graph
    gc.collect()
    print("[parent] loading full original Colorado graph for independent checks", flush=True)
    parent, _ = load_pbf(args.parent_osm, max_nodes=1500000)
    parent_preservation = verify_expansion(snapshot, parent)
    del snapshot
    gc.collect()
    if any(n not in parent for n in probes):
        raise ValueError("Parent graph lost fixed source/probe")
    checks, source_checks, conditional = [], 0, 0
    for orientation in ("metro-to-location", "location-to-metro"):
        oriented = parent if orientation == "metro-to-location" else parent.reverse(copy=False)
        for metric in ("length", "travel_time"):
            print(f"[parent oracle] {orientation} {metric}", flush=True)
            truth = {probe: [] for probe in probes}
            for source in sources:
                distances = nx.single_source_dijkstra_path_length(oriented, source["node"], weight=metric)
                for probe in probes:
                    if probe in distances:
                        truth[probe].append((distances[probe], source["cbsa"]))
                del distances
            production = assign(parent, sources, metric, orientation=orientation)
            rows = {r["probe"]: r for r in bounds[orientation][metric]["probes"]}
            for probe in probes:
                options = sorted(truth[probe])
                if not options:
                    raise ValueError("Expected real parent probe became unreachable")
                best, _ = options[0]
                tolerance = max(.002, best*1e-9)
                tied = sorted(cbsa for cost, cbsa in options if abs(cost-best) <= tolerance)
                label = production.get(str(probe))
                if label is None or label["cbsa"] not in tied or abs(label["cost"]-best) > tolerance:
                    raise ValueError("Independent full-parent winner/cost disagreement")
                row = rows[str(probe)]
                by_source = {r["cbsa"]: r for r in row["source_bounds"]}
                for cost, cbsa in options:
                    lower = by_source[cbsa]["parent_relative_lower_bound"]
                    upper = by_source[cbsa]["known_path_upper_bound"]
                    if lower is None or Fraction(*map(int, lower["exact"])) > Fraction(cost)+Fraction(str(tolerance)):
                        raise ValueError("Cut lower bound contradicts independent parent route")
                    if upper is not None and Fraction(cost) > Fraction(*map(int, upper["exact"]))+Fraction(str(tolerance)):
                        raise ValueError("Known path upper bound contradicts parent route")
                    source_checks += 1
                proven = row["conditional_subset_winner"]
                if proven is not None:
                    if proven not in tied:
                        raise ValueError("Conditional subset winner contradicts parent oracle")
                    conditional += 1
                checks.append({"probe": str(probe), "metric": metric, "orientation": orientation,
                               "known_graph_incumbent": row["incumbent"], "parent_winner_ids": tied,
                               "parent_best_cost": best, "conditional_subset_winner": proven})
            del production
    result = {"release_eligible": False, "access_certified": False, "extract_coverage_certified": False,
              "complete_global_competition": False, "qualifying_cbsa_ids": sorted(ids),
              "omitted_qualifying_cbsa_ids": sorted(set(ids)-set(FIXED_SOURCES)),
              "sources": sources, "origin_contract": "Same three fixed unapproved baseline graph vertices; connector costs excluded; no urban-origin substitution",
              "port_promotion": promotion, "known_path_preservation_after_promotion": preservation,
              "known_path_preservation_in_parent": parent_preservation,
              "parent_graph_nodes": parent.number_of_nodes(), "parent_graph_edges": parent.number_of_edges(),
              "extract_routing_model": extract_model, "parent_routing_model": dict(parent.graph),
              "bounds": bounds, "independent_parent_checks": checks,
              "independent_parent_source_costs_checked": source_checks,
              "conditional_subset_winners_checked": conditional, "disagreements": 0,
              "warning": "Only parent-relative modeled subset bounds; missing national competitors, parent-exterior roads, connectors, legal turns/access and geographic coverage remain uncertified",
              "source_hashes": {"extract_osm": digest(args.extract_osm), "parent_osm": interface["parent_osm_sha256"],
                                "interfaces": digest(args.interfaces), "metros_csv": digest(args.metros)}}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({"release_eligible": False, "parent_graph_nodes": parent.number_of_nodes(),
                      "parent_graph_edges": parent.number_of_edges(), "parent_source_costs_checked": source_checks,
                      "conditional_subset_winners_checked": conditional, "disagreements": 0}, indent=2))


if __name__ == "__main__":
    main()
