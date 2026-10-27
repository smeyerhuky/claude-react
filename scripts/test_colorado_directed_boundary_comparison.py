import unittest

import networkx as nx

from colorado_directed_boundary_comparison import compare_directed_winners


def graph(edges):
    g = nx.DiGraph()
    for u, v, distance, time in edges:
        g.add_edge(u, v, length=distance, travel_time=time)
    return g


class DirectedBoundaryTests(unittest.TestCase):
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
