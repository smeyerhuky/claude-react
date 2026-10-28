import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from shapely.geometry import box, mapping

from colorado_town_geography_audit import audit_prepared


class TownGeographyTests(unittest.TestCase):
    def prepare(self, root):
        manifest = {"bbox_lonlat": [-.2, -.2, 1.2, 1.2], "release_eligible": False,
            "physical_or_legal_access_certified": False, "land_water_completeness_certified": False,
            "coordinate_operation": {"geographic_accuracy_certified": False}, "geojson": {}}
        for name, suffix, geom in (("land", "land", box(0, 0, 1, 1)),
                                   ("water", "areawater", box(.4, 0, .6, 1))):
            path = root/("tiger2025-colorado-"+suffix+".geojson")
            path.write_text(json.dumps({"type": "Feature", "geometry": mapping(geom)}))
            manifest["geojson"][name] = {"sha256": hashlib.sha256(path.read_bytes()).hexdigest()}
        path = root/"tiger2025-geography-manifest.json"
        path.write_text(json.dumps(manifest))
        return manifest, path

    def test_all_cells_and_both_negative_types_execute(self):
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            manifest, _ = self.prepare(root)
            result = audit_prepared(root, manifest["bbox_lonlat"], size=8, require_offland=True)
            self.assertEqual(result["independent_scalar_cells_checked"], 64)
            self.assertEqual(result["negative_rejections"], {"water": 1, "outside_land": 1})
            self.assertEqual(result["unsupported_painted_cells"], 0)
            self.assertEqual(sum(result["pixel_counts"].values()), 64)
            self.assertFalse(result["road_access_certified"])
            self.assertFalse(result["release_eligible"])

    def test_changed_hash_bounds_and_certified_metadata_fail(self):
        for change in (lambda m: m.update(bbox_lonlat=[0, 0, 1, 1]),
                       lambda m: m["geojson"]["water"].update(sha256="changed"),
                       lambda m: m.update(physical_or_legal_access_certified=True)):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                manifest, path = self.prepare(root)
                bounds = list(manifest["bbox_lonlat"])
                change(manifest); path.write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    audit_prepared(root, bounds, size=8)


if __name__ == "__main__":
    unittest.main()
