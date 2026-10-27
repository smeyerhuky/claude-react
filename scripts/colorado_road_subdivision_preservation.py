#!/usr/bin/env python3
"""Preserve modeled baseline paths across OSM edge subdivision, not certify coverage.

An expanded extract can introduce junctions inside a contracted baseline arc.
Compare directed primitive OSM segments, including multiplicity and speed, then
require every baseline junction to survive. This witnesses baseline modeled
paths modulo subdivision; it proves neither complete geography nor legal access.
"""
from collections import Counter
import hashlib
import math

from stream_osm_roads import meters


def _atoms(graph):
    if not graph.is_directed() or not graph.is_multigraph():
        raise ValueError("Expected directed OSM multigraph")
    for u, v, _, data in graph.edges(keys=True, data=True):
        geometry = data.get("geometry")
        ids = data.get("osm_node_ids")
        way = data.get("osm_way_id")
        speed = data.get("speed_kph")
        if (not isinstance(geometry, (list, tuple)) or not isinstance(ids, (list, tuple)) or
                len(geometry) < 2 or len(ids) != len(geometry) or ids[0] != u or ids[-1] != v or
                any(type(node) is not int or node <= 0 for node in ids) or
                type(way) is not int or way <= 0 or isinstance(speed, bool) or
                not isinstance(speed, (int, float)) or not math.isfinite(speed) or speed <= 0):
            raise ValueError("Incomplete OSM segment provenance")
        if any(not isinstance(p, (list, tuple)) or len(p) != 2 or
               any(isinstance(x, bool) or not isinstance(x, (int, float)) or not math.isfinite(x) for x in p)
               for p in geometry):
            raise ValueError("Invalid OSM segment coordinates")
        for node, point in ((u, geometry[0]), (v, geometry[-1])):
            attrs = graph.nodes[node]
            if (attrs.get("x"), attrs.get("y")) != tuple(point):
                raise ValueError("Graph node disagrees with OSM geometry")
        length = sum(meters(a, b) for a, b in zip(geometry, geometry[1:]))
        expected = {"length": length, "travel_time": length/(speed*1000/3600)}
        for metric, cost in expected.items():
            actual = data.get(metric)
            if (isinstance(actual, bool) or not isinstance(actual, (int, float)) or
                    not math.isfinite(actual) or actual < 0 or
                    not math.isclose(actual, cost, rel_tol=1e-10, abs_tol=1e-8)):
                raise ValueError("Road cost disagrees with primitive geometry/speed")
        tags = tuple(data.get(k) for k in ("highway", "access", "motor_vehicle", "motorcar", "oneway"))
        for i, (a, b) in enumerate(zip(geometry, geometry[1:])):
            # IDs and ordered coordinates preserve direction and way identity.
            # Hashing reduces memory; counts preserve parallel/repeated arcs.
            atom = (way, ids[i], ids[i+1], tuple(float(x) for x in a),
                    tuple(float(x) for x in b), float(speed), tags)
            yield hashlib.sha256(repr(atom).encode("utf-8")).digest()


def baseline_snapshot(graph, max_distinct_atoms=12000000):
    atoms = Counter()
    for atom in _atoms(graph):
        atoms[atom] += 1
        if len(atoms) > max_distinct_atoms:
            raise ValueError("Primitive arc inventory exceeds memory bound")
    if not atoms:
        raise ValueError("Empty primitive road inventory")
    return {"atoms": atoms, "nodes": set(graph), "directed_primitive_arc_count": sum(atoms.values())}


def verify_expansion(snapshot, expanded):
    """Check streamed expanded atoms without a second full arc inventory."""
    missing_nodes = snapshot["nodes"] - set(expanded)
    if missing_nodes:
        raise ValueError("Expanded graph lost baseline junction nodes")
    remaining = snapshot["atoms"].copy()
    expanded_count = 0
    for atom in _atoms(expanded):
        expanded_count += 1
        if atom in remaining:
            remaining[atom] -= 1
            if remaining[atom] == 0:
                del remaining[atom]
    if remaining:
        raise ValueError(f"Expanded graph lost {sum(remaining.values())} directed primitive baseline arcs")
    return {"modeled_baseline_paths_preserved_modulo_subdivision": True,
            "baseline_directed_primitive_arcs": snapshot["directed_primitive_arc_count"],
            "expanded_directed_primitive_arcs": expanded_count,
            "baseline_junctions_preserved": len(snapshot["nodes"]),
            "comparison": "SHA256 multiset of directed OSM primitive segments, coordinates, way IDs, speed and access/direction tags; baseline junction inclusion",
            "cost_consistency_tolerance": {"relative": 1e-10, "absolute": 1e-8},
            "extract_coverage_certified": False, "access_certified": False,
            "release_eligible": False}
