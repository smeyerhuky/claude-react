#!/usr/bin/env python3
"""Cross-check research road PNG metro winners with independent directed Dijkstra.

This checks the routing *algorithm* within a fixed, clipped OSM graph.
It does NOT independently establish legal/physical road access, full network
coverage or comprehensive water data, and never certifies release.
"""
import argparse
import json
from pathlib import Path

from PIL import Image

from colorado_geographic_point_diagnostics import _edge_projection, edge_origin_oracle
from colorado_metro_winners import read_metros, snap_candidates
from colorado_research_road_preview import geographic_edge_subset
from colorado_routed_raster_diagnostics import SegmentGridIndex
from stream_osm_roads import load_pbf


def _oracle_cbsa(graph, index, sources, lon, lat, weight, max_gap_m,
                 ambiguity_m=5):
    """Oracle recomputes complete directed source paths, not node-winner labels."""
    options = []
    for edge in index.candidates(lon, lat, max_gap_m):
        p = _edge_projection(index.graph, edge, lon, lat)
        if p["gap_m"] > max_gap_m:
            continue
        u, v, key = edge
        geometry = tuple(tuple(pt) for pt in graph[u][v][key]["geometry"])
        physical = (min(geometry, tuple(reversed(geometry))),
                    tuple(sorted((str(u), str(v)))))
        options.append((edge, p, physical))
    if not options:
        return None, "no_nearby_road"
    gap = min(p["gap_m"] for _, p, _ in options)
    close = [(edge, p, physical) for edge, p, physical in options
             if p["gap_m"] <= gap + ambiguity_m]
    if len({physical for _, _, physical in close}) != 1:
        return None, "ambiguous_centerlines"
    routes = []
    for edge, p, _ in close:
        outcome = edge_origin_oracle(
            graph, edge, sources, weight, p["fraction"])
        if outcome["reachable"]:
            for cbsa in outcome["winners"]:
                routes.append((outcome["cost"], cbsa))
    if not routes:
        return None, "unreachable"
    best = min(cost for cost, _ in routes)
    tied = {cbsa for cost, cbsa in routes if
            abs(cost - best) <= max(0.002, abs(best) * 1e-9)}
    if len(tied) != 1:
        return None, "ambiguous_winner"
    return next(iter(tied)), "reachable"


def _stratified_pixels(png, max_samples):
    if type(max_samples) is not int or not 1 <= max_samples <= 40:
        raise ValueError("Invalid independent oracle sampling budget")
    points = [(x, y) for y in range(png.height)
              for x in range(png.width) if png.getpixel((x, y))[3] > 0]
    if not points:
        raise ValueError("Cannot validate empty road-region raster")
    count = min(max_samples, len(points))
    return [points[min(len(points) - 1,
                       (i * len(points) + len(points)//2) // count)]
            for i in range(count)]


def validate_road_png_oracle(graph, snapped, preview_dir, max_samples=8):
    """Fail if any sampled colored pixel conflicts with full directed Dijkstra."""
    root = Path(preview_dir)
    summary = json.loads((root / "preview-manifest.json").read_text())
    if (summary.get("release_eligible") is not False or
        summary.get("access_certified") is not False or
        summary.get("extract_coverage_certified") is not False):
        raise ValueError("Refuse non-research preview contract")
    bounds = summary.get("bounds_lonlat")
    if (not isinstance(bounds, list) or len(bounds) != 4 or
        summary.get("pixels", 0) > 128):
        raise ValueError("Invalid research PNG geography")
    threshold = summary.get("source_population_threshold")
    max_gap_m = summary.get("max_road_proximity_m")
    if type(threshold) is not int or threshold < 1 or not isinstance(
            max_gap_m, (int, float)) or not 0 < max_gap_m <= 500:
        raise ValueError("Invalid preview metro threshold or road gap")
    sources = [m for m in snapped if m["population"] >= threshold]
    if len(sources) != summary.get("source_cbsa_count"):
        raise ValueError("Preview metro sources differ from independent audit inputs")
    graph_view, _ = geographic_edge_subset(graph, bounds, max_gap_m)
    index = SegmentGridIndex(graph_view)
    result = {"status": "diagnostic-directed-dijkstra-algorithm-comparison",
              "release_eligible": False, "access_certified": False,
              "external_network_coverage_proven": False,
              "metrics": {}, "sample_budget_per_metric": max_samples}
    west, south, east, north = bounds
    for metric, weight in (("distance", "length"), ("time", "travel_time")):
        info = summary["layers"][metric]
        if info.get("weight") != weight:
            raise ValueError("Preview layer routing metric mismatch")
        palette = {tuple(rgba): cbsa for cbsa, rgba in info["palette_rgba"].items()}
        if len(palette) != len(info["palette_rgba"]):
            raise ValueError("Metro raster palette has ambiguous colors")
        with Image.open(root / info["image"]) as rgba:
            png = rgba.convert("RGBA")
            if png.size != (summary["pixels"], summary["pixels"]):
                raise ValueError("Unexpected research PNG resolution")
            chosen = _stratified_pixels(png, max_samples)
            verified = []
            for x, y in chosen:
                pixel = png.getpixel((x, y))
                actual = palette.get(pixel)
                if actual is None:
                    raise ValueError("Colored road pixel absent from metro palette")
                lon = west + (x + .5) * (east - west) / png.width
                lat = north - (y + .5) * (north - south) / png.height
                oracle, reason = _oracle_cbsa(
                    graph, index, sources, lon, lat, weight, max_gap_m)
                if oracle != actual:
                    raise ValueError(
                        f"Independent {metric} oracle disagrees at pixel ({x},{y}): "
                        f"PNG={actual}, directed-Dijkstra={oracle}, reason={reason}")
                verified.append({"pixel": [x, y], "cbsa": actual})
        result["metrics"][metric] = {
            "sampled_colored_pixels": len(verified),
            "disagreements": 0,
            "samples": verified}
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--osm", type=Path, required=True)
    parser.add_argument("--metros", type=Path,
                        default=Path("public/data/metros-census-2025.csv"))
    parser.add_argument("--preview-dir", type=Path, required=True)
    parser.add_argument("--max-samples", type=int, default=8)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    graph, _ = load_pbf(args.osm)
    snapped, _ = snap_candidates(graph, read_metros(args.metros))
    report = validate_road_png_oracle(
        graph, snapped, args.preview_dir, args.max_samples)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({metric: item["sampled_colored_pixels"]
                      for metric, item in report["metrics"].items()}))


if __name__ == "__main__":
    main()
