import unittest
import networkx as nx
from road_spike import assign


class DirectedBudgetTests(unittest.TestCase):
    def test_outward_and_inward_oneway_reachability(self):
        g = nx.MultiDiGraph()
        g.add_edge("metro", "a", length=10, travel_time=4)
        g.add_edge("a", "b", length=5, travel_time=8)
        g.add_edge("back", "metro", length=2, travel_time=1)
        g.add_node("island")
        sources = [{"cbsa": "1", "node": "metro"}]
        outward = assign(g, sources, "length", orientation="metro-to-location", max_cost=10)
        inward = assign(g, sources, "length", max_cost=10)
        self.assertEqual(set(outward), {"metro", "a"})
        self.assertEqual(set(inward), {"metro", "back"})
        timed = assign(g, sources, "travel_time", orientation="metro-to-location", max_cost=12)
        self.assertEqual(set(timed), {"metro", "a", "b"})
        self.assertNotIn("island", timed)

    def test_multiple_connectors_share_one_origin_label(self):
        g = nx.MultiDiGraph()
        g.add_edge("a", "x", length=3)
        g.add_edge("b", "y", length=2)
        result = assign(g, [{"cbsa": "1", "node": "a"}, {"cbsa": "1", "node": "b"}],
                        "length", orientation="metro-to-location", max_cost=3)
        self.assertEqual(set(result), {"a", "b", "x", "y"})

    def test_both_metrics_directions_and_budgets_match_direct_paths(self):
        g = nx.MultiDiGraph()
        for a, b, d, t in [(1, 2, 4, 8), (2, 3, 6, 1), (1, 3, 20, 3),
                            (4, 3, 2, 7), (3, 5, 1, 4)]:
            g.add_edge(a, b, length=d, travel_time=t)
        g.add_node(6)
        sources = [{"cbsa": "a", "node": 1}, {"cbsa": "b", "node": 4}]
        for metric in ("length", "travel_time"):
            for orientation in ("location-to-metro", "metro-to-location"):
                for budget in (0, 3, 10, 100):
                    result = assign(g, sources, metric, orientation=orientation, max_cost=budget)
                    for node in g:
                        paths = []
                        for source in sources:
                            a, b = (source["node"], node) if orientation == "metro-to-location" else (node, source["node"])
                            try:
                                paths.append((nx.dijkstra_path_length(g, a, b, weight=metric), source["cbsa"]))
                            except nx.NetworkXNoPath:
                                pass
                        expected = min(paths) if paths else (float("inf"), None)
                        self.assertEqual(str(node) in result, expected[0] <= budget)
                        if str(node) in result:
                            self.assertEqual((result[str(node)]["cost"], result[str(node)]["cbsa"]), expected)

    def test_invalid_unreachable_weights_and_budgets_fail_closed(self):
        for invalid in (None, -1, float("nan"), True, "1"):
            g = nx.MultiDiGraph()
            g.add_node("metro")
            g.add_edge("island", "other", length=invalid)
            with self.assertRaises(ValueError):
                assign(g, [{"cbsa": "a", "node": "metro"}], "length", max_cost=0)
        g = nx.DiGraph()
        g.add_node("metro")
        for budget in (-1, float("inf"), True):
            with self.assertRaises(ValueError):
                assign(g, [{"cbsa": "a", "node": "metro"}], "length", max_cost=budget)


if __name__ == "__main__":
    unittest.main()
