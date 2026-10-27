#!/usr/bin/env python3
"""Detect directed metro-winner changes between clipped and expanded graphs.

A disagreement is a coverage warning, never an approval. Sources and probes
must be supplied explicitly; this does not validate physical/legal access.
"""
import math
from collections import Counter
from numbers import Real

import networkx as nx


def _weighted_arcs(graph, weight):
    """Validate before NetworkX can silently substitute a unit edge cost."""
    if weight not in ("length", "travel_time"):
        raise ValueError("Unsupported routing metric")
    if not graph.is_directed():
        raise ValueError("Routing requires a directed graph")
    arcs = Counter()
    for u, v, data in graph.edges(data=True):
        cost = data.get(weight)
        if (isinstance(cost, bool) or not isinstance(cost, Real) or
                not math.isfinite(cost) or cost < 0):
            raise ValueError("Missing or invalid directed edge weight")
        # Keys can change when extracts are rebuilt. Preserve multiplicity and
        # metric costs, rather than trusting locally assigned multiedge keys.
        arcs[(u, v, cost)] += 1
    return arcs


def directed_winner(graph, sources, target, weight):
    """Independently calculate each source's directed cost to a probe node."""
    _weighted_arcs(graph, weight)
    return _directed_winner(graph, sources, target, weight)


def _directed_winner(graph, sources, target, weight):
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
    return {"status": "reachable", "winner": tied[0], "cost": best}


def compare_directed_winners(baseline, expanded, sources, probes, weight):
    # A larger bbox alone does not prove graph inclusion. Missing baseline
    # directed arcs would make a winner comparison misleading.
    old_arcs = _weighted_arcs(baseline, weight)
    new_arcs = _weighted_arcs(expanded, weight)
    if old_arcs - new_arcs:
        raise ValueError("Expanded graph lost a baseline directed arc or changed its cost")
    if not set(baseline).issubset(expanded):
        raise ValueError("Expanded graph lost a baseline node")
    if not sources or len(sources) < 2:
        raise ValueError("Need at least two competing metro sources")
    if not probes or len(probes) != len(set(probes)):
        raise ValueError("Missing or duplicate probes")
    rows = []
    for probe in probes:
        old = _directed_winner(baseline, sources, probe, weight)
        new = _directed_winner(expanded, sources, probe, weight)
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
