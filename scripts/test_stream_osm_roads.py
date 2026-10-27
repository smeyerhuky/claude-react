"""Synthetic fixture: contract shape vertices without losing cost or directions."""
import unittest
from types import SimpleNamespace

from stream_osm_roads import JunctionIndex, RoadHandler

class Tags(dict):
    pass

def way(ids, tags=None):
    nodes = [SimpleNamespace(ref=n, location=SimpleNamespace(valid=lambda: True, lon=float(n)*.001, lat=39.0)) for n in ids]
    return SimpleNamespace(nodes=nodes, tags=Tags(tags or {"highway":"residential"}))

class JunctionCompressionTests(unittest.TestCase):
    def test_road_joins_keep_intersection_not_shape_points(self):
        a = way([1, 2, 3, 4])
        b = way([5, 3, 6], {"highway":"primary", "oneway":"yes"})
        idx = JunctionIndex()
        idx.way(a);idx.way(b)
        keep = idx.junctions()
        self.assertEqual(keep, {1, 3, 4, 5, 6})
        loader = RoadHandler(keep)
        loader.way(a);loader.way(b)
        self.assertNotIn(2, loader.graph.nodes)
        self.assertEqual(loader.graph.number_of_nodes(), 5)
        forward = loader.graph[1][3][0]["length"]
        self.assertGreater(forward, 0)
        self.assertAlmostEqual(forward, loader.graph[3][1][0]["length"])
        self.assertFalse(loader.graph.has_edge(3, 5))  # one-way 5→3

    def test_repeated_node_within_one_way_is_a_junction(self):
        # Geometry loops back through node 2. It must remain routable, even
        # though the node occurs in only one OSM way.
        a = way([1, 2, 3, 4, 2, 5])
        idx = JunctionIndex()
        idx.way(a)
        self.assertIn(2, idx.junctions())
        loader = RoadHandler(idx.junctions())
        loader.way(a)
        self.assertTrue(loader.graph.has_edge(1, 2))
        self.assertTrue(loader.graph.has_edge(2, 5))
        self.assertFalse(loader.graph.has_edge(1, 5))

    def test_reversed_oneway(self):
        a = way([10, 11, 12], {"highway":"residential","oneway":"-1"})
        idx = JunctionIndex(); idx.way(a)
        loader = RoadHandler(idx.junctions()); loader.way(a)
        self.assertTrue(loader.graph.has_edge(12, 10))
        self.assertFalse(loader.graph.has_edge(10, 12))


class DirectedModelRegressions(unittest.TestCase):
    def load(self, tags, ids=(1, 2, 3)):
        w = way(list(ids), tags)
        index = JunctionIndex()
        index.way(w)
        loader = RoadHandler(index.junctions())
        loader.way(w)
        return loader.graph

    def test_explicit_roundabout_reverse_and_no_override_defaults(self):
        for value, forward, backward in (("-1", False, True), ("no", True, True), ("yes", True, False)):
            g = self.load({"highway": "residential", "junction": "roundabout", "oneway": value})
            self.assertEqual(g.has_edge(1, 3), forward)
            self.assertEqual(g.has_edge(3, 1), backward)

    def test_implicit_motorway_is_forward_unless_explicit_no(self):
        g = self.load({"highway": "motorway"})
        self.assertTrue(g.has_edge(1, 3))
        self.assertFalse(g.has_edge(3, 1))
        g = self.load({"highway": "motorway", "oneway": "no"})
        self.assertTrue(g.has_edge(3, 1))

    def test_vehicle_specific_direction(self):
        g = self.load({"highway": "residential", "oneway": "yes", "oneway:motorcar": "no"})
        self.assertTrue(g.has_edge(1, 3))
        self.assertTrue(g.has_edge(3, 1))

    def test_unknown_or_time_varying_direction_is_explicitly_omitted(self):
        for value in ("alternating", "reversible", "unknown"):
            g = self.load({"highway": "residential", "oneway": value})
            self.assertEqual(g.number_of_edges(), 0)
            self.assertEqual(g.graph["unsupported_direction_way_count"], 1)
        g = self.load({"highway": "residential", "oneway:conditional": "yes @ (08:00-09:00)"})
        self.assertEqual(g.number_of_edges(), 0)
        self.assertEqual(g.graph["unsupported_direction_way_count"], 1)

    def test_closed_way_keeps_full_loop_geometry_and_cost(self):
        g = self.load({"highway": "residential", "oneway": "yes"}, ids=(1, 2, 3, 1))
        self.assertTrue(g.has_edge(1, 1))
        self.assertGreater(g[1][1][0]["length"], 0)
        self.assertEqual(g[1][1][0]["osm_node_ids"], (1, 2, 3, 1))

    def test_missing_location_is_not_bridged(self):
        w = way([1, 2, 3])
        w.nodes[1].location.valid = lambda: False
        loader = RoadHandler({1, 3})
        with self.assertRaisesRegex(ValueError, "invented road chord"):
            loader.way(w)

if __name__ == "__main__":
    unittest.main()
