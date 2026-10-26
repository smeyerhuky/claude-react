"""Synthetic tests for non-certifying, land-mask-required geographic raster diagnostics."""
import unittest

import networkx as nx

from colorado_routed_raster_diagnostics import (
    SegmentGridIndex, edge_routed_options, sample_road_point, sample_masked_grid,
)
from stream_osm_roads import meters


class RoutedRasterTests(unittest.TestCase):
    def setUp(self):
        self.g = nx.MultiDiGraph()
        self.g.add_node(1, x=0.0, y=0.0)
        self.g.add_node(2, x=0.01, y=0.0)
        self.shape = ((0.0, 0.0), (0.01, 0.0))
        self.length = meters(*self.shape)
        self.g.add_edge(1, 2, length=self.length, travel_time=10,
                        geometry=self.shape)
        self.winners = {
            "1": {"cbsa": "A", "cost": 0},
            "2": {"cbsa": "B", "cost": 0},
        }

    def reverse(self):
        self.g.add_edge(2, 1, length=self.length, travel_time=10,
                        geometry=tuple(reversed(self.shape)))

    def test_directional_routed_interior_forbids_unmarked_reverse(self):
        idx = SegmentGridIndex(self.g)
        for lon in (0.0025, 0.0075):
            result = sample_road_point(idx, lon, 0, "length", self.winners)
            self.assertEqual(result["cbsa"], "B")
            self.assertFalse(result["access_certified"])
            self.assertFalse(result["release_eligible"])

    def test_reverse_centerline_changes_winner_at_different_fractions(self):
        self.reverse()
        idx = SegmentGridIndex(self.g)
        self.assertEqual(sample_road_point(idx, 0.0025, 0, "length",
                                            self.winners)["cbsa"], "A")
        self.assertEqual(sample_road_point(idx, 0.0075, 0, "length",
                                            self.winners)["cbsa"], "B")
        middle = sample_road_point(idx, 0.005, 0, "length", self.winners)
        self.assertEqual(middle["reason"], "ambiguous_winner")
        self.assertIsNone(middle["cbsa"])

    def test_curved_road_segments_are_indexed_even_when_endpoints_far(self):
        self.g[1][2][0]["geometry"] = ((0.0, 0.0), (0.005, 0.01), (0.01, 0.0))
        self.g[1][2][0]["length"] = (
            meters((0.0, 0.0), (0.005, 0.01)) +
            meters((0.005, 0.01), (0.01, 0.0)))
        idx = SegmentGridIndex(self.g, cell_deg=0.001)
        self.assertEqual(idx.candidates(0.005, 0.01), [(1, 2, 0)])
        result = sample_road_point(idx, 0.005, 0.01, "length", self.winners)
        self.assertEqual(result["cbsa"], "B")

    def test_centerline_crossing_is_transparent_even_if_both_routable(self):
        self.g.add_node(3, x=0.005, y=-0.005)
        self.g.add_node(4, x=0.005, y=0.005)
        cross = ((0.005, -0.005), (0.005, 0.005))
        self.g.add_edge(3, 4, length=meters(*cross),
                        travel_time=10, geometry=cross)
        idx = SegmentGridIndex(self.g)
        result = sample_road_point(idx, 0.005, 0, "length", self.winners)
        self.assertIsNone(result["cbsa"])
        self.assertEqual(result["reason"], "ambiguous_centerlines")

    def test_unreachable_and_offroad_are_not_filled(self):
        idx = SegmentGridIndex(self.g)
        self.assertEqual(sample_road_point(idx, 0.005, 0.01,
                                           "length", self.winners)["reason"],
                         "no_nearby_road")
        no_winners = {}
        unreachable = sample_road_point(idx, 0.005, 0, "length", no_winners)
        self.assertEqual(unreachable["reason"], "unreachable")
        self.assertIsNone(unreachable["cbsa"])

    def test_masked_grid_transparent_offland_and_requires_real_mask(self):
        self.reverse()
        idx = SegmentGridIndex(self.g)
        bounds = (0.0, -0.0001, 0.01, 0.0001)
        mask = [[True, False, True, True], [False, True, True, False]]
        output = sample_masked_grid(idx, self.winners, "length",
                                    bounds, mask, 4, 2, max_gap_m=30)
        self.assertFalse(output["release_eligible"])
        self.assertFalse(output["access_certified"])
        self.assertFalse(output["extract_coverage_certified"])
        self.assertEqual(output["reasons"]["off_land"], 3)
        self.assertEqual(output["cbsa_grid"][0][0], "A")
        self.assertIsNone(output["cbsa_grid"][0][1])
        self.assertEqual(output["cbsa_grid"][0][3], "B")
        with self.assertRaisesRegex(ValueError, "land mask required"):
            sample_masked_grid(idx, self.winners, "length",
                               bounds, None, 4, 2)
        with self.assertRaisesRegex(ValueError, "land mask required"):
            sample_masked_grid(idx, self.winners, "length",
                               bounds, [[1]*4]*2, 4, 2)

    def test_bad_geometry_and_index_limits_fail_closed(self):
        self.g.add_edge(2, 1, length=self.length, travel_time=10)
        with self.assertRaisesRegex(ValueError, "geometry missing"):
            SegmentGridIndex(self.g)
        self.g.remove_edge(2, 1, 0)
        with self.assertRaisesRegex(ValueError, "posting safety limit"):
            SegmentGridIndex(self.g, max_postings=1)
        with self.assertRaisesRegex(ValueError, "segment cell"):
            SegmentGridIndex(self.g, cell_deg=0.00001, max_segment_cells=5)

    def test_bad_route_inputs_fail_closed(self):
        idx = SegmentGridIndex(self.g)
        with self.assertRaisesRegex(ValueError, "metric"):
            sample_road_point(idx, 0.005, 0, "walking", self.winners)
        with self.assertRaisesRegex(ValueError, "radius"):
            idx.candidates(0.005, 0, radius_m=-1)
        with self.assertRaisesRegex(ValueError, "Malformed"):
            sample_road_point(idx, 0.005, 0, "length",
                              {"2": {"cbsa": "B", "cost": -1}})
        with self.assertRaisesRegex(ValueError, "grid dimensions"):
            sample_masked_grid(idx, self.winners, "length",
                               (0, 0, 1, 1), [[True]*1000]*1000,
                               1000, 1000)


if __name__ == "__main__":
    unittest.main()
