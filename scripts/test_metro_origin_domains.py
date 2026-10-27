import copy
from fractions import Fraction
import math
import random
import unittest

from shapely.geometry import box

from metro_origin_domains import build_domains, covering_ball, population_records


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

    def test_covering_ball_contains_box_points_in_independent_geometry(self):
        rng = random.Random(138)
        for bounds in ((-106, 38, -104, 41), (-180, -90, 180, 90), (170, 80, 180, 90), (-150, 60, -147, 64)):
            result = covering_ball(bounds)
            center = [float(Fraction(*map(int, v))) for v in result["center_lonlat_exact"]]
            radius = float(Fraction(*map(int, result["radius_m_exact"])))
            west, south, east, north = bounds
            samples = [(x, y) for x in (west, east) for y in (south, north)]
            samples += [(rng.uniform(west, east), rng.uniform(south, north)) for _ in range(30)]
            def vector(p):
                lon, lat = map(math.radians, p)
                return math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)
            a = vector(center)
            for sample in samples:
                b = vector(sample)
                cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
                distance = 6371000*math.atan2(math.sqrt(sum(v*v for v in cross)), sum(x*y for x, y in zip(a, b)))
                self.assertLessEqual(distance, radius+1e-7)
        with self.assertRaises(ValueError):
            covering_ball((1, 0, 0, 1))

    def test_binary_tiger_bbox_endpoints_are_not_decimal_substitutions(self):
        # Shapefile polygon coordinates are binary64. A decimal string of a
        # float is not necessarily its exact stored coordinate.
        bounds = (0.1, 0.2, 0.3, 0.4)
        result = covering_ball(bounds)
        west, south, east, north = map(Fraction.from_float, bounds)
        expected_center = ((west + east) / 2, (south + north) / 2)
        expected_radius = Fraction(6371000) * Fraction(22, 7) * (
            east - west + north - south) / 360
        encoded_center = tuple(Fraction(*map(int, pair))
                               for pair in result["center_lonlat_exact"])
        encoded_radius = Fraction(*map(int, result["radius_m_exact"]))
        self.assertEqual(encoded_center, expected_center)
        self.assertEqual(encoded_radius, expected_radius)
        self.assertNotEqual(expected_radius, Fraction(6371000) * Fraction(22, 7)
                            * Fraction(2, 5) / 360)
        self.assertGreaterEqual(result["radius_upper_bound_m"], float(expected_radius))
        with self.assertRaises(ValueError):
            covering_ball((0, 0, float("nan"), 1))

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
