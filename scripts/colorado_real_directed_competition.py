#!/usr/bin/env python3
"""Real-source node-route competition audit; no off-road connector certification.

Uses stable baseline node IDs in both extracts, retains every eligible CBSA in
an explicit omitted-source inventory, and compares custom multi-source labels
with independent per-probe reverse Dijkstra, in BOTH orientations and metrics.
This does not prove graph inclusion or global coverage.
"""
import argparse
import hashlib
import json
from pathlib import Path

import networkx as nx

from colorado_metro_winners import read_metros, snap_candidates
from road_spike import assign
from stream_osm_roads import load_pbf

ORIENTATIONS = ("location-to-metro", "metro-to-location")
METRICS = ("length", "travel_time")


def audit_graph(graph, sources, probes, *, budgets=(10000, 600)):
    """Check fixed graph vertices; probe-coordinate offsets are never routes."""
    if len(sources) < 2 or len({s["cbsa"] for s in sources}) != len(sources):
        raise ValueError("Need at least two distinct source metros")
    if not probes or len(probes) != len(set(probes)):
        raise ValueError("Missing or duplicate probes")
    if any(s["node"] not in graph for s in sources) or any(p not in graph for p in probes):
        raise ValueError("Fixed source/probe outside graph")
    results = {}
    for orientation in ORIENTATIONS:
        results[orientation] = {}
        for metric, budget in zip(METRICS, budgets):
            print(f"[audit] {orientation} {metric}: {len(sources)} sources, {len(probes)} fixed probes", flush=True)
            # Independent oracle searches once from each probe, not once per
            # production source, and does not consume production winner labels.
            oracle_graph = graph if orientation == "location-to-metro" else graph.reverse(copy=False)
            expected = {}
            for probe in probes:
                distances = nx.single_source_dijkstra_path_length(oracle_graph, probe, weight=metric)
                options = sorted((distances[s["node"]], s["cbsa"])
                                 for s in sources if s["node"] in distances)
                expected[probe] = options
                del distances
            labels = assign(graph, sources, metric, orientation=orientation)
            rows = []
            for probe in probes:
                options = expected[probe]
                actual = labels.get(str(probe))
                if not options:
                    if actual is not None:
                        raise ValueError("Allocator reached an oracle-unreachable probe")
                    rows.append({"probe": str(probe), "status": "unreachable", "winner": None, "cost": None})
                    continue
                best = options[0][0]
                tied = sorted(cbsa for cost, cbsa in options if abs(cost-best) <= max(.002, best*1e-9))
                if actual is None or actual["cbsa"] not in tied or abs(actual["cost"]-best) > max(.002, best*1e-9):
                    raise ValueError("Independent directed winner/cost disagreement")
                rows.append({"probe": str(probe), "status": "reachable" if len(tied) == 1 else "tied",
                             "winner": tied[0] if len(tied) == 1 else None,
                             "cost": best, "tied_cbsa_ids": tied,
                             "source_costs": [{"cbsa": cbsa, "cost": cost} for cost, cbsa in options]})
            del labels
            # Budgeted *single-metro* network isochrone has a distinct contract
            # from competition. Check every fixed probe against direct paths.
            isochrone = assign(graph, sources[:1], metric, orientation=orientation, max_cost=budget)
            for probe in probes:
                source_cost = next((cost for cost, cbsa in expected[probe] if cbsa == sources[0]["cbsa"]), None)
                if (str(probe) in isochrone) != (source_cost is not None and source_cost <= budget):
                    raise ValueError("Independent isochrone reachability disagreement")
            results[orientation][metric] = {"probes": rows, "oracle_disagreements": 0,
                                           "single_metro_isochrone": {"cbsa": sources[0]["cbsa"], "budget": budget,
                                                                       "units": "meters" if metric == "length" else "seconds",
                                                                       "reachable_graph_vertices": len(isochrone),
                                                                       "probe_disagreements": 0}}
    return results


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--baseline-osm", type=Path, required=True)
    p.add_argument("--expanded-osm", type=Path, required=True)
    p.add_argument("--metros", type=Path, required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    metros = read_metros(args.metros)
    eligible = [m for m in metros if m["population"] >= 100000]
    ids = [m["cbsa"] for m in eligible]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate eligible CBSA")
    requested = {"14500", "17820", "19740"}
    selected = [m for m in eligible if m["cbsa"] in requested]
    baseline, _ = load_pbf(args.baseline_osm)
    sources, rejected = snap_candidates(baseline, selected)
    if rejected or {s["cbsa"] for s in sources} != requested:
        raise ValueError("Missing requested diagnostic metro source")
    sources.sort(key=lambda s: s["cbsa"])
    # Real, fixed graph vertices at all three source snaps plus one near Sloan's
    # Lake. These do not assert traversable connectors from selection points.
    probe_selection, rejected = snap_candidates(baseline, [
        {"cbsa": "probe-sloans-lake", "lon": -105.04, "lat": 39.747}])
    if rejected:
        raise ValueError("Missing deterministic probe")
    probes = sorted({s["node"] for s in sources} | {probe_selection[0]["node"]})
    result = {"release_eligible": False, "access_certified": False,
              "extract_coverage_certified": False, "complete_global_competition": False,
              "threshold_population": 100000, "qualifying_cbsa_ids": sorted(ids),
              "omitted_qualifying_cbsa_ids": sorted(set(ids)-requested),
              "origin_contract": "unapproved nearest-node research snaps; all connector costs excluded; graph-vertex routes only",
              "sources": sources, "fixed_probe_node_ids": [str(n) for n in probes],
              "probe_coordinates_lonlat": {str(n): [baseline.nodes[n]["x"], baseline.nodes[n]["y"]] for n in probes},
              "graph_inclusion_proven": False,
              "warning": "Stable winners do not certify coverage; expanded paths may still omit exterior routes. Direction-specific graph vertices are not verified geographic access.",
              "baseline": audit_graph(baseline, sources, probes)}
    del baseline
    expanded, _ = load_pbf(args.expanded_osm)
    result["expanded"] = audit_graph(expanded, sources, probes)
    changes = []
    for orientation in ORIENTATIONS:
        for metric in METRICS:
            a = result["baseline"][orientation][metric]["probes"]
            b = result["expanded"][orientation][metric]["probes"]
            for old, new in zip(a, b):
                if old != new:
                    changes.append({"orientation": orientation, "metric": metric,
                                    "baseline": old, "expanded": new})
    result["changed_probe_metric_orientations"] = changes
    for name, path in (("baseline_osm_sha256", args.baseline_osm), ("expanded_osm_sha256", args.expanded_osm),
                       ("metros_csv_sha256", args.metros)):
        with path.open("rb") as handle:
            result[name] = hashlib.file_digest(handle, "sha256").hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps({"release_eligible": False, "qualifying_sources": len(ids), "diagnostic_sources": len(sources),
                      "omitted_sources": len(result["omitted_qualifying_cbsa_ids"]), "fixed_probes": len(probes),
                      "changed_probe_metric_orientations": len(changes), "oracle_disagreements": 0}, indent=2))


if __name__ == "__main__":
    main()
