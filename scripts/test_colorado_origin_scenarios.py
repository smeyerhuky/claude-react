import copy
import unittest
from unittest.mock import patch

from colorado_origin_scenarios import CENSUS_SCENARIO, build_scenarios, investigate_scenarios


class OriginScenarioTests(unittest.TestCase):
    def setUp(self):
        self.metros = [{"cbsa": str(i), "name": "metro "+str(i), "population": "100000", "longitude": "-105", "latitude": "40"} for i in (1, 2)]
        self.places = [{"GEOID": "0800001", "USPS": "CO", "NAME": "lead city", "LSAD": "25", "FUNCSTAT": "A", "INTPTLONG": "-105.01", "INTPTLAT": "40.01"}]
        self.selection = {"scenario_id": "colorado-named-city-point-leads-v1", "association_basis": "synthetic",
                          "places": [{"cbsa": "1", "geoid": "0800001", "name": "lead city", "metro_name": "metro 1"}]}

    def test_both_inventories_preserved_with_no_fallback_or_approval(self):
        result = build_scenarios(self.metros, self.places, self.selection)
        original, urban = result["scenarios"][CENSUS_SCENARIO], result["scenarios"][self.selection["scenario_id"]]
        self.assertEqual([r["cbsa"] for r in original], [r["cbsa"] for r in urban])
        self.assertIsNone(urban[1]["origin_lonlat"])
        self.assertNotEqual(original[0]["origin_lonlat"], urban[0]["origin_lonlat"])
        self.assertGreater(result["scenario_point_displacements"][0]["point_displacement_m"], 0)
        self.assertEqual(result["approved_origin_count"], 0)
        self.assertTrue(all(not r["access_verified"] and not r["connector_costs_established"] for rows in result["scenarios"].values() for r in rows))

    def test_exact_names_geoids_and_uniqueness_fail_closed(self):
        for field, value in (("cbsa", "other"), ("geoid", "0800002"), ("name", "wrong city"), ("metro_name", "wrong metro")):
            selection = copy.deepcopy(self.selection)
            selection["places"][0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                build_scenarios(self.metros, self.places, selection)
        with self.assertRaisesRegex(ValueError, "Duplicate CBSA"):
            build_scenarios(self.metros+self.metros, self.places, self.selection)
        with self.assertRaisesRegex(ValueError, "duplicate Colorado"):
            build_scenarios(self.metros, self.places+self.places, self.selection)
        selection = copy.deepcopy(self.selection)
        selection["places"] *= 2
        with self.assertRaises(ValueError):
            build_scenarios(self.metros, self.places, selection)

    def test_invalid_geography_and_threshold(self):
        for field, value in (("INTPTLAT", "nan"), ("INTPTLONG", "181"), ("USPS", "WY"), ("LSAD", "57")):
            places = copy.deepcopy(self.places)
            places[0][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                build_scenarios(self.metros, places, self.selection)
        for threshold in (-1, True, 100001):
            with self.assertRaises(ValueError):
                build_scenarios(self.metros, self.places, self.selection, threshold)

    def test_missing_scenario_cannot_silently_investigate_census_point(self):
        result = build_scenarios(self.metros, self.places, self.selection)
        with patch("colorado_origin_source_investigation.OriginInvestigation") as scanner:
            with self.assertRaisesRegex(ValueError, "Missing scenario point"):
                investigate_scenarios(result, "not-read", ["1", "2"])
            self.assertEqual(scanner.call_count, 0)


if __name__ == "__main__":
    unittest.main()
