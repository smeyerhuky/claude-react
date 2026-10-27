"""End-to-end tiny synthetic previews, NOT authoritative Colorado maps."""
import json
import tempfile
import unittest
from pathlib import Path

import networkx as nx
from PIL import Image

from colorado_research_road_preview import (
    geographic_edge_subset, render_research_preview,
)
from stream_osm_roads import meters


def rectangle(w, s, e, n):
    return {"type": "Polygon", "coordinates": [[
        [w, s], [e, s], [e, n], [w, n], [w, s]]]}


class ResearchRoadPreviewTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.folder = Path(temp.name)
        self.land = self.folder / "land.geojson"
        self.water = self.folder / "water.geojson"
        self.out = self.folder / "preview"
        self.land.write_text(json.dumps(rectangle(0, 0, .01, .01)))
        self.water.write_text(json.dumps(rectangle(.004, .004, .006, .006)))
        self.bounds = (0, 0, .01, .01)
        self.graph = nx.MultiDiGraph()
        self.graph.add_node(1, x=.001, y=.005)
        self.graph.add_node(2, x=.009, y=.005)
        line = ((.001, .005), (.009, .005))
        length = meters(*line)
        self.graph.add_edge(1, 2, geometry=line,
                            length=length, travel_time=90)
        self.graph.add_edge(2, 1, geometry=tuple(reversed(line)),
                            length=length, travel_time=90)
        self.sources = [
            {"cbsa": "A", "node": 1, "population": 150000,
             "name": "West", "snap_m": 0},
            {"cbsa": "B", "node": 2, "population": 300000,
             "name": "East", "snap_m": 0},
        ]

    def render(self, **kwargs):
        return render_research_preview(
            self.graph, self.sources,
            kwargs.pop("land", self.land),
            kwargs.pop("water", self.water),
            kwargs.pop("bounds", self.bounds),
            kwargs.pop("threshold", 100000),
            kwargs.pop("pixels", 5),
            kwargs.pop("max_gap_m", 30),
            kwargs.pop("output_dir", self.out),
        )

    def test_masked_time_and_distance_pngs_keep_water_and_offroad_clear(self):
        result = self.render()
        self.assertFalse(result["release_eligible"])
        self.assertFalse(result["access_certified"])
        self.assertFalse(result["extract_coverage_certified"])
        self.assertFalse(result["land_water_completeness_certified"])
        self.assertEqual(result["source_cbsa_count"], 2)
        self.assertEqual(result["source_cbsa_ids"], ["A", "B"])
        self.assertEqual(result["mask_provenance"]["pixel_counts"]["water_excluded"], 9)
        for metric in ("time", "distance"):
            details = result["layers"][metric]
            png = self.out / details["image"]
            self.assertTrue(png.exists())
            with Image.open(png) as image:
                self.assertEqual(image.size, (5, 5))
                self.assertEqual(image.mode, "RGBA")
                self.assertEqual(image.getpixel((2, 2))[3], 0)
                self.assertEqual(image.getpixel((1, 0))[3], 0)
                self.assertGreater(image.getpixel((0, 2))[3], 0)
                self.assertGreater(image.getpixel((4, 2))[3], 0)
            self.assertIn("off_land", details["reason_counts"])
            self.assertIn("routed_candidate", details["reason_counts"])
            self.assertEqual(details["transparent_pixels"], 23)
        manifest = json.loads((self.out / "preview-manifest.json").read_text())
        self.assertFalse(manifest["release_eligible"])

    def test_population_threshold_changes_eligible_source_and_color(self):
        result = self.render(threshold=200000)
        self.assertEqual(result["source_cbsa_count"], 1)
        self.assertEqual(result["source_cbsa_ids"], ["B"])
        self.assertEqual(sorted(result["layers"]["distance"]["palette_rgba"]), ["B"])

    def test_real_road_geometry_is_needed_even_outside_view(self):
        self.graph.add_edge(2, 1, length=1, travel_time=1)
        with self.assertRaisesRegex(ValueError, "missing road geometry"):
            self.render()

    def test_missing_water_or_unbounded_sample_refuses_to_draw(self):
        with self.assertRaisesRegex(ValueError, "Separate land and water"):
            self.render(water=None)
        with self.assertRaisesRegex(ValueError, "resolution"):
            self.render(pixels=1000)
        with self.assertRaisesRegex(ValueError, "[Tt]hreshold"):
            self.render(threshold=0)

    def test_bounded_viewport_uses_edges_not_only_endpoint_locations(self):
        selected, count = geographic_edge_subset(
            self.graph, (.0045, .0049, .0055, .0051), gap_m=30)
        self.assertEqual(count, 2)
        self.assertEqual(selected.number_of_edges(), 2)
        with self.assertRaisesRegex(ValueError, "preview cap"):
            geographic_edge_subset(
                self.graph, (.0045, .0049, .0055, .0051), max_edges=1)


if __name__ == "__main__":
    unittest.main()
