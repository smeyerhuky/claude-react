import math
import random
import unittest
from fractions import Fraction

from metro_competition_bounds import distance_lower_bound, number, screen_competitors


def spherical_distance(a, b):
    # Independent vector atan2 computation, not the production haversine helper.
    def xyz(p):
        lon, lat = map(math.radians, p)
        return math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)
    a, b = xyz(a), xyz(b)
    cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    return 6371000*math.atan2(math.sqrt(sum(x*x for x in cross)), sum(x*y for x, y in zip(a, b)))


def domain(center, radius=0):
    return {"center_lonlat": center, "radius_m": radius, "evidence_reference": "synthetic-test-only"}


class CompetitionBoundTests(unittest.TestCase):
    def test_global_bound_vs_independent_spherical_distance(self):
        pairs = [((180, 0), (-180, 0)), ((0, 90), (180, 90)),
                 ((0, 90), (180, -90)), ((0, 0), (180, 0)),
                 ((179.999, 40), (-179.999, 40)), ((0, 0), (0, .000001))]
        rng = random.Random(138)
        pairs += [((rng.uniform(-180, 180), rng.uniform(-90, 90)),
                   (rng.uniform(-180, 180), rng.uniform(-90, 90))) for _ in range(200)]
        for a, b in pairs:
            self.assertLessEqual(float(distance_lower_bound(a, b)), spherical_distance(a, b)+1e-7)
            self.assertEqual(distance_lower_bound(a, b), distance_lower_bound(b, a))

    def test_binary_float_endpoints_cannot_inflate_a_tiny_lower_bound(self):
        # 355/113 > pi gives an independent rational UPPER bound on each
        # meridian distance. The old decimal substitution exceeded even this.
        for latitude in (.1, 40., -40., 89., -89.):
            adjacent = math.nextafter(latitude, math.inf)
            delta = Fraction.from_float(adjacent)-Fraction.from_float(latitude)
            distance_upper = 6371000*Fraction(355, 113)*delta/180
            lower = distance_lower_bound((0, latitude), (0, adjacent))
            self.assertGreater(lower, 0)
            self.assertLessEqual(lower, distance_upper)
            # A full meridian route plus a tiny detour can be feasible under
            # this upper budget; a lower bound must never exclude this source.
            result = screen_competitors(["a"], {"a": domain((0, latitude))},
                (0, adjacent), metric="length", incumbent_cost=distance_upper)
            self.assertFalse(result["sources"][0]["conditional_exclusion"])
        self.assertEqual(number(.1), Fraction.from_float(.1))
        self.assertEqual(number("0.1"), Fraction(1, 10))
        self.assertNotEqual(number(.1), number("0.1"))

    def test_endpoint_domains_and_connector_costs_cannot_disappear(self):
        source, anchor, destination, attachment = (0, 0), (1, 1), (10, 10), (9, 9)
        r1, r2 = spherical_distance(source, anchor), spherical_distance(destination, attachment)
        bound = distance_lower_bound(source, destination, r1, r2)
        self.assertLessEqual(float(bound), spherical_distance(anchor, attachment))
        self.assertEqual(distance_lower_bound(source, destination, 40000000), 0)

    def test_unknowns_and_equal_costs_remain_competitors(self):
        known = {"a": domain((0, 0))}
        bound = distance_lower_bound((0, 0), (1, 1))
        result = screen_competitors(["b", "a"], known, (1, 1), metric="length", incumbent_cost=bound)
        self.assertEqual([r["reason"] for r in result["sources"]], ["may_compete", "unknown_origin_domain"])
        self.assertFalse(result["complete_global_competition"])
        self.assertEqual(result["applied_source_exclusions"], [])
        # Even a difference smaller than float resolution has an exact decision.
        result = screen_competitors(["a"], known, (1, 1), metric="length", incumbent_cost=bound-Fraction(1, 10**20))
        self.assertTrue(result["sources"][0]["conditional_exclusion"])
        result = screen_competitors(["a"], known, (1, 1), metric="length", incumbent_cost=bound-1, margin=1)
        self.assertFalse(result["sources"][0]["conditional_exclusion"])

    def test_time_requires_global_ceiling_and_units(self):
        kwargs = dict(eligible_ids=["a"], origin_domains={"a": domain((0, 0))}, destination=(10, 10),
                      metric="travel_time", incumbent_cost=100)
        unknown = screen_competitors(**kwargs)
        self.assertEqual(unknown["sources"][0]["reason"], "unknown_global_speed_ceiling")
        result = screen_competitors(**kwargs, speed_ceiling_kph=140)
        self.assertEqual(result["units"], "seconds")
        self.assertAlmostEqual(result["sources"][0]["lower_bound"], float(distance_lower_bound((0, 0), (10, 10)))/(140/3.6))
        self.assertTrue(result["sources"][0]["conditional_exclusion"])
        # A faster exterior network makes exclusion harder, never easier.
        fast = screen_competitors(**kwargs, speed_ceiling_kph=100000)
        self.assertFalse(fast["sources"][0]["conditional_exclusion"])

    def test_invalid_data_cannot_drop_or_exclude_sources(self):
        kwargs = dict(eligible_ids=["a"], origin_domains={"a": domain((0, 0))}, destination=(1, 1),
                      metric="length", incumbent_cost=0)
        for field, value in [("eligible_ids", []), ("eligible_ids", ["a", "a"]),
                             ("origin_domains", {"other": domain((0, 0))}),
                             ("destination", (181, 0)), ("destination", (0, float("nan"))),
                             ("incumbent_cost", -1), ("incumbent_cost", True), ("incumbent_cost", float("inf")),
                             ("metric", "traffic"), ("margin", -1), ("speed_ceiling_kph", 0),
                             ("destination_radius_m", -1), ("origin_domains", {"a": domain((0, 0), -1)}),
                             ("origin_domains", {"a": {**domain((0, 0)), "evidence_reference": ""}})]:
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                screen_competitors(**{**kwargs, field: value})


if __name__ == "__main__":
    unittest.main()
