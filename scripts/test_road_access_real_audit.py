import unittest
import networkx as nx
from road_access_real_audit import audit_samples
from road_edge_grid_index import RoadEdgeGridIndex


class RealAccessAuditTests(unittest.TestCase):
    def test_off_geometry_probe_is_flagged_and_never_verified(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100,
                   highway="residential")
        report = audit_samples(g, [(0.005, 0)], RoadEdgeGridIndex(g), radius_m=150)
        self.assertEqual(report["queries"], 2)
        self.assertEqual(report["no_candidates"], 0)
        self.assertTrue(all(not p["access_verified"] for p in report["probes"]))
        self.assertIn("off_road_connector_unverified", report["probes"][1]["risks"])
        self.assertIn("grade_barrier_or_crossing_unverified", report["probes"][1]["risks"])

    def test_controlled_access_road_is_reported(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100,
                   highway="motorway")
        report = audit_samples(g, [(0.005, 0)], RoadEdgeGridIndex(g), radius_m=150)
        self.assertEqual(report["risk_counts_nearest"]["controlled_access"], 2)

    def test_missing_road_is_explicit(self):
        g = nx.MultiDiGraph()
        g.add_edge(1, 2, geometry=((0, 0), (0.01, 0)), travel_time=100)
        report = audit_samples(g, [(20, 20)], RoadEdgeGridIndex(g), radius_m=10)
        self.assertEqual(report["no_candidates"], 2)
        self.assertEqual(report["probes"][0]["risks"], ["no_road_candidate"])


if __name__ == "__main__":
    unittest.main()
