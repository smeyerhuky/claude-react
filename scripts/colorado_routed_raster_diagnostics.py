#!/usr/bin/env python3
"""Research-only bounded road-edge raster sampler with explicit no-data pixels.

Unlike nearest-*vertex* rasterization, candidate origins are projected onto full
OSM road polylines, and directed route costs are propagated from precomputed
node-to-metro winners. This is NOT a geographic coverage certification, a
verified on-road driveway connector, or a release-ready land map.
"""
import math
from collections import defaultdict

from colorado_geographic_point_diagnostics import _edge_projection, _finite


class SegmentGridIndex:
    """Conservative polyline-segment spatial buckets for a bounded road graph.

    Every segment bounding box is indexed, including segments whose endpoints
    lie outside a query's search radius. No invisible nearest-node fallback.
    Fails closed if geometry is missing, index memory bounds are exceeded, or
    coordinates are invalid. Coordinates are WGS84 lon/lat.
    """

    def __init__(self, graph, cell_deg=0.01, max_postings=12000000,
                 max_segment_cells=2500):
        if not _finite(cell_deg) or not 0 < cell_deg <= 1:
            raise ValueError("Invalid spatial cell size")
        if not isinstance(max_postings, int) or max_postings < 1:
            raise ValueError("Invalid index posting limit")
        if not isinstance(max_segment_cells, int) or max_segment_cells < 1:
            raise ValueError("Invalid segment cell limit")
        self.graph = graph
        self.cell_deg = cell_deg
        self.buckets = defaultdict(list)
        self.postings = 0
        self.edge_count = 0
        for u, v, key, attrs in graph.edges(keys=True, data=True):
            geometry = attrs.get("geometry")
            if not isinstance(geometry, (list, tuple)) or len(geometry) < 2:
                raise ValueError("Cannot index graph: road geometry missing")
            if any(not isinstance(pt, (list, tuple)) or len(pt) != 2 or
                   any(not _finite(coord) for coord in pt) for pt in geometry):
                raise ValueError("Cannot index graph: malformed road geometry")
            edge = (u, v, key)
            occupied = set()
            for a, b in zip(geometry, geometry[1:]):
                x0, x1 = sorted((math.floor(a[0] / cell_deg),
                                 math.floor(b[0] / cell_deg)))
                y0, y1 = sorted((math.floor(a[1] / cell_deg),
                                 math.floor(b[1] / cell_deg)))
                count = (x1 - x0 + 1) * (y1 - y0 + 1)
                if count > max_segment_cells:
                    raise ValueError("Road segment spans too many index cells")
                for x in range(x0, x1 + 1):
                    for y in range(y0, y1 + 1):
                        occupied.add((x, y))
            if not occupied:
                raise ValueError("Cannot index empty polyline")
            self.postings += len(occupied)
            if self.postings > max_postings:
                raise ValueError("Spatial index exceeds posting safety limit")
            for cell in occupied:
                self.buckets[cell].append(edge)
            self.edge_count += 1
        if not self.edge_count:
            raise ValueError("Cannot index empty graph")

    def candidates(self, lon, lat, radius_m=30):
        """Conservative radius query; completeness applies only to loaded graph."""
        if not all(_finite(x) for x in (lon, lat, radius_m)) or not 0 < radius_m <= 500:
            raise ValueError("Invalid geographic radius query")
        if not -89 < lat < 89:
            raise ValueError("Latitude beyond supported spatial-index bounds")
        lat_pad = radius_m * 1.3 / 110574
        lon_pad = radius_m * 1.3 / (
            111000 * max(0.005, math.cos(math.radians(min(89.9, abs(lat) + lat_pad)))))
        west = math.floor((lon - lon_pad) / self.cell_deg)
        east = math.floor((lon + lon_pad) / self.cell_deg)
        south = math.floor((lat - lat_pad) / self.cell_deg)
        north = math.floor((lat + lat_pad) / self.cell_deg)
        found = set()
        for i in range(west, east + 1):
            for j in range(south, north + 1):
                found.update(self.buckets.get((i, j), ()))
        return sorted(found, key=lambda edge: tuple(str(e) for e in edge))


def _endpoint_assignment(winners, node, offset):
    item = winners.get(str(node))
    if item is None:
        return None
    cost = item.get("cost")
    cbsa = item.get("cbsa")
    if not _finite(cost) or cost < 0 or not isinstance(cbsa, str) or not cbsa:
        raise ValueError("Malformed directed road-node winner")
    return (cost + offset, cbsa)


def edge_routed_options(graph, edge, fraction, weight, winners):
    """Propagate precomputed directed winners from legal graph-edge endpoints.

    A reverse arc can only provide a backward option if its geometry exactly
    matches the reversed centerline of the same directed edge. This does NOT
    prove physical entry onto a road or rule out missing turn restrictions.
    """
    if weight not in ("length", "travel_time"):
        raise ValueError("Invalid routing metric")
    if not _finite(fraction) or not 0 <= fraction <= 1:
        raise ValueError("Invalid fractional origin")
    u, v, key = edge
    attrs = graph[u][v][key]
    cost = attrs.get(weight)
    if not _finite(cost) or cost < 0:
        raise ValueError("Invalid forward edge cost")
    shape = attrs.get("geometry")
    if not shape:
        raise ValueError("Road geometry missing")
    results = []
    forward = _endpoint_assignment(winners, v, cost * (1 - fraction))
    if forward:
        results.append(forward)
    if graph.has_edge(v, u):
        backwards = tuple(reversed(shape))
        for reverse in graph[v][u].values():
            if tuple(reverse.get("geometry", ())) != backwards:
                continue
            reverse_cost = reverse.get(weight)
            if not _finite(reverse_cost) or reverse_cost < 0:
                raise ValueError("Invalid matching reverse edge cost")
            previous = _endpoint_assignment(winners, u, reverse_cost * fraction)
            if previous:
                results.append(previous)
    if fraction == 0:
        initial = _endpoint_assignment(winners, u, 0)
        if initial:
            results.append(initial)
    if fraction == 1:
        last = _endpoint_assignment(winners, v, 0)
        if last:
            results.append(last)
    return results


def sample_road_point(index, lon, lat, weight, node_winners,
                      max_gap_m=30, ambiguity_m=5):
    """Research-only road-routed point: return CBSA or explicit no-data."""
    if weight not in ("length", "travel_time"):
        raise ValueError("Invalid routing metric")
    if not _finite(ambiguity_m) or ambiguity_m < 0 or ambiguity_m > 500:
        raise ValueError("Invalid ambiguity threshold")
    edges = index.candidates(lon, lat, max_gap_m)
    candidates = []
    for edge in edges:
        projected = _edge_projection(index.graph, edge, lon, lat)
        if projected["gap_m"] > max_gap_m:
            continue
        geometry = tuple(tuple(p) for p in
                         index.graph[edge[0]][edge[1]][edge[2]]["geometry"])
        # Distinct OSM node identities sharing XY can indicate a bridge, tunnel
        # or separate nonconnecting roadway: never collapse those into one.
        physical = (min(geometry, tuple(reversed(geometry))),
                    tuple(sorted((str(edge[0]), str(edge[1])))))
        candidates.append((edge, projected, physical))
    base = {"status": "diagnostic-only", "release_eligible": False,
            "access_certified": False, "extract_coverage_certified": False}
    if not candidates:
        return {**base, "cbsa": None, "reason": "no_nearby_road"}
    min_gap = min(value["gap_m"] for _, value, _ in candidates)
    close = [candidate for candidate in candidates
             if candidate[1]["gap_m"] <= min_gap + ambiguity_m]
    if len({item[2] for item in close}) > 1:
        return {**base, "cbsa": None, "reason": "ambiguous_centerlines",
                "closest_gap_m": min_gap}
    options = []
    for edge, point, _ in close:
        options.extend(edge_routed_options(
            index.graph, edge, point["fraction"], weight, node_winners))
    if not options:
        return {**base, "cbsa": None, "reason": "unreachable",
                "closest_gap_m": min_gap}
    cheapest = min(cost for cost, _ in options)
    tied = {cbsa for cost, cbsa in options
            if abs(cost - cheapest) <= max(0.002, abs(cheapest) * 1e-9)}
    if len(tied) != 1:
        return {**base, "cbsa": None, "reason": "ambiguous_winner",
                "closest_gap_m": min_gap}
    return {**base, "cbsa": next(iter(tied)), "reason": "routed_candidate",
            "cost": cheapest, "closest_gap_m": min_gap}


def sample_masked_grid(index, winners, weight, bounds, land_mask,
                       width, height, max_gap_m=30, max_pixels=20000):
    """Produce a bounded transparent/no-data grid; real land mask REQUIRED.

    Boolean mask must be independently supplied for every pixel, preserving
    coastline and water exclusions; no bounding-box-is-land fallback exists.
    Even covered cells remain research diagnostic and cannot feed release UI.
    """
    if not isinstance(width, int) or not isinstance(height, int) or (
        width < 1 or height < 1 or width * height > max_pixels):
        raise ValueError("Unsupported diagnostic grid dimensions")
    if len(bounds) != 4 or not all(_finite(c) for c in bounds):
        raise ValueError("Invalid bounds")
    west, south, east, north = bounds
    if not west < east or not south < north:
        raise ValueError("Invalid bounds")
    if not isinstance(land_mask, (list, tuple)) or len(land_mask) != height or (
        any(not isinstance(row, (list, tuple)) or len(row) != width or
            any(type(value) is not bool for value in row) for row in land_mask)):
        raise ValueError("Independently supplied boolean land mask required")
    pixels, tally = [], defaultdict(int)
    for y in range(height):
        lat = north - (y + 0.5) * (north - south) / height
        row = []
        for x in range(width):
            if not land_mask[y][x]:
                cbsa, reason = None, "off_land"
            else:
                lon = west + (x + 0.5) * (east - west) / width
                sampled = sample_road_point(
                    index, lon, lat, weight, winners, max_gap_m)
                cbsa, reason = sampled["cbsa"], sampled["reason"]
            row.append(cbsa)
            tally[reason] += 1
        pixels.append(row)
    return {"status": "experimental-mask-required", "release_eligible": False,
            "land_mask_required": True, "access_certified": False,
            "extract_coverage_certified": False,
            "weight": weight, "bounds_lonlat": list(bounds),
            "width": width, "height": height, "reasons": dict(tally),
            "cbsa_grid": pixels}
