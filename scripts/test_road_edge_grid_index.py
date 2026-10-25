import unittest
import networkx as nx
from road_segment_snapping import snap_point
from road_edge_grid_index import RoadEdgeGridIndex


class RoadGridIndexTests(unittest.TestCase):
    def test_index_matches_scan(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0), (0.01, 0.01)),
                   travel_time=200, length=2224)
        g.add_edge(2, 1, geometry=((0.01, 0.01), (0.01, 0), (0, 0)),
                   travel_time=200, length=2224)
        g.add_edge(1, 2, key="parallel", geometry=((0, 0.0001), (0.01, 0.0001)),
                   travel_time=90, length=1112)
        g.add_edge(3, 4, geometry=((1, 1), (1.01, 1)),
                   travel_time=90, length=1112)
        idx = RoadEdgeGridIndex(g, cell_degrees=0.002)
        for lon, lat, radius in ((0.01, 0, 30), (0.005, 0, 100),
                                 (1, 1, 10), (5, 5, 100), (0, 0, 0)):
            with self.subTest(lon=lon, lat=lat, radius=radius):
                self.assertEqual(snap_point(g, lon, lat, max_gap_m=radius),
                                 snap_point(g, lon, lat, max_gap_m=radius, index=idx))

    def test_long_segment_crosses_grid_cells(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.2, 0)),
                   travel_time=100, length=22240)
        idx = RoadEdgeGridIndex(g, cell_degrees=0.01)
        self.assertEqual(snap_point(g, 0.1, 0, max_gap_m=1),
                         snap_point(g, 0.1, 0, max_gap_m=1, index=idx))

    def test_invalid_geometry_fails_closed(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, length=100, travel_time=10)
        with self.assertRaises(ValueError):
            RoadEdgeGridIndex(g)


if __name__ == "__main__":
    unittest.main()
