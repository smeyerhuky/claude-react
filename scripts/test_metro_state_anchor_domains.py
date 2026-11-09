import copy
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from larimer_census_water_mask import encoded, geometry_encoded
from metro_state_anchor_domains import (OUTPUT, audit, inputs, scope, conditional_budget_case, preflight_originals)
from colorado_principal_city_domains import fraction, enclosing_ball, rectangle_distance_lower_bound


class MetroStateAnchorDomainTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls): cls.report = audit()

    def test_all_displayed_metros_and_required_cities_remain_explicit(self):
        report = self.report
        self.assertEqual(report, json.loads((OUTPUT/'report.json').read_bytes()))
        self.assertEqual((report['displayed_metros'],report['principal_city_memberships'],report['state_envelopes'],report['city_refinements']), (359,686,49,15))
        ids,members,states = scope()
        self.assertFalse(set(states)&{'AK','HI','PR'}); self.assertIn('DC',states)
        for context in report['contexts']:
            self.assertEqual([r['cbsa'] for r in context['metro_bounds']],ids)
            self.assertEqual(len(context['principal_city_memberships']),len(members))
            by_cbsa = {r['cbsa']:r for r in context['metro_bounds']}
            self.assertEqual(len(by_cbsa['19740']['principal_city_ids']),5)
            self.assertEqual(len(by_cbsa['22660']['principal_city_ids']),2)
            cross = [r for r in context['principal_city_memberships'] if r['cbsa']=='28140']
            self.assertTrue({'KS','MO'} <= {r['state'] for r in cross})
            washington = next(r for r in context['principal_city_memberships'] if r['principal_city_id']=='1150000')
            self.assertEqual(washington['state'],'DC')

    def test_planning_budgets_never_become_routes_or_approvals(self):
        report = self.report
        self.assertFalse(report['anchor_registry_adopted']); self.assertFalse(report['access_verified'])
        self.assertFalse(report['complete_global_competition']); self.assertFalse(report['release_eligible'])
        self.assertFalse(report['original_sources_replayed']); self.assertIsNone(report['travel_time_bounds'])
        self.assertEqual(report['applied_competitor_exclusions'],[])
        point,window = report['contexts']
        self.assertEqual(point['hypotheses'][0]['retained_or_unknown_ids'],['22660'])
        self.assertEqual(window['hypotheses'][1]['retained_or_unknown_ids'],['22660','24540'])
        for context in report['contexts']:
            ids={r['cbsa'] for r in context['metro_bounds']}
            for case in context['hypotheses']:
                excluded=set(case['conditional_bound_exceeds_assumption_ids']); retained=set(case['retained_or_unknown_ids'])
                self.assertFalse(excluded & retained); self.assertEqual(excluded | retained,ids)
                self.assertEqual(case['applied_competitor_exclusions'],[])
                self.assertFalse(case['feasible_incumbent_verified'])

    def test_city_refinements_are_not_replaced_with_native_census_origins(self):
        rows=self.report['contexts'][0]['principal_city_memberships']
        refined=[r for r in rows if r['domain_kind']=='city-envelope']
        self.assertEqual(len(refined),15)
        self.assertEqual({r['state'] for r in refined},{'CO','NE','WY'})
        self.assertEqual({r['name'] for r in refined if r['state']!='CO'},{'Cheyenne','Lincoln','Omaha'})
        _,_,boxes,cities=inputs()
        self.assertEqual(cities['3137000']['source_flags']['CLASSFP'],'C5')
        self.assertEqual(cities['5613900']['source_flags']['CLASSFP'],'C1')
        # The state envelope is strictly more permissive than the refined city
        # for these Nebraska destinations, so refinement may tighten the bound.
        q=self.report['contexts'][0]['destination_center_lonlat']
        self.assertLess(rectangle_distance_lower_bound(boxes['NE'],q),rectangle_distance_lower_bound(cities['3137000']['bounds_lonlat'],q))

    def test_metro_minimum_includes_every_required_city(self):
        for context in self.report['contexts']:
            radius=fraction(context['destination_radius_m_exact'])
            for metro in context['metro_bounds']:
                members=[r for r in context['principal_city_memberships'] if r['cbsa']==metro['cbsa']]
                self.assertEqual(fraction(metro['lower_bound_exact']),min(fraction(r['lower_bound_exact']) for r in members))
            if context['context']=='water-mask-window':
                from larimer_census_water_mask import BOUNDS
                self.assertEqual(context['destination_bounds_lonlat'],BOUNDS)
                self.assertEqual(context['destination_radius_m_exact'],enclosing_ball(BOUNDS)['radius_m_exact'])
                self.assertGreater(radius,0)

    def test_strict_ties_small_rational_gaps_and_refuted_incumbents(self):
        rows=[{'cbsa':'22660','lower_bound_exact':['0','1']},{'cbsa':'other','lower_bound_exact':['10000','1']}]
        self.assertEqual(conditional_budget_case(rows,10000)['conditional_bound_exceeds_assumption_ids'],[])
        self.assertEqual(conditional_budget_case(rows,Fraction(10000)-Fraction(1,10**30))['conditional_bound_exceeds_assumption_ids'],['other'])
        rows[0]['lower_bound_exact']=['20000','1']
        result=conditional_budget_case(rows,1000)
        self.assertTrue(result['assumption_refuted_by_incumbent_domain'])
        self.assertEqual(result['conditional_bound_exceeds_assumption_ids'],[])
        self.assertEqual(result['retained_or_unknown_ids'],['22660','other'])
        with self.assertRaises(ValueError): conditional_budget_case(rows+rows,1000)
        with self.assertRaises(ValueError): conditional_budget_case(rows,True)
        with self.assertRaises(ValueError): conditional_budget_case(rows,1000,incumbent_cbsa='foreign')

    def test_missing_state_or_city_cannot_disappear_after_metadata_rehash(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)/'domains'; shutil.copytree(OUTPUT,root)
            for filename,key,hash_key in [('states.json','states','state_bounds_sha256'),('refinements.json','cities','refinement_bounds_sha256')]:
                original=(OUTPUT/filename).read_bytes(); data=json.loads(original); data[key].pop()
                (root/filename).write_bytes(geometry_encoded(data))
                manifest=json.loads((OUTPUT/'manifest.json').read_bytes()); manifest[hash_key]=hashlib.sha256((root/filename).read_bytes()).hexdigest()
                (root/'manifest.json').write_bytes(encoded(manifest))
                with self.assertRaises(ValueError): audit(root)
                (root/filename).write_bytes(original)

    def test_source_scope_and_approval_changes_reject(self):
        with tempfile.TemporaryDirectory() as temporary:
            root=Path(temporary)/'domains'; shutil.copytree(OUTPUT,root)
            original=json.loads((root/'manifest.json').read_bytes())
            for mutate in (lambda d:d['displayed_cbsa_ids'].pop(),lambda d:d['required_states'].remove('DC'),
                           lambda d:d.update(anchors_adopted=True),lambda d:d.update(release_eligible=True),
                           lambda d:d['place_refinement_sources']['NE'].update(sha256='0'*64)):
                data=copy.deepcopy(original); mutate(data); (root/'manifest.json').write_bytes(encoded(data))
                with self.assertRaises(ValueError): audit(root)

    def test_all_four_originals_required_before_claiming_replay(self):
        with tempfile.TemporaryDirectory() as temporary:
            with self.assertRaisesRegex(ValueError,'All four'): preflight_originals(temporary)
