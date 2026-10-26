#!/usr/bin/env python3
"""Research-only geographic road-point diagnostic; NEVER production coverage.

Project lon/lat onto supplied OSM edge *polylines*, not straight chords or
nearest vertices. This deliberately cannot prove public/legal driveway access,
grade-separated entry, full-network nearest edge, or clipped-boundary closure.
No result from this module may set access_verified or authorize release.
"""
import math

import networkx as nx

from stream_osm_roads import meters


def _finite(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def project_polyline(geometry, lon, lat):
    """Return closest projected point and along-road fraction using real shape."""
    if not all(_finite(v) for v in (lon, lat)):
        raise ValueError("Non-finite geographic point")
    if not isinstance(geometry, (list, tuple)) or len(geometry) < 2:
        raise ValueError("Road edge requires full polyline geometry")
    if any(not isinstance(p, (list, tuple)) or len(p) != 2
           or not all(_finite(x) for x in p) for p in geometry):
        raise ValueError("Malformed road geometry")
    # Equirectangular local projection, appropriate only for short local road
    # segments. Exact geodesic distances are used for the returned gap/length.
    mx = 111320 * math.cos(math.radians(lat))
    my = 111320
    if mx <= 0:
        raise ValueError("Unsupported latitude")
    total = 0.0
    best = None
    for a, b in zip(geometry, geometry[1:]):
        distance = meters(a, b)
        ax, ay = (a[0] - lon) * mx, (a[1] - lat) * my
        dx, dy = (b[0] - a[0]) * mx, (b[1] - a[1]) * my
        denom = dx * dx + dy * dy
        if denom == 0 or distance <= 0:
            continue
        t = min(1.0, max(0.0, -(ax * dx + ay * dy) / denom))
        projected = (a[0] + t * (b[0] - a[0]),
                     a[1] + t * (b[1] - a[1]))
        gap_m = meters((lon, lat), projected)
        if best is None or gap_m < best["gap_m"]:
            best = {"gap_m": gap_m, "snapped_lon": projected[0],
                    "snapped_lat": projected[1], "along_m": total + distance * t}
        total += distance
    if best is None or total <= 0:
        raise ValueError("Degenerate road geometry")
    return {**best, "fraction": best["along_m"] / total, "shape_length_m": total}


def _edge_projection(graph, edge, lon, lat):
    u, v, key = edge
    data = graph[u][v][key]
    geometry = data.get("geometry")
    projected = project_polyline(geometry, lon, lat)
    nodes = graph.nodes
    if any(not _finite(nodes[n].get(field)) for n in (u, v) for field in ("x", "y")):
        raise ValueError("Road nodes require valid lon/lat")
    if (meters(geometry[0], (nodes[u]["x"], nodes[u]["y"])) > 1
            or meters(geometry[-1], (nodes[v]["x"], nodes[v]["y"])) > 1):
        raise ValueError("Road geometry does not match directed endpoints")
    length = data.get("length")
    if not _finite(length) or length <= 0 or abs(length - projected["shape_length_m"]) > max(1.0, 0.03 * length):
        raise ValueError("Edge length conflicts with road geometry")
    return projected


def edge_origin_oracle(graph, edge, sources, weight, fraction):
    """Direction-aware route from a chosen, physically *unverified* road edge."""
    if not _finite(fraction) or not 0 <= fraction <= 1:
        raise ValueError("fraction must lie in [0, 1]")
    u, v, key = edge
    data = graph[u][v][key]
    shape = data.get("geometry")
    if not shape:
        raise ValueError("Missing road geometry")
    forward = data.get(weight)
    if not _finite(forward) or forward < 0:
        raise ValueError("Invalid directed edge cost")
    starts = [(v, forward * (1 - fraction))]
    # Use backward travel only on a geometrically coincident reverse arc.
    # A different nearby carriageway or overpass does not grant reverse access.
    if graph.has_edge(v, u):
        for reverse in graph[v][u].values():
            if tuple(reverse.get("geometry", ())) != tuple(reversed(shape)):
                continue
            cost = reverse.get(weight)
            if not _finite(cost) or cost < 0:
                raise ValueError("Invalid reverse edge cost")
            starts.append((u, cost * fraction))
    if fraction == 0:
        starts.append((u, 0.0))
    if fraction == 1:
        starts.append((v, 0.0))
    costs = []
    for node, offset in starts:
        distances = nx.single_source_dijkstra_path_length(graph, node, weight=weight)
        for source in sources:
            target = int(source["node"])
            if target in distances:
                costs.append((offset + distances[target], str(source["cbsa"])))
    if not costs:
        return {"winners": [], "cost": None, "reachable": False}
    best = min(value for value, _ in costs)
    tie = max(1e-6, abs(best) * 1e-9)
    return {"winners": sorted({cbsa for value, cbsa in costs if abs(value - best) <= tie}),
            "cost": best, "reachable": True}


def diagnose_geographic_point(graph, lon, lat, candidate_edges, sources, weight,
                              max_gap_m=30, ambiguity_m=5, max_candidate_edges=50000):
    """Diagnose a point against an explicit, bounded road-edge candidate set.

    The caller MUST separately establish candidate completeness. No full-graph
    or physically/legal verified nearest road connector is inferred here.
    Competing distinct centerlines within ambiguity_m of the best are rejected.
    """
    if not _finite(max_gap_m) or max_gap_m <= 0 or not _finite(ambiguity_m) or ambiguity_m < 0:
        raise ValueError("Invalid proximity limits")
    if weight not in ("length", "travel_time"):
        raise ValueError("Unsupported routing metric")
    edges = list(candidate_edges)
    if not edges or len(edges) > max_candidate_edges:
        raise ValueError("Missing or unbounded road candidates")
    nearby = []
    for edge in edges:
        projection = _edge_projection(graph, edge, lon, lat)
        if projection["gap_m"] <= max_gap_m:
            geometry = tuple(tuple(p) for p in graph[edge[0]][edge[1]][edge[2]]["geometry"])
            physical = min(geometry, tuple(reversed(geometry)))
            nearby.append((edge, projection, physical))
    base = {"status": "diagnostic-only", "access_certified": False,
            "candidate_edges_examined": len(edges), "metric": weight}
    if not nearby:
        return {**base, "reason": "no_nearby_road", "winners": []}
    closest = min(proj["gap_m"] for _, proj, _ in nearby)
    plausible = [row for row in nearby if row[1]["gap_m"] <= closest + ambiguity_m]
    if len({physical for _, _, physical in plausible}) > 1:
        return {**base, "reason": "ambiguous_centerlines", "winners": [],
                "closest_gap_m": closest}
    choices = []
    for edge, projection, _ in plausible:
        routed = edge_origin_oracle(graph, edge, sources, weight, projection["fraction"])
        if routed["reachable"]:
            choices.append((routed["cost"], routed["winners"], projection))
    if not choices:
        return {**base, "reason": "unreachable", "winners": [],
                "closest_gap_m": closest}
    cost = min(item[0] for item in choices)
    tolerance = max(1e-6, abs(cost) * 1e-9)
    return {**base, "reason": "candidate_routed", "closest_gap_m": closest,
            "cost": cost, "winners": sorted({cbsa for c, winners, _ in choices
                 if abs(c - cost) <= tolerance for cbsa in winners})}
