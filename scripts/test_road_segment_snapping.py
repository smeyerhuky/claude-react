import unittest
import networkx as nx
from road_segment_snapping import snap_point


class SegmentSnapTests(unittest.TestCase):
    def test_curved_polyline_and_directed_offset(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0), (0.01, 0.01)),
                   travel_time=200, length=2224, osm_way_id=42)
        matches = snap_point(g, 0.01, 0.005, max_gap_m=20)
        self.assertEqual(len(matches), 1)
        self.assertEqual(matches[0]["edge"], (1, 2, 0))
        self.assertAlmostEqual(matches[0]["fraction"], 0.75, places=2)
        self.assertAlmostEqual(matches[0]["travel_time"], 50, delta=1)
        self.assertEqual(matches[0]["to_node"], 2)

    def test_one_way_does_not_invent_reverse_access(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)),
                   travel_time=100, length=1112)
        self.assertEqual([m["to_node"] for m in snap_point(g, 0.005, 0)], [2])

    def test_parallel_edges_preserve_keys(self):
        g = nx.MultiDiGraph()
        for key in ("a", "b"):
            g.add_edge(1, 2, key=key, geometry=((0, 0), (0.01, 0)),
                       travel_time=100, length=1112)
        self.assertEqual({m["edge"][2] for m in snap_point(g, 0.005, 0)},
                         {"a", "b"})

    def test_off_network_remains_unassigned(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)),
                   travel_time=100, length=1112)
        self.assertEqual(snap_point(g, 1, 1, max_gap_m=100), [])

    def test_missing_geometry_fails_closed(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, travel_time=10, length=100)
        with self.assertRaises(ValueError):
            snap_point(g, 0, 0)


if __name__ == "__main__":
    unittest.main()
