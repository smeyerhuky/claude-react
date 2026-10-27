import unittest

import networkx as nx

from colorado_directed_boundary_comparison import compare_directed_winners, directed_winner


def graph(edges):
    g = nx.DiGraph()
    for u, v, distance, time in edges:
        g.add_edge(u, v, length=distance, travel_time=time)
    return g


class DirectedBoundaryTests(unittest.TestCase):
    def test_invalid_weights_never_default_to_unit_cost(self):
        for value in (None, -1, float("nan"), float("inf"), True, "1"):
            with self.subTest(value=value):
                g = nx.DiGraph()
                g.add_edge("a", "probe", length=value)
                with self.assertRaisesRegex(ValueError, "edge weight"):
                    directed_winner(g, {"14500": "a"}, "probe", "length")
        g = nx.DiGraph([("a", "probe")])
        with self.assertRaisesRegex(ValueError, "edge weight"):
            directed_winner(g, {"14500": "a"}, "probe", "length")

    def test_undirected_graph_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "directed graph"):
            directed_winner(nx.Graph(), {"14500": "a"}, "p", "length")

    def test_multiedge_loss_and_cost_change_rejected(self):
        old = nx.MultiDiGraph()
        old.add_edge("a", "p", key=5, length=1)
        old.add_edge("a", "p", key=6, length=2)
        old.add_edge("b", "p", length=3)
        for operation in ("remove", "change"):
            new = old.copy()
            if operation == "remove":
                new.remove_edge("a", "p", 5)
            else:
                new["a"]["p"][5]["length"] = 10
            with self.assertRaisesRegex(ValueError, "baseline directed arc"):
                compare_directed_winners(old, new, {"1": "a", "2": "b"}, ["p"], "length")

    def test_shorter_route_with_same_winner_is_visible(self):
        old = graph([("a", "p", 10, 10), ("b", "p", 20, 20)])
        new = old.copy()
        new.add_edge("a", "x", length=1, travel_time=1)
        new.add_edge("x", "p", length=1, travel_time=1)
        result = compare_directed_winners(old, new, {"1": "a", "2": "b"}, ["p"], "length")
        self.assertEqual(result["changed_probe_count"], 1)
        self.assertEqual(result["probes"][0]["expanded"]["cost"], 2)

    def test_missing_border_route_changes_metro_winner(self):
        old = graph([("denver", "probe", 10, 10),
                     ("boulder", "dead_end", 1, 1)])
        new = graph([("denver", "probe", 10, 10),
                     ("boulder", "dead_end", 1, 1),
                     ("dead_end", "probe", 1, 1)])
        result = compare_directed_winners(
            old, new, {"19740": "denver", "14500": "boulder"},
            ["probe"], "length")
        self.assertEqual(result["changed_probe_count"], 1)
        self.assertEqual(result["probes"][0]["baseline"]["winner"], "19740")
        self.assertEqual(result["probes"][0]["expanded"]["winner"], "14500")
        self.assertFalse(result["release_eligible"])

    def test_reverse_only_road_cannot_create_forward_route(self):
        old = graph([("denver", "probe", 10, 10),
                     ("boulder", "dead_end", 1, 1)])
        new = graph([("denver", "probe", 10, 10),
                     ("boulder", "dead_end", 1, 1),
                     ("probe", "dead_end", 1, 1)])
        result = compare_directed_winners(
            old, new, {"19740": "denver", "14500": "boulder"},
            ["probe"], "travel_time")
        self.assertEqual(result["changed_probe_count"], 0)

    def test_lost_directed_arc_is_rejected(self):
        old = graph([("denver", "probe", 10, 10),
                     ("boulder", "probe", 2, 2)])
        new = graph([("denver", "probe", 10, 10)])
        with self.assertRaisesRegex(ValueError, "lost a baseline directed arc"):
            compare_directed_winners(
                old, new, {"19740": "denver", "14500": "boulder"},
                ["probe"], "length")

    def test_missing_competitor_source_fails_closed(self):
        old = graph([("denver", "probe", 10, 10)])
        new = graph([("denver", "probe", 10, 10),
                     ("boulder", "probe", 2, 2)])
        result = compare_directed_winners(
            old, new, {"19740": "denver", "14500": "boulder"},
            ["probe"], "length")
        self.assertEqual(result["probes"][0]["baseline"]["status"],
                         "source_outside_graph")
        self.assertIsNone(result["probes"][0]["baseline"]["winner"])
        self.assertFalse(result["extract_coverage_certified"])


if __name__ == "__main__":
    unittest.main()
