"""Synthetic mask tests; shapes are invented and NOT audited Colorado data."""
import hashlib
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import networkx as nx

from colorado_geographic_mask import build_explicit_land_water_mask, main
from colorado_routed_raster_diagnostics import SegmentGridIndex, sample_masked_grid
from stream_osm_roads import meters


def square(west, south, east, north):
    return [[west, south], [east, south], [east, north],
            [west, north], [west, south]]


def polygon(shell, holes=None):
    return {"type": "Polygon", "coordinates": [shell] + (holes or [])}


class ExplicitGeographyMaskTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = Path(temp.name)
        self.land = self.path / "land.geojson"
        self.water = self.path / "water.geojson"
        self.land.write_text(json.dumps(polygon(square(0, 0, 1, 1))))
        self.water.write_text(json.dumps(polygon(square(.4, .4, .6, .6))))

    def build(self, **kwargs):
        return build_explicit_land_water_mask(
            kwargs.pop("land", self.land), kwargs.pop("water", self.water),
            kwargs.pop("bounds", (0, 0, 1, 1)),
            kwargs.pop("width", 5), kwargs.pop("height", 5), **kwargs)

    def test_explicit_water_center_is_not_assigned_to_land(self):
        result = self.build()
        self.assertEqual(result["pixel_counts"],
                         {"land_nonwater": 24,
                          "water_excluded": 1,
                          "outside_supplied_land": 0})
        self.assertFalse(result["land_mask"][2][2])
        self.assertTrue(result["land_mask"][0][0])
        self.assertFalse(result["release_eligible"])
        self.assertFalse(result["input_completeness_certified"])
        self.assertEqual(result["land_geojson_sha256"],
                         hashlib.sha256(self.land.read_bytes()).hexdigest())

    def test_source_polygon_holes_and_off_state_are_transparent(self):
        self.land.write_text(json.dumps(polygon(
            square(0, 0, .7, 1), [square(.4, .4, .6, .6)])))
        result = self.build()
        self.assertFalse(result["land_mask"][2][2])
        self.assertFalse(result["land_mask"][0][4])
        self.assertEqual(result["pixel_counts"]["outside_supplied_land"], 11)
        self.assertTrue(result["land_mask"][0][0])

    def test_feature_collection_union_preserves_water_exclusion(self):
        self.land.write_text(json.dumps(
            {"type": "FeatureCollection", "features": [
                {"type": "Feature", "properties": {},
                 "geometry": polygon(square(0, 0, .5, 1))},
                {"type": "Feature", "properties": {},
                 "geometry": polygon(square(.5, 0, 1, 1))}]}))
        result = self.build()
        self.assertEqual(result["pixel_counts"]["water_excluded"], 1)
        self.assertEqual(result["polygon_features"]["land"], 2)

    def test_missing_water_or_malformed_geom_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "Separate land and water"):
            self.build(water=None)
        self.water.write_text(json.dumps({"type": "FeatureCollection",
                                          "features": []}))
        with self.assertRaisesRegex(ValueError, "no polygon"):
            self.build()
        self.water.write_text(json.dumps(polygon(square(.4, .4, .6, .6))))
        self.land.write_text(json.dumps({"type": "Point", "coordinates": [0, 0]}))
        with self.assertRaisesRegex(ValueError, "only polygon"):
            self.build()
        self.land.write_text(json.dumps(polygon(
            [[0, 0], [1, 1], [0, 1], [1, 0], [0, 0]])))
        with self.assertRaisesRegex(ValueError, "invalid polygon"):
            self.build()

    def test_deprecated_crs_and_unsafe_pixel_bounds_fail(self):
        data = json.loads(self.land.read_text())
        data["crs"] = {"type": "name", "properties": {"name": "EPSG:3857"}}
        self.land.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, "WGS84"):
            self.build()
        self.land.write_text(json.dumps(polygon(square(0, 0, 1, 1))))
        with self.assertRaisesRegex(ValueError, "resolution"):
            self.build(width=1000, height=1000)
        with self.assertRaisesRegex(ValueError, "bounds"):
            self.build(bounds=(1, 0, 0, 1))

    def test_mask_connects_to_existing_route_sampler_without_water_fallback(self):
        graph = nx.MultiDiGraph()
        graph.add_node(1, x=.1, y=.5)
        graph.add_node(2, x=.9, y=.5)
        shape = ((.1, .5), (.9, .5))
        length = meters(*shape)
        graph.add_edge(1, 2, geometry=shape, length=length,
                       travel_time=100)
        index = SegmentGridIndex(graph)
        winners = {"2": {"cbsa": "B", "cost": 0}}
        mask = self.build()["land_mask"]
        output = sample_masked_grid(
            index, winners, "length", (0, 0, 1, 1), mask,
            width=5, height=5, max_gap_m=30)
        self.assertIsNone(output["cbsa_grid"][2][2])
        self.assertEqual(output["reasons"]["off_land"], 1)
        self.assertEqual(output["cbsa_grid"][2][0], "B")
        self.assertEqual(output["cbsa_grid"][2][4], "B")
        self.assertFalse(output["release_eligible"])

    def test_cli_writes_mask_and_warns_against_certification(self):
        output = self.path / "mask.json"
        args = ["colorado_geographic_mask.py", "--land-geojson", str(self.land),
                "--water-geojson", str(self.water), "--bounds", "0", "0", "1", "1",
                "--width", "5", "--height", "5", "--output", str(output)]
        with patch.object(sys, "argv", args):
            main()
        payload = json.loads(output.read_text())
        self.assertEqual(payload["pixel_counts"]["water_excluded"], 1)
        self.assertFalse(payload["release_eligible"])


if __name__ == "__main__":
    unittest.main()
