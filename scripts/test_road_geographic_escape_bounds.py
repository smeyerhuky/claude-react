from fractions import Fraction
import math
import random
import unittest

import networkx as nx

from road_geographic_escape_bounds import boundary_distance_lower_bound, screen_exterior_routes
from test_metro_competition_bounds import spherical_distance


class GeographicEscapeTests(unittest.TestCase):
    def test_boundary_lower_bound_vs_independent_vector_geometry(self):
        rng = random.Random(138)
        for bounds in [(-110, 37, -102, 41), (-10, 85, 10, 89), (170, -45, 179, -40)]:
            west, south, east, north = bounds
            for _ in range(20):
                center = (rng.uniform(west, east), rng.uniform(south, north))
                lower = boundary_distance_lower_bound(center, bounds)
                for i in range(101):
                    lon = west+(east-west)*i/100
                    lat = south+(north-south)*i/100
                    for boundary in ((lon, south), (lon, north), (west, lat), (east, lat)):
                        self.assertLessEqual(float(lower), spherical_distance(center, boundary)+1e-7)

    def test_directed_exterior_shortcuts_cannot_beat_the_bound(self):
        # Independent Bellman-Ford with spherical edge costs on random directed
        # parents. Mark a visited outside node in a two-layer graph, so the
        # oracle minimizes over routes that actually make an excursion.
        rng = random.Random(137)
        bounds = (-2, -2, 2, 2)
        for _ in range(20):
            coords = [(rng.uniform(-1, 1), rng.uniform(-1, 1)) for _ in range(4)]
            coords += [(3., rng.uniform(-1, 1)), (-3., rng.uniform(-1, 1))]
            for metric in ("length", "travel_time"):
                g = nx.DiGraph()
                for u in range(6):
                    for v in range(6):
                        if u == v or (rng.random() < .3 and (u, v) not in ((0, 4), (4, 1))):
                            continue
                        cost = spherical_distance(coords[u], coords[v])
                        if metric == "travel_time":
                            cost /= 120*1000/3600
                        for visited in (False, True):
                            g.add_edge((u, visited), (v, visited or v >= 4), weight=cost)
                truth = nx.bellman_ford_path_length(g, (0, False), (1, True))
                result = screen_exterior_routes(coords[0], coords[1], bounds, metric=metric,
                    incumbent_upper_bound=truth, speed_ceiling_kph=120)
                lower = Fraction(*map(int, result["excursion_cost_lower_bound_exact"]))
                self.assertLessEqual(float(lower), truth+1e-7)
                self.assertFalse(result["conditional_exterior_routes_cannot_improve"])

    def test_endpoint_uncertainty_ties_and_global_speed(self):
        bounds, a, b = (-2, -2, 2, 2), (0, 0), (1, 1)
        lower = boundary_distance_lower_bound(a, bounds)+boundary_distance_lower_bound(b, bounds)
        r = screen_exterior_routes(a, b, bounds, metric="length", incumbent_upper_bound=lower)
        self.assertFalse(r["conditional_exterior_routes_cannot_improve"])
        r = screen_exterior_routes(a, b, bounds, metric="length", incumbent_upper_bound=lower-1)
        self.assertTrue(r["conditional_exterior_routes_cannot_improve"])
        self.assertEqual(r["applied_exterior_route_exclusions"], [])
        self.assertFalse(r["parent_exterior_coverage_certified"])
        uncertain = boundary_distance_lower_bound(a, bounds, 40000000)
        self.assertEqual(uncertain, 0)
        self.assertEqual(boundary_distance_lower_bound((-2, 0), bounds), 0)
        for speed in (None, 0, -1, float("inf")):
            with self.assertRaises(ValueError):
                screen_exterior_routes(a, b, bounds, metric="travel_time", incumbent_upper_bound=1,
                                       speed_ceiling_kph=speed)
        slow = screen_exterior_routes(a, b, bounds, metric="travel_time", incumbent_upper_bound=1, speed_ceiling_kph=120)
        fast = screen_exterior_routes(a, b, bounds, metric="travel_time", incumbent_upper_bound=1, speed_ceiling_kph=240)
        self.assertAlmostEqual(slow["excursion_cost_lower_bound"], 2*fast["excursion_cost_lower_bound"])

    def test_invalid_unwrapped_or_outside_region_fails(self):
        for point, box, radius in [((3, 0), (-2,-2,2,2), 0), ((0,0), (170,-2,-170,2), 0),
                                   ((0,0), (-180,-2,180,2), 0), ((0,0), (-2,2,2,-2), 0),
                                   ((0,0), (-2,-2,2,2), -1), ((float("nan"),0), (-2,-2,2,2), 0)]:
            with self.assertRaises(ValueError):
                boundary_distance_lower_bound(point, box, radius)


if __name__ == "__main__":
    unittest.main()
