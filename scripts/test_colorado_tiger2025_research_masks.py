"""Offline synthetic shapefile fixtures: test source handling, NOT real water truth."""
import hashlib
import io
import json
from pathlib import Path
import tempfile
import unittest
import zipfile

import shapefile
from PIL import Image
from pyproj import CRS

from colorado_tiger2025_research_masks import (
    STATE, COUNTY, _fetch_zip, _shapes_from_zip, build_research_geography,
)


def rect(w, s, e, n):
    # Shapefile outer rings are clockwise.
    return [[w, s], [w, n], [e, n], [e, s], [w, s]]


def archive(root, stem, fields, features):
    prefix = root / stem
    with shapefile.Writer(str(prefix), shapeType=shapefile.POLYGON) as writer:
        for field in fields:
            writer.field(field, "C", 12)
        for attrs, rings in features:
            writer.poly(rings)
            writer.record(*attrs)
    prefix.with_suffix(".prj").write_text(CRS.from_epsg(4269).to_wkt("WKT1_ESRI"))
    output = root / (stem + ".zip")
    with zipfile.ZipFile(output, "w") as z:
        for ext in (".shp", ".shx", ".dbf", ".prj"):
            path = prefix.with_suffix(ext)
            z.write(path, path.name)
            path.unlink()
    return output


class TIGER2025ResearchTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.root = Path(temp.name)
        self.out = self.root / "out"
        archive(self.root, STATE[:-4], ["STATEFP"],
                [(["08"], [rect(-.1, -.1, 1.1, 1.1)]),
                 (["06"], [rect(2, 2, 3, 3)])])
        archive(self.root, COUNTY[:-4], ["STATEFP", "GEOID"], [
            (["08", "08031"], [rect(0, 0, .5, 1)]),
            (["08", "08059"], [rect(.5, 0, 1, 1)]),
            (["08", "08001"], [rect(2, 2, 3, 3)])])
        archive(self.root, "tl_2025_08031_areawater", ["HYDROID"],
                [(["1"], [rect(.4, .4, .5, .6)])])
        archive(self.root, "tl_2025_08059_areawater", ["HYDROID"],
                [(["2"], [rect(.5, .4, .6, .6)])])

    def build(self, **kwargs):
        return build_research_geography(
            self.root, self.out, bounds=(0, 0, 1, 1), pixels=10, **kwargs)

    def test_selects_every_intersecting_county_and_writes_uncertified_png(self):
        result = self.build()
        self.assertEqual(result["county_geoids_intersecting_viewport"], ["08031", "08059"])
        self.assertEqual(len(result["download_sources"]), 4)
        self.assertFalse(result["release_eligible"])
        self.assertFalse(result["input_completeness_certified"])
        self.assertEqual(result["mask_provenance"]["pixel_counts"]["water_excluded"], 4)
        with Image.open(self.out / result["diagnostic_png"]) as image:
            self.assertEqual(image.mode, "RGBA")
            self.assertEqual(image.size, (10, 10))
            self.assertEqual(image.getpixel((4, 4)), (36, 105, 185, 255))
            self.assertEqual(image.getpixel((5, 4)), (36, 105, 185, 255))
        self.assertEqual(json.loads((self.out / "tiger2025-source-manifest.json").read_text())["release_eligible"], False)
        self.assertEqual(len(json.loads((self.out / "tiger2025-colorado-water.geojson").read_text())["features"]), 2)

    def test_optional_sha_lock_detects_changed_archive(self):
        raw = (self.root / STATE).read_bytes()
        with self.assertRaisesRegex(ValueError, "Pinned SHA256 mismatch"):
            _fetch_zip(STATE, "STATE", self.root, expected="0"*64)
        digest = hashlib.sha256(raw).hexdigest()
        _, meta = _fetch_zip(STATE, "STATE", self.root, expected=digest)
        self.assertEqual(meta["sha256"], digest)
        with self.assertRaisesRegex(ValueError, "Missing pinned SHA256"):
            self.build(expected_hashes={COUNTY: "f"*64})
        with self.assertRaisesRegex(ValueError, "Pinned SHA256 mismatch"):
            self.build(expected_hashes={STATE: digest, COUNTY: "f"*64})

    def test_missing_county_water_is_error_not_silent_empty_mask(self):
        (self.root / "tl_2025_08059_areawater.zip").unlink()
        def offline_fetch(filename, section, download_dir, expected=None):
            if not (Path(download_dir) / filename).exists():
                raise ValueError("Missing offline TIGER fixture")
            return _fetch_zip(filename, section, download_dir, expected)
        with self.assertRaisesRegex(ValueError, "Missing offline TIGER fixture"):
            self.build(fetcher=offline_fetch)

    def test_partial_county_coverage_fails_closed(self):
        archive(self.root, COUNTY[:-4], ["STATEFP", "GEOID"], [
            (["08", "08031"], [rect(0, 0, .5, 1)])])
        with self.assertRaisesRegex(ValueError, "Incomplete 2025 county coverage"):
            self.build()

    def test_wrong_projection_is_rejected(self):
        raw = (self.root / STATE).read_bytes()
        with zipfile.ZipFile(io.BytesIO(raw)) as z:
            members = {n: z.read(n) for n in z.namelist()}
        members[STATE[:-4] + ".prj"] = CRS.from_epsg(3857).to_wkt().encode()
        with zipfile.ZipFile(self.root / STATE, "w") as z:
            for name, data in members.items():
                z.writestr(name, data)
        with self.assertRaisesRegex(ValueError, "NAD83"):
            list(_shapes_from_zip((self.root / STATE).read_bytes(), STATE))

    def test_outside_colorado_and_unbounded_pixels_fail(self):
        with self.assertRaisesRegex(ValueError, "Colorado state"):
            build_research_geography(self.root, self.out, bounds=(2, 2, 2.5, 2.5))
        with self.assertRaisesRegex(ValueError, "Invalid bounded"):
            build_research_geography(self.root, self.out, pixels=200)


if __name__ == "__main__":
    unittest.main()
