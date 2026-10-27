#!/usr/bin/env python3
"""Bounded cross-source directed route regressions, not metro competition."""
import argparse
import hashlib
import json
import math
from pathlib import Path
from types import SimpleNamespace

import networkx as nx

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_raw_boundary_interfaces import fingerprint, supported
from colorado_road_subdivision_preservation import baseline_snapshot, verify_expansion
from road_spike import assign
from stream_osm_roads import JunctionIndex, RoadHandler, meters

BBOX = (-109.1, 36.5, -102., 37.3)
PROBES = [143742225, 143862641, 143904064, 143710319, 8499393844, 144231228, 141782050, 144605514]


class CorridorWays:
    def __init__(self, bounds=BBOX):
        if (len(bounds) != 4 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in bounds)
                or not -180 <= bounds[0] < bounds[2] <= 180 or not -90 <= bounds[1] < bounds[3] <= 90):
            raise ValueError("Finite ordered geographic corridor required")
        self.bounds, self.rows = tuple(bounds), {}

    def add(self, way, tags, points):
        if not supported(tags):
            return
        west, south, east, north = self.bounds
        # Conservative segment-bbox intersection: select whole ways, never
        # invent a clipped chord or infer that every selected point is supported.
        if not any(min(a[1], b[1]) <= east and max(a[1], b[1]) >= west and
                   min(a[2], b[2]) <= north and max(a[2], b[2]) >= south
                   for a, b in zip(points, points[1:])):
            return
        digest = fingerprint(way, tags, points)
        if way in self.rows:
            old = self.rows[way]
            if fingerprint(way, *old) != digest:
                raise ValueError("Selected overlapping way disagrees")
            return
        if len(self.rows) >= 200000:
            raise ValueError("Bounded corridor way memory limit exceeded")
        self.rows[way] = (dict(tags), tuple(points))


def build_graph(rows):
    if not rows:
        raise ValueError("Empty corridor cannot validate routes")
    def proxy(way, tags, points):
        return SimpleNamespace(id=way, tags=tags, nodes=[SimpleNamespace(
            ref=node, location=SimpleNamespace(lon=x, lat=y, valid=lambda: True)) for node, x, y in points])
    index = JunctionIndex()
    for way, (tags, points) in rows.items():
        index.way(proxy(way, tags, points))
    handler = RoadHandler(index.junctions(), max_nodes=300000)
    for way, (tags, points) in rows.items():
        handler.way(proxy(way, tags, points))
    return handler.graph


def path_witness(graph, origin, destination, metric, retained_way_ids):
    path = nx.shortest_path(graph, origin, destination, weight=metric)
    steps, cost, geometry_cost = [], [], []
    for u, v in zip(path, path[1:]):
        edge = min(graph[u][v].values(), key=lambda d: (d[metric], d["osm_way_id"]))
        ids, geometry = edge["osm_node_ids"], edge["geometry"]
        if ids[0] != u or ids[-1] != v:
            raise ValueError("Route witness reverses directed source geometry")
        length = math.fsum(meters(a, b) for a, b in zip(geometry, geometry[1:]))
        value = length if metric == "length" else length/(edge["speed_kph"]*1000/3600)
        if not math.isclose(value, edge[metric], rel_tol=1e-10, abs_tol=1e-8):
            raise ValueError("Route edge cost disagrees with directed primitive geometry")
        cost.append(edge[metric]); geometry_cost.append(value)
        steps.append({"u": u, "v": v, "osm_way_id": edge["osm_way_id"],
                      "osm_node_ids": list(ids), "geometry_lonlat": list(geometry),
                      "speed_kph": edge["speed_kph"], "metric_cost": edge[metric]})
    return {"node_path": path, "steps": steps, "cost": math.fsum(cost),
            "independently_replayed_geometry_cost": math.fsum(geometry_cost),
            "added_osm_way_ids": sorted({s["osm_way_id"] for s in steps}-set(retained_way_ids))}


def compare_routes(baseline, expanded, probes, retained_way_ids):
    if len(probes) < 2 or len(set(probes)) != len(probes) or any(p not in baseline or p not in expanded for p in probes):
        raise ValueError("Distinct fixed directed route probes must survive both graphs")
    preservation = verify_expansion(baseline_snapshot(baseline), expanded)
    rows, witnesses, checked = [], [], 0
    for metric in ("length", "travel_time"):
        for origin in probes:
            results = []
            for graph in (baseline, expanded):
                # Reuse the production allocator with ONE road-node source.
                # This source label is explicitly not an eligible CBSA identity.
                production = assign(graph, [{"cbsa": "boundary-probe", "node": origin}], metric,
                                    orientation="metro-to-location")
                oracle = nx.single_source_dijkstra_path_length(graph, origin, weight=metric)
                for target in probes:
                    label, truth = production.get(str(target)), oracle.get(target)
                    if (label is None) != (truth is None) or (truth is not None and
                            not math.isclose(label["cost"], truth, rel_tol=1e-9, abs_tol=.002)):
                        raise ValueError("Independent directed route oracle disagrees with allocator")
                    checked += 1
                results.append(oracle)
            for destination in probes:
                if origin == destination:
                    continue
                old, new = (d.get(destination) for d in results)
                tolerance = max(.002, (old or 0)*1e-9)
                if old is not None and (new is None or new > old+tolerance):
                    raise ValueError("Source union lost a baseline directed route or raised its cost")
                changed = new is not None and (old is None or new < old-tolerance)
                rows.append({"origin": origin, "destination": destination, "metric": metric,
                             "baseline_cost": old, "union_cost": new, "changed": changed})
                metric_witnesses = sum(w["metric"] == metric for w in witnesses)
                if changed and (old is not None or metric_witnesses < 2):
                    # Bound diagnostic witnesses; ALL comparisons remain in rows.
                    if metric_witnesses < 6:
                        witness = path_witness(expanded, origin, destination, metric, retained_way_ids)
                        if not witness["added_osm_way_ids"] or not math.isclose(witness["cost"], new, rel_tol=1e-9, abs_tol=.002):
                            raise ValueError("Changed route has no matching added-way path witness")
                        witnesses.append({"origin": origin, "destination": destination, "metric": metric, **witness})
    return {"release_eligible": False, "access_certified": False, "complete_global_competition": False,
            "source_union_geographic_coverage_certified": False, "qualifying_metro_competition_tested": False,
            "origin_contract": "Fixed raw road-node probes only; no CBSA origins or origin/destination connector costs",
            "metric_units": {"length": "meters", "travel_time": "seconds"},
            "baseline_graph_nodes": len(baseline), "union_graph_nodes": len(expanded),
            "baseline_path_preservation": preservation, "independent_directed_labels_checked": checked,
            "changed_route_cases": sum(r["changed"] for r in rows), "comparisons": rows, "path_witnesses": witnesses,
            "warning": "Only a bounded supplied-source corridor. Routes outside selected ways, other adjacent states, turn restrictions, connector costs and legal/physical access remain unresolved."}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--parent-osm", type=Path, nargs="+", required=True)
    parser.add_argument("--interfaces", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = json.loads(args.interfaces.read_text())
    sources = [source_metadata(p) for p in args.parent_osm]
    validate_sources(sources)
    if (report.get("method") != "snapshot-consistent-supplied-source-union-raw-interfaces-v1" or
            report.get("release_eligible") is not False or report.get("access_certified") is not False or
            report.get("source_union_geographic_coverage_certified") is not False or
            len(report["sources"]) != len(sources) or
            any(any(actual[k] != recorded[k] for k in actual) for actual, recorded in zip(sources, report["sources"]))):
        raise ValueError("Exact source union audit provenance/safety mismatch")
    ports = {p["osm_node_id"] for p in report["extracts"][0]["raw_interface_nodes"]}
    if not set(PROBES) <= ports:
        raise ValueError("Fixed boundary probes disappeared from complete raw interface; investigate source changes")
    collector = CorridorWays()
    HighwayReader(collector).apply_file(str(args.parent_osm[0]), locations=True, idx="sparse_mem_array")
    baseline = build_graph(collector.rows)
    retained_way_ids = set(collector.rows)
    print(f"[routes] retained corridor: {len(baseline)} nodes, {len(retained_way_ids)} ways", flush=True)
    for path in args.parent_osm[1:]:
        HighwayReader(collector).apply_file(str(path), locations=True, idx="sparse_mem_array")
    expanded = build_graph(collector.rows)
    print(f"[routes] union corridor: {len(expanded)} nodes, {len(collector.rows)} ways", flush=True)
    result = compare_routes(baseline, expanded, PROBES, retained_way_ids)
    result.update({"sources": sources, "selection_bbox": BBOX,
                   "selection_contract": "Whole modeled ways whose primitive-segment bbox intersects the declared box; selected geometry can extend beyond it; no clipping or area coverage claim",
                   "interface_report_sha256": hashlib.sha256(args.interfaces.read_bytes()).hexdigest(),
                   "fixed_directed_probes": PROBES})
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2)+"\n")
    print(json.dumps({k: result[k] for k in ("changed_route_cases", "independent_directed_labels_checked", "release_eligible")}, indent=2))


if __name__ == "__main__":
    main()
