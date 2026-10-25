import unittest
import networkx as nx
from road_access_diagnostics import diagnose_point
from road_edge_grid_index import RoadEdgeGridIndex


class AccessDiagnosticsTests(unittest.TestCase):
    def test_bridge_like_offset_is_not_certified(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100,
                   highway="residential")
        results = diagnose_point(g, 0.005, 0.0001, max_gap_m=50)
        self.assertEqual(len(results), 1)
        self.assertFalse(results[0]["access_verified"])
        self.assertIn("grade_barrier_or_crossing_unverified", results[0]["access_risks"])

    def test_controlled_access_road_flagged_even_at_zero_gap(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100,
                   highway="motorway", access="private")
        result = diagnose_point(g, 0.005, 0, max_gap_m=10)[0]
        self.assertIn("controlled_access", result["access_risks"])
        self.assertIn("restricted_access", result["access_risks"])
        self.assertFalse(result["access_verified"])

    def test_indexed_and_exhaustive_diagnostics_match(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100,
                   highway="residential")
        idx = RoadEdgeGridIndex(g)
        self.assertEqual(diagnose_point(g, 0.005, 0.0001, index=idx),
                         diagnose_point(g, 0.005, 0.0001))

    def test_off_network_has_no_invented_candidate(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100)
        self.assertEqual(diagnose_point(g, 1, 1, max_gap_m=10), [])


if __name__ == "__main__":
    unittest.main()
