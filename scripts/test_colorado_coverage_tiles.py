"""Synthetic regression tests for experimental Colorado road-proximity tiles."""
import json
import tempfile
import unittest
from pathlib import Path

import networkx as nx
from PIL import Image

from colorado_coverage_tiles import sample_grid, write_tiles, land_pixel_mask


class CoverageTileTests(unittest.TestCase):
    def test_proximity_and_unreachable_remain_transparent(self):
        graph = nx.DiGraph()
        graph.add_node(1, x=0.0, y=0.0)
        graph.add_node(2, x=0.02, y=0.0)
        bounds = (-0.005, -0.005, 0.025, 0.005)
        grid = sample_grid(graph, {"1": {"cbsa": "A"}}, bounds, 3, 1, max_gap_m=700)
        self.assertEqual(grid, [["A", None, None]])
        with self.assertRaises(ValueError):
            sample_grid(graph, {}, bounds, 0, 1)

    def test_land_polygon_holes_and_no_data_classes(self):
        graph = nx.DiGraph()
        graph.add_node(1, x=0.0, y=0.0)
        graph.add_node(2, x=4.0, y=4.0)
        results = {"100": {"sources": [{"cbsa": "A"}],
                   "distance": {"winners": {"1": {"cbsa": "A"}}},
                   "time": {"winners": {"1": {"cbsa": "A"}}}}}
        # Outer square and interior hole; grid bounds come from road nodes.
        geometry = {"type": "Polygon", "coordinates": [
            [[0,0],[4,0],[4,4],[0,4],[0,0]],
            [[1,1],[3,1],[3,3],[1,3],[1,1]]]}
        with tempfile.TemporaryDirectory() as d:
            maskfile = Path(d) / "land.geojson"
            maskfile.write_text(json.dumps(geometry))
            mask = land_pixel_mask(maskfile, [0,0,4,4], 4)
            self.assertFalse(bool(mask[1,1]))
            self.assertTrue(bool(mask[0,0]))
            manifest = write_tiles(graph, results, Path(d) / "tiles",
                                   pixels=4, tile_size=2, max_gap_m=100,
                                   land_geojson=maskfile)
            stats = manifest["datasets"]["100-distance"]
            self.assertEqual(stats["covered_pixels"], 0)
            self.assertEqual(stats["off_land_pixels"], 4)
            self.assertEqual(stats["unassigned_land_pixels"], 12)

    def test_tiles_stitch_on_global_pixel_grid(self):
        graph = nx.DiGraph()
        graph.add_node(1, x=0.005, y=0.005)
        graph.add_node(2, x=0.015, y=0.015)
        results = {"100": {"sources": [{"cbsa": "A"}, {"cbsa": "B"}],
                  "distance": {"winners": {"1": {"cbsa": "A"}, "2": {"cbsa": "B"}}},
                  "time": {"winners": {"1": {"cbsa": "B"}, "2": {"cbsa": "A"}}}}}
        with tempfile.TemporaryDirectory() as d:
            manifest = write_tiles(graph, results, d, pixels=8, tile_size=4,
                                   max_gap_m=4000)
            self.assertEqual(len(manifest["datasets"]["100-distance"]["tiles"]), 4)
            tiles = [Image.open(Path(d) / name).convert("RGBA")
                     for name in manifest["datasets"]["100-distance"]["tiles"]]
            stitched = Image.new("RGBA", (8, 8))
            for i, tile in enumerate(tiles):
                stitched.paste(tile, ((i % 2) * 4, (i // 2) * 4))
            self.assertEqual(stitched.getpixel((0, 0))[3], 255)
            self.assertNotEqual(stitched.getpixel((0, 0)), stitched.getpixel((7, 7)))
            saved = json.loads((Path(d) / "tiles-manifest.json").read_text())
            self.assertEqual(saved["datasets"]["100-distance"]["covered_pixels"], 64)
            self.assertEqual(saved["index_0"], "transparent no-data")


if __name__ == "__main__":
    unittest.main()
