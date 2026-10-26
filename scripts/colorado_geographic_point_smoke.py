#!/usr/bin/env python3
"""Real-OSM corridor smoke test of geographic origins; diagnostic ONLY.

No physical/legal road connector is independently audited by this script.
No candidate sets outside the loaded, clipped graph are certified.
"""
import argparse
import json
from pathlib import Path

from colorado_geographic_point_diagnostics import diagnose_full_graph_point
from colorado_metro_winners import read_metros, snap_candidates
from stream_osm_roads import load_pbf


def point_report(graph, snapped, lon, lat, threshold=100000, max_gap_m=30):
    sources = [m for m in snapped if m["population"] >= threshold]
    if not sources:
        raise ValueError("No qualifying metro sources in clipped road extract")
    metrics = {}
    for label, weight in (("road_distance", "length"),
                          ("road_time", "travel_time")):
        result = diagnose_full_graph_point(
            graph, lon, lat, sources, weight, max_gap_m=max_gap_m)
        if result["access_certified"] or result["extract_coverage_certified"]:
            raise AssertionError("Research diagnostic must never certify release")
        if any(winner not in {m["cbsa"] for m in sources}
               for winner in result["winners"]):
            raise AssertionError("Unknown metro winner in geographic diagnostic")
        metrics[label] = result
    return {"status": "diagnostic-only", "release_eligible": False,
            "origin_lonlat": [lon, lat],
            "threshold_population": threshold,
            "unsnapped_connector_warning":
                "Metro snapping and point-to-road approach not physically or legally verified",
            "extract_warning":
                "Clipped OSM corridor; roads and metro destinations outside extract omitted",
            "graph_nodes": graph.number_of_nodes(),
            "graph_directed_edges": graph.number_of_edges(),
            "candidate_metros": len(sources), "metrics": metrics}


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--metros", type=Path,
                   default=Path("public/data/metros-census-2025.csv"))
    p.add_argument("--lon", type=float, default=-104.9903)
    p.add_argument("--lat", type=float, default=39.7392)
    p.add_argument("--threshold", type=int, default=100000)
    p.add_argument("--max-gap-m", type=float, default=30)
    p.add_argument("--output", type=Path,
                   default=Path("colorado-geographic-validation/geographic-point-smoke.json"))
    args = p.parse_args()
    if args.threshold <= 0 or args.max_gap_m <= 0:
        p.error("Threshold and proximity must be positive")
    graph, _ = load_pbf(args.osm)
    snapped, rejected = snap_candidates(graph, read_metros(args.metros))
    output = point_report(graph, snapped, args.lon, args.lat,
                          args.threshold, args.max_gap_m)
    output["rejected_metro_snaps"] = rejected
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(output, indent=2))


if __name__ == "__main__":
    main()
