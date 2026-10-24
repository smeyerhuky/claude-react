"""Synthetic correctness checks; do not imply complete Colorado coverage."""
import unittest
import networkx as nx
from colorado_metro_winners import allocate_thresholds, snap_candidates


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
