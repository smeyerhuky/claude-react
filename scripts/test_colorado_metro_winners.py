"""Synthetic correctness checks; do not imply complete Colorado coverage."""
import unittest
import networkx as nx
from colorado_metro_winners import allocate_thresholds, snap_candidates, winner_change_report, boundary_proximity


class AllocatorTests(unittest.TestCase):
    def test_external_bbox_center_wins(self):
        g = nx.MultiDiGraph()
        g.add_node("point", x=0, y=0)
        g.add_node("external", x=.01, y=0)
        g.add_node("internal", x=-.02, y=0)
        g.add_edge("point", "external", length=2, travel_time=3)
        g.add_edge("point", "internal", length=12, travel_time=20)
        metros = [
            {"cbsa": "E", "name": "Outside", "population": 300000, "lon": .0105, "lat": 0},
            {"cbsa": "I", "name": "Inside", "population": 350000, "lon": -.02, "lat": 0}]
        sources, rejected = snap_candidates(g, metros, 500)
        self.assertEqual(len(sources), 2)
        self.assertFalse(rejected)
        out = allocate_thresholds(g, sources, [100000, 250000])
        for threshold in ("100000", "250000"):
            for metric in ("distance", "time"):
                self.assertEqual(out[threshold][metric]["winners"]["point"]["cbsa"], "E")

    def test_threshold_metric_and_disconnected(self):
        g = nx.MultiDiGraph()
        g.add_edge("point", "small", length=2, travel_time=20)
        g.add_edge("point", "large", length=8, travel_time=3)
        g.add_node("island")
        sources = [{"cbsa": "S", "name": "Small", "population": 120000,
                    "node": "small", "snap_m": 0},
                   {"cbsa": "L", "name": "Large", "population": 350000,
                    "node": "large", "snap_m": 0}]
        out = allocate_thresholds(g, sources, [100000, 250000])
        self.assertEqual(out["100000"]["distance"]["winners"]["point"]["cbsa"], "S")
        self.assertEqual(out["100000"]["time"]["winners"]["point"]["cbsa"], "L")
        self.assertEqual(out["250000"]["distance"]["winners"]["point"]["cbsa"], "L")
        self.assertEqual(out["100000"]["distance"]["unreachable_nodes"], 1)
        self.assertNotIn("island", out["100000"]["time"]["winners"])

    def test_real_threshold_difference_is_required(self):
        g = nx.MultiDiGraph()
        g.add_edge("point", "boulder", length=2, travel_time=2)
        g.add_edge("point", "denver", length=10, travel_time=10)
        sources = [
            {"cbsa": "14500", "name": "Boulder", "population": 328560,
             "node": "boulder", "snap_m": 0},
            {"cbsa": "19740", "name": "Denver", "population": 3092037,
             "node": "denver", "snap_m": 0},
        ]
        output = allocate_thresholds(g, sources, [100000, 400000])
        report = winner_change_report(output, 100000, 400000)
        self.assertEqual(report["distance"]["changed_winner_nodes"], 1)
        self.assertEqual(report["time"]["changed_winner_nodes"], 1)
        self.assertEqual(output["400000"]["distance"]["winners"]["point"]["cbsa"], "19740")

    def test_release_allocation_rejects_unverified_snaps(self):
        g = nx.MultiDiGraph()
        g.add_edge("origin", "metro", length=4, travel_time=7)
        source = {"cbsa": "19740", "name": "Denver", "population": 300000,
                  "node": "metro", "snap_m": 0}
        # Diagnostic nearest-node snaps remain useful for research only.
        research = allocate_thresholds(g, [source], [100000])
        self.assertEqual(research["100000"]["distance"]["winners"]["origin"]["cbsa"], "19740")
        with self.assertRaisesRegex(ValueError, "Unverified metro road access"):
            allocate_thresholds(g, [source], [100000], require_verified_access=True)
        verified = {**source, "access_verified": True}
        release = allocate_thresholds(g, [verified], [100000],
                                      require_verified_access=True)
        self.assertEqual(release["100000"]["time"]["winners"]["origin"]["cbsa"], "19740")

    def test_release_allocation_rejects_mixed_verification(self):
        g = nx.MultiDiGraph()
        g.add_edge("origin", "a", length=1, travel_time=1)
        g.add_edge("origin", "b", length=2, travel_time=2)
        sources = [
            {"cbsa": "A", "name": "A", "population": 300000,
             "node": "a", "snap_m": 0, "access_verified": True},
            {"cbsa": "B", "name": "B", "population": 300000,
             "node": "b", "snap_m": 0},
        ]
        with self.assertRaisesRegex(ValueError, "B"):
            allocate_thresholds(g, sources, [100000], require_verified_access=True)

    def test_boundary_proximity_is_only_a_diagnostic(self):
        g = nx.MultiDiGraph()
        g.add_node(1, x=-105.1, y=39.5)
        g.add_node(2, x=-105.099, y=39.5)
        report = boundary_proximity(g, radius_m=1000)
        self.assertEqual(report["near_edge_nodes"], 2)
        self.assertIn("bbox", report["interpretation"])

    def test_direction_and_rejected_external_candidate(self):
        g = nx.MultiDiGraph()
        g.add_edge("metro", "point", length=1, travel_time=1)
        source = [{"cbsa": "M", "name": "M", "population": 300000,
                   "node": "metro", "snap_m": 0}]
        out = allocate_thresholds(g, source, [250000])
        self.assertNotIn("point", out["250000"]["distance"]["winners"])
        g.nodes["metro"].update(x=0, y=0)
        g.nodes["point"].update(x=0, y=.01)
        selected, rejected = snap_candidates(g, [{"cbsa": "F", "name": "Far",
            "population": 300000, "lon": 12, "lat": 12}], 100)
        self.assertFalse(selected)
        self.assertEqual(rejected[0]["cbsa"], "F")


if __name__ == "__main__":
    unittest.main()
