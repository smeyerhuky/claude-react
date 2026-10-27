#!/usr/bin/env python3
"""Bounded raw-PBF origin investigation, independent of the graph spatial index.

Reports mapped highway geometry and the current driving filter separately.
No nearest road is an approved connector. No absence implies real inaccessibility.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

import osmium

from colorado_geographic_point_diagnostics import project_polyline
from colorado_metro_winners import read_metros
from stream_osm_roads import drivable


class OriginInvestigation(osmium.SimpleHandler):
    def __init__(self, metros, radius_m=20000):
        super().__init__()
        if not 0 < radius_m <= 25000 or not math.isfinite(radius_m):
            raise ValueError("Investigation radius must be finite and <=25km")
        ids = [m["cbsa"] for m in metros]
        if not ids or len(ids) != len(set(ids)):
            raise ValueError("Missing or duplicate investigation metros")
        self.radius_m = radius_m
        self.rows = []
        self.missing_location_ways = 0
        for m in sorted(metros, key=lambda m: m["cbsa"]):
            lon, lat = m["lon"], m["lat"]
            if not (math.isfinite(lon) and math.isfinite(lat) and
                    -180 <= lon <= 180 and -85 < lat < 85):
                raise ValueError("Unsupported origin coordinates")
            self.rows.append({"cbsa": m["cbsa"], "name": m["name"],
                              "origin_lonlat": [lon, lat],
                              "nearest_mapped_highway": None,
                              "nearest_model_drivable_highway": None})

    def way(self, w):
        if not w.tags.get("highway") or len(w.nodes) < 2:
            return
        if any(not n.location.valid() for n in w.nodes):
            self.missing_location_ways += 1
            return  # Never bridge missing geometry with an invented chord.
        shape = [(float(n.location.lon), float(n.location.lat)) for n in w.nodes]
        west = min(p[0] for p in shape)
        east = max(p[0] for p in shape)
        south = min(p[1] for p in shape)
        north = max(p[1] for p in shape)
        for row in self.rows:
            lon, lat = row["origin_lonlat"]
            lat_pad = self.radius_m * 1.3 / 110574
            lon_pad = self.radius_m * 1.3 / (111000 * math.cos(math.radians(abs(lat) + lat_pad)))
            if east < lon-lon_pad or west > lon+lon_pad or north < lat-lat_pad or south > lat+lat_pad:
                continue
            try:
                projection = project_polyline(shape, lon, lat)
            except ValueError as exc:
                if str(exc) == "Degenerate road geometry":
                    continue
                raise
            gap = projection["gap_m"]
            if gap > self.radius_m:
                continue
            candidate = {"osm_way_id": int(w.id),
                         "osm_way_url": f"https://www.openstreetmap.org/way/{w.id}",
                         "highway": w.tags.get("highway"),
                         "name": w.tags.get("name"),
                         "access": w.tags.get("access"),
                         "motor_vehicle": w.tags.get("motor_vehicle"),
                         "motorcar": w.tags.get("motorcar"),
                         "model_drivable": drivable(w),
                         "gap_m": gap,
                         "projection_lonlat": [projection["snapped_lon"], projection["snapped_lat"]],
                         "access_verified": False}
            for field in ("nearest_mapped_highway", "nearest_model_drivable_highway"):
                if field == "nearest_model_drivable_highway" and not candidate["model_drivable"]:
                    continue
                old = row[field]
                if old is None or (gap, candidate["osm_way_id"]) < (old["gap_m"], old["osm_way_id"]):
                    row[field] = candidate

    def report(self):
        return {"schema_version": "colorado-raw-origin-investigation-v1",
                "release_eligible": False, "access_verified": False,
                "extract_coverage_certified": False,
                "scan_radius_m": self.radius_m,
                "highway_ways_with_missing_locations": self.missing_location_ways,
                "method": "Raw PBF highway-way scan; no contracted graph or SegmentGridIndex; local equirectangular projection with spherical gap distance",
                "limitations": "Nearest geometry only within supplied PBF and search radius; OSM tags and modeled driving eligibility do not prove physical/legal entry; representative points are not verified urban access anchors",
                "metros": self.rows}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--metros", type=Path, required=True)
    p.add_argument("--cbsa", nargs="+", required=True)
    p.add_argument("--radius-m", type=float, default=20000)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    requested = set(args.cbsa)
    metros = [m for m in read_metros(args.metros) if m["cbsa"] in requested]
    if {m["cbsa"] for m in metros} != requested:
        raise ValueError("Requested CBSA missing from source CSV")
    scanner = OriginInvestigation(metros, args.radius_m)
    scanner.apply_file(str(args.osm), locations=True, idx="sparse_mem_array")
    report = scanner.report()
    for name, path in (("osm_sha256", args.osm), ("metros_csv_sha256", args.metros)):
        with path.open("rb") as handle:
            report[name] = hashlib.file_digest(handle, "sha256").hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")
    print(json.dumps(report, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
