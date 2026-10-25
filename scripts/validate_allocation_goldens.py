"""Independent forward-directed origin-to-metro checks for raster source allocations.

Reference computes single-origin shortest paths to *each* candidate metro,
rather than using the production reverse multi-source winner propagation.
"""
import math
import networkx as nx


def check_winners(graph, result, nodes, tolerance=0.01):
    if tolerance < 0:
        raise ValueError("Negative cost tolerance")
    records = []
    node_lookup = {str(n): n for n in graph.nodes}
    sources = [{**source, "node": node_lookup[str(source["node"])]}
               for source in result["sources"]]
    for node in nodes:
        for metric, weight in (("distance", "length"), ("time", "travel_time")):
            expected = result[metric]["winners"].get(str(node))
            lengths = nx.single_source_dijkstra_path_length(graph, node, weight=weight)
            candidates = [(float(lengths[s["node"]]), str(s["cbsa"]))
                          for s in sources if s["node"] in lengths]
            candidates.sort()
            if not candidates:
                if expected is not None:
                    raise AssertionError(f"{node}/{metric}: allocated but no forward path")
                records.append({"node": str(node), "metric": metric, "reachable": False})
                continue
            best, cbsa = candidates[0]
            if expected is None:
                raise AssertionError(f"{node}/{metric}: missing reachable winner {cbsa}")
            # A tied winner can be equally optimal; require its own routed cost.
            winning = next((cost for cost, candidate in candidates
                            if candidate == str(expected["cbsa"])), None)
            if winning is None or abs(winning - best) > tolerance:
                raise AssertionError(f"{node}/{metric}: winner {expected['cbsa']} cost "
                                     f"{winning} vs global best {cbsa} cost {best}")
            reported_cost = float(expected["cost"])
            if not math.isfinite(reported_cost) or abs(reported_cost - winning) > tolerance:
                raise AssertionError(f"{node}/{metric}: reported cost {reported_cost} "
                                     f"vs independent {winning}")
            records.append({"node": str(node), "metric": metric, "reachable": True,
                            "cbsa": str(expected["cbsa"]), "cost": round(best, 3)})
    return records


def sample_nodes(graph, count=6):
    """Deterministic dispersed sample, including bbox extrema and center-nearest."""
    if count < 1:
        raise ValueError("count must be positive")
    nodes = list(graph.nodes(data=True))
    if not nodes:
        return []
    points = [(n, a["x"], a["y"]) for n, a in nodes]
    west = min(p[1] for p in points)
    east = max(p[1] for p in points)
    south = min(p[2] for p in points)
    north = max(p[2] for p in points)
    positions = [(west, south), (east, north), (west, north), (east, south),
                 ((west + east) / 2, (south + north) / 2),
                 ((west * 3 + east) / 4, (south + north) / 2),
                 ((west + east * 3) / 4, (south + north) / 2)]
    selected = []
    for x, y in positions[:count]:
        n = min(points, key=lambda p: (p[1]-x)**2 + (p[2]-y)**2)[0]
        if n not in selected:
            selected.append(n)
    return selected
