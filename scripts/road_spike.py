#!/usr/bin/env python3
"""Colorado road-nearest-metro feasibility tool. No production app changes.

Input: locally acquired OSMnx graphml (do NOT download nationwide roads in CI).
Outputs per-node winner JSON for shortest road length vs modeled free-flow time.
"""
import argparse
import csv
import json
import math
import time
from pathlib import Path

METROS = Path("public/data/metros-census-2025.csv")


def metro_candidates(path, threshold):
    with path.open(newline="", encoding="utf-8") as handle:
        return [
            {"cbsa": row["cbsa"], "name": row["name"], "population": int(row["population"]),
             "lat": float(row["latitude"]), "lon": float(row["longitude"])}
            for row in csv.DictReader(handle) if int(row["population"]) >= threshold
        ]


def assign(graph, sources, weight, nx):
    """Reverse the directed graph to compute node→metro costs, NOT metro→node.

    Multiple CBSA origins can snap to the same vertex. Keep all origins together
    with a synthetic zero-cost sink to get deterministic winners.
    """
    reverse = graph.reverse(copy=False)
    # Explicit origin winner tracking avoids treating shortest time as distance.
    sink = object()
    g = nx.DiGraph()
    for u, v, data in reverse.edges(data=True):
        cost = float(data[weight])
        if not math.isfinite(cost) or cost < 0:
            raise ValueError("Non-finite or negative edge cost")
        if g.has_edge(u, v):
            g[u][v]["cost"] = min(g[u][v]["cost"], cost)
        else:
            g.add_edge(u, v, cost=cost)
    # Reversing edges and starting from each metro gives the desired node→metro costs.
    # A super-source is used to retain CBSA provenance even with multiple metros.
    start = object()
    for metro in sources:
        endpoint = ("origin", metro["cbsa"])
        g.add_edge(start, endpoint, cost=0)
        g.add_edge(endpoint, metro["node"], cost=0)
    lengths, paths = nx.single_source_dijkstra(g, start, weight="cost")
    result = {}
    for node in graph.nodes:
        if node not in lengths:
            continue
        path = paths[node]
        winner = next((p[1] for p in path if isinstance(p, tuple) and p[0] == "origin"), None)
        result[str(node)] = {"cbsa": winner, "cost": round(lengths[node], 3)}
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--graphml", required=True, type=Path, help="Local OSMnx drive-network GraphML")
    parser.add_argument("--threshold", type=int, default=250000)
    parser.add_argument("--output", type=Path, default=Path("road-spike-output.json"))
    parser.add_argument("--metropolitan-csv", type=Path, default=METROS)
    args = parser.parse_args()
    import networkx as nx
    import osmnx as ox
    graph = ox.load_graphml(args.graphml)
    # OSMnx uses directed MultiDiGraph. GraphML numeric attrs need validation.
    graph = ox.routing.add_edge_speeds(graph, fallback=40)
    graph = ox.routing.add_edge_travel_times(graph)
    candidates = metro_candidates(args.metropolitan_csv, args.threshold)
    west = min(d["x"] for _, d in graph.nodes(data=True))
    east = max(d["x"] for _, d in graph.nodes(data=True))
    south = min(d["y"] for _, d in graph.nodes(data=True))
    north = max(d["y"] for _, d in graph.nodes(data=True))
    candidates = [c for c in candidates if west <= c["lon"] <= east and south <= c["lat"] <= north]
    for c in candidates:
        c["node"] = ox.distance.nearest_nodes(graph, X=c["lon"], Y=c["lat"])
    if len(candidates) < 2:
        raise SystemExit("At least 2 qualifying metro origins must lie inside the graph bbox; enlarge your input graph or reduce --threshold.")
    t0 = time.monotonic()
    # OSMnx length is meters, travel_time is seconds. Graph snapping is approximate.
    distance = assign(graph, candidates, "length", nx)
    seconds = assign(graph, candidates, "travel_time", nx)
    diff = sum(1 for node in distance.keys() & seconds.keys() if distance[node]["cbsa"] != seconds[node]["cbsa"])
    report = {
        "status": "EXPERIMENTAL; not a production isochrone or nationwide map",
        "graph": str(args.graphml), "nodes": len(graph.nodes), "edges": len(graph.edges),
        "threshold": args.threshold, "sources": candidates, "orientation": "location-to-metro",
        "metric_units": {"distance": "meters", "time": "seconds"},
        "modeled_time": "OSMnx imputed free-flow speeds; no live traffic, turns not modeled",
        "bbox": [west, south, east, north],
        "both_reachable": len(distance.keys() & seconds.keys()),
        "time_distance_differing_winner_nodes": diff,
        "computation_seconds": round(time.monotonic() - t0, 3),
        "distance": distance, "time": seconds,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, separators=(",", ":")))
    print(json.dumps({k: v for k, v in report.items() if k not in ("distance", "time")}, indent=2))


if __name__ == "__main__":
    main()
