#!/usr/bin/env python3
"""Fetch and clip official 2025 Census TIGER state + county AREAWATER shapes.

Research-only input preparation; U.S. Census polygons are not an audit of
every creek, wetland, seasonal lake, driveway or road graph connection.
County selection is computed from ALL 2025 U.S. county shapes, not a hand-
picked Denver county list. No nonexistent area is assumed dry land.
"""
import argparse
import hashlib
import io
import json
import math
import re
import urllib.request
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import box, mapping, shape
from shapely.ops import unary_union

TIGER_BASE = "https://www2.census.gov/geo/tiger/TIGER2025"
STATE_FILENAME = "tl_2025_us_state.zip"
COUNTY_FILENAME = "tl_2025_us_county.zip"
STATE_FIPS = "08"
MAX_ARCHIVE_BYTES = 130_000_000


def _validate_bbox(bounds):
    if not isinstance(bounds, (tuple, list)) or len(bounds) != 4 or any(
        type(v) not in (float, int) or not math.isfinite(v) for v in bounds
    ):
        raise ValueError("Invalid geographic bbox")
    west, south, east, north = bounds
    if not (-110 <= west < east <= -101 and
            36 <= south < north <= 42):
        raise ValueError("Preview bbox must lie within Colorado's approximate extent")
    if (east - west) * (north - south) > 3:
        raise ValueError("Preview bbox exceeds research safety size")
    return box(west, south, east, north)


def _download_census_zip(cache, folder, filename, offline=False):
    if not re.fullmatch(r"tl_2025_(?:us_(?:state|county)|08\d{3}_areawater)\.zip", filename):
        raise ValueError("Unsupported TIGER archive name")
    if folder not in ("STATE", "COUNTY", "AREAWATER"):
        raise ValueError("Unsupported TIGER source directory")
    url = f"{TIGER_BASE}/{folder}/{filename}"
    cache = Path(cache)
    cache.mkdir(parents=True, exist_ok=True)
    dest = cache / filename
    if not dest.is_file():
        if offline:
            raise ValueError("Offline TIGER source missing: " + filename)
        request = urllib.request.Request(
            url, headers={"User-Agent": "Colorado-metro-research/1.0"})
        with urllib.request.urlopen(request, timeout=90) as reply:
            length = reply.headers.get("Content-Length")
            if length and int(length) > MAX_ARCHIVE_BYTES:
                raise ValueError("TIGER archive download exceeds byte cap")
            data = reply.read(MAX_ARCHIVE_BYTES + 1)
        if len(data) > MAX_ARCHIVE_BYTES:
            raise ValueError("TIGER archive download exceeds byte cap")
        # Refuse replacing an existing cache file; avoid partial downloads.
        dest.write_bytes(data)
    if dest.stat().st_size > MAX_ARCHIVE_BYTES or dest.stat().st_size == 0:
        raise ValueError("TIGER cache archive has unsafe size")
    raw = dest.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    try:
        with zipfile.ZipFile(io.BytesIO(raw)) as zf:
            if zf.testzip() is not None:
                raise ValueError("Corrupt TIGER zip file")
            expected_stem = filename[:-4]
            members = {name.lower(): name for name in zf.namelist()}
            for ext in (".shp", ".shx", ".dbf"):
                key = (expected_stem + ext).lower()
                if key not in members:
                    raise ValueError("TIGER archive lacks " + key)
                if zf.getinfo(members[key]).file_size > 350_000_000:
                    raise ValueError("TIGER shapefile member exceeds safety limit")
    except zipfile.BadZipFile as exc:
        raise ValueError("Corrupt TIGER zip file") from exc
    return dest, {"url": url, "filename": filename, "sha256": digest,
                  "bytes": len(raw)}


def _read_shapes(path, max_records=250000):
    path = Path(path)
    with zipfile.ZipFile(path) as zf:
        stem = path.stem
        names = {name.lower(): name for name in zf.namelist()}
        def read(ext):
            return io.BytesIO(zf.read(names[(stem+ext).lower()]))
        reader = shapefile.Reader(shp=read(".shp"), shx=read(".shx"),
                                  dbf=read(".dbf"))
        if len(reader) > max_records:
            raise ValueError("TIGER shapefile exceeds record safety limit")
        for record in reader.iterShapeRecords():
            properties = record.record.as_dict()
            geom = shape(record.shape.__geo_interface__)
            if geom.is_empty:
                continue
            if geom.geom_type not in ("Polygon", "MultiPolygon"):
                raise ValueError("Unexpected TIGER geometry type")
            if not geom.is_valid:
                raise ValueError("Invalid polygon in TIGER input; review source manually")
            yield properties, geom


def _write_geojson(path, geom, kind):
    if geom.is_empty or not geom.is_valid or geom.geom_type not in (
        "Polygon", "MultiPolygon"):
        raise ValueError("Empty/invalid " + kind + " polygon output")
    path = Path(path)
    path.write_text(json.dumps({
        "type": "Feature", "properties": {"research_only": True,
                                       "layer": kind, "vintage": 2025},
        "geometry": mapping(geom)
    }, separators=(",", ":")) + "\n", encoding="utf-8")
    return hashlib.sha256(path.read_bytes()).hexdigest()


def prepare_tiger2025_geography(bounds, cache, output_dir, offline=False):
    """Create separate clipped land and water GeoJSON with a source audit log.

    The downloaded COUNTY shapefile automatically selects every 2025 county
    polygon intersecting the requested viewport. If any selected AREAWATER
    file is absent, malformed or the county coverage has gaps, fail closed.
    """
    viewport = _validate_bbox(bounds)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)
    sources = []
    state_path, state_source = _download_census_zip(
        cache, "STATE", STATE_FILENAME, offline)
    sources.append(state_source)
    states = [polygon for fields, polygon in _read_shapes(state_path, 60)
              if fields.get("GEOID") == STATE_FIPS]
    if len(states) != 1:
        raise ValueError("Missing or duplicate Colorado state polygon")
    state = states[0]
    land = state.intersection(viewport)
    if land.is_empty or land.area <= 0:
        raise ValueError("Preview does not intersect official Colorado polygon")

    county_path, county_source = _download_census_zip(
        cache, "COUNTY", COUNTY_FILENAME, offline)
    sources.append(county_source)
    selected = []
    selected_parts = []
    for fields, polygon in _read_shapes(county_path, 5000):
        if fields.get("STATEFP") != STATE_FIPS or not polygon.intersects(viewport):
            continue
        geoid = fields.get("GEOID")
        if not isinstance(geoid, str) or not re.fullmatch(r"08\d{3}", geoid):
            raise ValueError("Invalid Colorado county GEOID")
        selected.append(geoid)
        selected_parts.append(polygon.intersection(viewport))
    if not selected or len(selected) > 64 or len(set(selected)) != len(selected):
        raise ValueError("Missing/duplicate Colorado county coverage")
    coverage = unary_union(selected_parts)
    # Co-vintage TIGER state and county boundaries ought to coincide; a tiny
    # topological tolerance accounts for floating point overlay roundoff.
    uncovered = land.difference(coverage).area
    if uncovered > max(1e-12, land.area * 1e-6):
        raise ValueError("County water inputs do not cover entire Colorado viewport")

    water_parts = []
    intersecting_water_features = 0
    for geoid in sorted(selected):
        path, provenance = _download_census_zip(
            cache, "AREAWATER", f"tl_2025_{geoid}_areawater.zip", offline)
        sources.append(provenance)
        for _, polygon in _read_shapes(path, 50000):
            if polygon.intersects(viewport):
                clipped = polygon.intersection(viewport)
                if clipped.area > 0:
                    water_parts.append(clipped)
                    intersecting_water_features += 1
    if not water_parts:
        # No fake empty water polygon and no presumption of hydrological
        # completeness. A different bounded region may be selected.
        raise ValueError("No area-water polygons intersect research viewport")
    water = unary_union(water_parts)
    # Water beyond the state boundary is not relevant to Colorado land pixels.
    water = water.intersection(land)
    if water.is_empty or not water.is_valid:
        raise ValueError("Clipped water union is invalid or empty")

    land_path = output / "tiger2025-colorado-land.geojson"
    water_path = output / "tiger2025-colorado-areawater.geojson"
    land_hash = _write_geojson(land_path, land, "land")
    water_hash = _write_geojson(water_path, water, "water")
    manifest = {
        "schema_version": 1,
        "status": "research-only-official-source-ingestion",
        "release_eligible": False,
        "physical_or_legal_access_certified": False,
        "land_water_completeness_certified": False,
        "outside_extract_coverage_certified": False,
        "vintage": 2025, "state_fips": STATE_FIPS,
        "bbox_lonlat": list(bounds),
        "selected_county_geoids": sorted(selected),
        "county_coverage_gap_degree2": uncovered,
        "intersecting_areawater_features": intersecting_water_features,
        "source_archives": sources,
        "geojson": {
            "land": {"path": land_path.name, "sha256": land_hash},
            "water": {"path": water_path.name, "sha256": water_hash}
        },
        "limitations": [
            "Census AREAWATER polygons omit narrow single-line drainage and may omit seasonal water",
            "State/county TIGER coverage is not legal/physical drivable connector evidence",
            "This clipping process does not prove full network or source metro coverage",
            "Off-land, water, unreachable and ambiguous pixels must remain transparent"
        ],
    }
    (output / "tiger2025-geography-manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    return manifest


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bbox", type=float, nargs=4, required=True)
    parser.add_argument("--cache", type=Path, default=Path("local-data/tiger2025"))
    parser.add_argument("--output-dir", type=Path,
                        default=Path("colorado-geographic-validation/tiger2025"))
    parser.add_argument("--offline", action="store_true",
                        help="Never download; fail if a required archive is uncached")
    args = parser.parse_args()
    manifest = prepare_tiger2025_geography(
        args.bbox, args.cache, args.output_dir, offline=args.offline)
    print(json.dumps({key: value for key, value in manifest.items()
                      if key != "source_archives"}, indent=2))


if __name__ == "__main__":
    main()
