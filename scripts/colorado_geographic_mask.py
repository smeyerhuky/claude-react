#!/usr/bin/env python3
"""Explicit 2025 Colorado land/water GeoJSON pixel mask, research only.

No bbox-is-land inference, no missing-water fallback. Input polygon provenance,
completeness and legal road access are NOT certified by this module.
"""
import argparse
import hashlib
import json
import math
from fractions import Fraction
from pathlib import Path


def _load_polygon_file(path, label):
    from shapely.geometry import shape
    from shapely.ops import unary_union

    path = Path(path)
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict) or "crs" in data:
        raise ValueError(label + " requires explicit WGS84 GeoJSON without legacy CRS")
    if data.get("type") == "FeatureCollection":
        features = data.get("features")
        if not isinstance(features, list) or not features:
            raise ValueError(label + " GeoJSON has no polygon features")
        geometries = [feature.get("geometry") if isinstance(feature, dict)
                      else None for feature in features]
    elif data.get("type") == "Feature":
        geometries = [data.get("geometry")]
    else:
        geometries = [data]
    parts = []
    for geom in geometries:
        if not isinstance(geom, dict) or geom.get("type") not in ("Polygon", "MultiPolygon"):
            raise ValueError(label + " must contain only polygon geometries")
        if "crs" in geom:
            raise ValueError(label + " contains unsupported CRS")
        polygon = shape(geom)
        if polygon.is_empty or not polygon.is_valid or polygon.area <= 0:
            raise ValueError(label + " has empty or invalid polygon")
        left, bottom, right, top = polygon.bounds
        if not all(math.isfinite(c) for c in polygon.bounds) or (
                left < -180 or right > 180 or bottom < -90 or top > 90):
            raise ValueError(label + " has invalid WGS84 coordinate bounds")
        parts.append(polygon)
    united = unary_union(parts)
    if united.is_empty or not united.is_valid:
        raise ValueError(label + " polygon union is invalid")
    sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
    return united, sha256, len(parts)


def build_explicit_land_water_mask(land_geojson, water_geojson, bounds, width,
                                   height, max_pixels=20000):
    """Full-pixel footprint mask with source hashes and conservative no-data cells.

    Both geographic polygon layers are REQUIRED. A valid geometry does not
    prove the supplied source contains every stream, reservoir or seasonal
    water body. Do not use this mask to authorize a production road region.
    """
    import numpy as np
    from shapely import box, covers, intersects

    if type(width) is not int or type(height) is not int or (
            width < 1 or height < 1 or width * height > max_pixels):
        raise ValueError("Invalid bounded land mask resolution")
    if not isinstance(bounds, (tuple, list)) or len(bounds) != 4 or any(
            not isinstance(x, (int, float)) or isinstance(x, bool) or
            not math.isfinite(x) for x in bounds):
        raise ValueError("Invalid land mask bounds")
    west, south, east, north = bounds
    if not -180 <= west < east <= 180 or not -90 <= south < north <= 90:
        raise ValueError("Invalid geographic land mask bounds")
    if land_geojson is None or water_geojson is None:
        raise ValueError("Separate land and water GeoJSON sources are required")

    land, land_hash, land_features = _load_polygon_file(land_geojson, "Land")
    water, water_hash, water_features = _load_polygon_file(water_geojson, "Water")
    # Enclose exact linear interpolation of the input floating-point bounds.
    # Neighboring footprints overlap by at most rounding width, never leave a
    # gap. Unpadded cell edges can miss water that touches a decimal grid line.
    def edges(start, stop, count):
        start, stop = Fraction(start), Fraction(stop)
        lows, highs = [], []
        for i in range(count+1):
            exact = start+(stop-start)*i/count
            value = float(exact)
            lows.append(math.nextafter(value, -math.inf) if Fraction(value) > exact else value)
            highs.append(math.nextafter(value, math.inf) if Fraction(value) < exact else value)
        return lows, highs
    xlow, xhigh = edges(west, east, width)
    ylow, yhigh = edges(south, north, height)
    left, top = np.meshgrid(xlow[:-1], yhigh[1:][::-1])
    right, bottom = np.meshgrid(xhigh[1:], ylow[:-1][::-1])
    cells = box(left, bottom, right, top)
    inside_land = covers(land, cells)
    # Include boundary contact: a point/line intersection is still unsupported
    # shoreline. Thin supplied polygons cannot vanish between pixel centers.
    on_water = intersects(water, cells)
    valid = inside_land & ~on_water
    outside = int(np.count_nonzero(~inside_land))
    excluded_water = int(np.count_nonzero(inside_land & on_water))
    return {
        "status": "research-only-explicit-land-water-mask",
        "release_eligible": False,
        "input_completeness_certified": False,
        "pixel_support_rule": "entire-cell-covered-by-land-and-disjoint-from-water-v1",
        "bounds_lonlat": list(bounds),
        "width": width, "height": height,
        "land_mask": valid.tolist(),
        "pixel_counts": {"land_nonwater": int(np.count_nonzero(valid)),
                         "water_excluded": excluded_water,
                         "outside_supplied_land": outside},
        "land_geojson_sha256": land_hash,
        "water_geojson_sha256": water_hash,
        "polygon_features": {"land": land_features, "water": water_features},
        "warning": ("Partial land cells and all water contact remain transparent. "
                    "Input GeoJSON is not independently certified as complete; "
                    "road access, external graph routes and waterways may be missing."),
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--land-geojson", type=Path, required=True)
    parser.add_argument("--water-geojson", type=Path, required=True)
    parser.add_argument("--bounds", nargs=4, type=float, required=True,
                        metavar=("WEST", "SOUTH", "EAST", "NORTH"))
    parser.add_argument("--width", type=int, default=64)
    parser.add_argument("--height", type=int, default=64)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build_explicit_land_water_mask(
        args.land_geojson, args.water_geojson, args.bounds, args.width, args.height)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items()
                      if key != "land_mask"}, indent=2))


if __name__ == "__main__":
    main()
