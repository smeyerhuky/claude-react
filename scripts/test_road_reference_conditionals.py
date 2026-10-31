import copy
from datetime import datetime,timezone
import json
from pathlib import Path
import unittest
from road_reference_conditionals import resolve_tag,parse_condition,matches,parse_expression,UnsupportedCondition,MAX_CLAUSES,MAX_EXPRESSION
from road_reference_scenario import load


def scenario_at(instant):
    result=load();result['reference_instant_utc']=instant;return result


class WeeklyReferenceConditionalTests(unittest.TestCase):
    def resolve(self,expression,instant='2026-10-28T18:00:00Z',base='yes',zone='America/Phoenix'):
        tags={'motor_vehicle:conditional':expression}
        if base is not None:tags['motor_vehicle']=base
        return resolve_tag(tags,'motor_vehicle',scenario_at(instant),zone)

    def test_real_peak_clause_inactive_base_and_exact_end_boundary(self):
        expression='no @ (Mo-Fr 06:00-09:00,15:00-19:00)'
        for instant,expected in [('2026-10-28T18:00:00Z','yes'),('2026-10-28T14:00:00Z','no'),
                                 ('2026-10-28T15:59:59Z','no'),('2026-10-28T16:00:00Z','yes'),
                                 ('2026-10-28T22:00:00Z','no'),('2026-10-29T02:00:00Z','yes')]:
            with self.subTest(instant=instant):self.assertEqual(self.resolve(expression,instant)['selected_raw_value'],expected)

    def test_declared_zone_changes_clock_without_changing_absolute_reference(self):
        expression='no @ (Mo-Fr 06:00-09:00)'
        self.assertEqual(self.resolve(expression,'2026-10-28T15:00:00Z',zone='America/Phoenix')['selected_raw_value'],'no')
        self.assertEqual(self.resolve(expression,'2026-10-28T15:00:00Z',zone='America/Denver')['selected_raw_value'],'yes')
        with self.assertRaises(ValueError):self.resolve(expression,zone='America/Unknown')

    def test_overnight_uses_previous_weekday_and_week_wrapping(self):
        expression='no @ (Fr 22:00-02:00)'
        for instant,expected in [('2026-10-30T07:00:00Z','yes'),('2026-10-31T07:00:00Z','no'),('2026-10-31T08:00:00Z','yes')]:
            with self.subTest(instant=instant):self.assertEqual(self.resolve(expression,instant,zone='America/Denver')['selected_raw_value'],expected)
        self.assertEqual(self.resolve('no @ (Fr-Mo 20:00-02:00)','2026-10-27T07:00:00Z',zone='America/Denver')['selected_raw_value'],'no')

    def test_last_matching_outer_clause_wins_but_missing_base_never_means_yes(self):
        result=self.resolve('no @ (Mo-Fr 06:00-20:00); yes @ (We 10:00-14:00)')
        self.assertEqual(result['selected_raw_value'],'yes');self.assertEqual(result['matching_clause_indices'],[0,1]);self.assertEqual(result['selected_clause_index'],1)
        self.assertEqual(self.resolve('yes @ (We 10:00-14:00); no @ (Mo-Fr 06:00-20:00)')['selected_raw_value'],'no')
        result=self.resolve('no @ (Mo-Fr 06:00-09:00)',base=None)
        self.assertIsNone(result['selected_raw_value']);self.assertEqual(result['value_source'],'missing_explicit_base')
        self.assertFalse(result['access_verified']);self.assertFalse(result['route_cost_emitted'])

    def test_clock_only_weekday_only_and_full_day_are_explicit(self):
        for expression in ('no @ 10:00-12:00','no @ (We)','no @ (Mo-Su 00:00-24:00)'):
            with self.subTest(expression=expression):self.assertEqual(self.resolve(expression)['selected_raw_value'],'no')
        condition=parse_condition('Mo, We, Fr 10:00-12:00')
        self.assertTrue(matches(condition,datetime(2026,10,28,11,tzinfo=timezone.utc)))

    def test_unsupported_later_clause_cannot_be_hidden_by_a_matching_earlier_clause(self):
        for expression in ('no @ (PH 06:00-09:00)','no @ (wet)','no @ (weight>3.5)',
                           'no @ (Mo-Fr 06:00-09:00 AND disabled)','no @ (Oct 01-31 06:00-09:00)',
                           'yes @ (Mo-Su 00:00-24:00); no @ (wet)',
                           'no @ (Mo-Fr 06:00-09:00; Sa 10:00-11:00)','no @ (Mo 00:00-00:00)',
                           'no @ (Mo 26:00-27:00)','no @ (Mo 08:00-09:00'):
            with self.subTest(expression=expression),self.assertRaises(UnsupportedCondition):self.resolve(expression)

    def test_bounded_input_and_no_partial_resolution(self):
        for expression in ('x'*(MAX_EXPRESSION+1),';'.join(['no @ (Mo 08:00-09:00)']*(MAX_CLAUSES+1)),
                           'no @ (Mo,Tu,We,Th,Fr,Sa,Su,Mo 08:00-09:00)',
                           'no @ (Mo '+','.join(['08:00-09:00']*17)+')','',True):
            with self.subTest(expression=str(expression)[:60]),self.assertRaises(UnsupportedCondition):parse_expression(expression)
        with self.assertRaises(UnsupportedCondition):resolve_tag({'motor_vehicle':'no @ (Mo 08:00-09:00)'},'motor_vehicle',load(),'UTC')

    def test_dst_repeated_and_skipped_wall_clocks_are_converted_from_utc(self):
        expression='no @ (Su 01:00-02:00)'
        for instant in ('2026-11-01T05:30:00Z','2026-11-01T06:30:00Z'):
            with self.subTest(instant=instant):self.assertEqual(self.resolve(expression,instant,zone='America/New_York')['selected_raw_value'],'no')
        self.assertEqual(self.resolve(expression,'2026-11-01T07:00:00Z',zone='America/New_York')['selected_raw_value'],'yes')
        self.assertEqual(self.resolve('no @ (Su 02:00-03:00)','2026-03-08T07:00:00Z',zone='America/New_York')['selected_raw_value'],'yes')

    def test_actual_retained_arizona_tag_stays_unmodified_and_uncertified(self):
        root=Path(__file__).resolve().parents[1]
        raw=json.loads((root/'docs/research/raw-via-way-compiler/arizona-context.json').read_text())
        way=next(w for w in raw['ways'] if w['id']==437327483);before=copy.deepcopy(way['tags'])
        result=resolve_tag(way['tags'],'motor_vehicle',load(),'America/Phoenix')
        self.assertEqual(result['selected_raw_value'],'yes');self.assertEqual(before,way['tags'])
        self.assertFalse(result['access_verified']);self.assertFalse(result['release_eligible'])
        # Resolving one raw value must not remove a compiler's remaining controls.
        from road_via_way_compile import compile_relation,UnsupportedViaWay
        with self.assertRaisesRegex(UnsupportedViaWay,'Conditional member-way'):
            compile_relation(raw['restrictions'][0],raw['ways'],[])


if __name__=='__main__':unittest.main()
