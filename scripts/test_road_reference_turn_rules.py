import copy
import json
import unittest
from road_reference_scenario import ROOT, load
from road_reference_turn_rules import resolve


def fixture(tags=None):
    return dict(id=42, tags={'type': 'restriction', 'restriction': 'no_u_turn', **(tags or {})},
        members=[dict(type='w', ref=1, role='from'), dict(type='n', ref=2, role='via'), dict(type='w', ref=3, role='to')])


def at(instant):
    scenario = load(); scenario['reference_instant_utc'] = instant; return scenario


class ReferenceTurnRuleTests(unittest.TestCase):
    def check_rule(self, result, applies, value):
        self.assertEqual(result['status'], 'resolved_relation_applicability', result.get('reason'))
        self.assertIs(result['applies'], applies)
        self.assertEqual(result['selected_raw_value'], value)
        for flag in ('topology_compiled', 'turn_legality_certified', 'geographic_timezone_assignment_verified',
                     'other_relations_accounted', 'route_cost_emitted', 'access_verified', 'anchors_adopted', 'release_eligible'):
            self.assertIs(result[flag], False)

    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported')
        self.assertIsNone(result['applies'])
        self.assertIsNone(result['selected_raw_value'])
        self.assertFalse(result['topology_compiled']); self.assertFalse(result['route_cost_emitted'])

    def test_real_conditional_only_relation_keeps_missing_base_and_exact_boundaries(self):
        raw = json.loads((ROOT / 'docs/research/fort-collins-entry-context/raw-osm-context.json').read_text())
        relation = raw['restrictions'][0]; before = copy.deepcopy(relation)
        for instant, applies in [('2026-10-28T18:00:00Z', False), ('2026-10-30T00:59:59Z', False),
                                 ('2026-10-30T01:00:00Z', True), ('2026-10-30T05:59:59Z', True),
                                 ('2026-10-30T06:00:00Z', False), ('2026-11-01T01:00:00Z', True),
                                 ('2026-11-01T06:00:00Z', False)]:
            with self.subTest(instant=instant):
                result = resolve(relation, zone='America/Denver', scenario=at(instant))
                self.check_rule(result, applies, 'no_u_turn' if applies else None)
                self.assertEqual(result['declared_members'], relation['members'])
        self.assertEqual(relation, before)
        self.assertNotIn('restriction', relation['tags'])

    def test_static_and_car_mode_override_come_before_less_specific_conditional(self):
        relation = fixture({'restriction:conditional': 'only_right_turn @ (We)', 'restriction:motorcar': 'no_left_turn'})
        result = resolve(relation, zone='America/Denver')
        self.check_rule(result, True, 'no_left_turn')
        self.assertEqual(result['selected_key'], 'restriction:motorcar')
        self.check_rule(resolve(fixture({'restriction:motor_vehicle': 'only_straight_on',
                                        'restriction:motorcar': 'no_right_turn'})), True, 'no_right_turn')

    def test_active_same_mode_conditional_and_last_clause_win(self):
        relation = fixture({'restriction:conditional': 'no_left_turn @ (We); only_right_turn @ (We 12:00-13:00)'})
        result = resolve(relation, zone='America/Denver')
        self.check_rule(result, True, 'only_right_turn')
        self.assertEqual(result['raw_value_traces'][0]['matching_clause_indices'], [0, 1])
        relation['tags']['restriction:conditional'] = 'only_right_turn @ (We 12:00-13:00); no_left_turn @ (We)'
        self.check_rule(resolve(relation, zone='America/Denver'), True, 'no_left_turn')

    def test_inactive_more_specific_without_base_falls_back_to_generic_static(self):
        result = resolve(fixture({'restriction:motorcar:conditional': 'no_left_turn @ (Mo)'}), zone='America/Denver')
        self.check_rule(result, True, 'no_u_turn')
        self.assertEqual(result['selected_key'], 'restriction')

    def test_explicit_car_exemption_keeps_raw_rule_but_is_not_a_turn_permission(self):
        for exception in ('motorcar', 'motor_vehicle', 'vehicle', 'bicycle; motorcar'):
            relation = fixture({'except': exception}); before = copy.deepcopy(relation)
            result = resolve(relation)
            self.check_rule(result, False, 'no_u_turn')
            self.assertEqual(result['basis'], 'explicit_car_exception')
            self.assertEqual(relation, before)
        self.check_rule(resolve(fixture({'except': 'bicycle;bus'})), True, 'no_u_turn')

    def test_unknown_exception_purpose_or_conditional_exception_fails_closed(self):
        for exception in ('delivery', 'destination', 'permit', 'unknown', 'motorcar;motorcar', '', 'bus;'):
            with self.subTest(exception=exception): self.rejected(resolve(fixture({'except': exception})))
        self.rejected(resolve(fixture({'except:conditional': 'motorcar @ (We)'}), zone='America/Denver'))

    def test_unsupported_syntax_cannot_hide_behind_exemption_or_higher_mode(self):
        for tags in ({'restriction:conditional': 'no_u_turn @ (PH)', 'except': 'motorcar'},
                     {'restriction:conditional': 'no_u_turn @ (wet)', 'restriction:motorcar': 'no_left_turn'},
                     {'restriction:conditional': 'no_u_turn @ (We); no_left_turn @ (weight>3.5)'}):
            self.rejected(resolve(fixture(tags), zone='America/Denver'))

    def test_unsupported_kind_cannot_hide_in_inactive_later_clause(self):
        for kind in ('none', 'no_entry', 'no_exit', 'magic', 'no_left_turn;no_right_turn'):
            with self.subTest(kind=kind): self.rejected(resolve(fixture({'restriction': kind})))
        self.rejected(resolve(fixture({'restriction:conditional': 'no_u_turn @ (We); magic @ (Mo)'}), zone='America/Denver'))

    def test_explicit_valid_zone_required_and_never_borrowed_from_host(self):
        relation = fixture({'restriction:conditional': 'only_right_turn @ (We 12:00-13:00)'})
        self.rejected(resolve(relation))
        self.rejected(resolve(relation, zone='America/Unknown'))
        self.check_rule(resolve(relation, zone='America/Denver'), True, 'only_right_turn')
        self.check_rule(resolve(relation, zone='America/Phoenix'), True, 'no_u_turn')

    def test_unknown_mode_lane_legacy_or_additional_vehicle_context_unsupported(self):
        for tags in ({'restriction:vehicle': 'no_u_turn'}, {'restriction:lanes': 'no_left_turn'},
                     {'day_on': 'Mo'}, {'hour_on': '08:00'}, {'motorcar': 'yes'}, {'hov': 'yes'},
                     {'maxheight': '2'}, {'opening_hours': '24/7'}, {'source:conditional': 'x @ (We)'}):
            with self.subTest(tags=tags): self.rejected(resolve(fixture(tags), zone='America/Denver'))

    def test_via_way_extra_missing_and_duplicate_members_not_partially_accepted(self):
        relation = fixture(); relation['members'][1]['type'] = 'w'; self.rejected(resolve(relation))
        relation = fixture(); relation['members'].pop(); self.rejected(resolve(relation))
        relation = fixture(); relation['members'].append(dict(type='n', ref=4, role='location_hint')); self.rejected(resolve(relation))
        relation = fixture(); relation['members'][1]['role'] = 'from'; self.rejected(resolve(relation))
        relation = fixture(); relation['members'][0]['ref'] = True; self.rejected(resolve(relation))

    def test_no_car_relevant_rule_is_unsupported_not_unrestricted(self):
        relation = fixture(); relation['tags'] = {'type': 'restriction', 'restriction:bicycle': 'no_u_turn'}
        self.rejected(resolve(relation))
        relation['tags'] = {'type': 'restriction'}; self.rejected(resolve(relation))

    def test_tag_clause_and_identity_budgets_withhold_all_output(self):
        relation = fixture({'restriction:conditional': ';'.join(['no_u_turn @ (We)'] * 33)})
        self.rejected(resolve(relation, zone='America/Denver'))
        relation = fixture(); relation['id'] = 2**63; self.rejected(resolve(relation))
        relation = fixture(); relation['tags'].update({str(i): 'x' for i in range(65)}); self.rejected(resolve(relation))
        relation = fixture(); relation['tags']['restriction'] = 'x' * 8193; self.rejected(resolve(relation))
        relation = fixture(); relation['unexpected_metadata'] = 'ignored?'; self.rejected(resolve(relation))

    def test_raw_hash_and_member_copy_bind_without_mutating_evidence(self):
        relation = fixture(); before = copy.deepcopy(relation)
        original = resolve(relation); original['declared_members'][0]['ref'] = 99
        self.assertEqual(relation, before)
        relation['members'][0]['ref'] = 4
        changed = resolve(relation)
        self.assertNotEqual(original['input_sha256'], changed['input_sha256'])


if __name__ == '__main__':
    unittest.main()
