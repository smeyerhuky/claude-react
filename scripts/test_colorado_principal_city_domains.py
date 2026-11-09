import copy
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path
import random
import shutil
import tempfile
import unittest

from colorado_principal_city_domains import (OUTPUT, audit, candidate_city_check, enclosing_ball,
                                             fraction, load_features, SOURCE, derive, rectangle_distance_lower_bound)
from larimer_census_water_mask import encoded, geometry_encoded


def spherical_distance(a, b):
    def xyz(value):
        lon, lat = map(math.radians, value)
        return math.cos(lat)*math.cos(lon), math.cos(lat)*math.sin(lon), math.sin(lat)
    a, b = xyz(a), xyz(b)
    cross = (a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0])
    return 6371000*math.atan2(math.sqrt(sum(c*c for c in cross)), sum(x*y for x, y in zip(a, b)))


class ColoradoCityDomainTests(unittest.TestCase):
    def test_complete_retained_city_and_metro_sets_replay_without_adoption(self):
        report = audit()
        self.assertEqual(report, json.loads((OUTPUT/'report.json').read_bytes()))
        metros = {row['cbsa']: row for row in report['metro_domains']}
        self.assertEqual(set(metros), {'14500','17820','19740','22660','24300','24540','39380'})
        self.assertEqual(len(report['city_domains']), 12)
        self.assertEqual(metros['19740']['required_principal_city_ids'], ['0804000','0809280','0812815','0816495','0820000'])
        self.assertEqual(metros['22660']['required_principal_city_ids'], ['0827425','0846465'])
        self.assertGreater(fraction(metros['24540']['conditional_distance_lower_bound_exact']), 0)
        self.assertFalse(report['adopted_anchor_registry'])
        self.assertFalse(report['access_verified']); self.assertFalse(report['release_eligible'])
        self.assertFalse(report['complete_global_competition'])
        self.assertIsNone(report['travel_time_lower_bounds'])
        self.assertEqual(report['applied_competitor_exclusions'], [])

    def test_bbox_enclosure_dominates_independent_spherical_oracle(self):
        rng = random.Random(283)
        bounds = [row['bounds_lonlat'] for row in audit()['city_domains']]
        for _ in range(200):
            west, south = rng.uniform(-179, 160), rng.uniform(-89, 80)
            bounds.append([west, south, min(179, west+rng.uniform(0, 19)), min(89, south+rng.uniform(0, 9))])
        for west, south, east, north in bounds:
            ball = enclosing_ball([west, south, east, north]); radius = float(fraction(ball['radius_m_exact']))
            samples = [(west,south),(west,north),(east,south),(east,north)]
            samples += [(rng.uniform(west,east),rng.uniform(south,north)) for _ in range(5)]
            for value in samples:
                self.assertLessEqual(spherical_distance(ball['center_lonlat'], value), radius+1e-7)

    def test_rectangle_bound_against_independent_sampled_oracle_including_dateline(self):
        cases = [([-170,-5,-160,5], [175,0]), ([170,-5,179,5], [-175,0]),
                 ([-20,80,20,89], [170,90]), ([0,0,0,0], [180,0])]
        rng = random.Random(2831)
        for _ in range(200):
            west = rng.uniform(-179,150); south = rng.uniform(-85,75)
            cases.append(([west,south,min(179,west+rng.uniform(0,25)),min(89,south+rng.uniform(0,10))],
                          [rng.uniform(-180,180),rng.uniform(-90,90)]))
        for bounds, destination in cases:
            west,south,east,north = bounds
            lower = float(rectangle_distance_lower_bound(bounds,destination))
            samples = [(west,south),(west,north),(east,south),(east,north)]
            samples += [(rng.uniform(west,east),rng.uniform(south,north)) for _ in range(8)]
            for value in samples:
                self.assertLessEqual(lower,spherical_distance(value,destination)+1e-7)
        self.assertEqual(rectangle_distance_lower_bound([-106,39,-104,41],[-105,40]),0)

    def test_float_midpoint_rounding_cannot_shrink_a_tiny_domain(self):
        south = 40.; north = math.nextafter(south, math.inf)
        radius = fraction(enclosing_ball([0, south, 0, north])['radius_m_exact'])
        delta = Fraction.from_float(north)-Fraction.from_float(south)
        # pi < 355/113 supplies an independent meridian-distance upper bound;
        # the stored center rounds to one endpoint, so half a span is unsafe.
        self.assertGreaterEqual(radius, 6371000*Fraction(355,113)*delta/180)
        for bounds in ([1,0,0,1], [-180,0,180,1], [0,91,1,92], [0,0,float('inf'),1], [0,True,1,2]):
            with self.assertRaises(ValueError): enclosing_ball(bounds)

    def test_bounds_dominate_city_vertices_and_use_every_required_city(self):
        report = audit(); features = load_features(OUTPUT)
        for row in report['city_domains']:
            geometry = features[row['principal_city_id']][1]
            lower = float(fraction(row['conditional_distance_lower_bound_exact']))
            for polygon in (geometry.geoms if geometry.geom_type == 'MultiPolygon' else [geometry]):
                for ring in [polygon.exterior, *polygon.interiors]:
                    coordinates = list(ring.coords)
                    for value in coordinates[::max(1,len(coordinates)//20)]:
                        self.assertLessEqual(lower, spherical_distance(value, report['geographic_context_point'])+1e-7)
        for metro in report['metro_domains']:
            city_rows = [row for row in report['city_domains'] if row['cbsa'] == metro['cbsa']]
            self.assertEqual(fraction(metro['conditional_distance_lower_bound_exact']),
                             min(fraction(row['conditional_distance_lower_bound_exact']) for row in city_rows))

    def test_city_location_check_does_not_snap_or_claim_vehicle_access(self):
        denver = [-104.9997276,39.7528388]
        accepted = candidate_city_check('0820000', denver)
        self.assertTrue(accepted['covered_by_supplied_city_polygon'])
        self.assertFalse(candidate_city_check('0827425', denver)['covered_by_supplied_city_polygon'])
        self.assertTrue(candidate_city_check('0827425', [-105.08,40.59])['covered_by_supplied_city_polygon'])
        for flag in ('anchor_adopted','access_verified','release_eligible','legal_jurisdiction_certified'):
            self.assertFalse(accepted[flag])
        with self.assertRaises(ValueError): candidate_city_check('9999999', denver)

    def test_missing_city_or_duplicate_membership_cannot_be_hidden_by_rehashing(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)/'domains'; shutil.copytree(OUTPUT, root)
            original = json.loads((root/'cities.geojson').read_bytes())
            for mutation in ('missing','duplicate','foreign-cbsa'):
                data = copy.deepcopy(original)
                if mutation == 'missing': data['features'].pop()
                elif mutation == 'duplicate': data['features'][-1] = data['features'][0]
                else: data['features'][0]['properties']['cbsa'] = '99999'
                (root/'cities.geojson').write_bytes(geometry_encoded(data))
                manifest = json.loads((root/'manifest.json').read_bytes())
                manifest['retained_geometry_sha256'] = hashlib.sha256((root/'cities.geojson').read_bytes()).hexdigest()
                (root/'manifest.json').write_bytes(encoded(manifest))
                with self.assertRaises(ValueError): audit(root)

    def test_changed_source_approval_or_required_city_set_fails_closed(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)/'domains'; shutil.copytree(OUTPUT, root)
            original = json.loads((root/'manifest.json').read_bytes())
            for mutate in (lambda d: d.update(anchors_adopted=True), lambda d: d.update(release_eligible=True),
                           lambda d: d['source'].update(sha256='0'*64),
                           lambda d: d['required_cities'].pop('0809280')):
                data = copy.deepcopy(original); mutate(data); (root/'manifest.json').write_bytes(encoded(data))
                with self.assertRaises(ValueError): audit(root)

    def test_original_bytes_must_match_before_any_geometry_is_admitted(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary)/SOURCE['name']; path.write_bytes(b'not the pinned Census source')
            with self.assertRaisesRegex(ValueError, 'pinned Census original'): derive(path)
