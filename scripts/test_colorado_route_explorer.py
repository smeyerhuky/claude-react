"""Synthetic tests for route explorer geometry, snapping, and correctness."""
import unittest
import networkx as nx
from colorado_route_explorer import nearest, route, validate_cost, coordinates, PLACES, TRIPS


class ExplorerTests(unittest.TestCase):
    def test_v2_trips_cover_front_range_mountain_and_rural(self):
        categories = {category for _, _, category in TRIPS}
        self.assertEqual(categories, {"Front Range", "Mountain corridor", "Rural / mountain"})
        self.assertGreaterEqual(len(TRIPS), 6)
        self.assertTrue(all(origin in PLACES and destination in PLACES
                            for origin, destination, _ in TRIPS))
        self.assertEqual(len(TRIPS), len({(a, b) for a, b, _ in TRIPS}))

    def test_snap_selects_nearest_geographic_node(self):
        g = nx.MultiDiGraph()
        g.add_node(1, x=-105.0, y=39.0)
        g.add_node(2, x=-104.0, y=39.0)
        distance, node = nearest(g, -105.001, 39.0)
        self.assertEqual(node, 1)
        self.assertLess(distance, 100)

    def test_oneway_and_disconnected(self):
        g = nx.MultiDiGraph()
        g.add_node(1, x=0, y=0)
        g.add_node(2, x=1, y=0)
        g.add_node(3, x=2, y=0)
        g.add_edge(1, 2, length=100.0, travel_time=10.0)
        self.assertIsNone(route(g, 2, 1, "length"))
        self.assertIsNone(route(g, 1, 3, "length"))
        self.assertEqual(route(g, 1, 2, "length")["distance_m"], 100)
        self.assertEqual(coordinates(g, [1, 2]), [(0, 0), (1, 0)])

    def test_shortest_vs_fastest_parallel_edges(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, length=100, travel_time=30)
        g.add_edge(1, 2, length=140, travel_time=10)
        self.assertEqual(route(g, 1, 2, "length")["travel_time_s"], 30)
        self.assertEqual(route(g, 1, 2, "travel_time")["distance_m"], 140)

    def test_mismatch_is_fatal(self):
        a = {"cost": 100.0}
        self.assertAlmostEqual(validate_cost(a, {"cost": 100.0005}, "length"), 0.0005)
        with self.assertRaises(AssertionError):
            validate_cost(a, {"cost": 101.0}, "length")
        with self.assertRaises(AssertionError):
            validate_cost(a, None, "length")
        self.assertIsNone(validate_cost(None, None, "length"))


if __name__ == "__main__":
    unittest.main()
