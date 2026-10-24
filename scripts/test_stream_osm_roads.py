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

    def test_reversed_oneway(self):
        a = way([10, 11, 12], {"highway":"residential","oneway":"-1"})
        idx = JunctionIndex(); idx.way(a)
        loader = RoadHandler(idx.junctions()); loader.way(a)
        self.assertTrue(loader.graph.has_edge(12, 10))
        self.assertFalse(loader.graph.has_edge(10, 12))

if __name__=="__main__":
    unittest.main()
