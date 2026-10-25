#!/usr/bin/env python3
"""Experimental, road-proximity-masked raster tiles; NOT continuous land coverage.

Pixels are sampled in one global lon/lat grid. Nearest *road vertex* is a
visual approximation, not nearest routable edge or independently routed sample.
Unsupported/off-road or unreachable pixels are transparent, never filled with
straight-line fallback.
"""
import json
import math
from pathlib import Path


def sample_grid(graph, winners, bounds, width, height, max_gap_m=1000):
    """Return CBSA or None for each cell in a single globally aligned grid."""
    import numpy as np
    from scipy.spatial import cKDTree
    if width < 1 or height < 1 or max_gap_m <= 0:
        raise ValueError("Invalid grid parameters")
    west, south, east, north = bounds
    if west >= east or south >= north:
        raise ValueError("Invalid geographic bounds")
    nodes = list(graph.nodes(data=True))
    if not nodes:
        raise ValueError("Empty road graph")
    lat0 = (south + north) / 2
    mx = 111320 * math.cos(math.radians(lat0))
    my = 111320
    tree = cKDTree([(a["x"] * mx, a["y"] * my) for _, a in nodes])
    xs = west + (np.arange(width) + 0.5) * (east - west) / width
    result = []
    for row in range(height):
        lat = north - (row + 0.5) * (north - south) / height
        points = np.column_stack((xs * mx, np.full(width, lat * my)))
        distances, nearest = tree.query(points)
        values = []
        for distance, idx in zip(distances, nearest):
            node, attrs = nodes[int(idx)]
            # Use exact geodesic-enough meters() for threshold filtering if needed;
            # equirectangular proximity is deliberately just a sampling estimate.
            assignment = winners.get(str(node))
            values.append(assignment["cbsa"] if distance <= max_gap_m and assignment else None)
        result.append(values)
    return result


def write_tiles(graph, results, output_dir, pixels=512, tile_size=256, max_gap_m=1000):
    """Write transparent PNG tiles per threshold and metric, plus a tile manifest."""
    from PIL import Image
    import numpy as np
    if pixels % tile_size or pixels < tile_size:
        raise ValueError("Resolution must be a multiple of tile size")
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    attrs = [a for _, a in graph.nodes(data=True)]
    bounds = [min(a["x"] for a in attrs), min(a["y"] for a in attrs),
              max(a["x"] for a in attrs), max(a["y"] for a in attrs)]
    # All datasets share the same stable CBSA to color mapping.
    cbsas = sorted({str(s["cbsa"]) for r in results.values() for s in r["sources"]})
    if len(cbsas) > 254:
        raise ValueError("Indexed preview supports at most 254 sources")
    palette = {cbsa: i + 1 for i, cbsa in enumerate(cbsas)}
    tiles_per_axis = pixels // tile_size
    manifest = {"status": "experimental-road-proximity-only", "bounds_lonlat": bounds,
                "pixels_per_axis": pixels, "tile_size": tile_size,
                "max_road_vertex_gap_m": max_gap_m, "index_0": "transparent no-data",
                "cbsa_index": palette, "datasets": {}}
    for threshold, result in results.items():
        for metric in ("distance", "time"):
            key = f"{threshold}-{metric}"
            grid = sample_grid(graph, result[metric]["winners"], bounds,
                               pixels, pixels, max_gap_m)
            indexed = np.array([[palette.get(value, 0) for value in row]
                                for row in grid], dtype=np.uint8)
            covered = int(np.count_nonzero(indexed))
            images = []
            for y in range(tiles_per_axis):
                for x in range(tiles_per_axis):
                    sub = indexed[y*tile_size:(y+1)*tile_size,
                                  x*tile_size:(x+1)*tile_size]
                    # RGBA pixels distinguish no-data from actual assigned values.
                    rgba = np.zeros((tile_size, tile_size, 4), dtype=np.uint8)
                    for cbsa, value in palette.items():
                        mask = sub == value
                        rgba[mask, 0] = (value * 67) % 251
                        rgba[mask, 1] = (value * 119) % 251
                        rgba[mask, 2] = (value * 173) % 251
                    rgba[sub > 0, 3] = 255
                    name = f"{key}/tile-{x}-{y}.png"
                    target = output_dir / name
                    target.parent.mkdir(parents=True, exist_ok=True)
                    Image.fromarray(rgba, "RGBA").save(target)
                    images.append(name)
            manifest["datasets"][key] = {"covered_pixels": covered,
                "no_data_pixels": pixels * pixels - covered,
                "covered_fraction": round(covered / (pixels * pixels), 6),
                "tiles": images}
    (output_dir / "tiles-manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    return manifest
