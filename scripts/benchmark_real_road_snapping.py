"""Benchmark real OSM road geometry against exhaustive snapping.

Usage: PYTHONPATH=scripts python scripts/benchmark_real_road_snapping.py \
    --osm local-data/roads.osm.pbf --queries 30 --output local-data/snapping-benchmark.json
Requires a locally acquired filtered OSM PBF. No download or geographic
correctness claim is performed by this script.
"""
import argparse
import json
import random
import time
from pathlib import Path

from road_access_real_audit import audit_samples
from road_edge_grid_index import RoadEdgeGridIndex
from road_segment_snapping import snap_point
from stream_osm_roads import load_pbf


def run(path, queries=30, seed=17, radius_m=150, cell_degrees=0.02):
    if queries < 1 or radius_m < 0:
        raise ValueError("queries must be positive and radius nonnegative")
    t0 = time.perf_counter()
    graph, ways = load_pbf(path)
    load_s = time.perf_counter() - t0
    if graph.number_of_edges() == 0:
        raise ValueError("No directed road edges in OSM extract")
    rng = random.Random(seed)
    edges = list(graph.edges(keys=True, data=True))
    samples = []
    for _ in range(queries):
        _, _, _, data = rng.choice(edges)
        geometry = data["geometry"]
        a, b = rng.choice(list(zip(geometry, geometry[1:])))
        fraction = rng.random()
        samples.append((a[0] + (b[0] - a[0]) * fraction,
                        a[1] + (b[1] - a[1]) * fraction))
    t0 = time.perf_counter()
    index = RoadEdgeGridIndex(graph, cell_degrees=cell_degrees)
    build_s = time.perf_counter() - t0
    durations = {}
    matches = {}
    for mode in ("exhaustive", "indexed"):
        t0 = time.perf_counter()
        matches[mode] = [snap_point(graph, lon, lat, max_gap_m=radius_m,
                                    index=index if mode == "indexed" else None)
                         for lon, lat in samples]
        durations[mode] = time.perf_counter() - t0
    if matches["exhaustive"] != matches["indexed"]:
        raise AssertionError("Indexed snapping differs from exhaustive scan")
    access_audit = audit_samples(graph, samples, index, radius_m=radius_m)
    return {"access_audit": access_audit, "dataset": str(path), "osm_ways": ways, "nodes": graph.number_of_nodes(),
            "directed_edges": graph.number_of_edges(), "queries": queries,
            "graph_load_s": load_s, "index_build_s": build_s,
            "exhaustive_query_s": durations["exhaustive"],
            "indexed_query_s": durations["indexed"],
            "query_only_speedup": durations["exhaustive"] / max(durations["indexed"], 1e-12),
            "parity": True, "note": "Samples lie on OSM road geometry; not an independent access oracle"}


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--osm", type=Path, required=True)
    parser.add_argument("--queries", type=int, default=30)
    parser.add_argument("--seed", type=int, default=17)
    parser.add_argument("--radius-m", type=float, default=150)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    report = run(args.osm, args.queries, args.seed, args.radius_m)
    result = json.dumps(report, indent=2)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(result + "\n")
    print(result)
