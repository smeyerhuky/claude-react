#!/usr/bin/env python3
"""Research-only PNG layers from directed Colorado roads and explicit land/water.

This is a *sparse* route-supported pixel preview. Neither close-to-road
geometric samples nor source polygons are independently certified, and clipped
road graphs may omit decisive paths or metro competitors. NEVER deploy the
output as production Metro Population Voronoi road regions.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

from colorado_geographic_mask import build_explicit_land_water_mask
from colorado_metro_winners import allocate_thresholds, read_metros, snap_candidates
from colorado_routed_raster_diagnostics import SegmentGridIndex, sample_masked_grid
from stream_osm_roads import load_pbf


def geographic_edge_subset(graph, bounds, gap_m=30, max_edges=250000):
    """Index edges touching the padded viewport, scanning *every* loaded arc.

    Completeness is only relative to the loaded graph extract. The index is
    for geometric origin proximity, not a guarantee of legal road entry.
    """
    if len(bounds) != 4 or any(not isinstance(v, (int, float)) or
                                  not math.isfinite(v) for v in bounds):
        raise ValueError("Invalid preview bounds")
    west, south, east, north = bounds
    if not -180 <= west < east <= 180 or not -89 < south < north < 89:
        raise ValueError("Invalid preview bounds")
    if not 0 < gap_m <= 500 or type(max_edges) is not int or max_edges < 1:
        raise ValueError("Invalid preview limits")
    margin_y = 2 * gap_m / 110574
    margin_x = 2 * gap_m / (111000 * max(
        0.005, math.cos(math.radians(max(abs(south), abs(north)) + margin_y))))
    selected = []
    for u, v, key, data in graph.edges(keys=True, data=True):
        shape = data.get("geometry")
        if not isinstance(shape, (tuple, list)) or len(shape) < 2 or any(
                not isinstance(p, (tuple, list)) or len(p) != 2 or
                any(not isinstance(x, (int, float)) or not math.isfinite(x)
                    for x in p) for p in shape):
            raise ValueError("Cannot assert complete extract scan: missing road geometry")
        lons = [p[0] for p in shape]
        lats = [p[1] for p in shape]
        if (max(lons) >= west-margin_x and min(lons) <= east+margin_x and
                max(lats) >= south-margin_y and min(lats) <= north+margin_y):
            selected.append((u, v, key))
            if len(selected) > max_edges:
                raise ValueError("Viewport requires more road edges than the preview cap")
    if not selected:
        raise ValueError("No road edges intersect the supported preview area")
    return graph.edge_subgraph(selected), len(selected)


def _color(cbsa):
    # Stable, reproducible, deterministic colors for both routing metrics.
    rgb = hashlib.sha256(str(cbsa).encode("utf-8")).digest()
    return (64 + rgb[0] % 150, 64 + rgb[1] % 150, 64 + rgb[2] % 150, 205)


def _save_routed_png(grid, sources, path):
    from PIL import Image

    palette = {str(source["cbsa"]): _color(source["cbsa"]) for source in sources}
    if not grid or not grid[0]:
        raise ValueError("Empty road-region raster")
    width = len(grid[0])
    if any(len(row) != width for row in grid):
        raise ValueError("Nonrectangular road-region raster")
    pixels = []
    for row in grid:
        for cbsa in row:
            if cbsa is None:
                pixels.append((0, 0, 0, 0))
            elif str(cbsa) in palette:
                pixels.append(palette[str(cbsa)])
            else:
                raise ValueError("Raster contains a nonqualifying metro CBSA")
    image = Image.new("RGBA", (width, len(grid)))
    image.putdata(pixels)
    image.save(path)
    return {cbsa: list(rgba) for cbsa, rgba in sorted(palette.items())}


def render_research_preview(graph, snapped, land_geojson, water_geojson,
                            bounds, threshold, pixels, max_gap_m, output_dir):
    """Write transparent route-aware PNGs and one explicit experimental manifest.

    Uses full extracted-graph directed node winners; only local edge geometry
    is spatially indexed. Does not certify external paths, legal connectors,
    or authoritative water/land completeness.
    """
    if type(threshold) is not int or threshold < 1:
        raise ValueError("Threshold must be a positive integer")
    if type(pixels) is not int or not 1 <= pixels <= 128:
        raise ValueError("Preview resolution must be between 1 and 128")
    if not isinstance(max_gap_m, (int, float)) or not 0 < max_gap_m <= 500:
        raise ValueError("Invalid maximum road gap")
    mask = build_explicit_land_water_mask(
        land_geojson, water_geojson, bounds, pixels, pixels)
    graph_view, indexed_edges = geographic_edge_subset(graph, bounds, max_gap_m)
    index = SegmentGridIndex(graph_view)
    allocation = allocate_thresholds(graph, snapped, [threshold])[str(threshold)]
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)
    layers = {}
    for metric, weight, filename in (("distance", "length", "by-road-distance.png"),
                                      ("time", "travel_time", "by-road-time.png")):
        sample = sample_masked_grid(
            index, allocation[metric]["winners"], weight, bounds,
            mask["land_mask"], pixels, pixels, max_gap_m=max_gap_m)
        filename_path = output_dir / filename
        palette = _save_routed_png(sample["cbsa_grid"],
                                   allocation["sources"], filename_path)
        layers[metric] = {
            "image": filename, "weight": weight,
            "transparent_pixels": pixels*pixels - sample["reasons"].get("routed_candidate", 0),
            "reason_counts": sample["reasons"],
            "palette_rgba": palette}
    summary = {
        "status": "research-only-uncertified-coverage",
        "release_eligible": False,
        "access_certified": False,
        "land_water_completeness_certified": False,
        "extract_coverage_certified": False,
        "orientation": "location-to-metro",
        "graph_routing_model": dict(graph.graph),
        "source_population_threshold": threshold,
        "source_cbsa_count": len(allocation["sources"]),
        "source_cbsa_ids": sorted(str(m["cbsa"]) for m in allocation["sources"]),
        "bounds_lonlat": list(bounds), "pixels": pixels,
        "max_road_proximity_m": max_gap_m,
        "road_edge_count_in_viewport": indexed_edges,
        "mask_provenance": {key: mask[key] for key in
            ("land_geojson_sha256", "water_geojson_sha256",
             "pixel_counts", "input_completeness_certified")},
        "layers": layers,
        "warning": ("Pixels are geometrically snapped toward modeled road centerlines; "
                    "no legal/physical connector audit, external graph closure, or "
                    "complete hydrology certification exists. Unsupported pixels "
                    "are transparent, not straight-line fallbacks."),
    }
    (output_dir / "preview-manifest.json").write_text(
        json.dumps(summary, indent=2) + "\n", encoding="utf-8")
    return summary


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--osm", required=True, type=Path)
    parser.add_argument("--metros", type=Path,
                        default=Path("public/data/metros-census-2025.csv"))
    parser.add_argument("--land-geojson", type=Path, required=True)
    parser.add_argument("--water-geojson", type=Path, required=True)
    parser.add_argument("--bounds", nargs=4, type=float, required=True,
                        metavar=("WEST", "SOUTH", "EAST", "NORTH"))
    parser.add_argument("--pixels", type=int, default=64)
    parser.add_argument("--max-gap-m", type=float, default=30)
    parser.add_argument("--threshold", type=int, default=100000)
    parser.add_argument("--output-dir", type=Path,
                        default=Path("colorado-research-road-regions"))
    args = parser.parse_args()
    # Missing land or water datasets are argparse errors, not silent fallback.
    graph, _ = load_pbf(args.osm)
    sources, rejected = snap_candidates(graph, read_metros(args.metros))
    result = render_research_preview(
        graph, sources, args.land_geojson, args.water_geojson,
        args.bounds, args.threshold, args.pixels, args.max_gap_m, args.output_dir)
    for key, path in (("osm_sha256", args.osm), ("metro_csv_sha256", args.metros)):
        with path.open("rb") as handle:
            result[key] = hashlib.file_digest(handle, "sha256").hexdigest()
    result["rejected_candidate_snaps"] = rejected
    (args.output_dir / "preview-manifest.json").write_text(
        json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({key: value for key, value in result.items()
                      if key != "layers"}, indent=2))


if __name__ == "__main__":
    main()
