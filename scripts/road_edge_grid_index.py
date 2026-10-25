"""Reusable conservative spatial grid for directed OSM edge candidate lookup.

Index is a snapshot: rebuild after graph edits. Every polyline segment's bbox
is indexed, including long segments crossing cell boundaries. The final
geodesic distance check remains in snap_point.
"""
import math
from collections import defaultdict


class RoadEdgeGridIndex:
    def __init__(self, graph, cell_degrees=0.02):
        if not math.isfinite(cell_degrees) or cell_degrees <= 0:
            raise ValueError("cell_degrees must be finite and positive")
        self.cell_degrees = cell_degrees
        self.edges = {}
        self.cells = defaultdict(set)
        self.polar_edges = set()
        for u, v, key, data in graph.edges(keys=True, data=True):
            edge = (u, v, key)
            shape = data.get("geometry")
            if not shape or len(shape) < 2:
                raise ValueError("Road edge lacks preserved polyline geometry")
            self.edges[edge] = data
            for a, b in zip(shape, shape[1:]):
                if any(not math.isfinite(x) for x in (*a, *b)):
                    raise ValueError("Non-finite road geometry")
                # Longitude wrapping and high latitudes need a conservative
                # fallback; never silently omit a potentially nearby edge.
                if abs(a[1]) >= 85 or abs(b[1]) >= 85 or abs(a[0] - b[0]) > 180:
                    self.polar_edges.add(edge)
                    continue
                x0 = math.floor(min(a[0], b[0]) / cell_degrees)
                x1 = math.floor(max(a[0], b[0]) / cell_degrees)
                y0 = math.floor(min(a[1], b[1]) / cell_degrees)
                y1 = math.floor(max(a[1], b[1]) / cell_degrees)
                for x in range(x0, x1 + 1):
                    for y in range(y0, y1 + 1):
                        self.cells[(x, y)].add(edge)

    def candidates(self, lon, lat, max_gap_m):
        if not all(math.isfinite(x) for x in (lon, lat, max_gap_m)) or max_gap_m < 0:
            raise ValueError("Invalid snapping coordinates or radius")
        if abs(lat) >= 85 or abs(lon) > 180 or max_gap_m >= 1000000:
            return self.edges.items()
        # A conservative envelope for a spherical Earth (using 110 km per
        # degree latitude and the smallest cosine within the search band).
        dlat = max_gap_m / 110000 + 1e-9
        edge_lat = min(89.999999, abs(lat) + dlat)
        if edge_lat >= 85:
            return self.edges.items()
        dlon = dlat / math.cos(math.radians(edge_lat))
        if lon - dlon < -180 or lon + dlon > 180:
            return self.edges.items()
        x0 = math.floor((lon - dlon) / self.cell_degrees)
        x1 = math.floor((lon + dlon) / self.cell_degrees)
        y0 = math.floor((lat - dlat) / self.cell_degrees)
        y1 = math.floor((lat + dlat) / self.cell_degrees)
        selected = set(self.polar_edges)
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                selected.update(self.cells.get((x, y), ()))
        return ((edge, self.edges[edge]) for edge in selected)
