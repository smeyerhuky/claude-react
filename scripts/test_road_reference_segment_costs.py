import copy
from fractions import Fraction
import json
import math
import random
import unittest
from pyproj import Geod
from road_reference_segment_costs import project, meters, policy
from road_reference_scenario import ROOT
from road_reference_way_permissions import DEFAULTS


def fixture():
    way = dict(id=10, tags={'highway': 'residential', 'oneway': 'no'},
               nodes=[[1, -105., 40.], [2, -105.001, 40.], [3, -105.001, 40.002]])
    nodes = [dict(id=row[0], lonlat=row[1:], tags={}) for row in way['nodes']]
    return way, nodes


def run(way, nodes, **kwargs):
    return project(way, nodes, default_policy=DEFAULTS, **kwargs)


class ReferenceSegmentCostsTests(unittest.TestCase):
    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported', result)
        self.assertIsNone(result['arcs'])
        self.assertFalse(result['segment_weights_emitted'])

    def test_defaults_preserve_raw_segments_and_reverse_geometry(self):
        way, nodes = fixture(); original = copy.deepcopy((way, nodes))
        result = run(way, nodes)
        self.assertEqual(result['status'], 'supported_segment_weights')
        self.assertEqual(len(result['arcs']), 4)
        a, b = result['arcs'][:2]
        self.assertEqual(a['id'], 'raw:10:0:forward'); self.assertEqual(b['id'], 'raw:10:0:backward')
        self.assertEqual(a['raw_geometry'], list(reversed(b['raw_geometry'])))
        self.assertEqual(a['length'], b['length']); self.assertEqual(a['travel_time'], b['travel_time'])
        self.assertEqual(a['selected_speed_kph'], 30)
        self.assertEqual(a['speed_basis'], 'declared_highway_model_default')
        self.assertIsNone(a['selected_raw_speed'])
        for key in ('route_cost_emitted', 'turn_restrictions_evaluated', 'access_verified',
                    'anchors_adopted', 'release_eligible', 'global_speed_ceiling_certified'):
            self.assertIs(result[key], False)
        self.assertEqual((way, nodes), original)

    def test_all_highway_defaults_are_explicit(self):
        for highway, kph in policy()['default_speed_kph'].items():
            way, nodes = fixture(); way['tags']['highway'] = highway
            result = run(way, nodes)
            self.assertEqual(result['status'], 'supported_segment_weights', highway)
            self.assertTrue(all(a['selected_speed_kph'] == kph for a in result['arcs']))

    def test_posted_units_and_exact_conversion(self):
        for raw, expected in [('30 mph', Fraction('48.28032')), ('48.280 km/h', Fraction('48.280')),
                              ('20.5 kph', Fraction('20.5')), ('25', Fraction(25))]:
            way, nodes = fixture(); way['tags']['maxspeed'] = raw
            arc = run(way, nodes)['arcs'][0]
            self.assertEqual(Fraction(*arc['speed_mps_fraction']), expected * Fraction(5, 18))
            self.assertEqual(arc['selected_raw_speed'], raw)
            self.assertEqual(arc['travel_time'], float(Fraction.from_float(arc['length']) / (expected * Fraction(5, 18))))

    def test_directional_limit_precedence_in_original_raw_orientation(self):
        way, nodes = fixture(); way['tags'].update({'maxspeed': '30 mph', 'maxspeed:forward': '10', 'maxspeed:backward': '20'})
        result = run(way, nodes)
        self.assertEqual([a['selected_speed_kph'] for a in result['arcs']], [10, 20, 10, 20])
        self.assertEqual(result['arcs'][0]['travel_time'], 2 * result['arcs'][1]['travel_time'])
        del way['tags']['maxspeed:backward']
        self.assertEqual(run(way, nodes)['arcs'][1]['selected_raw_speed'], '30 mph')

    def test_unknown_or_out_of_domain_never_clamps_or_falls_back(self):
        for raw in ('', '0', '-5', '161', '100 mph', '30;50', 'signals', 'none', 'walk', 'US:urban',
                    '30 mph trailing', '30 knots', ' 30', '30 ', 'NaN', 'inf', '1e2', '12.3456', '0300', '٣٠'):
            way, nodes = fixture(); way['tags']['maxspeed'] = raw
            with self.subTest(raw=raw): self.rejected(run(way, nodes))

    def test_overridden_and_denied_direction_values_must_still_be_supported(self):
        way, nodes = fixture(); way['tags'].update({'oneway': 'yes', 'maxspeed:backward': 'signals'})
        self.rejected(run(way, nodes))
        way['tags'].update({'maxspeed:backward': '20', 'maxspeed:forward': '20', 'maxspeed': 'bad'})
        self.rejected(run(way, nodes))

    def test_speed_namespaces_node_extents_and_conditionals_require_separate_contract(self):
        for key in ('maxspeed:conditional', 'maxspeed:advisory', 'maxspeed:motorcar', 'maxspeed:lanes', 'maxspeed:variable'):
            way, nodes = fixture(); way['tags'][key] = '20'
            self.rejected(run(way, nodes))
        way, nodes = fixture(); nodes[0]['tags']['maxspeed'] = '20'
        self.rejected(run(way, nodes))
        way, nodes = fixture(); way['tags']['maxspeed:conditional'] = '20 @ (We)'
        self.rejected(run(way, nodes, feature_zones={'way:10': 'America/Denver'}))

    def test_permissions_and_complete_context_cannot_be_bypassed(self):
        way, nodes = fixture(); nodes[0]['tags']['access'] = 'no'
        self.assertEqual([a['id'] for a in run(way, nodes)['arcs']], ['raw:10:1:forward', 'raw:10:1:backward'])
        nodes[0]['tags'] = {'barrier': 'bollard'}; self.rejected(run(way, nodes))
        way, nodes = fixture(); self.rejected(run(way, nodes[:-1]))
        nodes[0]['lonlat'][0] += .001; self.rejected(run(way, nodes))

    def test_denied_directions_do_not_emit_weighted_arcs(self):
        way, nodes = fixture(); way['tags']['oneway'] = '-1'
        self.assertEqual([a['direction'] for a in run(way, nodes)['arcs']], ['backward', 'backward'])
        way['tags']['access'] = 'no'
        self.assertEqual(run(way, nodes)['arcs'], [])

    def test_zero_length_and_missing_geometry_reject_without_partial_arcs(self):
        way, nodes = fixture(); way['nodes'][2][1:] = way['nodes'][1][1:]; nodes[2]['lonlat'] = way['nodes'][1][1:]
        self.rejected(run(way, nodes))
        self.assertEqual(meters([-180, 40], [180, 40], 6371000), 0)
        self.assertEqual(meters([0, 90], [120, 90], 6371000), 0)

    def test_spherical_lengths_against_independent_geodesic_implementation(self):
        radius = policy()['earth_radius_m']; oracle = Geod(a=radius, b=radius)
        pairs = [([179.999, 40.], [-179.999, 40.]), ([0., 89.99], [120., 89.99]),
                 ([0., 0.], [179.99999999, .000000001]), ([10, -60], [-170, 60]),
                 ([0., 0.], [.001, 0.]), ([-105., 40.], [-105.0000001, 40.0000001])]
        rng = random.Random(247)
        for _ in range(200):
            x, y = rng.uniform(-178, 178), rng.uniform(-88, 88)
            pairs.append(([x, y], [x + rng.uniform(-1, 1), y + rng.uniform(-1, 1)]))
        for a, b in pairs:
            expected = oracle.inv(*a, *b)[2]
            self.assertAlmostEqual(meters(a, b, radius), expected, delta=max(1e-7, expected * 1e-10))
        self.assertAlmostEqual(meters([0, 0], [1, 0], radius), radius * math.pi / 180, places=7)

    def test_actual_source_weights_keep_bollard_unsupported(self):
        raw = json.loads((ROOT / 'docs/research/fort-collins-entry-context/raw-osm-context.json').read_text())
        for wid, expected_status in [(696728766, 'supported_segment_weights'), (1475543490, 'supported_segment_weights'), (815164359, 'unsupported')]:
            way = next(w for w in raw['ways'] if w['id'] == wid)
            ids = {r[0] for r in way['nodes']}; nodes = [n for n in raw['nodes'] if n['id'] in ids]
            result = run(way, nodes); self.assertEqual(result['status'], expected_status)
            if result['arcs']:
                self.assertEqual(result['arcs'][0]['selected_raw_speed'], '30 mph' if wid == 1475543490 else None)
                self.assertFalse(result['route_cost_emitted'])

    def test_raw_input_and_policy_bindings_are_present(self):
        result = run(*fixture())
        for key in ('scenario_sha256', 'cost_policy_sha256', 'permission_projection_sha256', 'raw_input_sha256'):
            self.assertEqual(len(result[key]), 64)
        way, nodes = fixture(); way['tags']['maxspeed'] = '20'
        self.assertNotEqual(result['raw_input_sha256'], run(way, nodes)['raw_input_sha256'])
