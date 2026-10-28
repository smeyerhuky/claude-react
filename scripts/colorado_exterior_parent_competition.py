#!/usr/bin/env python3
"""Research-only source expansion and weighted cuts against a supplied prefix."""
import argparse
import gc
import hashlib
import json
import math
from pathlib import Path
import resource
import time

import numpy as np
from scipy.sparse.csgraph import dijkstra

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_expanded_parent_competition import FLAGS, nearest_primitive_lead, winners
from colorado_metro_winners import read_metros
from colorado_neighbor_metro_competition import validate_inventory
from colorado_sparse_parent_oracle import trace_path
from road_primitive_sparse import PrimitiveSparseBuilder

ARIZONA_IDS = {"22380", "29420", "39150"}


class SourceScan:
    def __init__(self, builder):
        self.builder, self.seen = builder, set()

    def add(self, way, tags, points):
        if way in self.seen:
            raise ValueError("Duplicate highway within one source")
        self.seen.add(way)
        self.builder.add(way, tags, points)


def arc_keys(graph):
    coo = graph.length.tocoo(copy=False)
    return (coo.row.astype(np.uint64) << 32) | coo.col.astype(np.uint64), coo.row, coo.col


def audit_extension(prefix, parent):
    n = len(prefix.osm_ids)
    if (len(parent.osm_ids) < n or not np.array_equal(prefix.osm_ids, parent.osm_ids[:n]) or
            not np.array_equal(prefix.longitude, parent.longitude[:n]) or
            not np.array_equal(prefix.latitude, parent.latitude[:n])):
        raise ValueError("Prefix node identities/coordinates changed")
    old, _, _ = arc_keys(prefix)
    new, rows, cols = arc_keys(parent)
    if np.any(old[1:] <= old[:-1]) or np.any(new[1:] <= new[:-1]):
        raise ValueError("Sorted unique primitive pairs required")
    positions = np.searchsorted(new, old)
    if np.any(positions >= len(new)) or not np.array_equal(new[positions], old):
        raise ValueError("Exterior parent lost a prefix directed arc")
    cheaper = {}
    for metric in ("length", "travel_time"):
        a, b = getattr(prefix, metric), getattr(parent, metric)
        if (not np.array_equal(a.indptr, prefix.length.indptr) or not np.array_equal(a.indices, prefix.length.indices) or
                not np.array_equal(b.indptr, parent.length.indptr) or not np.array_equal(b.indices, parent.length.indices)):
            raise ValueError("Metric-specific primitive topology mismatch")
        if np.any(b.data[positions] > a.data):
            raise ValueError("Exterior parent increased a prefix arc cost")
        cheaper[metric] = int(np.count_nonzero(b.data[positions] < a.data))
    inbound = (rows >= n) & (cols < n)
    outbound = (rows < n) & (cols >= n)
    entries, exits = np.unique(cols[inbound]), np.unique(rows[outbound])
    ports = np.union1d(entries, exits)
    if len(ports) > 100000:
        raise ValueError("Too many weighted interface ports; never truncate")
    entry_set, exit_set = set(map(int, entries)), set(map(int, exits))
    return {"prefix_directed_pairs_preserved": len(old),
            "all_prefix_modeled_paths_preserved_with_nonincreased_cost": True,
            "cheaper_prefix_arc_counts": cheaper,
            "inbound_directed_pairs": int(inbound.sum()), "outbound_directed_pairs": int(outbound.sum()),
            "weighted_interface_node_count": len(ports),
            "weighted_interface_nodes": [{"node": int(parent.osm_ids[i]),
                "lonlat": [float(parent.longitude[i]), float(parent.latitude[i])],
                "inbound": int(i) in entry_set, "outbound": int(i) in exit_set} for i in ports],
            "warning": "All primitive vertices, including former hidden shape nodes, are explicit. Cut is relative to supplied graphs only; no exterior closure, legal turns, grade or access certification."}


def same_cost(a, b):
    return (a is None and b is None) or (a is not None and b is not None and
           not isinstance(a, bool) and math.isfinite(a) and a >= 0 and math.isclose(a, b, abs_tol=.002, rel_tol=1e-9))


def compare_exterior(prefix, parent, domains, baseline, additional_ids):
    for report in (domains, baseline):
        if any(report.get(flag) is not False for flag in FLAGS):
            raise ValueError("Research safety mismatch")
    ids = domains["source_qualifying_cbsa_ids"]
    records = {r["cbsa"]: r for r in domains["domains"]}
    old_sources = {s["cbsa"]: s for s in baseline["sources"]}
    added = set(additional_ids)
    selected = set(old_sources) | added
    if (not ids or len(ids) != len(set(ids)) or set(records) != set(ids) or len(records) != len(domains["domains"]) or
            ids != baseline["source_qualifying_cbsa_ids"] or len(old_sources) != len(baseline["sources"]) or
            not added or len(added) != len(additional_ids) or added & set(old_sources) or
            not selected <= set(ids) or not 2 <= len(selected) <= 16):
        raise ValueError("Complete matching source inventories and distinct additions required")
    expected_report = dict(baseline["primitive_parent_graph"])
    actual_report = dict(prefix.report)
    expected_report.pop("resource_limits", None); actual_report.pop("resource_limits", None)
    if expected_report != actual_report:
        raise ValueError("Prefix graph/model mismatch")
    cut = audit_extension(prefix, parent)
    sources = []
    for cbsa in sorted(selected):
        point = records[cbsa]["native_representative_lonlat"]
        if cbsa in old_sources:
            s = old_sources[cbsa]
            if (point != s["native_origin_lonlat"] or s["access_verified"] is not False or
                    s["connector_costs_included"] is not False or s["node"] not in prefix.node_index):
                raise ValueError("Original source scenario/lead changed")
            i = prefix.node_index[s["node"]]
            if s["node_lonlat"] != [float(prefix.longitude[i]), float(prefix.latitude[i])]:
                raise ValueError("Original source node coordinates changed")
            sources.append(dict(s))
        else:
            sources.append({"cbsa": cbsa, "native_origin_lonlat": point,
                **nearest_primitive_lead(parent, point), "lead_policy": "additional-nearest-primitive-vertex-lead",
                "access_verified": False, "connector_costs_included": False})
    coordinates = baseline["probe_coordinates_lonlat"]
    if not coordinates or len(coordinates) > 100:
        raise ValueError("Bounded nonempty probe inventory required")
    for probe, point in coordinates.items():
        if str(int(probe)) != probe or int(probe) not in prefix.node_index:
            raise ValueError("Missing original prefix probe")
        i = prefix.node_index[int(probe)]
        if point != [float(prefix.longitude[i]), float(prefix.latitude[i])]:
            raise ValueError("Original probe coordinate mismatch")
    refs = {(r["orientation"], r["metric"], r["probe"]): r for r in baseline["comparisons"]}
    expected = {(o, m, p) for o in ("metro-to-location", "location-to-metro")
                for m in ("length", "travel_time") for p in coordinates}
    if len(refs) != len(baseline["comparisons"]) or set(refs) != expected:
        raise ValueError("Incomplete or duplicate original cases")
    cases, replays, checks, improvements, witnesses = [], 0, 0, 0, []
    for orientation in ("metro-to-location", "location-to-metro"):
        for metric in ("length", "travel_time"):
            matrix, base_matrix = getattr(parent, metric), getattr(prefix, metric)
            if orientation == "location-to-metro":
                matrix, base_matrix = matrix.transpose().tocsr(), base_matrix.transpose().tocsr()
            costs = {p: [] for p in coordinates}
            for source in sources:
                start = parent.node_index[source["node"]]
                labels, predecessors = dijkstra(matrix, directed=True, indices=start, return_predecessors=True)
                old_labels = dijkstra(base_matrix, directed=True, indices=start) if source["cbsa"] in old_sources else None
                for probe in coordinates:
                    target = parent.node_index[int(probe)]
                    value = float(labels[target])
                    if math.isnan(value) or value < 0:
                        raise ValueError("Invalid exterior route label")
                    cost, old, exact, outside = value if math.isfinite(value) else None, None, None, None
                    if old_labels is not None:
                        old_value = float(old_labels[target]); old = old_value if math.isfinite(old_value) else None
                        options = refs[(orientation, metric, probe)]["source_costs"]
                        if len(options) != len(old_sources) or {o["cbsa"] for o in options} != set(old_sources):
                            raise ValueError("Incomplete original source cost inventory")
                        original = next(o["graph_only_cost"] for o in options if o["cbsa"] == source["cbsa"])
                        if not same_cost(original, old):
                            raise ValueError("Rebuilt prefix cost disagrees with original report")
                        if old is not None and (cost is None or cost > old+max(.002, old*1e-9)):
                            raise ValueError("Exterior graph lost a modeled prefix route")
                        checks += 1
                    improved = old_labels is not None and cost is not None and (old is None or cost < old-max(.002, old*1e-9))
                    improvements += improved
                    if cost is not None:
                        path, total = trace_path(matrix, predecessors, start, target)
                        if not same_cost(float(total), cost):
                            raise ValueError("Exterior path replay mismatch")
                        exact = [str(total.numerator), str(total.denominator)]
                        outside = sum(i >= len(prefix.osm_ids) for i in path)
                        replays += 1
                        if improved and len(witnesses) < 12:
                            actual_path = path if orientation == "metro-to-location" else list(reversed(path))
                            witnesses.append({"cbsa": source["cbsa"], "probe": probe, "metric": metric,
                                "orientation": orientation, "prefix_cost": old, "exterior_cost": cost,
                                "outside_prefix_vertices": outside, "raw_osm_node_path": [int(parent.osm_ids[i]) for i in actual_path],
                                "exact_stored_path_cost": exact})
                    costs[probe].append({"cbsa": source["cbsa"], "prefix_cost": old,
                        "graph_only_cost": cost, "exact_stored_path_cost": exact,
                        "outside_prefix_vertices": outside, "original_source_route_improved": improved})
                del labels, predecessors, old_labels
            for probe, options in costs.items():
                tied, best = winners(options, "graph_only_cost")
                previous, _ = winners([o for o in options if o["cbsa"] in old_sources], "prefix_cost")
                cases.append({"probe": probe, "metric": metric, "orientation": orientation,
                    "source_costs": options, "prefix_subset_winner_ids": previous,
                    "exterior_subset_winner_ids": tied, "best_graph_only_cost": best,
                    "subset_winner_changed": tied != previous})
            del matrix, base_matrix
            gc.collect()
    return {**{flag: False for flag in FLAGS}, "parent_exterior_coverage_certified": False,
        "datum_alignment_verified": False, "applied_source_exclusions": [],
        "source_qualifying_cbsa_ids": ids, "diagnostic_source_cbsa_ids": sorted(selected),
        "unrepresented_source_qualifying_cbsa_ids": sorted(set(ids)-selected),
        "sources": sources, "probe_coordinates_lonlat": coordinates, "town_probe_leads": baseline.get("town_probe_leads", []),
        "comparisons": cases, "source_costs_computed": len(cases)*len(sources),
        "original_prefix_costs_reproduced": checks, "primitive_paths_replayed": replays,
        "improved_original_source_cost_cases": improvements, "changed_route_witnesses": witnesses,
        "changed_subset_winner_cases": sum(c["subset_winner_changed"] for c in cases),
        "weighted_prefix_interface": cut, "primitive_parent_graph": parent.report,
        "metric_units": {"length": "meters", "travel_time": "seconds"},
        "warning": "Supplied-source, graph-only comparison. No connectors/costs, independent access, turns/grade, datum or land/water certification. Parent exterior and all omitted competitors remain unknown. Stored-path replay is not a second shortest-path solver."}


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ("domains", "baseline-report", "metros", "output"):
        p.add_argument("--"+name, type=Path, required=True)
    p.add_argument("--parent-osm", type=Path, nargs="+", required=True)
    args = p.parse_args()
    digest = lambda path: hashlib.sha256(path.read_bytes()).hexdigest()
    domains = json.loads(args.domains.read_text()); baseline = json.loads(args.baseline_report.read_text())
    if baseline["domains_sha256"] != digest(args.domains) or domains["source_provenance"]["metros_csv_sha256"] != digest(args.metros):
        raise ValueError("Exact domains/baseline/CSV binding mismatch")
    selected = {s["cbsa"] for s in baseline["sources"]} | ARIZONA_IDS
    validate_inventory(domains, read_metros(args.metros), selected)
    metadata = [source_metadata(path) for path in args.parent_osm]; validate_sources(metadata)
    count = len(baseline["source_provenance"])
    if len(metadata) <= count or metadata[:count] != baseline["source_provenance"]:
        raise ValueError("Exact ordered source prefix plus new sources required")
    began = time.monotonic()
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    prefix = None
    for index, path in enumerate(args.parent_osm):
        scan = SourceScan(builder)
        HighwayReader(scan).apply_file(str(path), locations=True, idx="sparse_mem_array")
        del scan
        print(f"[exterior] {path.name}: {len(builder.ids)} nodes /{len(builder.u)} arcs", flush=True)
        if index+1 == count:
            prefix = builder.snapshot()
    parent = builder.finish(); del builder
    result = compare_exterior(prefix, parent, domains, baseline, sorted(ARIZONA_IDS))
    result.update(source_provenance=metadata, domains_sha256=digest(args.domains),
        baseline_report_sha256=digest(args.baseline_report), elapsed_seconds=time.monotonic()-began,
        peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({k: result[k] for k in ("source_costs_computed", "original_prefix_costs_reproduced",
        "primitive_paths_replayed", "improved_original_source_cost_cases", "changed_subset_winner_cases", "release_eligible")}))


if __name__ == "__main__":
    main()
