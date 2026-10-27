import math
from types import SimpleNamespace as NS
import unittest

from colorado_origin_source_investigation import OriginInvestigation


def node(lon, lat, valid=True):
    return NS(location=NS(lon=lon, lat=lat, valid=lambda: valid))


def way(way_id, highway, offset, **tags):
    return NS(id=way_id, tags={"highway": highway, **tags},
              nodes=[node(-105.001, 40+offset), node(-104.999, 40+offset)])


class RawOriginTests(unittest.TestCase):
    def scanner(self):
        return OriginInvestigation([{"cbsa": "14500", "name": "fixture", "lon": -105, "lat": 40}], 1000)

    def test_omitted_classes_and_private_roads_do_not_become_drivable(self):
        s = self.scanner()
        s.way(way(1, "service", .001, access="private"))
        s.way(way(2, "track", .002))
        s.way(way(3, "residential", .003))
        row = s.report()["metros"][0]
        self.assertEqual(row["nearest_mapped_highway"]["osm_way_id"], 1)
        self.assertEqual(row["nearest_model_drivable_highway"]["osm_way_id"], 3)
        self.assertFalse(s.report()["release_eligible"])
        self.assertFalse(row["nearest_model_drivable_highway"]["access_verified"])

    def test_scan_radius_absence_has_no_access_claim(self):
        s = self.scanner()
        s.way(way(1, "residential", .1))
        self.assertIsNone(s.report()["metros"][0]["nearest_model_drivable_highway"])
        self.assertFalse(s.report()["extract_coverage_certified"])

    def test_polyline_interiors_not_nearest_vertices(self):
        s = self.scanner()
        s.way(NS(id=1, tags={"highway": "residential"},
                 nodes=[node(-105.1, 40), node(-104.9, 40)]))
        self.assertAlmostEqual(s.report()["metros"][0]["nearest_model_drivable_highway"]["gap_m"], 0)

    def test_missing_locations_never_bridged(self):
        s = self.scanner()
        s.way(NS(id=1, tags={"highway": "residential"},
                 nodes=[node(-105.001, 40), node(0, 0, False), node(-104.999, 40)]))
        self.assertEqual(s.report()["highway_ways_with_missing_locations"], 1)
        self.assertIsNone(s.report()["metros"][0]["nearest_mapped_highway"])

    def test_invalid_radius_and_duplicate_metros(self):
        for radius in (0, -1, math.inf, math.nan, 25001):
            with self.assertRaises(ValueError):
                OriginInvestigation([], radius)
        m = {"cbsa": "1", "name": "fixture", "lon": -105, "lat": 40}
        with self.assertRaises(ValueError):
            OriginInvestigation([m, m])


if __name__ == "__main__":
    unittest.main()
