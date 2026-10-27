import unittest

from shapely.geometry import box
from colorado_cbsa_state_origin_inventory import classify_representative_points


def metro(cbsa, lon, lat, population=120000):
    return {"cbsa": cbsa, "longitude": str(lon), "latitude": str(lat),
            "population": str(population)}


class StateOriginInventoryTests(unittest.TestCase):
    def test_state_location_does_not_exclude_national_competitors(self):
        rows = [metro("14500", -105.3, 40), metro("19740", -104.8, 39.7),
                metro("99999", -99, 39)]
        audit = {"threshold_population": 100000, "candidates": [
            {"cbsa": "14500", "candidate_count_within_limit": 0},
            {"cbsa": "19740", "candidate_count_within_limit": 1},
            {"cbsa": "99999", "candidate_count_within_limit": 0},
        ]}
        result = classify_representative_points(
            rows, box(-109, 37, -102, 41), 100000, audit)
        self.assertEqual(result["representative_points_inside_colorado_count"], 2)
        self.assertEqual(result["representative_points_outside_colorado_count"], 1)
        self.assertEqual(result["inside_colorado_missing_geometric_candidates"], 1)
        self.assertEqual(result["outside_colorado_missing_geometric_candidates"], 1)
        self.assertFalse(result["global_competitor_exclusion_permitted"])
        self.assertFalse(result["release_eligible"])

    def test_border_point_is_not_silently_dropped(self):
        result = classify_representative_points(
            [metro("14500", -109, 40)], box(-109, 37, -102, 41), 100000)
        self.assertEqual(result["representative_points_inside_colorado_count"], 1)

    def test_audit_identity_mismatch_rejected(self):
        with self.assertRaisesRegex(ValueError, "incomplete"):
            classify_representative_points(
                [metro("14500", -105, 40)], box(-109, 37, -102, 41), 100000,
                {"threshold_population": 100000, "candidates": []})

    def test_duplicate_and_nonfinite_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            classify_representative_points(
                [metro("14500", -105, 40), metro("14500", -105, 40)],
                box(-109, 37, -102, 41), 100000)
        with self.assertRaisesRegex(ValueError, "Invalid metro"):
            classify_representative_points(
                [metro("14500", float("nan"), 40)],
                box(-109, 37, -102, 41), 100000)


if __name__ == "__main__":
    unittest.main()
