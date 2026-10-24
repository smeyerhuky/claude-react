#!/usr/bin/env python3
"""Deterministic directed point-to-point Colorado routing benchmark."""
import argparse
import json
import math
import random
import resource
import statistics
import time
from pathlib import Path

import networkx as nx
from stream_osm_roads import load_pbf
from validate_colorado_routing import full_graph

METRICS = ("length", "travel_time")
TOLERANCE = 0.001


def route(graph, source, target, metric):
    start = time.perf_counter()
    try:
        cost, path = nx.bidirectional_dijkstra(graph, source, target, weight=metric)
    except nx.NetworkXNoPath:
        cost, path = None, None
    return cost, path, time.perf_counter() - start


def make_pairs(graph, origins, destinations, seed):
    """Sample directed pairs from retained nodes; add self and reversed pairs."""
    if origins < 1 or destinations < 1:
        raise ValueError("origins and destinations must be positive")
    nodes = sorted(graph.nodes)
    if not nodes:
        raise ValueError("Graph is empty")
    rng = random.Random(seed)
    sources = rng.sample(nodes, min(origins, len(nodes)))
    pairs = []
    for source in sources:
        targets = rng.sample(nodes, min(destinations, len(nodes)))
        for target in targets:
            pairs.append([source, target])
            pairs.append([target, source])
        pairs.append([source, source])
    return list(dict.fromkeys(tuple(pair) for pair in pairs))


def evaluate(graph, pairs):
    results = []
    for source, target in pairs:
        if source not in graph or target not in graph:
            raise ValueError(f"Missing retained endpoint: {source}, {target}")
        for metric in METRICS:
            cost, path, seconds = route(graph, source, target, metric)
            results.append({"source": source, "target": target, "metric": metric,
                            "cost": cost, "hops": None if path is None else len(path)-1,
                            "seconds": seconds})
    return results


def compare(reference, compressed):
    if len(reference) != len(compressed):
        raise ValueError("Different query counts")
    failures = []
    max_deltas = {metric: 0.0 for metric in METRICS}
    unreachable = 0
    for a, b in zip(reference, compressed):
        key = ("source", "target", "metric")
        if any(a[k] != b[k] for k in key):
            raise ValueError("Query order mismatch")
        av, bv = a["cost"], b["cost"]
        if av is None and bv is None:
            unreachable += 1
        elif (av is None) != (bv is None):
            failures.append({"kind": "reachability", **{k: a[k] for k in key},
                             "reference": av, "compressed": bv})
        else:
            delta = abs(av - bv)
            max_deltas[a["metric"]] = max(max_deltas[a["metric"]], delta)
            if not math.isfinite(delta) or delta > TOLERANCE:
                failures.append({"kind": "cost", **{k: a[k] for k in key},
                                 "reference": av, "compressed": bv, "delta": delta})
    return {"status": "pass" if not failures else "fail",
            "queries": len(reference), "both_unreachable": unreachable,
            "reachability_mismatches": sum(f["kind"] == "reachability" for f in failures),
            "cost_mismatches": sum(f["kind"] == "cost" for f in failures),
            "max_distance_delta_m": max_deltas["length"],
            "max_travel_time_delta_s": max_deltas["travel_time"],
            "examples": failures[:100]}


def run(args):
    start = time.perf_counter()
    graph = load_pbf(args.osm)[0] if args.mode == "compressed" else full_graph(args.osm)
    build_seconds = time.perf_counter() - start
    if args.mode == "compressed":
        pairs = make_pairs(graph, args.origins, args.destinations, args.seed)
        args.pairs.write_text(json.dumps(pairs, indent=2) + "\n")
    else:
        pairs = json.loads(args.pairs.read_text())
    results = evaluate(graph, pairs)
    timings = {metric: [r["seconds"] for r in results if r["metric"] == metric]
               for metric in METRICS}
    report = {"mode": args.mode, "nodes": graph.number_of_nodes(),
              "edges": graph.number_of_edges(), "build_seconds": build_seconds,
              "peak_process_rss_kib": resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              "seed": args.seed, "pairs": len(pairs),
              "timings": {metric: {"median_seconds": statistics.median(times),
                                   "total_seconds": sum(times), "queries": len(times)}
                          for metric, times in timings.items()},
              "results": results}
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({k: v for k, v in report.items() if k != "results"}, indent=2))


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=("compressed", "reference"))
    parser.add_argument("--osm", type=Path)
    parser.add_argument("--pairs", type=Path)
    parser.add_argument("--output", type=Path)
    parser.add_argument("--origins", type=int, default=24)
    parser.add_argument("--destinations", type=int, default=8)
    parser.add_argument("--seed", type=int, default=20261023)
    parser.add_argument("--compare", nargs=2, type=Path, metavar=("REFERENCE", "COMPRESSED"))
    args = parser.parse_args()
    if args.compare:
        a, b = [json.loads(path.read_text()) for path in args.compare]
        report = compare(a["results"], b["results"])
        if args.output:
            args.output.write_text(json.dumps(report, indent=2) + "\n")
        print(json.dumps(report, indent=2))
        if report["status"] != "pass":
            raise SystemExit(1)
    else:
        if not all((args.mode, args.osm, args.pairs, args.output)):
            parser.error("--mode, --osm, --pairs and --output are required for benchmarking")
        if args.origins < 1 or args.destinations < 1:
            parser.error("origins and destinations must be positive")
        run(args)


if __name__ == "__main__":
    main()
