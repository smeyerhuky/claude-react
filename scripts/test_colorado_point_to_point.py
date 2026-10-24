"""Directed routing edge cases and point-to-point benchmark regression tests."""
import unittest

import networkx as nx

from benchmark_colorado_point_to_point import compare, evaluate, make_pairs
from stream_osm_roads import JunctionIndex, RoadHandler
from test_stream_osm_roads import way


def build(ways, compressed):
    idx = JunctionIndex()
    for w in ways:
        idx.way(w)
    keep = idx.junctions() if compressed else set(idx.counts)
    handler = RoadHandler(keep)
    for w in ways:
        handler.way(w)
    return handler.graph


class PointToPointTests(unittest.TestCase):
    def test_oneway_reverse_unreachable_and_cost(self):
        ways = [way([1, 2, 3], {"highway": "residential", "oneway": "yes"}),
                way([3, 4, 5], {"highway": "primary", "oneway": "yes"})]
        reference, compressed = build(ways, False), build(ways, True)
        pairs = [(1, 5), (5, 1), (1, 1)]
        summary = compare(evaluate(reference, pairs), evaluate(compressed, pairs))
        self.assertEqual(summary["status"], "pass")
        self.assertEqual(summary["both_unreachable"], 2)

    def test_repeated_node_and_bidirectional_shortcut(self):
        ways = [way([1, 2, 3, 4, 2, 5]),
                way([5, 6, 7], {"highway": "secondary"})]
        reference, compressed = build(ways, False), build(ways, True)
        pairs = [(1, 7), (7, 1), (2, 4), (4, 2)]
        self.assertEqual(compare(evaluate(reference, pairs), evaluate(compressed, pairs))["status"], "pass")

    def test_disconnected_components(self):
        ways = [way([1, 2, 3]), way([20, 21, 22])]
        reference, compressed = build(ways, False), build(ways, True)
        pairs = [(1, 22), (22, 1), (1, 3)]
        self.assertEqual(compare(evaluate(reference, pairs), evaluate(compressed, pairs))["status"], "pass")

    def test_detects_cost_and_reachability_regressions(self):
        a = [{"source": 1, "target": 2, "metric": "length", "cost": 10.0},
             {"source": 2, "target": 1, "metric": "travel_time", "cost": None}]
        b = [{"source": 1, "target": 2, "metric": "length", "cost": 11.0},
             {"source": 2, "target": 1, "metric": "travel_time", "cost": 2.0}]
        summary = compare(a, b)
        self.assertEqual(summary["status"], "fail")
        self.assertEqual(summary["cost_mismatches"], 1)
        self.assertEqual(summary["reachability_mismatches"], 1)

    def test_deterministic_pairs_include_reverse_and_self(self):
        graph = nx.DiGraph()
        graph.add_nodes_from([1, 2, 3, 4])
        a = make_pairs(graph, 3, 2, 17)
        self.assertEqual(a, make_pairs(graph, 3, 2, 17))
        self.assertTrue(any(u == v for u, v in a))
        self.assertTrue(all((v, u) in a for u, v in a))


if __name__ == "__main__":
    unittest.main()
