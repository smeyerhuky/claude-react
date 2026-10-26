"""Entirely synthetic offline TIGER-shaped zips; never certify real hydrology."""
import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

import shapefile
from shapely.geometry import shape

from colorado_geographic_mask import build_explicit_land_water_mask
from colorado_tiger2025_geography import (
    COUNTY_FILENAME, STATE_FILENAME, _validate_bbox, prepare_tiger2025_geography,
)


def clockwise_ring(west, south, east, north):
    return [[west, south], [west, north], [east, north],
            [east, south], [west, south]]


def write_zip(folder, filename, records, fields):
    """Build temporary shapefile zip with the Census filename convention."""
    base = folder / filename[:-4]
    writer = shapefile.Writer(str(base), shapeType=shapefile.POLYGON)
    for field in fields:
        writer.field(field, "C", size=8)
    for values, rings in records:
        writer.poly(rings)
        writer.record(*values)
    writer.close()
    with zipfile.ZipFile(folder / filename, "w",
                         compression=zipfile.ZIP_DEFLATED) as dest:
        for ext in (".shp", ".shx", ".dbf"):
            path = folder / (base.name + ext)
            dest.write(path, path.name)
            path.unlink()


class Tiger2025SourceTests(unittest.TestCase):
    def setUp(self):
        temp = tempfile.TemporaryDirectory()
        self.addCleanup(temp.cleanup)
        self.path = Path(temp.name)
        self.cache = self.path / "source"
        self.cache.mkdir()
        self.out = self.path / "output"
        self.bbox = (-105.10, 39.55, -104.90, 39.85)
        write_zip(self.cache, STATE_FILENAME, [
            (("08",), [clockwise_ring(-105.2, 39.5, -104.8, 39.9)])],
            ["GEOID"])
        write_zip(self.cache, COUNTY_FILENAME, [
            (("08", "08001"), [clockwise_ring(-105.2, 39.5, -105.0, 39.9)]),
            (("08", "08031"), [clockwise_ring(-105.0, 39.5, -104.8, 39.9)]),
            (("09", "09001"), [clockwise_ring(-104.0, 39.5, -103.0, 39.9)]),
        ], ["STATEFP", "GEOID"])
        write_zip(self.cache, "tl_2025_08001_areawater.zip", [
            (("a",), [clockwise_ring(-105.06, 39.67, -105.02, 39.73)])],
            ["HYDROID"])
        write_zip(self.cache, "tl_2025_08031_areawater.zip", [
            (("b",), [clockwise_ring(-104.98, 39.67, -104.94, 39.73)])],
            ["HYDROID"])

    def ingest(self, **kwargs):
        return prepare_tiger2025_geography(
            kwargs.pop("bounds", self.bbox),
            self.cache, self.out, offline=True)

    def test_offline_selects_all_intersecting_counties_and_pins_hashes(self):
        result = self.ingest()
        self.assertFalse(result["release_eligible"])
        self.assertFalse(result["land_water_completeness_certified"])
        self.assertEqual(result["selected_county_geoids"], ["08001", "08031"])
        self.assertEqual(len(result["source_archives"]), 4)
        self.assertEqual(result["intersecting_areawater_features"], 2)
        self.assertLess(result["county_coverage_gap_degree2"], 1e-10)
        first = result["source_archives"][0]
        self.assertEqual(first["sha256"],
                         hashlib.sha256((self.cache / STATE_FILENAME)
                                        .read_bytes()).hexdigest())
        land = shape(json.loads((self.out / result["geojson"]["land"]["path"])
                                .read_text())["geometry"])
        self.assertTrue(land.is_valid)
        mask = build_explicit_land_water_mask(
            self.out / result["geojson"]["land"]["path"],
            self.out / result["geojson"]["water"]["path"], self.bbox, 20, 20)
        self.assertGreater(mask["pixel_counts"]["water_excluded"], 0)
        self.assertGreater(mask["pixel_counts"]["land_nonwater"], 0)
        self.assertFalse(mask["release_eligible"])
        self.assertEqual(
            json.loads((self.out / "tiger2025-geography-manifest.json")
                       .read_text())["selected_county_geoids"], ["08001", "08031"])

    def test_missing_water_file_does_not_mean_no_water(self):
        (self.cache / "tl_2025_08031_areawater.zip").unlink()
        with self.assertRaisesRegex(ValueError, "Offline TIGER source missing"):
            self.ingest()

    def test_omitted_county_fails_state_coverage_guard(self):
        write_zip(self.cache, COUNTY_FILENAME, [
            (("08", "08001"), [clockwise_ring(-105.2, 39.5, -105.0, 39.9)])],
            ["STATEFP", "GEOID"])
        with self.assertRaisesRegex(ValueError, "do not cover"):
            self.ingest()

    def test_malformed_cache_fails_closed(self):
        (self.cache / STATE_FILENAME).write_bytes(b"not-a-zip")
        with self.assertRaisesRegex(ValueError, "Corrupt"):
            self.ingest()

    def test_empty_water_polygons_are_not_considered_certified_dry_land(self):
        write_zip(self.cache, "tl_2025_08031_areawater.zip", [
            (("other",), [clockwise_ring(-104.85, 39.67, -104.82, 39.73)])],
            ["HYDROID"])
        # The remaining 08001 polygon still intersects; check the count.
        self.assertEqual(self.ingest()["intersecting_areawater_features"], 1)
        write_zip(self.cache, "tl_2025_08001_areawater.zip", [
            (("outside",), [clockwise_ring(-105.18, 39.67, -105.13, 39.73)])],
            ["HYDROID"])
        with self.assertRaisesRegex(ValueError, "No area-water"):
            self.ingest()

    def test_invalid_viewport_rejected_before_network(self):
        for bbox in ((-106, 39, -108, 40),
                     (-106, 38, -104, 41),
                     (-120, 39, -118, 40)):
            with self.assertRaises(ValueError):
                _validate_bbox(bbox)

    def test_zip_missing_dbf_rejected(self):
        path = self.cache / STATE_FILENAME
        with zipfile.ZipFile(path) as src:
            data = {name: src.read(name) for name in src.namelist()
                    if not name.endswith(".dbf")}
        with zipfile.ZipFile(path, "w") as dst:
            for name, value in data.items():
                dst.writestr(name, value)
        with self.assertRaisesRegex(ValueError, "lacks"):
            self.ingest()


if __name__ == "__main__":
    unittest.main()
