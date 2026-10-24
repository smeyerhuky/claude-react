#!/usr/bin/env python3
"""Reproducible Colorado shortest-vs-fastest route explorer (not navigation)."""
import argparse
import json
import math
import statistics
import time
from pathlib import Path

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import networkx as nx

from stream_osm_roads import load_pbf, meters
from validate_colorado_routing import full_graph

PLACES = {
    "Denver": (-104.9903, 39.7392),
    "Boulder": (-105.2705, 40.0150),
    "Colorado Springs": (-104.8214, 38.8339),
    "Idaho Springs": (-105.5136, 39.7425),
    "Georgetown": (-105.6975, 39.7061),
    "Nederland": (-105.5061, 39.9614),
    "Fairplay": (-106.0028, 39.2247),
}
TRIPS = (
    ("Denver", "Boulder", "Front Range"),
    ("Denver", "Colorado Springs", "Front Range"),
    ("Denver", "Idaho Springs", "Mountain corridor"),
    ("Idaho Springs", "Georgetown", "Mountain corridor"),
    ("Boulder", "Nederland", "Mountain corridor"),
    ("Colorado Springs", "Fairplay", "Rural / mountain"),
)
TOLERANCE = 0.001


def nearest(graph, longitude, latitude):
    """Snap to a retained road vertex using a geographic-distance approximation."""
    candidates = ((meters((longitude, latitude), (data["x"], data["y"])), node)
                  for node, data in graph.nodes(data=True) if "x" in data and "y" in data)
    return min(candidates)


def best_edge(graph, u, v, metric):
    """NetworkX MultiDiGraph Dijkstra uses the minimum parallel-edge weight."""
    return min(graph[u][v].values(), key=lambda edge: edge[metric])


def route(graph, source, target, metric):
    try:
        cost, path = nx.bidirectional_dijkstra(graph, source, target, weight=metric)
    except nx.NetworkXNoPath:
        return None
    distance = sum(best_edge(graph, u, v, metric)["length"] for u, v in zip(path, path[1:]))
    seconds = sum(best_edge(graph, u, v, metric)["travel_time"] for u, v in zip(path, path[1:]))
    return {"cost": cost, "distance_m": distance, "travel_time_s": seconds, "nodes": path}


def validate_cost(reference, compressed, metric):
    if (reference is None) != (compressed is None):
        raise AssertionError(f"{metric}: directed reachability mismatch")
    if reference is None:
        return None
    delta = abs(reference["cost"] - compressed["cost"])
    if not math.isfinite(delta) or delta > TOLERANCE:
        raise AssertionError(f"{metric}: compressed cost differs by {delta}")
    return delta


def benchmark_route(graph, source, target, metric, repetitions=3):
    """Warm-cache sequential query timings; graph construction is excluded."""
    if repetitions < 1:
        raise ValueError("repetitions must be positive")
    samples = []
    for _ in range(repetitions):
        start = time.perf_counter()
        result = route(graph, source, target, metric)
        samples.append((time.perf_counter() - start) * 1000)
        if result is None:
            raise RuntimeError("Benchmark route unexpectedly unreachable")
    return {"samples_ms": samples, "median_ms": statistics.median(samples)}


def coordinates(graph, path):
    return [(graph.nodes[node]["x"], graph.nodes[node]["y"]) for node in path]


def draw(graph, trips, destination):
    fig, axes = plt.subplots(len(trips), 1, figsize=(11, 5 * len(trips)), squeeze=False)
    for ax, trip in zip(axes[:, 0], trips):
        colors = {"length": "#1565c0", "travel_time": "#e65100"}
        for metric, label in (("length", "Shortest distance"), ("travel_time", "Fastest modeled time")):
            result = trip["reference"][metric]
            if result is None:
                continue
            points = coordinates(graph, result["nodes"])
            ax.plot([p[0] for p in points], [p[1] for p in points],
                    color=colors[metric], linewidth=2.1, alpha=0.85, label=label)
        for name, node in (("origin", trip["origin_node"]), ("destination", trip["destination_node"])):
            data = graph.nodes[node]
            ax.scatter(data["x"], data["y"], s=55, color="black", zorder=5)
            ax.annotate(name.title(), (data["x"], data["y"]), xytext=(5, 5),
                        textcoords="offset points")
        ax.set_title(f'{trip["origin"]} → {trip["destination"]}')
        ax.set_xlabel("Longitude")
        ax.set_ylabel("Latitude")
        ax.set_aspect(1 / max(0.1, math.cos(math.radians(39.5))))
        ax.legend()
        ax.grid(alpha=0.2)
    fig.suptitle("Colorado OSM routes: full-geometry paths, compressed cost cross-check")
    fig.tight_layout()
    fig.savefig(destination, dpi=150)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--osm", type=Path, required=True)
    parser.add_argument("--output-dir", type=Path, default=Path("route-explorer"))
    parser.add_argument("--max-snap-m", type=float, default=15000)
    args = parser.parse_args()
    if args.max_snap_m <= 0:
        parser.error("--max-snap-m must be positive")
    args.output_dir.mkdir(parents=True, exist_ok=True)
    compressed, _ = load_pbf(args.osm)
    snaps = {}
    for name, (lon, lat) in PLACES.items():
        snap_m, node = nearest(compressed, lon, lat)
        if snap_m > args.max_snap_m:
            raise RuntimeError(f"{name}: nearest road node {snap_m:.1f} m away; exceeds limit")
        snaps[name] = {"node": node, "snap_m": snap_m}
    reference = full_graph(args.osm)
    graph_sizes = {"full": {"nodes": reference.number_of_nodes(), "edges": reference.number_of_edges()},
                   "compressed": {"nodes": compressed.number_of_nodes(), "edges": compressed.number_of_edges()}}
    trips = []
    for origin, destination, category in TRIPS:
        source, target = snaps[origin]["node"], snaps[destination]["node"]
        item = {"origin": origin, "destination": destination, "category": category,
                "origin_node": source, "destination_node": target,
                "origin_snap_m": snaps[origin]["snap_m"],
                "destination_snap_m": snaps[destination]["snap_m"],
                "reference": {}, "compressed": {}, "cost_deltas": {}, "benchmark": {}}
        for metric in ("length", "travel_time"):
            full = route(reference, source, target, metric)
            small = route(compressed, source, target, metric)
            item["cost_deltas"][metric] = validate_cost(full, small, metric)
            if full is None:
                raise RuntimeError(f"No {metric} route for {origin} → {destination}")
            item["reference"][metric] = full
            item["compressed"][metric] = small
            item["benchmark"][metric] = {
                "full": benchmark_route(reference, source, target, metric),
                "compressed": benchmark_route(compressed, source, target, metric),
            }
        item["geometry"] = {metric: coordinates(reference, item["reference"][metric]["nodes"])
                            for metric in ("length", "travel_time")}
        trips.append(item)
    draw(reference, trips, args.output_dir / "colorado-routes.png")
    (args.output_dir / "routes.json").write_text(json.dumps({
        "status": "pass", "tolerance_m": TOLERANCE, "tolerance_s": TOLERANCE,
        "note": "Illustrated paths come from full OSM geometry. Compressed graph route costs are checked separately. Travel times are modeled, not live traffic.",
        "places": snaps, "trips": trips, "graph_sizes": graph_sizes,
        "benchmark_method": "3 sequential warm-cache bidirectional Dijkstra queries per graph, route and metric; wall-clock perf_counter; graph construction and snapping excluded; no memory measurement.",
    }, indent=2) + "\n")
    from colorado_route_explorer_html import render_html
    render_html(args.output_dir / "routes.json", args.output_dir / "interactive.html")
    from colorado_route_performance_html import render_dashboard
    render_dashboard(args.output_dir / "routes.json", args.output_dir / "performance.html")
    print(f"PASS: {len(trips)} city pairs across {len(set(t[2] for t in TRIPS))} categories, both metrics; map, JSON, interactive HTML and performance dashboard written")


if __name__ == "__main__":
    main()
