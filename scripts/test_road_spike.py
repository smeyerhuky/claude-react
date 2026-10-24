"""Offline correctness tests for road_spike allocation on a SYNTHETIC graph.

This is a network algorithm fixture, NOT a Colorado road dataset.
"""
import unittest

import networkx as nx

from road_spike import assign


class RoadSpikeTest(unittest.TestCase):
    def test_metric_winners_can_differ(self):
        graph = nx.MultiDiGraph()
        # At node 'point', metro A is the shortest road distance (5 m) but
        # metro B is faster (2 s). Reverse direction is intentionally different.
        graph.add_edge("point", "a", length=5.0, travel_time=50.0)
        graph.add_edge("point", "b", length=12.0, travel_time=2.0)
        graph.add_edge("a", "point", length=1.0, travel_time=1.0)
        graph.add_edge("b", "point", length=1.0, travel_time=1.0)
        origins = [{"cbsa": "A", "node": "a"}, {"cbsa": "B", "node": "b"}]
        d = assign(graph, origins, "length", nx)
        t = assign(graph, origins, "travel_time", nx)
        self.assertEqual(d["point"]["cbsa"], "A")
        self.assertEqual(t["point"]["cbsa"], "B")
        self.assertEqual(d["point"]["cost"], 5)
        self.assertEqual(t["point"]["cost"], 2)

    def test_disconnected_point_is_unassigned(self):
        graph = nx.MultiDiGraph()
        graph.add_edge("near", "metro", length=4, travel_time=8)
        graph.add_node("isolated")
        result = assign(graph, [{"cbsa": "X", "node": "metro"}], "length", nx)
        self.assertEqual(result["near"]["cbsa"], "X")
        self.assertNotIn("isolated", result)

    def test_invalid_cost_rejected(self):
        graph = nx.MultiDiGraph()
        graph.add_edge(1, 2, length=-1)
        with self.assertRaises(ValueError):
            assign(graph, [{"cbsa": "X", "node": 2}], "length", nx)


if __name__ == "__main__":
    unittest.main()
