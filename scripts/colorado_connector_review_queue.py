#!/usr/bin/env python3
"""Prepare *unapproved* metro-to-road connector candidates for human audit.

No geometry proximity, OSM way tag, reviewer name, or generated queue entry
ever sets access_verified. Every eligible metro remains accounted for, including
those with NO candidate in the loaded road extract.
"""
import argparse
import hashlib
import json
import math
from pathlib import Path

from colorado_geographic_point_diagnostics import _edge_projection
from colorado_metro_winners import read_metros
from colorado_routed_raster_diagnostics import SegmentGridIndex
from stream_osm_roads import load_pbf


def _road_candidate(graph, edge, projected):
    u, v, key = edge
    attributes = graph[u][v][key]
    way_id = attributes.get("osm_way_id")
    osm_id = way_id if type(way_id) is int and way_id > 0 else None
    geometry = attributes["geometry"]
    return {
        "road_from_node": str(u),
        "road_to_node": str(v),
        "road_edge_key": str(key),
        "osm_way_id": osm_id,
        "osm_way_url": (f"https://www.openstreetmap.org/way/{osm_id}"
                        if osm_id else None),
        "road_highway_tag": attributes.get("highway"),
        "osm_access_tag": attributes.get("access") or "not_provided",
        "osm_motor_vehicle_tag": attributes.get("motor_vehicle") or "not_provided",
        "osm_motorcar_tag": attributes.get("motorcar") or "not_provided",
        "osm_oneway_tag": attributes.get("oneway") or "not_provided",
        "distance_to_centerline_m": round(projected["gap_m"], 2),
        "geometric_projection_lonlat": [
            round(projected["snapped_lon"], 8),
            round(projected["snapped_lat"], 8),
        ],
        "fraction_along_directed_centerline": round(projected["fraction"], 7),
        "directed_road_length_m": round(attributes["length"], 2),
        "grade_separation_independently_verified": False,
        "physical_origin_to_centerline_access_verified": False,
        "public_legal_motor_access_verified": False,
        "note": ("OSM tags and geometric proximity are unverified review clues, "
                 "not proof of vehicle access or grade-level connectivity"),
    }


def build_review_queue(graph, metros, threshold=100000, max_gap_m=100,
                       per_metro=4, max_metros=5000):
    """Provide a deterministic, full qualifying-CBSA review backlog.

    Searches directed edge *polylines*, deduplicates exact reverse arcs for
    the human queue only, and never suppresses an eligible metro that has
    no nearby candidate. All results require independent physical/legal audit.
    """
    if type(threshold) is not int or threshold < 1:
        raise ValueError("Invalid audit population threshold")
    if not isinstance(max_gap_m, (float, int)) or not math.isfinite(max_gap_m) or (
            not 0 < max_gap_m <= 500):
        raise ValueError("Invalid maximum geometric candidate distance")
    if type(per_metro) is not int or not 1 <= per_metro <= 12:
        raise ValueError("Invalid number of candidates per metro")
    if not isinstance(metros, list) or len(metros) > max_metros:
        raise ValueError("Invalid or oversized Census metro inventory")
    qualifying = sorted(
        (m for m in metros if m["population"] >= threshold),
        key=lambda m: str(m["cbsa"]))
    if not qualifying:
        raise ValueError("No metros qualify for connector review")
    index = SegmentGridIndex(graph)
    # These coarse spatial-index cell bounds contain every indexed road
    # segment, including curved geometry that leaves its endpoint bbox.
    # They are an *overestimate*, NOT proof of spatial graph completeness.
    cells = index.buckets
    cell_size = index.cell_deg
    envelope = [
        min(cell[0] for cell in cells) * cell_size,
        min(cell[1] for cell in cells) * cell_size,
        (max(cell[0] for cell in cells) + 1) * cell_size,
        (max(cell[1] for cell in cells) + 1) * cell_size,
    ]
    west, south, east, north = envelope
    queue = []
    for metro in qualifying:
        cbsa = metro["cbsa"]
        lon, lat = metro["lon"], metro["lat"]
        if (not isinstance(cbsa, str) or not cbsa or
            not all(isinstance(x, (int, float)) and not isinstance(x, bool)
                    and math.isfinite(x) for x in (lon, lat)) or
            not -180 <= lon <= 180 or not -89 < lat < 89):
            raise ValueError("Malformed metro representative origin")
        inside_envelope = west <= lon <= east and south <= lat <= north
        candidates = []
        seen_physical = set()
        for edge in index.candidates(lon, lat, max_gap_m):
            projected = _edge_projection(graph, edge, lon, lat)
            if projected["gap_m"] > max_gap_m:
                continue
            u, v, key = edge
            data = graph[u][v][key]
            coordinates = tuple(tuple(p) for p in data["geometry"])
            physical = (tuple(sorted((str(u), str(v)))),
                        min(coordinates, tuple(reversed(coordinates))),
                        data.get("osm_way_id"))
            if physical in seen_physical:
                continue
            seen_physical.add(physical)
            candidates.append(_road_candidate(graph, edge, projected))
        candidates.sort(key=lambda c: (
            c["distance_to_centerline_m"],
            str(c["osm_way_id"]), c["road_from_node"], c["road_to_node"]))
        # A wider, bounded search gives reviewers a concrete lead for origins
        # inside the coarse envelope but outside the normal 100 m gate.
        # It NEVER changes candidate eligibility or verifies access.
        nearest_triage = None
        if inside_envelope and not candidates:
            leads = []
            for edge in index.candidates(lon, lat, 500):
                projection = _edge_projection(graph, edge, lon, lat)
                if projection["gap_m"] <= 500:
                    leads.append(_road_candidate(graph, edge, projection))
            if leads:
                nearest_triage = min(leads, key=lambda c: (
                    c["distance_to_centerline_m"],
                    str(c["osm_way_id"]), c["road_from_node"],
                    c["road_to_node"], c["road_edge_key"]))
        queue.append({
            "cbsa": cbsa, "metro_name": metro["name"],
            "population": metro["population"],
            "origin_lonlat": [lon, lat],
            "origin_coordinate_kind": "2025_CBSA_representative_point_not_verified_urban_access_anchor",
            "urban_access_anchor_independently_verified": False,
            "graph_envelope_relation": ("inside_road_segment_index_envelope"
                                         if inside_envelope else
                                         "outside_road_segment_index_envelope"),
            "review_status": ("candidate_requires_independent_audit" if candidates
                              else "no_candidate_within_geometric_limit"),
            "access_verified": False,
            "has_approved_connector": False,
            "candidate_count_within_limit": len(candidates),
            "candidate_roads": candidates[:per_metro],
            "nearest_unapproved_triage_lead_within_500m": nearest_triage,
            "unresolved_obligations": [
                "Independently verify a legal public motor-vehicle connection from the exact origin",
                "Confirm vehicle direction, barriers, private access and grade separation",
                "Inspect correct origin-to-road entry, not just geometric distance",
                "Bind audited evidence to exact 2025 metro, graph and connector hashes",
            ]
        })
    if len({m["cbsa"] for m in queue}) != len(queue):
        raise ValueError("Duplicate qualifying CBSA in Census metro inventory")
    return {
        "schema_version": "colorado-road-connector-review-queue-v1",
        "status": "human-review-queue-not-independent-access-evidence",
        "release_eligible": False, "access_verified": False,
        "approval_or_evidence": False,
        "threshold_population": threshold,
        "maximum_geometric_gap_m": max_gap_m,
        "eligible_metros_including_missing_candidates": len(queue),
        "metros_with_geometric_candidates": sum(bool(x["candidate_roads"]) for x in queue),
        "metros_without_geometric_candidates": sum(not x["candidate_roads"] for x in queue),
        "missing_metros_outside_road_index_envelope": sum(
            not x["candidate_roads"] and
            x["graph_envelope_relation"] == "outside_road_segment_index_envelope"
            for x in queue),
        "missing_metros_inside_road_index_envelope": sum(
            not x["candidate_roads"] and
            x["graph_envelope_relation"] == "inside_road_segment_index_envelope"
            for x in queue),
        "coarse_graph_road_envelope_lonlat": envelope,
        "graph_envelope_certifies_route_coverage": False,
        "inside_envelope_missing_with_triage_lead": sum(
            x["graph_envelope_relation"] == "inside_road_segment_index_envelope"
            and not x["candidate_roads"]
            and x["nearest_unapproved_triage_lead_within_500m"] is not None
            for x in queue),
        "graph_nodes": graph.number_of_nodes(),
        "graph_edges": graph.number_of_edges(),
        "warning": ("Nearest OSM edge, tags and road geometry do not independently "
                    "establish physical or legal connector access. Out-of-graph "
                    "metro competitors cannot be silently omitted from release. "
                    "The index-cell envelope is not a route or border closure "
                    "certificate. Census representative points may be remote "
                    "from drivable urban-center anchors."),
        "candidates": queue,
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--metros", type=Path,
                   default=Path("public/data/metros-census-2025.csv"))
    p.add_argument("--threshold", type=int, default=100000)
    p.add_argument("--max-gap-m", type=float, default=100)
    p.add_argument("--per-metro", type=int, default=4)
    p.add_argument("--output", type=Path,
                   default=Path("colorado-connector-review/review-queue.json"))
    args = p.parse_args()
    graph, _ = load_pbf(args.osm)
    report = build_review_queue(
        graph, read_metros(args.metros), threshold=args.threshold,
        max_gap_m=args.max_gap_m, per_metro=args.per_metro)
    for name, path in (("osm_sha256", args.osm),
                       ("metros_csv_sha256", args.metros)):
        with path.open("rb") as handle:
            report[name] = hashlib.file_digest(handle, "sha256").hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({key: value for key, value in report.items()
                      if key != "candidates"}, indent=2))


if __name__ == "__main__":
    main()
