"""Synthetic-only; geographic candidates and access are NOT certified."""
import unittest

import networkx as nx

from colorado_geographic_point_diagnostics import (
    diagnose_geographic_point, diagnose_full_graph_point,
    scan_local_road_candidates, edge_origin_oracle, project_polyline,
)
from stream_osm_roads import meters


class GeographicPointDiagnosticTests(unittest.TestCase):
    def setUp(self):
        self.g = nx.MultiDiGraph()
        self.g.add_node(1, x=0.0, y=0.0)
        self.g.add_node(2, x=0.01, y=0.0)
        self.geometry = ((0.0, 0.0), (0.01, 0.0))
        self.length = meters(*self.geometry)
        self.g.add_edge(1, 2, length=self.length, travel_time=10,
                        geometry=self.geometry)
        self.edge = (1, 2, 0)
        self.sources = [{"node": "1", "cbsa": "A"},
                        {"node": "2", "cbsa": "B"}]

    def add_reverse(self, geometry=None, travel_time=10):
        shape = geometry or tuple(reversed(self.geometry))
        self.g.add_edge(2, 1, length=sum(meters(a, b)
            for a, b in zip(shape, shape[1:])), travel_time=travel_time,
            geometry=shape)

    def diagnose(self, lon, lat, candidates=None, **kwargs):
        return diagnose_geographic_point(self.g, lon, lat,
            candidates if candidates is not None else [self.edge],
            self.sources, "length", **kwargs)

    def test_polyline_projection_uses_geometry_not_endpoint_chord(self):
        shape = ((0.0, 0.0), (0.0, 0.01), (0.01, 0.01))
        output = project_polyline(shape, 0.0001, 0.005)
        self.assertAlmostEqual(output["fraction"], 0.25, places=2)
        self.assertLess(output["gap_m"], 12)
        self.assertAlmostEqual(output["snapped_lon"], 0.0, places=6)

    def test_one_way_interior_point_cannot_travel_backward(self):
        result = self.diagnose(0.0025, 0)
        self.assertEqual(result["status"], "diagnostic-only")
        self.assertFalse(result["access_certified"])
        self.assertEqual(result["winners"], ["B"])
        self.assertAlmostEqual(result["cost"], self.length * 0.75, places=3)

    def test_bidirectional_segment_changes_winner_with_position(self):
        self.add_reverse()
        for lon, cbsa in ((0.0025, "A"), (0.0075, "B")):
            result = self.diagnose(lon, 0, [self.edge, (2, 1, 0)])
            self.assertEqual(result["reason"], "candidate_routed")
            self.assertEqual(result["winners"], [cbsa])
        self.assertEqual(self.diagnose(0.005, 0, [self.edge, (2, 1, 0)])["winners"],
                         ["A", "B"])

    def test_nearby_but_distinct_reverse_geometry_does_not_grant_return(self):
        self.add_reverse(geometry=((0.01, 0.0), (0.005, 0.001), (0.0, 0.0)))
        routed = edge_origin_oracle(self.g, self.edge, self.sources, "length", 0.25)
        self.assertEqual(routed["winners"], ["B"])

    def test_reverse_travel_time_cost_can_differ(self):
        self.add_reverse(travel_time=30)
        left = edge_origin_oracle(self.g, self.edge, self.sources, "travel_time", 0.25)
        right = edge_origin_oracle(self.g, self.edge, self.sources, "travel_time", 0.75)
        self.assertEqual(left["winners"], ["A", "B"])
        self.assertEqual(right["winners"], ["B"])

    def test_crossing_centerlines_are_ambiguous_not_filled(self):
        self.g.add_node(3, x=0.005, y=-0.005)
        self.g.add_node(4, x=0.005, y=0.005)
        crossing = ((0.005, -0.005), (0.005, 0.005))
        self.g.add_edge(3, 4, length=meters(*crossing),
                        travel_time=12, geometry=crossing)
        result = self.diagnose(0.005, 0.0, [self.edge, (3, 4, 0)])
        self.assertEqual(result["reason"], "ambiguous_centerlines")
        self.assertEqual(result["winners"], [])

    def test_offroad_and_disconnected_fail_closed(self):
        self.assertEqual(self.diagnose(0.005, 0.01)["reason"], "no_nearby_road")
        result = diagnose_geographic_point(self.g, 0.005, 0, [self.edge],
                  [{"node": "9", "cbsa": "X"}], "length")
        self.assertEqual(result["reason"], "unreachable")
        self.assertEqual(result["winners"], [])

    def test_inconsistent_edge_geometry_rejected(self):
        self.g[1][2][0]["length"] = 2
        with self.assertRaisesRegex(ValueError, "conflicts"):
            self.diagnose(0.005, 0)

    def test_exhaustive_graph_scan_finds_non_vertex_road_position(self):
        result = diagnose_full_graph_point(self.g, 0.005, 0,
            self.sources, "length", max_gap_m=20)
        self.assertEqual(result["winners"], ["B"])
        self.assertEqual(result["graph_edges_scanned"], 1)
        self.assertEqual(result["road_candidates"],
                         "exhaustive_within_loaded_graph")
        self.assertFalse(result["extract_coverage_certified"])
        self.assertFalse(result["access_certified"])

    def test_exhaustive_scan_includes_segment_when_endpoints_are_far(self):
        # Both endpoints fall outside a 20m envelope around the test point,
        # but the full road polyline passes directly through that envelope.
        found, scanned = scan_local_road_candidates(self.g, 0.005, 0, 20)
        self.assertEqual(scanned, 1)
        self.assertEqual(found, [self.edge])

    def test_exhaustive_scan_does_not_skip_unmodeled_road_geometry(self):
        self.g.add_edge(2, 1, length=self.length, travel_time=10)
        with self.assertRaisesRegex(ValueError, "road geometry missing"):
            diagnose_full_graph_point(self.g, 0.005, 0,
                                      self.sources, "length")

    def test_exhaustive_scan_limit_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "scan limit"):
            diagnose_full_graph_point(self.g, 0.005, 0,
                self.sources, "length", max_scan_edges=0)
        # The missing-geometry case above covers incomplete graph data;
        # exceed the scan cap using two fully modeled edges.
        self.add_reverse()
        with self.assertRaisesRegex(ValueError, "safety limit"):
            diagnose_full_graph_point(self.g, 0.005, 0,
                self.sources, "length", max_scan_edges=1)

    def test_exhaustive_scan_reports_no_road_without_fallback(self):
        result = diagnose_full_graph_point(self.g, 0.005, 0.01,
                        self.sources, "length", max_gap_m=20)
        self.assertEqual(result["reason"], "no_nearby_road")
        self.assertEqual(result["winners"], [])

    def test_invalid_values_and_candidates_rejected(self):
        with self.assertRaisesRegex(ValueError, "Non-finite"):
            self.diagnose(float("nan"), 0)
        with self.assertRaisesRegex(ValueError, "Missing or unbounded"):
            self.diagnose(0.005, 0, [])
        with self.assertRaisesRegex(ValueError, "proximity"):
            self.diagnose(0.005, 0, max_gap_m=-1)
        with self.assertRaisesRegex(ValueError, "metric"):
            diagnose_geographic_point(self.g, 0.005, 0, [self.edge],
                                       self.sources, "invalid")
        with self.assertRaisesRegex(ValueError, "fraction"):
            edge_origin_oracle(self.g, self.edge, self.sources,
                               "length", float("inf"))


if __name__ == "__main__":
    unittest.main()
