import unittest
from benchmark_road_snapping import run


class RoadSnapBenchmarkTests(unittest.TestCase):
    def test_small_grid_parity(self):
        report = run(side=6, queries=5, seed=11)
        self.assertTrue(report["parity"])
        self.assertEqual(report["graph_edges"], 60)
        self.assertEqual(report["queries"], 5)
        self.assertGreaterEqual(report["median_candidates_per_query"], 0)


if __name__ == "__main__":
    unittest.main()
