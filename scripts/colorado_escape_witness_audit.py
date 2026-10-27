#!/usr/bin/env python3
"""Check conditional excursion bounds against actual sourced road paths."""
import argparse
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path

from colorado_adjacent_source_interfaces import source_metadata, validate_sources
from metro_competition_bounds import number, point
from road_geographic_escape_bounds import boundary_distance_lower_bound


def vector_distance(a, b):
    def vector(p):
        lon, lat = map(math.radians, p)
        return math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)
    a, b = vector(a), vector(b)
    cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    return 6371000*math.atan2(math.sqrt(math.fsum(x*x for x in cross)), math.fsum(x*y for x,y in zip(a,b)))


def audit_witnesses(report):
    for flag in ("release_eligible", "access_certified", "source_union_geographic_coverage_certified", "complete_global_competition"):
        if report.get(flag) is not False:
            raise ValueError("Source witness report safety mismatch")
    witnesses = report["path_witnesses"]
    if not witnesses or len(witnesses) > 100:
        raise ValueError("Explicit bounded path witnesses required")
    rows = []
    metrics = set()
    for w in witnesses:
        metric = w["metric"]
        if metric not in ("length", "travel_time") or not w["steps"]:
            raise ValueError("Missing directed metric/geometry witness")
        if (w["steps"][0]["u"] != w["origin"] or w["steps"][-1]["v"] != w["destination"] or
                w.get("node_path") != [w["steps"][0]["u"]]+[step["v"] for step in w["steps"]]):
            raise ValueError("Path endpoint/node identity disagrees with directed witness")
        metrics.add(metric)
        costs, coordinates, last = [], [], None
        for step in w["steps"]:
            geometry, ids = step["geometry_lonlat"], step["osm_node_ids"]
            if len(geometry) < 2 or len(geometry) != len(ids) or ids[0] != step["u"] or ids[-1] != step["v"]:
                raise ValueError("Directed witness geometry/reference mismatch")
            if last is not None and last != (step["u"], tuple(geometry[0])):
                raise ValueError("Discontinuous directed witness")
            last = step["v"], tuple(geometry[-1])
            for p in geometry:
                point(p)
            speed = number(step["speed_kph"])
            if not 0 < speed <= 140:
                raise ValueError("Witness speed outside tested static model ceiling")
            length = math.fsum(vector_distance(a,b) for a,b in zip(geometry,geometry[1:]))
            costs.append(length if metric == "length" else length/float(speed*1000/3600))
            coordinates.extend(geometry)
        replay = math.fsum(costs)
        reported = number(w["independently_replayed_geometry_cost"])
        if reported < 0 or not math.isclose(replay, float(reported), rel_tol=1e-9, abs_tol=.002):
            raise ValueError("Independent vector path cost disagrees with source witness")
        a, b = coordinates[0], coordinates[-1]
        # A diagnostic rectangle around endpoints, not a claimed covered region.
        bounds = [min(a[0],b[0])-.001, min(a[1],b[1])-.001,
                  max(a[0],b[0])+.001, max(a[1],b[1])+.001]
        outside = sum(not(bounds[0] <= p[0] <= bounds[2] and bounds[1] <= p[1] <= bounds[3]) for p in coordinates)
        if not outside:
            raise ValueError("Witness no longer makes a diagnostic excursion; avoid vacuous validation")
        lower = boundary_distance_lower_bound(a,bounds)+boundary_distance_lower_bound(b,bounds)
        if metric == "travel_time":
            lower /= Fraction(140000,3600)
        if lower > number(replay):
            raise ValueError("Excursion bound exceeds independently replayed actual path cost")
        rows.append({"origin": w["origin"], "destination": w["destination"], "metric": metric,
                     "diagnostic_rectangle": bounds, "outside_geometry_points": outside,
                     "excursion_lower_bound_exact": [str(lower.numerator),str(lower.denominator)],
                     "independent_vector_path_cost": replay})
    if metrics != {"length", "travel_time"}:
        raise ValueError("Both actual-source routing metrics required")
    return {"release_eligible": False, "access_certified": False, "complete_global_competition": False,
            "parent_exterior_coverage_certified": False, "applied_exterior_route_exclusions": [],
            "independent_actual_path_excursions_checked": len(rows), "paths": rows,
            "metric_units": {"length": "meters", "travel_time": "seconds"},
            "cost_agreement_absolute_tolerance": .002, "cost_agreement_relative_tolerance": 1e-9,
            "warning": "Diagnostic endpoint rectangles have no source coverage claim; a ceiling on these actual paths is not proof of a global speed ceiling. No regional closure or legal-access certification."}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--route-report", type=Path, required=True)
    p.add_argument("--parent-osm", type=Path, nargs="+", required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    report = json.loads(args.route_report.read_text())
    sources = [source_metadata(path) for path in args.parent_osm]
    validate_sources(sources)
    if sources != report["sources"]:
        raise ValueError("Actual path witness source hashes/timestamps mismatch")
    result = audit_witnesses(report)
    result["sources"] = sources
    result["route_report_sha256"] = hashlib.sha256(args.route_report.read_bytes()).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2)+"\n")
    print(json.dumps({"actual_path_excursions_checked": len(result["paths"]), "release_eligible": False}))


if __name__ == "__main__":
    main()
