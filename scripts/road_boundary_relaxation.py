"""Conditional parent-relative bounds for unknown nonnegative exterior routes.

All missing directed arcs must be represented by complete exit/entry ports.
This module cannot establish that assumption or physical/global completeness.
"""
from fractions import Fraction
import math

import networkx as nx

from stream_osm_roads import meters


def promote_raw_ports(graph, ports):
    """Split directed OSM polylines at every supplied raw port, in place.

    Stage and validate before mutation. Keep zero-length subarcs: dropping one
    can disconnect an otherwise preserved baseline path at a new junction.
    """
    if not graph.is_directed() or not graph.is_multigraph() or not ports:
        raise ValueError("Need directed OSM multigraph and explicit raw ports")
    coordinates = {}
    for port in ports:
        node, point = port["osm_node_id"], port["lonlat"]
        if (type(node) is not int or node <= 0 or node in coordinates or len(point) != 2 or
                any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in point) or
                not -180 <= point[0] <= 180 or not -90 <= point[1] <= 90 or
                type(port["can_enter_retained_way_set"]) is not bool or type(port["can_exit_retained_way_set"]) is not bool or
                not (port["can_enter_retained_way_set"] or port["can_exit_retained_way_set"])):
            raise ValueError("Invalid or duplicate raw port")
        coordinates[node] = tuple(point)
    found, updates, zero = set(), [], 0
    for u, v, key, data in graph.edges(keys=True, data=True):
        ids, shape = data.get("osm_node_ids"), data.get("geometry")
        if not ids or not shape or len(ids) != len(shape) or len(ids) < 2 or ids[0] != u or ids[-1] != v:
            raise ValueError("Explicit directed raw OSM geometry required for port promotion")
        splits = [0]
        for index, (node, point) in enumerate(zip(ids, shape)):
            if node not in coordinates:
                continue
            if tuple(point) != coordinates[node]:
                raise ValueError("Raw port coordinate disagrees with graph geometry")
            found.add(node)
            if 0 < index < len(ids)-1:
                if node in graph:
                    raise ValueError("Contraction hides an existing graph junction")
                splits.append(index)
        if len(splits) == 1:
            continue
        splits.append(len(ids)-1)
        speed = data.get("speed_kph")
        if isinstance(speed, bool) or not isinstance(speed, (int, float)) or not math.isfinite(speed) or speed <= 0:
            raise ValueError("Need explicit static speed for split costs")
        pieces = []
        for left, right in zip(splits, splits[1:]):
            geometry, nodes = tuple(shape[left:right+1]), tuple(ids[left:right+1])
            length = sum(meters(a, b) for a, b in zip(geometry, geometry[1:]))
            zero += length == 0
            pieces.append((nodes[0], nodes[-1], {**data, "geometry": geometry, "osm_node_ids": nodes,
                                                "length": length, "travel_time": length/(speed*1000/3600)}))
        for metric in ("length", "travel_time"):
            old = data.get(metric)
            if (isinstance(old, bool) or not isinstance(old, (int, float)) or not math.isfinite(old) or old < 0 or
                    not math.isclose(sum(p[2][metric] for p in pieces), old, rel_tol=1e-10, abs_tol=1e-8)):
                raise ValueError("Split costs do not preserve original modeled cost")
        updates.append((u, v, key, pieces))
    if found != set(coordinates):
        raise ValueError("Raw ports missing from graph geometry; never drop interface nodes")
    for node, point in coordinates.items():
        if node in graph and (graph.nodes[node].get("x"), graph.nodes[node].get("y")) != point:
            raise ValueError("Existing graph node disagrees with port coordinate")
    new_nodes = len(set(coordinates)-set(graph))
    for node, (x, y) in coordinates.items():
        graph.add_node(node, x=x, y=y)
    for u, v, key, pieces in updates:
        graph.remove_edge(u, v, key)
        for a, b, data in pieces:
            graph.add_edge(a, b, **data)
    return {"raw_ports": len(coordinates), "new_junction_nodes": new_nodes,
            "split_directed_edges": len(updates), "zero_length_subarcs_retained": zero,
            "release_eligible": False, "access_certified": False}


def conditional_cut_bounds(graph, sources, probes, exits, entries, *, metric, orientation, margin=0):
    """Lower-bound any parent path by its known prefix/suffix around excursions.

    L_i(d) = min(D_G(s_i,d), min_exit D_G(s_i,exit) + min_entry D_G(entry,d)).
    Unknown exterior travel is optimistically free. Both ports of omitted
    internal arcs count as exit/entry too. Reverse orientation swaps the roles.
    """
    if not graph.is_directed() or metric not in ("length", "travel_time") or orientation not in ("metro-to-location", "location-to-metro"):
        raise ValueError("Explicit directed graph, metric and orientation required")
    if len(sources) < 2 or len({s["cbsa"] for s in sources}) != len(sources):
        raise ValueError("Need distinct competing source identities")
    probes, exits, entries = list(probes), set(exits), set(entries)
    if not probes or len(set(probes)) != len(probes) or any(n not in graph for n in probes+list(exits|entries)+[s["node"] for s in sources]):
        raise ValueError("Missing/duplicate probes, sources or promoted ports")
    slack = Fraction(str(margin))
    if isinstance(margin, bool) or slack < 0:
        raise ValueError("Invalid nonnegative comparison margin")
    for _, _, data in graph.edges(data=True):
        cost = data.get(metric)
        if (isinstance(cost, bool) or not isinstance(cost, (int, float)) or not math.isfinite(cost) or cost < 0 or
                (isinstance(cost, int) and float(cost) != cost)):
            raise ValueError("Finite nonnegative explicit representable costs required")
    # Standard summation bound gamma_k=k*u/(1-k*u), u=2^-53. Use 2N
    # operations to cover mixed int/float addition along a simple known path.
    n = 2*len(graph)
    if n >= 2**52:
        raise ValueError("Graph exceeds floating-point error-bound scope")
    gamma = Fraction(n, 2**53-n)
    lower_factor, upper_factor = 1+gamma, 1-gamma
    oriented = graph if orientation == "metro-to-location" else graph.reverse(copy=False)
    if orientation == "location-to-metro":
        exits, entries = entries, exits
    def checked(distances):
        if any(not math.isfinite(v) or v < 0 for v in distances.values()):
            raise ValueError("Distance overflow or invalid label; cannot produce a bound")
        return distances
    suffix = checked(nx.multi_source_dijkstra_path_length(oriented, entries, weight=metric)) if entries else {}
    labels = {}
    for source in sources:
        distances = checked(nx.single_source_dijkstra_path_length(oriented, source["node"], weight=metric))
        prefix = min((distances[n] for n in exits if n in distances), default=None)
        rows = {}
        for probe in probes:
            known = distances.get(probe)
            lower_options = [] if known is None else [Fraction(known)/lower_factor]
            if prefix is not None and probe in suffix:
                lower_options.append((Fraction(prefix)+Fraction(suffix[probe]))/lower_factor)
            rows[probe] = (None if known is None else Fraction(known)/upper_factor,
                           min(lower_options) if lower_options else None)
        labels[source["cbsa"]] = rows
    result = []
    def encode(value):
        return None if value is None else {"value": float(value), "exact": [str(value.numerator), str(value.denominator)]}
    for probe in probes:
        feasible = [(rows[probe][0], cbsa) for cbsa, rows in labels.items() if rows[probe][0] is not None]
        upper, incumbent = min(feasible) if feasible else (None, None)
        possible = [cbsa for cbsa, rows in labels.items() if rows[probe][1] is not None and (upper is None or rows[probe][1] <= upper+slack)]
        result.append({"probe": str(probe), "incumbent": incumbent, "feasible_known_path_upper_bound": encode(upper),
                       "possible_subset_winners": sorted(possible),
                       "conditional_subset_winner": incumbent if possible == [incumbent] else None,
                       "source_bounds": [{"cbsa": cbsa, "known_path_upper_bound": encode(rows[probe][0]),
                                          "parent_relative_lower_bound": encode(rows[probe][1])} for cbsa, rows in sorted(labels.items())]})
    return {"release_eligible": False, "access_certified": False, "complete_global_competition": False,
            "conditional_only": True, "metric": metric, "orientation": orientation,
            "assumption": "Complete promoted interface for every missing parent arc, nonnegative exterior costs, and the same modeled endpoints/costs; no connectors or omitted national sources certified",
            "floating_point_gamma_exact": [str(gamma.numerator), str(gamma.denominator)], "probes": result}
