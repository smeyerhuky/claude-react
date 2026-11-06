import copy
from fractions import Fraction
import itertools
import unittest
from road_opaque_control_bounds import bracket_cost,validate_witness,geometry_lower_bounds
from road_reference_way_permissions import DEFAULTS
from test_road_maneuver_probe import independent_history_truth


def arc(aid,way,a,b,length,time=None):
    return dict(id=aid,way=way,**{'from':a,'to':b},length=length,travel_time=length if time is None else time)


def possible(aid,way,a,b,length):
    return dict(arc('possible-geometry:'+aid,way,a,b,length,0),bound_only=True,modeled_permission=None)


class OpaqueBoundsTests(unittest.TestCase):
    def fixture(self):
        known=[arc('a',1,1,2,2,3),arc('b',2,2,4,2,3)]
        potential=[possible('99:0:forward',99,1,3,1),possible('100:0:forward',100,3,4,1)]
        return known,potential

    def test_bracket_contains_every_small_completion_with_deletions_and_nonnegative_penalties(self):
        known,potential=self.fixture();before=copy.deepcopy((known,potential))
        for metric in ('length','travel_time'):
            result=bracket_cost([1,2,3,4],known,potential,[],1,4,['a','b'],metric)
            lo=Fraction(*map(int,result['optimistic_lower_bound_exact']));hi=Fraction(*map(int,result['supported_witness_upper_bound_exact']))
            self.assertFalse(result['conditional_stored_cost_stable_within_supplied_universe'])
            for mask in range(4):
                for penalties in itertools.product((0,1,7),repeat=2):
                    completed=copy.deepcopy(known)
                    for i,row in enumerate(potential):
                        if mask&(1<<i):
                            value=copy.deepcopy(row);value[metric]+=penalties[i];completed.append(value)
                    truth=independent_history_truth(completed,[],1,4,metric)
                    self.assertIsNotNone(truth);self.assertLessEqual(lo,truth);self.assertLessEqual(truth,hi)
        self.assertEqual((known,potential),before)

    def test_equal_bracket_proves_cost_stability_without_resolving_the_opaque_state(self):
        known,_=self.fixture();known += [arc('entry',3,1,5,8,8),arc('exit',4,6,4,8,8)]
        potential=[possible('99:0:forward',99,5,6,1),possible('99:0:backward',99,6,5,1)]
        for metric in ('length','travel_time'):
            result=bracket_cost(list(range(1,7)),known,potential,[],1,4,['a','b'],metric)
            self.assertTrue(result['conditional_stored_cost_stable_within_supplied_universe'])
            self.assertEqual(result['gap_exact'],['0','1']);self.assertFalse(result['actual_gate_state_evaluated'])
            self.assertFalse(result['normal_graph_admitted']);self.assertFalse(result['global_route_optimality_certified'])

    def test_witness_enforces_no_only_partial_end_and_unconstrained_start_semantics(self):
        known=[arc('a',1,1,2,1),arc('b',2,2,3,1),arc('c',3,3,4,1),arc('detour',4,2,4,1)]
        no=[dict(id='no',kind='no',arc_sequence=['a','b','c'])]
        with self.assertRaises(ValueError):validate_witness([1,2,3,4],known,no,1,4,['a','b','c'],'length')
        validate_witness([1,2,3,4],known,no,2,4,['b','c'],'length')
        only=[dict(id='only',kind='only',arc_sequence=['a','b','c'])]
        validate_witness([1,2,3,4],known,only,1,3,['a','b'],'length')
        with self.assertRaises(ValueError):validate_witness([1,2,3,4],known,only,1,4,['a','detour'],'length')

    def test_witness_cannot_use_unknown_geometry_or_undeclared_reversal(self):
        known,potential=self.fixture()
        with self.assertRaises(ValueError):bracket_cost([1,2,3,4],known,potential,[],1,4,[r['id'] for r in potential],'length')
        reversed_arcs=[arc('a',1,1,2,1),arc('reverse',1,2,1,1)]
        with self.assertRaises(ValueError):validate_witness([1,2],reversed_arcs,[],1,1,['a','reverse'],'length')

    def test_all_supplied_maneuvers_must_resolve_on_supported_members(self):
        known,potential=self.fixture();bad=[dict(id='unknown-member',kind='no',arc_sequence=['a',potential[0]['id']])]
        with self.assertRaises(ValueError):bracket_cost([1,2,3,4],known,potential,bad,1,4,['a','b'],'length')

    def test_namespace_nonfinite_negative_and_nonzero_time_lower_bounds_reject(self):
        known,potential=self.fixture()
        for change in ('negative','nan','positive-time','namespace','permission'):
            rows=copy.deepcopy(potential)
            if change=='negative':rows[0]['length']=-1
            if change=='nan':rows[0]['length']=float('nan')
            if change=='positive-time':rows[0]['travel_time']=1
            if change=='namespace':rows[0]['id']='raw:99:0:forward'
            if change=='permission':rows[0]['modeled_permission']=True
            with self.subTest(change=change),self.assertRaises(ValueError):bracket_cost([1,2,3,4],known,rows,[],1,4,['a','b'],'length')

    def test_original_gate_geometry_is_retained_and_both_directions_are_only_possibilities(self):
        way=dict(id=99,tags={'highway':'service','oneway':'yes'},nodes=[[1,-105.,40.],[2,-104.999,40.]])
        nodes=[dict(id=1,lonlat=[-105.,40.],tags={}),dict(id=2,lonlat=[-104.999,40.],tags={'barrier':'gate'})]
        before=copy.deepcopy((way,nodes));result=geometry_lower_bounds(way,nodes,default_policy=DEFAULTS)
        self.assertEqual((way,nodes),before);self.assertEqual(result['strict_permission_status'],'unsupported')
        self.assertEqual(len(result['potential_arcs']),2)
        self.assertTrue(all(r['modeled_permission'] is None and r['bound_only'] and r['travel_time']==0 for r in result['potential_arcs']))
        self.assertFalse(result['permission_claimed']);self.assertFalse(result['actual_gate_state_evaluated'])

    def test_discontinuous_wrong_target_or_tampered_geometry_never_validate(self):
        known,potential=self.fixture()
        with self.assertRaises(ValueError):validate_witness([1,2,3,4],known,[],1,4,['b','a'],'length')
        with self.assertRaises(ValueError):validate_witness([1,2,3,4],known,[],1,3,['a','b'],'length')
        way=dict(id=99,tags={'highway':'service'},nodes=[[1,-105.,40.],[2,-104.999,40.]])
        nodes=[dict(id=1,lonlat=[-105.,40.],tags={}),dict(id=2,lonlat=[-104.,40.],tags={'barrier':'gate'})]
        with self.assertRaises(ValueError):geometry_lower_bounds(way,nodes,default_policy=DEFAULTS)
