import copy
from fractions import Fraction
import json
import unittest
from reference_via_node_compile import compile_relation
from road_reference_way_permissions import DEFAULTS
from road_reference_scenario import ROOT, load
from road_maneuver_probe import solve
from test_road_maneuver_probe import independent_history_truth


def fixture():
    ways = [dict(id=10, tags={'highway': 'residential', 'oneway': 'no'},
                 nodes=[[1, 0., 0.], [2, .001, 0.], [3, .002, 0.]]),
            dict(id=20, tags={'highway': 'residential', 'oneway': 'no'},
                 nodes=[[3, .002, 0.], [4, .002, .001], [5, .002, .002]])]
    coordinates = {row[0]: row[1:] for way in ways for row in way['nodes']}
    nodes = [dict(id=nid, lonlat=xy, tags={}) for nid, xy in sorted(coordinates.items())]
    relation = dict(id=42, tags={'type': 'restriction', 'restriction': 'no_left_turn'},
        members=[dict(type='w', ref=10, role='from'), dict(type='n', ref=3, role='via'), dict(type='w', ref=20, role='to')])
    return relation, ways, nodes


def compile_case(relation, ways, nodes, **kwargs):
    return compile_relation(relation, ways, nodes, default_policy=DEFAULTS, **kwargs)


class ReferenceViaNodeCompileTests(unittest.TestCase):
    def compiled(self, result):
        self.assertEqual(result['status'], 'compiled_declared_transition', result.get('reason'))
        self.assertTrue(result['topology_compiled'])
        for flag in ('access_verified', 'route_cost_emitted', 'release_eligible', 'anchors_adopted',
                     'independent_maneuver_geometry_verified', 'all_incident_ways_accounted', 'other_relations_accounted'):
            self.assertIs(result[flag], False)

    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported')
        self.assertFalse(result['topology_compiled'])
        self.assertIsNone(result['declared_arc_sequence'])
        self.assertIsNone(result['transition'])
        self.assertIsNone(result['active_pattern'])

    def test_exact_segment_indices_and_node_continuity(self):
        result = compile_case(*fixture()); self.compiled(result)
        self.assertEqual(result['declared_arc_sequence'], ['raw:10:1:forward', 'raw:20:0:forward'])
        self.assertEqual([(arc['from'], arc['to']) for arc in result['transition']], [(2, 3), (3, 4)])
        self.assertEqual(result['active_pattern']['kind'], 'no')

    def test_all_raw_way_orientation_combinations(self):
        for reverse_from, reverse_to, expected in [
            (False, False, ['raw:10:1:forward', 'raw:20:0:forward']),
            (True, False, ['raw:10:0:backward', 'raw:20:0:forward']),
            (False, True, ['raw:10:1:forward', 'raw:20:1:backward']),
            (True, True, ['raw:10:0:backward', 'raw:20:1:backward'])]:
            with self.subTest(reverse_from=reverse_from, reverse_to=reverse_to):
                relation, ways, nodes = fixture()
                if reverse_from: ways[0]['nodes'].reverse()
                if reverse_to: ways[1]['nodes'].reverse()
                result = compile_case(relation, ways, nodes); self.compiled(result)
                self.assertEqual(result['declared_arc_sequence'], expected)

    def test_oneway_and_exact_via_node_access_cannot_be_overridden(self):
        relation, ways, nodes = fixture(); ways[0]['tags']['oneway'] = '-1'
        self.rejected(compile_case(relation, ways, nodes))
        relation, ways, nodes = fixture(); nodes[2]['tags']['motorcar'] = 'no'
        self.rejected(compile_case(relation, ways, nodes))

    def test_remote_known_node_denial_vs_unknown_control(self):
        relation, ways, nodes = fixture(); nodes[0]['tags']['access'] = 'no'
        self.compiled(compile_case(relation, ways, nodes))  # Only the adjacent incoming segment is matched.
        nodes[0]['tags'] = {'barrier': 'gate'}
        self.rejected(compile_case(relation, ways, nodes))  # Unknown context cannot be cropped away.

    def test_missing_duplicate_foreign_or_misaligned_node_context(self):
        relation, ways, nodes = fixture()
        self.rejected(compile_case(relation, ways, nodes[:-1]))
        duplicate = copy.deepcopy(nodes); duplicate[-1] = copy.deepcopy(duplicate[0])
        self.rejected(compile_case(relation, ways, duplicate))
        foreign = copy.deepcopy(nodes); foreign[-1]['id'] = 99
        self.rejected(compile_case(relation, ways, foreign))
        moved = copy.deepcopy(nodes); moved[2]['lonlat'] = [.00201, 0.]
        self.rejected(compile_case(relation, ways, moved))

    def test_nearby_coordinate_is_not_shared_raw_node(self):
        relation, ways, nodes = fixture(); ways[1]['nodes'][0][0] = 30
        nodes.append(dict(id=30, lonlat=[.002, 0.], tags={}))
        self.rejected(compile_case(relation, ways, nodes))

    def test_parallel_or_extra_member_way_cannot_be_substituted(self):
        relation, ways, nodes = fixture(); replacement = copy.deepcopy(ways); replacement[1]['id'] = 21
        self.rejected(compile_case(relation, replacement, nodes))
        extra = copy.deepcopy(ways[1]); extra['id'] = 30
        self.rejected(compile_case(relation, ways + [extra], nodes))

    def test_interior_and_repeated_via_need_separate_split_contract(self):
        relation, ways, nodes = fixture(); ways[0]['nodes'][1:] = list(reversed(ways[0]['nodes'][1:]))
        self.rejected(compile_case(relation, ways, nodes))
        relation, ways, nodes = fixture(); ways[0]['nodes'].insert(0, copy.deepcopy(ways[0]['nodes'][-1]))
        self.rejected(compile_case(relation, ways, nodes))

    def test_same_way_uturn_retains_distinct_directed_segment_identities(self):
        relation, ways, nodes = fixture(); relation['members'][2]['ref'] = 10
        relation['tags']['restriction'] = 'no_u_turn'
        result = compile_case(relation, ways[:1], nodes[:3]); self.compiled(result)
        self.assertEqual(result['declared_arc_sequence'], ['raw:10:1:forward', 'raw:10:1:backward'])
        self.assertFalse(result['independent_maneuver_geometry_verified'])

    def test_inactive_or_excepted_declarations_still_require_complete_geometry(self):
        relation, ways, nodes = fixture(); relation['tags'] = {'type': 'restriction', 'restriction:conditional': 'no_left_turn @ (Mo)'}
        result = compile_case(relation, ways, nodes, relation_zone='America/Denver'); self.compiled(result)
        self.assertIsNone(result['active_pattern']); self.assertFalse(result['selection']['applies'])
        self.rejected(compile_case(relation, ways, nodes[:-1], relation_zone='America/Denver'))
        relation['tags'] = {'type': 'restriction', 'restriction': 'no_left_turn', 'except': 'motorcar'}
        result = compile_case(relation, ways, nodes); self.compiled(result); self.assertIsNone(result['active_pattern'])

    def test_relation_zone_is_not_a_way_zone_fallback(self):
        relation, ways, nodes = fixture(); ways[0]['tags']['motorcar:conditional'] = 'yes @ (We)'
        self.rejected(compile_case(relation, ways, nodes, relation_zone='America/Denver'))
        self.compiled(compile_case(relation, ways, nodes, relation_zone='America/Denver', feature_zones={'way:10': 'America/Denver'}))
        self.rejected(compile_case(relation, ways, nodes, feature_zones={'way:999': 'America/Denver'}))

    def test_invalid_selection_and_budgets_never_emit_partial_patterns(self):
        relation, ways, nodes = fixture(); relation['tags']['restriction:conditional'] = 'no_left_turn @ (PH)'
        self.rejected(compile_case(relation, ways, nodes, relation_zone='America/Denver'))
        relation, ways, nodes = fixture(); ways[0]['nodes'] *= 501
        self.rejected(compile_case(relation, ways, nodes))
        relation, ways, nodes = fixture(); nodes[0]['extra_metadata'] = 'not silently ignored'
        self.rejected(compile_case(relation, ways, nodes))

    def test_actual_fort_collins_rule_compiles_same_segments_at_inactive_and_active_times(self):
        raw = json.loads((ROOT / 'docs/research/fort-collins-entry-context/raw-osm-context.json').read_text())
        relation = raw['restrictions'][0]; member_ids = {m['ref'] for m in relation['members'] if m['type'] == 'w'}
        ways = [w for w in raw['ways'] if w['id'] in member_ids]
        ids = {row[0] for way in ways for row in way['nodes']}; nodes = [n for n in raw['nodes'] if n['id'] in ids]
        before = copy.deepcopy((relation, ways, nodes))
        inactive = compile_case(relation, ways, nodes, relation_zone='America/Denver'); self.compiled(inactive)
        scenario = load(); scenario['reference_instant_utc'] = '2026-10-30T01:00:00Z'
        active = compile_case(relation, ways, nodes, relation_zone='America/Denver', scenario=scenario); self.compiled(active)
        expected = ['raw:696728766:5:forward', 'raw:1475543490:0:forward']
        self.assertEqual(inactive['declared_arc_sequence'], expected); self.assertIsNone(inactive['active_pattern'])
        self.assertEqual(active['active_pattern']['arc_sequence'], expected)
        self.assertNotEqual(inactive['scenario_sha256'], active['scenario_sha256'])
        self.assertEqual((relation, ways, nodes), before)

    def test_compiled_no_and_only_patterns_match_independent_history_oracle(self):
        relation, ways, nodes = fixture(); original = copy.deepcopy((relation, ways, nodes))
        for raw_kind in ('no_left_turn', 'only_left_turn'):
            relation['tags']['restriction'] = raw_kind
            compiled = compile_case(relation, ways, nodes); self.compiled(compiled)
            arcs = [dict(arc, length=1, travel_time=2) for arc in compiled['transition']]
            arcs.extend([dict(id='detour-a', way=30, **{'from': 3, 'to': 6}, length=3, travel_time=1),
                         dict(id='detour-b', way=40, **{'from': 6, 'to': 4}, length=3, travel_time=1)])
            patterns = [compiled['active_pattern']]
            for metric in ('length', 'travel_time'):
                for start, end in ((2, 4), (3, 4), (2, 6), (2, 2)):
                    actual = solve(range(1, 7), arcs, patterns, start, end, metric)
                    truth = independent_history_truth(arcs, patterns, start, end, metric)
                    self.assertEqual(truth, None if actual['cost'] is None else Fraction(*map(int, actual['exact_stored_path_cost'])))
            if raw_kind.startswith('no_'):
                self.assertEqual(solve(range(1, 7), arcs, patterns, 2, 4)['arc_path'], ['raw:10:1:forward', 'detour-a', 'detour-b'])
            else:
                self.assertEqual(solve(range(1, 7), arcs, patterns, 2, 4)['arc_path'], ['raw:10:1:forward', 'raw:20:0:forward'])
        relation['tags']['restriction'] = original[0]['tags']['restriction']
        self.assertEqual((relation, ways, nodes), original)
