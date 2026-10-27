#!/usr/bin/env python3
"""Detect directed metro-winner changes between clipped and expanded graphs.

A disagreement is a coverage warning, never an approval. Sources and probes
must be supplied explicitly; this does not validate physical/legal access.
"""
import math

import networkx as nx


def directed_winner(graph, sources, target, weight):
    """Independently calculate each source's directed cost to a probe node."""
    if weight not in ("length", "travel_time"):
        raise ValueError("Unsupported routing metric")
    if not sources or len(sources) != len(set(sources)):
        raise ValueError("Missing or duplicate metro sources")
    if target not in graph:
        return {"status": "probe_outside_graph", "winner": None}
    costs = []
    for cbsa, node in sorted(sources.items()):
        if node not in graph:
            return {"status": "source_outside_graph", "winner": None}
        try:
            cost = nx.shortest_path_length(graph, node, target, weight=weight)
        except nx.NetworkXNoPath:
            continue
        if not math.isfinite(cost) or cost < 0:
            raise ValueError("Invalid directed route cost")
        costs.append((cost, cbsa))
    if not costs:
        return {"status": "unreachable", "winner": None}
    best = min(cost for cost, _ in costs)
    tied = sorted(cbsa for cost, cbsa in costs
                  if abs(cost - best) <= max(0.002, abs(best) * 1e-9))
    if len(tied) != 1:
        return {"status": "tied", "winner": None}
    return {"status": "reachable", "winner": tied[0]}


def compare_directed_winners(baseline, expanded, sources, probes, weight):
    if not probes or len(probes) != len(set(probes)):
        raise ValueError("Missing or duplicate probes")
    rows = []
    for probe in probes:
        old = directed_winner(baseline, sources, probe, weight)
        new = directed_winner(expanded, sources, probe, weight)
        rows.append({"probe": str(probe), "baseline": old, "expanded": new,
                     "changed": old != new})
    return {
        "release_eligible": False,
        "extract_coverage_certified": False,
        "access_certified": False,
        "metric": weight,
        "changed_probe_count": sum(x["changed"] for x in rows),
        "probes": rows,
        "warning": "Directed graph comparison is not complete-source or access certification",
    }
