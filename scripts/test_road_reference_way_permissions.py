import copy
import json
from pathlib import Path
import unittest
from road_reference_way_permissions import evaluate, DEFAULTS
from road_reference_scenario import load


def fixture(tags=None):
    way = dict(id=10, nodes=[[1, -105, 40], [2, -105.001, 40]],
               tags={'highway': 'residential', **(tags or {})})
    nodes = [dict(id=row[0], lonlat=row[1:], tags={}) for row in way['nodes']]
    return way, nodes


class ReferenceWayPermissionTests(unittest.TestCase):
    def run_way(self, tags=None, node_tags=None, zones=None, scenario=None):
        way, nodes = fixture(tags)
        if node_tags is not None:
            nodes[0]['tags'] = node_tags
        return evaluate(way, nodes, default_policy=DEFAULTS, feature_zones=zones, scenario=scenario)

    def allowed(self, result, expected):
        self.assertEqual(result['status'], 'supported_tag_projection', result.get('reason'))
        self.assertEqual(result['eligible_directions'], expected)
        for key in ('access_verified', 'release_eligible', 'route_cost_emitted', 'anchors_adopted',
                    'geographic_timezone_assignment_verified', 'turn_restrictions_evaluated'):
            self.assertIs(result[key], False)

    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported')
        self.assertIsNone(result['direction_permissions'])
        self.assertEqual(result['eligible_directions'], [])
        self.assertFalse(result['route_cost_emitted'])

    def test_defaults_are_explicit_model_assumptions_not_raw_yes(self):
        result = self.run_way()
        self.allowed(result, ['forward', 'backward'])
        selected = result['direction_permissions']['forward']['access_selection']
        self.assertIsNone(selected['raw_value'])
        self.assertEqual(selected['basis'], 'declared_US_highway_default')
        with self.assertRaises(ValueError):
            evaluate(*fixture(), default_policy='implicit')

    def test_mode_specificity_precedes_direction_and_conditional(self):
        self.allowed(self.run_way({'vehicle': 'no', 'motor_vehicle': 'no', 'motorcar': 'yes',
                                  'access:forward': 'no', 'access:conditional': 'no @ (We)'},
                                 zones={'way:10': 'America/Denver'}), ['forward', 'backward'])
        self.allowed(self.run_way({'access': 'yes', 'vehicle': 'no'}), [])
        self.allowed(self.run_way({'access:forward': 'yes', 'motorcar': 'no'}), [])

    def test_direction_specificity_precedes_same_mode_bare_conditional(self):
        result = self.run_way({'motorcar:forward': 'no', 'motorcar:conditional': 'yes @ (We)'},
                              zones={'way:10': 'America/Denver'})
        self.allowed(result, ['backward'])
        result = self.run_way({'motorcar:forward': 'no',
                              'motorcar:forward:conditional': 'yes @ (We)', 'motorcar': 'no'},
                              zones={'way:10': 'America/Denver'})
        self.allowed(result, ['forward'])

    def test_last_matching_clause_and_frozen_zone_clock(self):
        tags = {'motorcar': 'yes', 'motorcar:conditional': 'no @ (We); yes @ (We 11:00-12:00)'}
        self.allowed(self.run_way(tags, zones={'way:10': 'America/Phoenix'}), ['forward', 'backward'])
        self.allowed(self.run_way(tags, zones={'way:10': 'America/Denver'}), [])

    def test_missing_conditional_base_stays_missing_and_default_is_separate(self):
        result = self.run_way({'motorcar:conditional': 'no @ (Mo)'}, zones={'way:10': 'America/Denver'})
        self.allowed(result, ['forward', 'backward'])
        trace = next(t for t in result['raw_value_traces'] if t['key'] == 'motorcar')
        self.assertIsNone(trace['selected_raw_value'])
        self.assertEqual(trace['source'], 'missing_explicit_base')
        self.assertEqual(result['direction_permissions']['forward']['access_selection']['basis'],
                         'declared_US_highway_default')

    def test_oneway_and_car_override_and_implied_rules(self):
        for tags, expected in [({'oneway': '-1'}, ['backward']),
                               ({'oneway': 'yes', 'oneway:motorcar': 'no'}, ['forward', 'backward']),
                               ({'junction': 'roundabout'}, ['forward'])]:
            with self.subTest(tags=tags): self.allowed(self.run_way(tags), expected)
        self.allowed(self.run_way({'oneway:conditional': 'yes @ (We)', 'oneway:motorcar': 'no'},
                                 zones={'way:10': 'America/Denver'}), ['forward', 'backward'])
        for value in ('reversible', 'alternating', 'unknown'):
            self.rejected(self.run_way({'oneway': value}))

    def test_highway_defaults_are_bounded_and_explicit_oneway_overrides_implied(self):
        self.allowed(self.run_way({'highway': 'motorway'}), ['forward'])
        self.allowed(self.run_way({'junction': 'roundabout', 'oneway': 'no'}), ['forward', 'backward'])
        self.allowed(self.run_way({'highway': 'motorway_link', 'oneway': 'yes'}), ['forward'])
        for tags in ({'highway': 'motorway_link'}, {'junction': 'circular'}, {'highway': 'footway'},
                     {'highway': 'construction'}, {'highway': 'track'}):
            self.rejected(self.run_way(tags))

    def test_node_denial_composes_without_overriding_way_denial(self):
        result = self.run_way({'motorcar': 'yes'}, {'vehicle': 'no'})
        self.allowed(result, [])
        self.assertEqual(result['direction_permissions']['forward']['node_denials'], [1])
        self.allowed(self.run_way({'motorcar': 'no'}, {'motorcar': 'yes'}), [])
        self.allowed(self.run_way({}, {'access': 'no', 'motorcar': 'yes'}), ['forward', 'backward'])

    def test_every_controlled_feature_needs_own_explicit_zone(self):
        tags = {'motorcar:conditional': 'yes @ (We)'}
        node = {'access:conditional': 'no @ (We)'}
        self.rejected(self.run_way(tags, node, {'way:10': 'America/Denver'}))
        self.rejected(self.run_way(tags, node, {'node:1': 'America/Denver'}))
        self.allowed(self.run_way(tags, node, {'way:10': 'America/Denver', 'node:1': 'America/Denver'}), [])
        self.rejected(self.run_way(tags, zones={'way:10': 'America/Unknown'}))

    def test_unmodeled_controls_and_unknown_purpose_never_emit_permissions(self):
        for tags in ({'hov': 'yes'}, {'motorcar:lanes': 'yes|no'}, {'lanes:psv': '1'},
                     {'motorcar:both_ways': 'no'}, {'oneway:motorcar:forward': 'yes'},
                     {'maxheight': '2.1'}, {'barrier': 'gate'}, {'opening_hours': '24/7'},
                     {'traffic_sign': 'US:R5-1'}, {'construction': 'minor'}, {'access': 'destination'},
                     {'access': 'customers'}, {'access': 'permit'}, {'oneway:conditional': 'yes @ (wet)'}):
            with self.subTest(tags=tags): self.rejected(self.run_way(tags, zones={'way:10': 'America/Denver'}))
        for tags in ({'access:forward': 'no'}, {'oneway': 'yes'}, {'barrier': 'bollard'}):
            with self.subTest(node=tags): self.rejected(self.run_way(node_tags=tags))

    def test_unknown_late_or_hidden_conditional_cannot_be_bypassed(self):
        for tags in ({'motorcar': 'yes', 'access:conditional': 'no @ (PH)'},
                     {'motorcar:conditional': 'yes @ (We); no @ (wet)'},
                     {'maxspeed:conditional': '20 @ (We)'}):
            self.rejected(self.run_way(tags, zones={'way:10': 'America/Denver'}))
        self.rejected(self.run_way({'motorcar:forward': 'yes', 'motorcar:backward': 'permit'}))

    def test_missing_duplicate_foreign_and_mismatched_node_records(self):
        way, nodes = fixture()
        variants = [[], nodes[:1], [nodes[0], nodes[0]], nodes + [nodes[0]]]
        changed = copy.deepcopy(nodes); changed[1]['id'] = 99; variants.append(changed)
        changed = copy.deepcopy(nodes); changed[1]['lonlat'][0] += 0.001; variants.append(changed)
        for variant in variants:
            self.rejected(evaluate(way, variant, default_policy=DEFAULTS))

    def test_geometry_tag_budgets_and_mutation(self):
        way, nodes = fixture({'motorcar': 'yes'})
        before = copy.deepcopy((way, nodes))
        result = evaluate(way, nodes, default_policy=DEFAULTS)
        self.allowed(result, ['forward', 'backward'])
        self.assertEqual((way, nodes), before)
        changed = copy.deepcopy(way); changed['nodes'][0][1] = float('nan')
        self.rejected(evaluate(changed, nodes, default_policy=DEFAULTS))
        changed = copy.deepcopy(way); changed['tags']['motorcar'] = 'x' * 8193
        self.rejected(evaluate(changed, nodes, default_policy=DEFAULTS))
        changed = copy.deepcopy(nodes); changed[0]['tags']['motorcar'] = False
        self.rejected(evaluate(way, changed, default_policy=DEFAULTS))
        self.rejected(evaluate(way, nodes, default_policy=DEFAULTS, feature_zones={'way:99': 'UTC'}))

    def test_original_raw_contexts_remain_unmodified_and_uncertified(self):
        root = Path(__file__).resolve().parents[1] / 'docs/research/reference-way-permissions'
        for state in ('colorado', 'arizona'):
            context = json.loads((root / (state + '-context.json')).read_text())
            before = copy.deepcopy(context)
            for way in context['ways']:
                ids = {row[0] for row in way['nodes']}
                nodes = [n for n in context['nodes'] if n['id'] in ids]
                result = evaluate(way, nodes, default_policy=DEFAULTS,
                                  feature_zones={f'way:{way["id"]}': 'America/Phoenix'} if state == 'arizona' else {})
                if state == 'colorado': self.allowed(result, ['forward'])
                if way['id'] == 437327483: self.rejected(result)
                self.assertFalse(result['access_verified'])
            self.assertEqual(context, before)


if __name__ == '__main__':
    unittest.main()
