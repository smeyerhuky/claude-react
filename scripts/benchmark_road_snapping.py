"""Reproducible synthetic indexed-vs-exhaustive snapping benchmark.

Run: PYTHONPATH=scripts python scripts/benchmark_road_snapping.py
This measures a synthetic grid, not real Colorado performance or correctness.
"""
import argparse
import json
import random
import statistics
import time

import networkx as nx

from road_edge_grid_index import RoadEdgeGridIndex
from road_segment_snapping import snap_point


def build_grid(side, spacing=0.001):
    graph = nx.MultiDiGraph()
    for y in range(side):
        for x in range(side - 1):
            u = y * side + x
            a = (x * spacing, y * spacing)
            b = ((x + 1) * spacing, y * spacing)
            graph.add_edge(u, u + 1, geometry=(a, b), travel_time=10)
            graph.add_edge(u + 1, u, geometry=(b, a), travel_time=10)
    return graph


def run(side=80, queries=100, seed=17, cell_degrees=0.005):
    if side < 2 or queries < 1:
        raise ValueError("side >= 2 and queries >= 1 required")
    graph = build_grid(side)
    rng = random.Random(seed)
    points = [(rng.uniform(0, (side - 1) * 0.001),
               rng.uniform(0, (side - 1) * 0.001)) for _ in range(queries)]
    t0 = time.perf_counter()
    index = RoadEdgeGridIndex(graph, cell_degrees=cell_degrees)
    build_s = time.perf_counter() - t0
    durations = {}
    results = {}
    for mode in ("exhaustive", "indexed"):
        start = time.perf_counter()
        matches = [snap_point(graph, lon, lat, max_gap_m=150, index=index if mode == "indexed" else None)
                   for lon, lat in points]
        durations[mode] = time.perf_counter() - start
        results[mode] = matches
    if results["exhaustive"] != results["indexed"]:
        raise AssertionError("Indexed snapping diverged from exhaustive results")
    return {"graph_edges": graph.number_of_edges(), "queries": queries,
            "index_build_s": round(build_s, 6),
            "exhaustive_query_s": round(durations["exhaustive"], 6),
            "indexed_query_s": round(durations["indexed"], 6),
            "speedup_excluding_build": round(durations["exhaustive"] / max(durations["indexed"], 1e-12), 2),
            "median_candidates_per_query": statistics.median(
                len(list(index.candidates(lon, lat, 150))) for lon, lat in points),
            "parity": True, "dataset": "synthetic"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--side", type=int, default=80)
    parser.add_argument("--queries", type=int, default=100)
    parser.add_argument("--seed", type=int, default=17)
    args = parser.parse_args()
    print(json.dumps(run(args.side, args.queries, args.seed), indent=2))
