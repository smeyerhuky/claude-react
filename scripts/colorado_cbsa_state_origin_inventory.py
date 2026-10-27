#!/usr/bin/env python3
"""Classify qualifying CBSA representative points against official Colorado state geometry.

This is an origin-geography diagnostic, NOT a metro-boundary classification,
a complete source-competition proof, or physical/legal road access approval.
All national qualifying CBSAs remain eligible competitors.
"""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

from shapely.geometry import Point
from colorado_tiger2025_geography import _read_shapes, STATE_FIPS


def classify_representative_points(rows, state, threshold, audit=None):
    if state.is_empty or not state.is_valid:
        raise ValueError("Invalid state geometry")
    qualifying = {}
    seen = set()
    for row in rows:
        cbsa = row["cbsa"]
        if cbsa in seen:
            raise ValueError("Duplicate CBSA: " + cbsa)
        seen.add(cbsa)
        population = int(row["population"])
        if population < threshold:
            continue
        lon, lat = float(row["longitude"]), float(row["latitude"])
        if not (math.isfinite(lon) and math.isfinite(lat) and -180 <= lon <= 180 and -90 <= lat <= 90):
            raise ValueError("Invalid metro representative point")
        qualifying[cbsa] = {"cbsa": cbsa, "inside_colorado_state": bool(state.covers(Point(lon, lat)))}
    if not qualifying:
        raise ValueError("No qualifying CBSAs")
    if audit is not None:
        if audit["threshold_population"] != threshold:
            raise ValueError("Connector audit threshold mismatch")
        candidates = audit["candidates"]
        by_id = {x["cbsa"]: x for x in candidates}
        if len(by_id) != len(candidates) or set(by_id) != set(qualifying):
            raise ValueError("Connector audit incomplete or duplicate CBSA")
        for cbsa, entry in qualifying.items():
            candidate = by_id[cbsa]
            count = candidate["candidate_count_within_limit"]
            if type(count) is not int or count < 0:
                raise ValueError("Invalid geometric candidate count")
            entry["geometric_candidate_count"] = count
            entry["has_geometric_candidate"] = count > 0
    inside = sorted(k for k, v in qualifying.items() if v["inside_colorado_state"])
    outside = sorted(set(qualifying) - set(inside))
    result = {
        "release_eligible": False,
        "access_certified": False,
        "extract_coverage_certified": False,
        "global_competitor_exclusion_permitted": False,
        "qualifying_cbsa_count": len(qualifying),
        "representative_points_inside_colorado_count": len(inside),
        "representative_points_outside_colorado_count": len(outside),
        "inside_colorado_cbsa_ids": inside,
        "outside_colorado_cbsa_ids": outside,
        "classification_scope": "2025 Census CBSA representative points, not CBSA polygons",
        "warning": "Outside-state origins remain eligible national competitors; no access or route certification",
    }
    if audit is not None:
        result["inside_colorado_missing_geometric_candidates"] = sum(
            not qualifying[k]["has_geometric_candidate"] for k in inside)
        result["outside_colorado_missing_geometric_candidates"] = sum(
            not qualifying[k]["has_geometric_candidate"] for k in outside)
        result["inside_colorado_with_geometric_candidates"] = len(inside) - result["inside_colorado_missing_geometric_candidates"]
        result["outside_colorado_with_geometric_candidates"] = len(outside) - result["outside_colorado_missing_geometric_candidates"]
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--metros", required=True)
    p.add_argument("--tiger-state-zip", required=True)
    p.add_argument("--audit", required=True)
    p.add_argument("--threshold", type=int, default=100000)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    if args.threshold <= 0:
        raise ValueError("Population threshold must be positive")
    states = [geom for fields, geom in _read_shapes(Path(args.tiger_state_zip), 60)
              if fields.get("GEOID") == STATE_FIPS]
    if len(states) != 1:
        raise ValueError("Missing or duplicate official Colorado state polygon")
    with Path(args.metros).open(newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    audit = json.loads(Path(args.audit).read_text())
    result = classify_representative_points(rows, states[0], args.threshold, audit)
    result["tiger_state_zip_sha256"] = hashlib.sha256(Path(args.tiger_state_zip).read_bytes()).hexdigest()
    result["metros_csv_sha256"] = hashlib.sha256(Path(args.metros).read_bytes()).hexdigest()
    result["audit_sha256"] = hashlib.sha256(Path(args.audit).read_bytes()).hexdigest()
    Path(args.output).write_text(json.dumps(result, sort_keys=True, indent=2) + "\n")
    print(json.dumps({k: v for k, v in result.items() if not k.endswith("_ids")}, indent=2))


if __name__ == "__main__":
    main()
