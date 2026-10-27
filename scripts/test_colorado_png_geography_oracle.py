import json
import tempfile
import unittest
from pathlib import Path

from PIL import Image
from shapely.geometry import box, mapping

from colorado_geographic_mask import build_explicit_land_water_mask
from colorado_png_geography_oracle import verify_png_footprints


class GeographyOracleTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.base = Path(temp.name)
        self.png = self.base / "sample.png"

    def image(self, position=None, size=(5, 5)):
        image = Image.new("RGBA", size, (0, 0, 0, 0))
        if position is not None:
            image.putpixel(position, (255, 10, 20, 255))
        image.save(self.png)

    def test_catches_narrow_water_missed_by_center_sampling(self):
        self.image((0, 2))  # center .1,.5 is dry, but the footprint intersects.
        with self.assertRaisesRegex(ValueError, "Painted pixel"):
            verify_png_footprints(self.png, box(0, 0, 1, 1), box(.19, 0, .21, 1), (0, 0, 1, 1))

    def test_catches_corner_water_and_partial_land(self):
        self.image((0, 0), (2, 2))
        with self.assertRaisesRegex(ValueError, "Painted pixel"):
            verify_png_footprints(self.png, box(0, 0, 1, 1), box(.5, .5, .6, .6), (0, 0, 1, 1))
        self.image((3, 2))
        with self.assertRaisesRegex(ValueError, "Painted pixel"):
            verify_png_footprints(self.png, box(0, 0, .75, 1), box(.1, .1, .2, .2), (0, 0, 1, 1))

    def test_separate_geometry_algorithms_agree_on_masks(self):
        for bounds in ((0, 0, 1, 1), (-105.060, 39.732, -105.020, 39.762)):
            west, south, east, north = bounds
            land = box(west, south, east-(east-west)*.13, north)
            water = box(west+(east-west)*.4, south+(north-south)*.4,
                        west+(east-west)*.6, south+(north-south)*.6)
            for name, geom in (("land", land), ("water", water)):
                (self.base / (name+".geojson")).write_text(json.dumps(mapping(geom)))
            result = build_explicit_land_water_mask(self.base/"land.geojson", self.base/"water.geojson", bounds, 5, 7)
            image = Image.new("RGBA", (5, 7), (0, 0, 0, 0))
            for y, row in enumerate(result["land_mask"]):
                for x, supported in enumerate(row):
                    if supported:
                        image.putpixel((x, y), (10, 20, 30, 255))
            image.save(self.png)
            oracle = verify_png_footprints(self.png, land, water, bounds)
            self.assertEqual(oracle["geography_pixel_counts"], result["pixel_counts"])
            self.assertGreater(oracle["routed_pixels"], 0)
            self.assertFalse(oracle["land_water_completeness_certified"])


if __name__ == "__main__":
    unittest.main()
