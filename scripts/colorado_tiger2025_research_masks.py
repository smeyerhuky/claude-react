#!/usr/bin/env python3
"""Download 2025 Census TIGER state/county water and render UNCERTIFIED masks.

Research only: geometry and provenance do not certify hydrologic completeness,
legal access, OSM extract closure or release eligibility. No UI integration.
"""
import argparse
import hashlib
import io
import json
import re
from pathlib import Path
import urllib.request
import zipfile

BASE = "https://www2.census.gov/geo/tiger/TIGER2025"
STATE = "tl_2025_us_state.zip"
COUNTY = "tl_2025_us_county.zip"
DEFAULT_BOUNDS = (-105.075, 39.70, -104.92, 39.79)  # bounded Denver research view
MAX_ZIP_BYTES = 125_000_000


def _fetch_zip(filename, section, download_dir, expected=None, opener=None):
    """Exact Census URL, capped download, hash and optional externally pinned digest."""
    url = f"{BASE}/{section}/{filename}"
    path = Path(download_dir) / filename
    if path.exists():
        raw = path.read_bytes()
    else:
        if opener is None:
            opener = urllib.request.urlopen
        request = urllib.request.Request(url, headers={"User-Agent": "Colorado-research-TIGER2025/1.0"})
        with opener(request, timeout=90) as response:
            raw = response.read(MAX_ZIP_BYTES + 1)
        if len(raw) > MAX_ZIP_BYTES:
            raise ValueError(f"Oversized Census download: {filename}")
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(raw)
    if not raw or len(raw) > MAX_ZIP_BYTES:
        raise ValueError(f"Missing/oversized TIGER archive: {filename}")
    digest = hashlib.sha256(raw).hexdigest()
    if expected is not None and digest != expected:
        raise ValueError(f"Pinned SHA256 mismatch for {filename}")
    if not zipfile.is_zipfile(io.BytesIO(raw)):
        raise ValueError(f"Invalid TIGER ZIP: {filename}")
    return raw, {"url": url, "filename": filename, "sha256": digest, "bytes": len(raw)}


def _shapes_from_zip(raw, filename, wanted_state=None, raw_bbox=None):
    """Require one complete NAD83 shapefile; explicitly transform to WGS84."""
    import shapefile
    from pyproj import CRS, Transformer
    from shapely.geometry import shape
    from shapely.ops import transform

    stem = filename.removesuffix(".zip")
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = set(z.namelist())
        wanted = {ext: stem + ext for ext in (".shp", ".shx", ".dbf", ".prj")}
        if not all(member in names for member in wanted.values()):
            raise ValueError(f"Missing TIGER shapefile member: {filename}")
        if len(names) > 20 or any(i.file_size > 350_000_000 for i in z.infolist()):
            raise ValueError("Unbounded TIGER ZIP member")
        crs = CRS.from_wkt(z.read(wanted[".prj"]).decode("utf-8"))
        if crs.to_epsg() != 4269:
            raise ValueError("Expected official TIGER NAD83 geographic EPSG:4269")
        transformer = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)
        with shapefile.Reader(shp=io.BytesIO(z.read(wanted[".shp"])),
                              shx=io.BytesIO(z.read(wanted[".shx"])),
                              dbf=io.BytesIO(z.read(wanted[".dbf"]))) as reader:
            fields = [f[0] for f in reader.fields[1:]]
            for record in reader.iterShapeRecords():
                attrs = dict(zip(fields, record.record))
                if wanted_state is not None and str(attrs.get("STATEFP", "")) != wanted_state:
                    continue
                if raw_bbox is not None:
                    x0, y0, x1, y1 = record.shape.bbox
                    w, s, e, n = raw_bbox
                    if x1 < w - .01 or x0 > e + .01 or y1 < s - .01 or y0 > n + .01:
                        continue
                geom = transform(transformer.transform, shape(record.shape.__geo_interface__))
                if geom.is_empty or not geom.is_valid or geom.geom_type not in ("Polygon", "MultiPolygon"):
                    raise ValueError(f"Invalid TIGER polygon in {filename}")
                yield attrs, geom


def _polygon_parts(geom):
    if geom.is_empty:
        return []
    if geom.geom_type == "Polygon":
        return [geom]
    if geom.geom_type == "MultiPolygon":
        return list(geom.geoms)
    raise ValueError("Unexpected clipped TIGER polygon type")


def _geojson(polygons):
    from shapely.geometry import mapping
    return {"type": "FeatureCollection", "features": [
        {"type": "Feature", "properties": {}, "geometry": mapping(poly)}
        for poly in polygons]}


def build_research_geography(download_dir, output_dir, bounds=DEFAULT_BOUNDS,
                             pixels=96, expected_hashes=None, fetcher=_fetch_zip):
    """Select *all* intersecting official counties, never a hand-picked subset."""
    from shapely.geometry import box
    from shapely.ops import unary_union
    from PIL import Image
    from colorado_geographic_mask import build_explicit_land_water_mask

    if (len(bounds) != 4 or not -180 <= bounds[0] < bounds[2] <= 180 or
            not -90 <= bounds[1] < bounds[3] <= 90 or
            type(pixels) is not int or not 1 <= pixels <= 128):
        raise ValueError("Invalid bounded Colorado research viewport")
    lock_required = expected_hashes is not None
    expected_hashes = expected_hashes or {}
    area = box(*bounds)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    downloads = {}

    def acquire(name, section):
        if lock_required and name not in expected_hashes:
            raise ValueError(f"Missing pinned SHA256 for {name}")
        raw, metadata = fetcher(name, section, download_dir, expected_hashes.get(name))
        downloads[name] = metadata
        return raw

    state_zip = acquire(STATE, "STATE")
    states = [g for attrs, g in _shapes_from_zip(state_zip, STATE, wanted_state="08")
              if str(attrs.get("STATEFP", "")) == "08"]
    if len(states) != 1 or not states[0].covers(area):
        raise ValueError("Research viewport must lie entirely inside 2025 Colorado state")
    land = _polygon_parts(states[0].intersection(area))

    county_zip = acquire(COUNTY, "COUNTY")
    counties = {}
    for attrs, geom in _shapes_from_zip(county_zip, COUNTY, wanted_state="08", raw_bbox=bounds):
        if str(attrs.get("STATEFP", "")) != "08" or not geom.intersects(area):
            continue
        geoid = str(attrs.get("GEOID", ""))
        if len(geoid) != 5 or not geoid.startswith("08") or geoid in counties:
            raise ValueError("Invalid/duplicate Colorado county GEOID")
        counties[geoid] = geom
    if not counties or not unary_union(list(counties.values())).covers(area):
        raise ValueError("Incomplete 2025 county coverage of research viewport")

    water = []
    feature_counts = {}
    for geoid in sorted(counties):
        filename = f"tl_2025_{geoid}_areawater.zip"
        raw = acquire(filename, "AREAWATER")
        feature_counts[geoid] = 0
        for _, geom in _shapes_from_zip(raw, filename):
            clipped = geom.intersection(area)
            if clipped.area > 0:
                parts = _polygon_parts(clipped)
                water.extend(parts)
                feature_counts[geoid] += len(parts)
    if not water:
        raise ValueError("No TIGER areawater in viewport; cannot supply a nonempty water layer")

    land_file = output_dir / "tiger2025-colorado-land.geojson"
    water_file = output_dir / "tiger2025-colorado-water.geojson"
    land_file.write_text(json.dumps(_geojson(land), sort_keys=True) + "\n")
    water_file.write_text(json.dumps(_geojson(water), sort_keys=True) + "\n")
    mask = build_explicit_land_water_mask(land_file, water_file, bounds, pixels, pixels)
    # Only a diagnostic of supplied TIGER geometry, not a certified map.
    from shapely import contains_xy
    import numpy as np
    water_union = unary_union(water)
    xs = bounds[0] + (np.arange(pixels) + .5) * (bounds[2] - bounds[0]) / pixels
    ys = bounds[3] - (np.arange(pixels) + .5) * (bounds[3] - bounds[1]) / pixels
    lon, lat = np.meshgrid(xs, ys)
    water_cells = contains_xy(water_union, lon, lat)
    rgba = []
    for row in range(pixels):
        for col in range(pixels):
            rgba.append((36, 105, 185, 255) if water_cells[row, col] else
                        (205, 202, 189, 255) if mask["land_mask"][row][col] else
                        (0, 0, 0, 0))
    image = Image.new("RGBA", (pixels, pixels))
    image.putdata(rgba)
    png_file = output_dir / "tiger2025-geography-diagnostic.png"
    image.save(png_file)
    if not any(water_cells.flat):
        raise ValueError("Water polygons present but no water pixel sampled; increase resolution or adjust corridor")
    result = {
        "status": "real-census-inputs-research-only-not-a-release-audit",
        "release_eligible": False,
        "input_completeness_certified": False,
        "legal_physical_access_certified": False,
        "extract_coverage_certified": False,
        "source": "US Census 2025 TIGER/Line STATE, COUNTY, county AREAWATER",
        "source_crs": "EPSG:4269 NAD83", "output_crs": "EPSG:4326 WGS84",
        "bounds_lonlat": list(bounds), "pixels": pixels,
        "county_geoids_intersecting_viewport": sorted(counties),
        "water_polygon_parts_per_county": feature_counts,
        "download_sources": downloads,
        "mask_provenance": {key: mask[key] for key in (
            "land_geojson_sha256", "water_geojson_sha256", "pixel_counts")},
        "diagnostic_png": png_file.name,
        "diagnostic_png_sha256": hashlib.sha256(png_file.read_bytes()).hexdigest(),
        "warning": "Census TIGER areawater is not an exhaustive hydrology or legal road-access audit; no release approval is implied. Unmapped water and out-of-extract routes remain unknown.",
    }
    (output_dir / "tiger2025-candidate-hashes.json").write_text(
        json.dumps({name: metadata["sha256"] for name, metadata in sorted(downloads.items())},
                   indent=2) + "\n")
    (output_dir / "tiger2025-source-manifest.json").write_text(
        json.dumps(result, indent=2, sort_keys=True) + "\n")
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--download-dir", type=Path, default=Path("local-data/tiger2025"))
    parser.add_argument("--output-dir", type=Path, default=Path("colorado-tiger2025-research"))
    parser.add_argument("--bounds", nargs=4, type=float, default=DEFAULT_BOUNDS)
    parser.add_argument("--pixels", type=int, default=96)
    parser.add_argument("--expected-hashes", type=Path, help="Optional JSON {zip_basename: sha256}; rejects changed inputs")
    args = parser.parse_args()
    hashes = json.loads(args.expected_hashes.read_text()) if args.expected_hashes else None
    if hashes is not None and (not isinstance(hashes, dict) or any(
            not isinstance(k, str) or not isinstance(v, str) or
            not re.fullmatch(r"[0-9a-f]{64}", v)
            for k, v in hashes.items())):
        parser.error("Expected hash lock must map archive basenames to SHA256 hex")
    result = build_research_geography(args.download_dir, args.output_dir,
                                      args.bounds, args.pixels, hashes)
    print(json.dumps({k: v for k, v in result.items() if k != "download_sources"}, indent=2))


if __name__ == "__main__":
    main()
