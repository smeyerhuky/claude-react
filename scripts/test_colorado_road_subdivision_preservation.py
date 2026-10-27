from types import SimpleNamespace as NS
import unittest

from colorado_road_subdivision_preservation import baseline_snapshot, verify_expansion
from stream_osm_roads import RoadHandler


def graph(keep, way_id=42, tags=None):
    w = NS(id=way_id, tags=tags or {"highway": "residential", "oneway": "yes"},
           nodes=[NS(ref=i, location=NS(lon=-105+i*.001, lat=40., valid=lambda: True)) for i in (1, 2, 3)])
    h = RoadHandler(set(keep))
    h.way(w)
    return h.graph


class SubdivisionTests(unittest.TestCase):
    def test_retained_junction_cannot_be_buried_in_expanded_geometry(self):
        baseline = graph([1, 2, 3])
        expanded = graph([1, 3])
        expanded.add_node(2, x=-104.998, y=40.)
        with self.assertRaisesRegex(ValueError, "bypasses a graph junction"):
            verify_expansion(baseline_snapshot(baseline), expanded)

    def test_shared_interior_node_must_be_an_explicit_junction(self):
        g = graph([1, 3])
        w = NS(id=99, tags={"highway": "residential", "oneway": "yes"},
               nodes=[NS(ref=i, location=NS(lon=-105+i*.001, lat=40., valid=lambda: True)) for i in (4, 2, 5)])
        h = RoadHandler({4, 5})  # Deliberately malformed contraction: 2 hidden.
        h.way(w)
        import networkx as nx
        with self.assertRaisesRegex(ValueError, "shared interior"):
            baseline_snapshot(nx.compose(g, h.graph))

    def test_new_junction_subdivision_preserves_modeled_path(self):
        baseline = graph([1, 3])
        expanded = graph([1, 2, 3])
        self.assertFalse(expanded.has_edge(1, 3))
        r = verify_expansion(baseline_snapshot(baseline), expanded)
        self.assertTrue(r["modeled_baseline_paths_preserved_modulo_subdivision"])
        self.assertEqual(r["baseline_directed_primitive_arcs"], 2)
        self.assertFalse(r["extract_coverage_certified"])
        self.assertFalse(r["release_eligible"])

    def test_missing_reverse_arc_fails(self):
        baseline = graph([1, 3], tags={"highway": "residential", "oneway": "no"})
        with self.assertRaisesRegex(ValueError, "primitive baseline arcs"):
            verify_expansion(baseline_snapshot(baseline), graph([1, 2, 3]))

    def test_same_geometry_different_way_does_not_mask_omission(self):
        with self.assertRaisesRegex(ValueError, "primitive baseline arcs"):
            verify_expansion(baseline_snapshot(graph([1, 3])), graph([1, 2, 3], way_id=99))

    def test_cost_corruption_and_missing_geometry_rejected(self):
        for attr, value in (("length", 1), ("travel_time", 1), ("osm_node_ids", None)):
            g = graph([1, 3])
            g[1][3][0][attr] = value
            with self.assertRaises(ValueError):
                baseline_snapshot(g)

    def test_missing_parallel_arc_multiplicity_rejected(self):
        baseline = graph([1, 3])
        baseline.add_edge(1, 3, **baseline[1][3][0])
        with self.assertRaisesRegex(ValueError, "primitive baseline arcs"):
            verify_expansion(baseline_snapshot(baseline), graph([1, 2, 3]))

    def test_changed_speed_rejected_even_with_consistent_cost(self):
        expanded = graph([1, 2, 3], tags={"highway": "residential", "oneway": "yes", "maxspeed": "60"})
        with self.assertRaisesRegex(ValueError, "primitive baseline arcs"):
            verify_expansion(baseline_snapshot(graph([1, 3])), expanded)

    def test_lost_baseline_junction_rejected(self):
        baseline = graph([1, 2, 3])
        with self.assertRaisesRegex(ValueError, "junction nodes"):
            verify_expansion(baseline_snapshot(baseline), graph([1, 3]))


if __name__ == "__main__":
    unittest.main()
