#!/usr/bin/env python3
"""Two explicit research origin scenarios; no urban point is access approval."""
import argparse
import csv
import hashlib
import io
import json
import math
from pathlib import Path

from stream_osm_roads import meters

CENSUS_SCENARIO = "census-cbsa-representative-point-v1"


def lonlat(lon, lat):
    lon, lat = float(lon), float(lat)
    if not (math.isfinite(lon) and math.isfinite(lat) and -180 <= lon <= 180 and -85 < lat < 85):
        raise ValueError("Invalid scenario point")
    return [lon, lat]


def build_scenarios(metro_rows, place_rows, selection, threshold=100000):
    if type(threshold) is not int or threshold <= 0:
        raise ValueError("Invalid population threshold")
    metros, places = {}, {}
    for row in metro_rows:
        cbsa = row["cbsa"]
        if cbsa in metros:
            raise ValueError("Duplicate CBSA")
        metros[cbsa] = row
    eligible = {k: row for k, row in metros.items() if int(row["population"]) >= threshold}
    if not eligible:
        raise ValueError("No qualifying metro sources")
    for row in place_rows:
        geoid = row["GEOID"]
        if geoid in places or not geoid.isdigit() or len(geoid) != 7 or not geoid.startswith("08") or row["USPS"] != "CO":
            raise ValueError("Invalid or duplicate Colorado place GEOID")
        lonlat(row["INTPTLONG"], row["INTPTLAT"])
        places[geoid] = row
    if selection["scenario_id"] != "colorado-named-city-point-leads-v1" or not selection["places"]:
        raise ValueError("Unknown or empty research scenario")
    chosen = {}
    seen_places = set()
    for lead in selection["places"]:
        cbsa, geoid = lead["cbsa"], lead["geoid"]
        if cbsa not in eligible or cbsa in chosen or geoid in seen_places or geoid not in places:
            raise ValueError("Missing, duplicated or nonqualifying research association")
        place = places[geoid]
        if eligible[cbsa]["name"] != lead["metro_name"]:
            raise ValueError("CBSA identity/name mismatch")
        if place["NAME"] != lead["name"] or place["LSAD"] != "25" or place["FUNCSTAT"] != "A":
            raise ValueError("Named-city identity/status mismatch")
        chosen[cbsa] = place
        seen_places.add(geoid)
    original, urban, shifts = [], [], []
    for cbsa, row in sorted(eligible.items()):
        identity = {"cbsa": cbsa, "name": row["name"], "population": int(row["population"]),
                    "access_verified": False, "connector_costs_established": False, "release_eligible": False}
        point = lonlat(row["longitude"], row["latitude"])
        original.append({**identity, "origin_lonlat": point, "status": "unapproved-representative-point",
                         "source_kind": "2025 Census CBSA representative coordinate"})
        place = chosen.get(cbsa)
        if place is None:
            urban.append({**identity, "origin_lonlat": None, "status": "missing-urban-anchor-evidence"})
        else:
            alternative = lonlat(place["INTPTLONG"], place["INTPTLAT"])
            urban.append({**identity, "origin_lonlat": alternative, "status": "unapproved-named-city-point-lead",
                          "source_kind": "2025 Census place representative coordinate; not road-access evidence",
                          "place_geoid": place["GEOID"], "place_name": place["NAME"]})
            shifts.append({"cbsa": cbsa, "point_displacement_m": meters(point, alternative), "access_verified": False})
    return {"schema_version": 1, "release_eligible": False, "access_certified": False,
            "complete_global_competition": False, "threshold_population": threshold,
            "qualifying_cbsa_ids": sorted(eligible), "approved_origin_count": 0,
            "scenarios": {CENSUS_SCENARIO: original, selection["scenario_id"]: urban},
            "scenario_point_displacements": shifts,
            "urban_association_basis": selection["association_basis"],
            "warning": "Both scenarios are research-only. Named-city representative points are leads for the urban-access scenario, not verified urban/road anchors; missing leads never fall back to Census CBSA points. Source datum/connector costs remain unverified."}


def investigate_scenarios(registry, osm, selected_ids):
    from colorado_origin_source_investigation import OriginInvestigation
    selected = set(selected_ids)
    if not selected or not selected.issubset(registry["qualifying_cbsa_ids"]):
        raise ValueError("Invalid scenario investigation inventory")
    reports, planned = {}, {}
    for scenario, rows in registry["scenarios"].items():
        origins = [{"cbsa": r["cbsa"], "name": r["name"], "lon": r["origin_lonlat"][0], "lat": r["origin_lonlat"][1]}
                   for r in rows if r["cbsa"] in selected and r["origin_lonlat"] is not None]
        if {o["cbsa"] for o in origins} != selected:
            raise ValueError("Missing scenario point; cannot silently substitute another policy")
        planned[scenario] = origins
    for scenario, origins in planned.items():
        scanner = OriginInvestigation(origins)
        scanner.apply_file(str(osm), locations=True, idx="sparse_mem_array")
        reports[scenario] = scanner.report()
    return reports


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--metros", type=Path, required=True)
    p.add_argument("--places", type=Path, required=True)
    p.add_argument("--selection", type=Path, default=Path(__file__).with_name("colorado_origin_scenario_places.json"))
    p.add_argument("--osm", type=Path)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    selection = json.loads(args.selection.read_text())
    raw = args.places.read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != selection["gazetteer_sha256"]:
        raise ValueError("Gazetteer source changed; review bytes and version the selection before reuse")
    place_rows = [{k.strip(): v.strip() for k, v in row.items()} for row in csv.DictReader(io.StringIO(raw.decode("utf-8-sig")), delimiter="|")]
    with args.metros.open(newline="", encoding="utf-8") as handle:
        result = build_scenarios(list(csv.DictReader(handle)), place_rows, selection)
    result["source_provenance"] = {"gazetteer_url": selection["gazetteer_url"], "gazetteer_sha256": digest,
                                   "metros_csv_sha256": hashlib.sha256(args.metros.read_bytes()).hexdigest(),
                                   "selection_sha256": hashlib.sha256(args.selection.read_bytes()).hexdigest()}
    if args.osm:
        result["raw_source_investigations"] = investigate_scenarios(result, args.osm, [r["cbsa"] for r in selection["places"]])
        with args.osm.open("rb") as handle:
            result["source_provenance"]["osm_sha256"] = hashlib.file_digest(handle, "sha256").hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({"qualifying_sources_per_scenario": len(result["qualifying_cbsa_ids"]),
                      "urban_point_leads": len(result["scenario_point_displacements"]),
                      "approved_origins": 0, "release_eligible": False}, indent=2))


if __name__ == "__main__":
    main()
