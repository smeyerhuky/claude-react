#!/usr/bin/env python3
"""Benchmark full and contracted Colorado routing in isolated processes."""
import argparse
import json
import random
import resource
import statistics
import time
from pathlib import Path

import networkx as nx
from validate_colorado_routing import full_graph
from stream_osm_roads import load_pbf


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--mode", choices=("compressed", "reference"), required=True)
    p.add_argument("--origins", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    p.add_argument("--samples", type=int, default=12)
    args = p.parse_args()
    if args.samples < 1:
        p.error("--samples must be positive")
    start = time.perf_counter()
    graph = load_pbf(args.osm)[0] if args.mode == "compressed" else full_graph(args.osm)
    build_seconds = time.perf_counter() - start
    if args.mode == "compressed":
        candidates = sorted(graph.nodes)
        origins = random.Random(20261023).sample(candidates, min(args.samples, len(candidates)))
        args.origins.write_text(json.dumps(origins) + "\n")
    else:
        origins = json.loads(args.origins.read_text())
        missing = set(origins) - set(graph.nodes)
        if missing:
            raise RuntimeError(f"Reference graph missing {len(missing)} sampled origins")
    metrics = {}
    for metric in ("length", "travel_time"):
        timings = []
        reached = []
        for origin in origins:
            t = time.perf_counter()
            costs = nx.single_source_dijkstra_path_length(graph, origin, weight=metric)
            timings.append(time.perf_counter() - t)
            reached.append(len(costs))
        metrics[metric] = {
            "runs": len(timings),
            "median_seconds": statistics.median(timings),
            "total_seconds": sum(timings),
            "reached_nodes_per_origin": reached,
        }
    result = {
        "mode": args.mode,
        "nodes": graph.number_of_nodes(),
        "edges": graph.number_of_edges(),
        "build_seconds": build_seconds,
        "peak_process_rss_kib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
        "origins": origins,
        "metrics": metrics,
    }
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
