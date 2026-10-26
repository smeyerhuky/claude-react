"""Synthetic independent directed Dijkstra oracle tests for research road PNGs."""
import json
import tempfile
import unittest
from pathlib import Path

import networkx as nx
from PIL import Image

from colorado_research_road_preview import render_research_preview
from colorado_road_png_dijkstra_oracle import validate_road_png_oracle
from stream_osm_roads import meters


def polygon(w, s, e, n):
    return {"type": "Polygon", "coordinates": [[
        [w, s], [e, s], [e, n], [w, n], [w, s]]]}


class IndependentRoadPixelOracleTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        root = Path(temp.name)
        self.land = root / "land.geojson"
        self.water = root / "water.geojson"
        self.preview = root / "preview"
        self.land.write_text(json.dumps(polygon(0, 0, .01, .01)))
        self.water.write_text(json.dumps(polygon(.004, .004, .006, .006)))
        self.graph = nx.MultiDiGraph()
        self.graph.add_node(1, x=.001, y=.005)
        self.graph.add_node(2, x=.009, y=.005)
        line = ((.001, .005), (.009, .005))
        length = meters(*line)
        self.graph.add_edge(1, 2, geometry=line, length=length,
                            travel_time=100)
        self.graph.add_edge(2, 1, geometry=tuple(reversed(line)),
                            length=length, travel_time=100)
        self.sources = [{"node": 1, "cbsa": "A", "name": "West",
                         "population": 150000, "snap_m": 0},
                        {"node": 2, "cbsa": "B", "name": "East",
                         "population": 300000, "snap_m": 0}]
        render_research_preview(
            self.graph, self.sources, self.land, self.water,
            bounds=(0, 0, .01, .01), threshold=100000,
            pixels=5, max_gap_m=30, output_dir=self.preview)

    def check(self, **kwargs):
        return validate_road_png_oracle(
            self.graph, kwargs.pop("sources", self.sources),
            self.preview, max_samples=kwargs.pop("max_samples", 4))

    def test_independent_directed_dijkstra_matches_both_routed_images(self):
        output = self.check()
        self.assertFalse(output["release_eligible"])
        self.assertFalse(output["access_certified"])
        self.assertFalse(output["external_network_coverage_proven"])
        self.assertGreaterEqual(output["metrics"]["distance"]["sampled_colored_pixels"], 2)
        self.assertEqual(output["metrics"]["time"]["disagreements"], 0)
        samples = output["metrics"]["distance"]["samples"]
        self.assertIn("A", [x["cbsa"] for x in samples])
        self.assertIn("B", [x["cbsa"] for x in samples])

    def test_wrong_cbsa_pixels_fail_even_when_alpha_is_valid(self):
        path = self.preview / "by-road-distance.png"
        with Image.open(path) as image:
            pixels = image.convert("RGBA")
        summary = json.loads((self.preview / "preview-manifest.json").read_text())
        colors = summary["layers"]["distance"]["palette_rgba"]
        a, b = tuple(colors["A"]), tuple(colors["B"])
        swapped = [b if p == a else a if p == b else p for p in pixels.getdata()]
        pixels.putdata(swapped)
        pixels.save(path)
        with self.assertRaisesRegex(ValueError, "oracle disagrees"):
            self.check()

    def test_changed_source_population_inventory_cannot_be_reused(self):
        source = [self.sources[0]]
        with self.assertRaisesRegex(ValueError, "metro sources differ"):
            self.check(sources=source)

    def test_equal_count_but_different_source_identity_is_rejected(self):
        changed = [dict(m) for m in self.sources]
        changed[1]["cbsa"] = "C"
        with self.assertRaisesRegex(ValueError, "metro sources differ"):
            self.check(sources=changed)

    def test_nonresearch_or_incorrect_layer_metric_is_rejected(self):
        path = self.preview / "preview-manifest.json"
        payload = json.loads(path.read_text())
        payload["release_eligible"] = True
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "non-research"):
            self.check()
        payload["release_eligible"] = False
        payload["layers"]["distance"]["weight"] = "travel_time"
        path.write_text(json.dumps(payload))
        with self.assertRaisesRegex(ValueError, "metric mismatch"):
            self.check()

    def test_all_transparent_image_or_unbounded_budget_rejected(self):
        png = self.preview / "by-road-distance.png"
        Image.new("RGBA", (5, 5), (0, 0, 0, 0)).save(png)
        with self.assertRaisesRegex(ValueError, "empty road-region"):
            self.check()
        with self.assertRaisesRegex(ValueError, "sampling budget"):
            self.check(max_samples=100)


if __name__ == "__main__":
    unittest.main()
