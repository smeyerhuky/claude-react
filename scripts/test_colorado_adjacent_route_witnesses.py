import unittest
from unittest.mock import patch

from colorado_adjacent_route_witnesses import CorridorWays, build_graph, compare_routes, path_witness

TAGS = {"highway": "primary", "oneway": "yes"}
POINTS = [(1, 0., 0.), (2, 0., 1.), (3, 1., 0.)]


class AdjacentRouteTests(unittest.TestCase):
    def graphs(self):
        c = CorridorWays((-2, -2, 3, 3))
        c.add(10, TAGS, POINTS)
        c.add(20, TAGS, [POINTS[-1], (4, 2., 0.)])
        baseline = build_graph(c.rows)
        c.add(30, TAGS, [POINTS[0], POINTS[-1]])
        return baseline, build_graph(c.rows)

    def test_both_metrics_compare_directed_paths_and_replay_added_way(self):
        baseline, expanded = self.graphs()
        r = compare_routes(baseline, expanded, [1, 3], {10, 20})
        self.assertEqual(r["changed_route_cases"], 2)
        self.assertEqual(r["independent_directed_labels_checked"], 16)
        self.assertEqual({w["metric"] for w in r["path_witnesses"]}, {"length", "travel_time"})
        for w in r["path_witnesses"]:
            self.assertEqual(w["node_path"], [1, 3])
            self.assertEqual(w["added_osm_way_ids"], [30])
            self.assertAlmostEqual(w["cost"], w["independently_replayed_geometry_cost"])
        for row in r["comparisons"]:
            if row["origin"] == 3:
                self.assertIsNone(row["baseline_cost"])
                self.assertIsNone(row["union_cost"])
        self.assertFalse(r["qualifying_metro_competition_tested"])
        self.assertFalse(r["release_eligible"])

    def test_whole_way_selection_never_clips_or_invents_boundary_chord(self):
        c = CorridorWays((-.1, -.1, .1, .1))
        c.add(10, TAGS, [(1, -1., 0.), (2, 1., 0.)])
        self.assertEqual(c.rows[10][1], ((1, -1., 0.), (2, 1., 0.)))
        c.add(11, TAGS, [(3, 5., 5.), (4, 6., 6.)])
        self.assertNotIn(11, c.rows)
        c.add(10, TAGS, [(1, -1., 0.), (2, 1., 0.)])
        with self.assertRaisesRegex(ValueError, "disagrees"):
            c.add(10, {**TAGS, "oneway": "no"}, [(1, -1., 0.), (2, 1., 0.)])

    def test_lost_baseline_arcs_or_missing_probes_fail(self):
        baseline, expanded = self.graphs()
        with self.assertRaisesRegex(ValueError, "probes"):
            compare_routes(baseline, expanded, [1, 999], {10, 20})
        expanded.remove_edge(3, 4)
        with self.assertRaisesRegex(ValueError, "lost"):
            compare_routes(baseline, expanded, [1, 3], {10, 20})

    def test_oracle_disagreement_and_corrupt_directed_geometry_fail(self):
        baseline, expanded = self.graphs()
        with patch("colorado_adjacent_route_witnesses.assign", return_value={}):
            with self.assertRaisesRegex(ValueError, "oracle"):
                compare_routes(baseline, expanded, [1, 3], {10, 20})
        edge = min(expanded[1][3].values(), key=lambda d: d["length"])
        edge["osm_node_ids"] = (3, 1)
        with self.assertRaisesRegex(ValueError, "reverses"):
            path_witness(expanded, 1, 3, "length", {10, 20})

    def test_explicit_way_and_node_budgets_fail_closed(self):
        c = CorridorWays((-2,-2,3,3), max_ways=1)
        c.add(10,TAGS,POINTS)
        with self.assertRaisesRegex(ValueError,"memory limit"):
            c.add(20,TAGS,[POINTS[-1],(4,2.,0.)])
        with self.assertRaisesRegex(RuntimeError,"exceeded"):
            build_graph(c.rows,max_nodes=1)
        for value in (0, True, 500001):
            with self.assertRaises(ValueError):
                CorridorWays(max_ways=value)
        with self.assertRaises(ValueError):
            build_graph(c.rows,max_nodes=1500001)

    def test_invalid_or_empty_corridor_fails(self):
        with self.assertRaises(ValueError):
            CorridorWays((0, 1, 0, 2))
        with self.assertRaises(ValueError):
            build_graph({})


if __name__ == "__main__":
    unittest.main()
