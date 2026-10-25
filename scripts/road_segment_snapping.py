"""Experimental point-to-directed-road snapping; no off-network winner fallback.

Coordinates are lon/lat. Candidate access is geometric only: bridges, barriers,
turn restrictions and safe approach paths require additional validation.
"""
import math
from stream_osm_roads import meters


def project_segment(point, a, b):
    """Local equirectangular projection, sufficient for short OSM segments."""
    lat = math.radians((point[1] + a[1] + b[1]) / 3)
    scale = math.cos(lat)
    ax, ay = (a[0] - point[0]) * scale, a[1] - point[1]
    bx, by = (b[0] - point[0]) * scale, b[1] - point[1]
    dx, dy = bx - ax, by - ay
    fraction = max(0., min(1., -(ax * dx + ay * dy) / (dx * dx + dy * dy))) if dx * dx + dy * dy else 0.
    return (a[0] + (b[0] - a[0]) * fraction,
            a[1] + (b[1] - a[1]) * fraction), fraction


def snap_point(graph, lon, lat, max_gap_m=1000, limit=8):
    """Return nearest keyed directed edge candidates, or [] if too far away.

    Offset costs are measured along the actual polyline to the downstream node.
    Opposite travel requires its own directed edge and independent candidate.
    """
    if max_gap_m < 0 or limit < 1:
        raise ValueError("Invalid snapping bounds")
    point = (lon, lat)
    matches = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        shape = data.get("geometry")
        if not shape or len(shape) < 2:
            raise ValueError("Road edge lacks preserved polyline geometry")
        lengths = [meters(a, b) for a, b in zip(shape, shape[1:])]
        total = sum(lengths)
        if total <= 0:
            continue
        walked = 0.
        for i, (a, b) in enumerate(zip(shape, shape[1:])):
            projected, fraction = project_segment(point, a, b)
            gap = meters(point, projected)
            if gap <= max_gap_m:
                remaining = max(0., total - walked - fraction * lengths[i])
                matches.append({"edge": (u, v, key), "snapped": projected,
                                "gap_m": gap, "fraction": (walked + fraction * lengths[i]) / total,
                                "to_node": v, "length": remaining,
                                "travel_time": remaining / total * data["travel_time"],
                                "osm_way_id": data.get("osm_way_id")})
            walked += lengths[i]
    matches.sort(key=lambda m: (m["gap_m"], str(m["edge"])))
    return matches[:limit]
