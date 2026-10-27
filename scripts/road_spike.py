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


def assign(graph, sources, weight, nx=None, *, orientation="location-to-metro",
           max_cost=None):
    """Winner per node with explicit direction and optional budget.

    Default preserves node→metro research results. Forward roads support
    outward metro→node competition and network isochrones. A budget limits
    modeled network cost only; it does not certify off-road access or closure.
    """
    import heapq
    if orientation not in ("location-to-metro", "metro-to-location"):
        raise ValueError("Invalid route orientation")
    if not graph.is_directed() or weight not in ("length", "travel_time"):
        raise ValueError("Directed graph and supported metric required")
    if max_cost is not None and (isinstance(max_cost, bool) or
            not isinstance(max_cost, (int, float)) or not math.isfinite(max_cost)
            or max_cost < 0):
        raise ValueError("Invalid network cost budget")
    # Check the entire supplied graph even when a budget would hide bad arcs.
    for _, _, data in graph.edges(data=True):
        value = data.get(weight)
        if (isinstance(value, bool) or not isinstance(value, (int, float)) or
                not math.isfinite(value) or value < 0):
            raise ValueError("Missing, non-finite or negative edge cost")
    frontier = []
    best = {}
    if not sources or any(m["node"] not in graph for m in sources):
        raise ValueError("Missing source or source outside graph")
    for metro in sorted(sources, key=lambda m: m["cbsa"]):
        node, cbsa = metro["node"], metro["cbsa"]
        heapq.heappush(frontier, (0.0, cbsa, node))
    roads = graph.reverse(copy=False) if orientation == "location-to-metro" else graph
    while frontier:
        cost, cbsa, node = heapq.heappop(frontier)
        if max_cost is not None and cost > max_cost:
            break
        if node in best:
            continue
        best[node] = {"cbsa": cbsa, "cost": round(cost, 3)}
        for neighbor, edges in roads.adj[node].items():
            if neighbor in best:
                continue
            if graph.is_multigraph():
                values = [float(data[weight]) for data in edges.values()]
            else:
                values = [float(edges[weight])]
            if any(not math.isfinite(v) or v < 0 for v in values):
                raise ValueError("Non-finite or negative edge cost")
            heapq.heappush(frontier, (cost + min(values), cbsa, neighbor))
    return {str(node): value for node, value in best.items()}


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
