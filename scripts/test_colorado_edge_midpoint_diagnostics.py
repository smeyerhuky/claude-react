import unittest

import networkx as nx

from colorado_edge_midpoint_diagnostics import midpoint_oracle, fractional_edge_oracle, diagnose


class MidpointTests(unittest.TestCase):
    def setUp(self):
        self.g = nx.MultiDiGraph()
        self.g.add_edge(1, 2, length=10, travel_time=10)
        self.g.add_edge(2, 3, length=10, travel_time=10)
        self.g.add_edge(2, 1, length=10, travel_time=10)

    def test_one_way_midpoint_must_go_forward(self):
        self.assertEqual(midpoint_oracle(self.g, (2, 3, 0),
                         [{"node": "2", "cbsa": "A"}, {"node": "3", "cbsa": "B"}],
                         "length"), ["B"])

    def test_two_way_midpoint_can_go_backwards(self):
        self.assertEqual(midpoint_oracle(self.g, (1, 2, 0),
                         [{"node": "1", "cbsa": "A"}, {"node": "3", "cbsa": "B"}],
                         "length"), ["A"])

    def test_unreachable_source(self):
        self.assertEqual(midpoint_oracle(self.g, (2, 3, 0),
                         [{"node": "9", "cbsa": "X"}], "length"), [])

    def test_parallel_edges_have_distinct_keys(self):
        self.g.add_edge(1, 2, length=30, travel_time=30)
        self.assertEqual(midpoint_oracle(self.g, (1, 2, 0),
                         [{"node": "1", "cbsa": "A"}, {"node": "2", "cbsa": "B"}],
                         "length"), ["A", "B"])
        self.assertEqual(midpoint_oracle(self.g, (1, 2, 1),
                         [{"node": "1", "cbsa": "A"}, {"node": "2", "cbsa": "B"}],
                         "length"), ["A"])

    def test_fractional_one_way_must_go_forward(self):
        sources = [{"node": "2", "cbsa": "A"}, {"node": "3", "cbsa": "B"}]
        for fraction in (0.25, 0.5, 0.75):
            self.assertEqual(fractional_edge_oracle(
                self.g, (2, 3, 0), sources, "length", fraction), ["B"])

    def test_fractional_bidirectional_can_change_winner_inside_edge(self):
        sources = [{"node": "1", "cbsa": "A"}, {"node": "2", "cbsa": "B"}]
        self.assertEqual(fractional_edge_oracle(
            self.g, (1, 2, 0), sources, "length", 0.25), ["A"])
        self.assertEqual(fractional_edge_oracle(
            self.g, (1, 2, 0), sources, "length", 0.50), ["A", "B"])
        self.assertEqual(fractional_edge_oracle(
            self.g, (1, 2, 0), sources, "length", 0.75), ["B"])

    def test_reverse_cost_is_direction_specific(self):
        # Opposite directed arcs need not have the same cost.
        self.g[2][1][0]["travel_time"] = 30
        sources = [{"node": "1", "cbsa": "A"}, {"node": "2", "cbsa": "B"}]
        self.assertEqual(fractional_edge_oracle(
            self.g, (1, 2, 0), sources, "travel_time", 0.25), ["A", "B"])
        self.assertEqual(fractional_edge_oracle(
            self.g, (1, 2, 0), sources, "travel_time", 0.5), ["B"])

    def test_fraction_must_be_finite_and_bounded(self):
        for fraction in (-0.1, 1.01, float("nan"), float("inf")):
            with self.assertRaisesRegex(ValueError, "fraction"):
                fractional_edge_oracle(self.g, (1, 2, 0), [], "length", fraction)

    def test_endpoint_origin_can_take_other_road_without_reverse_arc(self):
        self.assertEqual(fractional_edge_oracle(
            self.g, (2, 3, 0), [{"node": "1", "cbsa": "A"}],
            "length", 0), ["A"])

    def test_diagnostic_is_noncertifying(self):
        result = {"100000": {"sources": [{"node": "3", "cbsa": "B"}],
                 "distance": {"winners": {"1": {"cbsa": "A"}, "2": {"cbsa": "B"}}},
                 "time": {"winners": {"1": {"cbsa": "A"}, "2": {"cbsa": "B"}}}}}
        report = diagnose(self.g, result, count=2)
        self.assertEqual(report["status"], "diagnostic-only")
        self.assertEqual(report["fractional_positions"], [0.25, 0.5, 0.75])
        self.assertTrue(all("fraction_from_u" in sample for sample in
            report["datasets"]["100000-distance"]["samples"]))
        self.assertEqual(report["datasets"]["100000-distance"]["checked"], 2)


if __name__ == "__main__":
    unittest.main()
