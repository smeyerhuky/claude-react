"""Audit risk annotations on real road geometry and deliberately off-road probes.

This measures risk-reporting coverage, not physical access or safe crossings.
"""
from collections import Counter
from road_access_diagnostics import diagnose_point


def audit_samples(graph, samples, index, radius_m=150, offset_lat_degrees=0.0001):
    if radius_m < 0 or offset_lat_degrees <= 0:
        raise ValueError("radius must be nonnegative and offset positive")
    counts = Counter()
    cases = []
    for lon, lat in samples:
        for kind, point in (("on_geometry", (lon, lat)),
                            ("offset_north", (lon, lat + offset_lat_degrees))):
            results = diagnose_point(graph, *point, max_gap_m=radius_m, index=index)
            counts["queries"] += 1
            if not results:
                counts["no_candidates"] += 1
                cases.append({"kind": kind, "candidate_count": 0,
                              "access_verified": False, "risks": ["no_road_candidate"]})
                continue
            nearest = results[0]
            if nearest["access_verified"]:
                raise AssertionError("Geometric snap must not certify access")
            counts["candidates"] += len(results)
            for flag in nearest["access_risks"]:
                counts[flag] += 1
            if nearest["gap_m"] > 0 and "off_road_connector_unverified" not in nearest["access_risks"]:
                raise AssertionError("Off-network connector risk was suppressed")
            cases.append({"kind": kind, "candidate_count": len(results),
                          "nearest_gap_m": round(nearest["gap_m"], 3),
                          "access_verified": False,
                          "risks": nearest["access_risks"]})
    return {"queries": counts["queries"], "no_candidates": counts["no_candidates"],
            "risk_counts_nearest": {k: v for k, v in sorted(counts.items())
                                    if k not in ("queries", "no_candidates", "candidates")},
            "probes": cases,
            "note": "Offset probes are synthetic coordinates on real OSM geometry; no independently verified origin-to-road connector"}
