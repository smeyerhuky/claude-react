#!/usr/bin/env python3
"""Independent sampled routing oracle for Colorado metro winner datasets.

Validates directed node-to-metro assignments, NOT geographic raster accuracy.
A green result is necessary but insufficient for production geographic regions.
"""
import argparse
import json
import random
from pathlib import Path

import networkx as nx

from colorado_metro_winners import allocate_thresholds, read_metros, snap_candidates
from stream_osm_roads import load_pbf


def validate(graph, results, count=100, seed=20261024):
    rng = random.Random(seed)
    report = {"seed": seed, "sample_target_per_dataset": count, "datasets": {},
              "limitations": ["Tests road vertices, not independently snapped geographic points",
                              "Clipped graph and omitted metro origins are not certified",
                              "Uses same graph and edge weights, but independent NetworkX shortest paths"]}
    for threshold, result in results.items():
        for metric, weight in (("distance", "length"), ("time", "travel_time")):
            sources = result["sources"]
            winners = result[metric]["winners"]
            population = list(graph.nodes)
            chosen = rng.sample(population, min(count, len(population)))
            mismatches = []
            checked = 0
            for node in chosen:
                # Directed location -> destination, not destination -> location.
                lengths = nx.single_source_dijkstra_path_length(graph, node, weight=weight)
                available = [(lengths[int(s["node"])], s["cbsa"]) for s in sources
                             if int(s["node"]) in lengths]
                stored = winners.get(str(node))
                if not available:
                    if stored is not None:
                        mismatches.append({"node": str(node), "error": "false reachable"})
                else:
                    best_cost = min(v for v, _ in available)
                    # Equal-cost ties may legitimately select either CBSA.
                    acceptable = {cbsa for cost, cbsa in available
                                  if abs(cost - best_cost) <= max(1e-6, abs(best_cost)*1e-9)}
                    if stored is None or stored["cbsa"] not in acceptable:
                        mismatches.append({"node": str(node), "stored": stored,
                                           "expected_cbsa": sorted(acceptable),
                                           "best_cost": best_cost})
                checked += 1
            key = f"{threshold}-{metric}"
            report["datasets"][key] = {"checked": checked, "mismatches": len(mismatches),
                                        "examples": mismatches[:20],
                                        "status": "pass" if not mismatches else "fail"}
    report["status"] = ("pass" if all(d["status"] == "pass"
                                     for d in report["datasets"].values()) else "fail")
    return report


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--metros", type=Path, default=Path("public/data/metros-census-2025.csv"))
    p.add_argument("--output", type=Path, default=Path("colorado-geographic-validation.json"))
    p.add_argument("--samples", type=int, default=8)
    p.add_argument("--seed", type=int, default=20261024)
    p.add_argument("--thresholds", nargs="+", type=int, default=[100000, 250000, 400000])
    args = p.parse_args()
    if args.samples < 1:
        p.error("--samples must be positive")
    graph, _ = load_pbf(args.osm)
    sources, _ = snap_candidates(graph, read_metros(args.metros))
    results = allocate_thresholds(graph, sources, args.thresholds)
    report = validate(graph, results, args.samples, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report, indent=2))
    raise SystemExit(0 if report["status"] == "pass" else 1)


if __name__ == "__main__":
    main()
