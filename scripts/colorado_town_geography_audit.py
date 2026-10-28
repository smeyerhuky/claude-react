#!/usr/bin/env python3
"""Official-source geography-only diagnostics for the three southern probes."""
import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image
from shapely.geometry import box, shape

from colorado_geographic_mask import build_explicit_land_water_mask
from colorado_png_geography_oracle import verify_png_footprints
from colorado_tiger2025_geography import prepare_tiger2025_geography

CASES = {
    "antonito": [-106.08, 36.97, -105.95, 37.15],
    "ignacio": [-107.7, 37.05, -107.55, 37.20],
    "san-luis": [-105.50, 37.13, -105.35, 37.28],
}


def audit_prepared(root, bounds, *, size=64, require_offland=False):
    root = Path(root)
    manifest_path = root/"tiger2025-geography-manifest.json"
    manifest = json.loads(manifest_path.read_text())
    if (manifest["bbox_lonlat"] != bounds or any(manifest.get(k) is not False for k in
            ("release_eligible", "physical_or_legal_access_certified", "land_water_completeness_certified")) or
            manifest["coordinate_operation"]["geographic_accuracy_certified"] is not False):
        raise ValueError("Exact research geography manifest/bounds required")
    paths = {kind: root/("tiger2025-colorado-"+suffix+".geojson")
             for kind, suffix in (("land", "land"), ("water", "areawater"))}
    for kind, path in paths.items():
        if hashlib.sha256(path.read_bytes()).hexdigest() != manifest["geojson"][kind]["sha256"]:
            raise ValueError("Exact geography polygon hash mismatch")
    mask = build_explicit_land_water_mask(paths["land"], paths["water"], bounds, size, size)
    (root/"geography-mask.json").write_text(json.dumps(mask, indent=2)+"\n")
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    for y, row in enumerate(mask["land_mask"]):
        for x, valid in enumerate(row):
            if valid:
                image.putpixel((x, y), (42, 140, 80, 255))
    image_path = root/"geography-only-mask.png"
    image.save(image_path)
    # Independently load the actual polygons; the checker imports no mask code.
    land, water = (shape(json.loads(paths[k].read_text())["geometry"]) for k in ("land", "water"))
    oracle = verify_png_footprints(image_path, land, water, bounds)
    if (oracle["geography_pixel_counts"] != mask["pixel_counts"] or
            oracle["routed_pixels"] != mask["pixel_counts"]["land_nonwater"] or
            sum(mask["pixel_counts"].values()) != size*size or
            mask["pixel_counts"]["land_nonwater"] == 0 or mask["pixel_counts"]["water_excluded"] == 0):
        raise ValueError("Nonvacuous independent whole-cell geography check failed")
    negatives = {"water": 0, "outside_land": 0}
    west, south, east, north = bounds
    for y, row in enumerate(mask["land_mask"]):
        for x, valid in enumerate(row):
            if valid:
                continue
            cell = box(west+(east-west)*x/size, north-(north-south)*(y+1)/size,
                       west+(east-west)*(x+1)/size, north-(north-south)*y/size)
            reason = "outside_land" if not land.covers(cell) else "water" if water.intersects(cell) else None
            if reason is None or negatives[reason]:
                continue
            bad = image.copy()
            bad.putpixel((x, y), (255, 0, 0, 255))
            negative_path = root/("negative-painted-"+reason+".png")
            bad.save(negative_path)
            try:
                verify_png_footprints(negative_path, land, water, bounds)
            except ValueError as error:
                if "Painted pixel" not in str(error):
                    raise
                negatives[reason] += 1
            else:
                raise ValueError("Independent checker accepted deliberately unsupported paint")
    if not negatives["water"] or require_offland and not negatives["outside_land"]:
        raise ValueError("Required real-source negative did not execute")
    result = {"release_eligible": False, "road_access_certified": False,
        "land_water_completeness_certified": False, "geographic_accuracy_certified": False,
        "bounds_lonlat": bounds, "width": size, "height": size, "pixel_counts": mask["pixel_counts"],
        "independent_scalar_cells_checked": size*size, "negative_rejections": negatives,
        "unsupported_painted_cells": oracle["unsupported_painted_pixels"],
        "geography_manifest_sha256": hashlib.sha256(manifest_path.read_bytes()).hexdigest(),
        "land_geojson_sha256": mask["land_geojson_sha256"], "water_geojson_sha256": mask["water_geojson_sha256"],
        "warning": "Diagnostic geography-only alpha mask, not routed or accessible land. Shared GEOS/source polygons do not independently certify hydrology. Datum accuracy is not an absolute error bound; omitted/seasonal water and road/connector/exterior coverage remain unresolved."}
    (root/"geography-audit.json").write_text(json.dumps(result, indent=2)+"\n")
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--cache", type=Path, required=True)
    p.add_argument("--output-dir", type=Path, required=True)
    p.add_argument("--offline", action="store_true")
    args = p.parse_args()
    results = []
    for name, bounds in CASES.items():
        root = args.output_dir/name
        prepare_tiger2025_geography(bounds, args.cache, root, offline=args.offline)
        result = audit_prepared(root, bounds, require_offland=name == "antonito")
        results.append({"name": name, **result})
        print(json.dumps({"name": name, "pixel_counts": result["pixel_counts"],
                          "negative_rejections": result["negative_rejections"]}), flush=True)
    summary = {"release_eligible": False, "road_access_certified": False,
               "land_water_completeness_certified": False, "results": results}
    (args.output_dir/"town-geography-audit.json").write_text(json.dumps(summary, indent=2)+"\n")


if __name__ == "__main__":
    main()
