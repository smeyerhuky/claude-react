#!/usr/bin/env python3
"""Diagnostic directed road-edge midpoint samples, not geographic certification.

An edge is approximated as a straight segment between contracted graph nodes.
Midpoint origins can travel toward v on u->v, and toward u only if v->u exists.
This deliberately exposes differences from nearest-vertex raster assignments.
"""
import argparse
import json
import random
from pathlib import Path

import networkx as nx

from colorado_metro_winners import allocate_thresholds, read_metros, snap_candidates
from stream_osm_roads import load_pbf


def midpoint_oracle(graph, edge, sources, weight):
    """Compute independent origin-to-source cost from a directed edge midpoint."""
    u, v, key = edge
    # OSM loads a MultiDiGraph: each parallel edge has its own key and cost.
    possibilities = [(v, graph[u][v][key][weight] / 2)]
    if graph.has_edge(v, u):
        # Reverse arcs can be parallel. Use the cheapest available reverse
        # traversal as an approximation, not an assertion of matching geometry.
        reverse = min(attrs[weight] for attrs in graph[v][u].values())
        possibilities.append((u, reverse / 2))
    costs = []
    for start, offset in possibilities:
        lengths = nx.single_source_dijkstra_path_length(graph, start, weight=weight)
        for source in sources:
            node = int(source["node"])
            if node in lengths:
                costs.append((offset + lengths[node], source["cbsa"]))
    if not costs:
        return []
    best = min(cost for cost, _ in costs)
    return sorted({cbsa for cost, cbsa in costs
                   if abs(cost - best) <= max(1e-6, abs(best) * 1e-9)})


def diagnose(graph, results, count=4, seed=20261025):
    if count < 1:
        raise ValueError("count must be positive")
    edges = list(graph.edges(keys=True))
    if not edges:
        raise ValueError("Empty graph")
    chosen = random.Random(seed).sample(edges, min(count, len(edges)))
    report = {"status": "diagnostic-only", "seed": seed, "sampled_edges": len(chosen),
              "datasets": {}, "limitations": [
                  "Only graph-edge midpoints, not independently snapped arbitrary coordinates",
                  "Contracted edges approximated by straight lines; geometry not certified",
                  "Clipped network, incomplete metro sources, and land masking not certified",
                  "Nearest-vertex raster disagreement is diagnostic, not a routing failure"]}
    for threshold, result in results.items():
        for metric, weight in (("distance", "length"), ("time", "travel_time")):
            differences, unreachable, samples = 0, 0, []
            winners = result[metric]["winners"]
            for u, v, key in chosen:
                expected = midpoint_oracle(graph, (u, v, key), result["sources"], weight)
                vertex_cbsa = winners.get(str(u), {}).get("cbsa")
                if not expected:
                    unreachable += 1
                elif vertex_cbsa not in expected:
                    differences += 1
                samples.append({"edge": [str(u), str(v), str(key)],
                                "edge_midpoint_cbsa": expected,
                                "origin_vertex_cbsa": vertex_cbsa,
                                "differs": bool(expected and vertex_cbsa not in expected)})
            report["datasets"][f"{threshold}-{metric}"] = {
                "checked": len(chosen), "midpoint_unreachable": unreachable,
                "midpoint_vs_origin_vertex_disagreements": differences,
                "samples": samples}
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", required=True, type=Path)
    p.add_argument("--metros", type=Path, default=Path("public/data/metros-census-2025.csv"))
    p.add_argument("--output", type=Path, default=Path("colorado-geographic-validation/edge-midpoints.json"))
    p.add_argument("--samples", type=int, default=4)
    p.add_argument("--seed", type=int, default=20261025)
    args = p.parse_args()
    graph, _ = load_pbf(args.osm)
    snapped, _ = snap_candidates(graph, read_metros(args.metros))
    results = allocate_thresholds(graph, snapped, [100000, 250000, 400000])
    report = diagnose(graph, results, args.samples, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: {k: v for k, v in value.items() if k != "samples"}
                      for key, value in report["datasets"].items()}, indent=2))


if __name__ == "__main__":
    main()
