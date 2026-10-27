import copy
import unittest

from shapely.geometry import box

from metro_origin_domains import build_domains, population_records


def geography(cbsa, name, shape, point):
    return ({"GEOID": cbsa, "LSAD": "M1", "NAMELSAD": name, "INTPTLON": str(point[0]), "INTPTLAT": str(point[1])}, shape)


class OriginDomainTests(unittest.TestCase):
    def setUp(self):
        self.existing = [{"cbsa": "10000", "name": "A Metro Area", "population": "100000"}]
        self.population = [{"name": "A Metro Area", "population": 100000}, {"name": "B Metro Area", "population": 200000}]
        self.geometries = [geography("10000", "A Metro Area", box(0, 0, 1, 1), (.5, .5)),
                           geography("20000", "B Metro Area", box(-150, 60, -149, 61), (-149.5, 60.5))]

    def test_population_year_threshold_and_nonmetro_rows(self):
        rows = [("Geographic Area", "Population", None), (None, 2024, 2025),
                (".A Metro Area", 99999, 100000), (".B Metro Area", 200000, 99999),
                ("C Micro Area", 200000, 300000)]
        self.assertEqual(population_records(rows), [{"name": "A Metro Area", "population": 100000}])
        for bad in (rows+[(".A Metro Area", 1, 100000)], [("Area",)],
                    [("Geographic Area",), (".A Metro Area",)],
                    [("Geographic Area", None), (None, 2025), (".A Metro Area", "unavailable")]):
            with self.assertRaises(ValueError):
                population_records(bad)

    def test_preserves_existing_inventory_and_exposes_source_scope_gap(self):
        result = build_domains(self.existing, self.population, self.geometries)
        self.assertEqual(result["existing_csv_cbsa_ids"], ["10000"])
        self.assertEqual(result["source_qualifying_cbsa_ids"], ["10000", "20000"])
        self.assertEqual(result["source_qualifiers_absent_from_existing_csv"], ["20000"])
        self.assertEqual(result["domains"][1]["native_bbox_lonlat"], [-150., 60., -149., 61.])
        self.assertFalse(result["road_coverage_certified"])
        self.assertTrue(all(not x["access_verified"] and not x["road_origin_verified"] for x in result["domains"]))

    def test_ambiguous_missing_or_altered_source_identity_fails_closed(self):
        for populations, geometries in ((self.population+self.population, self.geometries),
                                         ([{"name": "A different Metro Area", "population": 100000}], self.geometries),
                                         (self.population, self.geometries+self.geometries),
                                         (self.population[1:], self.geometries),
                                         ([{**self.population[0], "population": 100001}]+self.population[1:], self.geometries)):
            with self.assertRaises(ValueError):
                build_domains(self.existing, populations, geometries)
        shapes = [geography("10000", "A Metro Area", box(0, 0, 1, 1), (2, 2)), self.geometries[1]]
        with self.assertRaisesRegex(ValueError, "internal point"):
            build_domains(self.existing, self.population, shapes)

    def test_wrong_city_association_is_reported_without_fallback_or_access(self):
        registry = {"release_eligible": False, "access_certified": False,
                    "scenarios": {"colorado-named-city-point-leads-v1": [{"cbsa": "10000", "origin_lonlat": [2, 2]}]}}
        result = build_domains(self.existing, self.population, self.geometries, registry)
        row = result["selected_urban_lead_membership"][0]
        self.assertFalse(row["inside_native_cbsa_polygon"])
        self.assertEqual(row["origin_lonlat"], [2, 2])
        self.assertFalse(row["access_verified"])
        bad = copy.deepcopy(registry)
        bad["scenarios"]["colorado-named-city-point-leads-v1"] *= 2
        with self.assertRaises(ValueError):
            build_domains(self.existing, self.population, self.geometries, bad)


if __name__ == "__main__":
    unittest.main()
