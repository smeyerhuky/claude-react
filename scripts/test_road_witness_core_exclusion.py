import copy
from fractions import Fraction
import random
import unittest
import networkx as nx
from road_witness_core_exclusion import certify
from test_road_maneuver_probe import independent_history_truth


def fixture():
    def edge(aid,way,a,b,length,time):return dict(id=aid,way=way,**{'from':a,'to':b},length=length,travel_time=time)
    known=[edge('a',10,1,2,2,3),edge('b',11,2,3,2,3),edge('exit',12,1,4,5,7),edge('return',13,5,3,0,0),edge('unreachable',14,6,7,0,0)]
    possible=[dict(edge('possible-geometry:99:0:forward',99,4,5,0,0),bound_only=True,modeled_permission=None)]
    return known,possible


def check(known,possible,metric='length',**kwargs):
    return certify(list(range(1,8)),known,possible,kwargs.get('patterns',[]),[1,2,3,6],kwargs.get('source',1),kwargs.get('target',3),kwargs.get('path',['a','b']),metric)


class WitnessCoreExclusionTests(unittest.TestCase):
    def test_exact_certificate_retains_unreachable_exit_and_external_preconditions(self):
        k,v=fixture();r=check(k,v)
        self.assertTrue(r['conditional_retained_cost_stable_with_nonnegative_exterior'])
        self.assertEqual((r['first_exit_count'],r['reachable_first_exit_count'],r['unreachable_first_exit_count']),(2,1,1))
        self.assertEqual(r['minimum_first_exit_gap_exact'],['1','1'])
        for flag in ('source_replay_verified_in_this_process','source_incidence_certified','exterior_continuation_nonnegativity_verified',
                     'normal_graph_admitted','route_query_result_returned','global_route_optimality_certified','geographic_coverage_certified',
                     'actual_access_verified','anchors_adopted','connector_costs_included','release_eligible'):self.assertFalse(r[flag])

    def test_independent_oracle_over_arbitrary_nonnegative_outside_completions(self):
        k,v=fixture();rng=random.Random(270)
        for metric in ('length','travel_time'):
            proof=check(k,v,metric);upper=Fraction(*map(int,proof['interior_supported_witness']['stored_cost_exact']))
            for sample in range(40):
                arcs=copy.deepcopy(k)+(copy.deepcopy(v) if sample%2 else [])
                for index,(a,b) in enumerate(((4,5),(5,4),(4,7),(7,5),(5,7))):
                    arcs.append(dict(id=f'outside-{index}',way=100+index,**{'from':a,'to':b},length=rng.randrange(5),travel_time=rng.randrange(5)))
                self.assertEqual(independent_history_truth(arcs,[],1,3,metric),upper)

    def test_exact_ties_and_very_small_positive_or_negative_gaps_are_not_rounded(self):
        for metric,upper in (('length',4),('travel_time',6)):
            for delta in (0,2**-40,-2**-40):
                k,v=fixture();k[2][metric]=upper+delta;r=check(k,v,metric)
                self.assertEqual(Fraction(*map(int,r['minimum_first_exit_gap_exact'])),Fraction(upper+delta)-upper)
                self.assertEqual(r['conditional_exterior_walks_cannot_improve_or_tie'],delta>0)
                self.assertEqual(r['may_compete_or_tie_count'],int(delta<=0))

    def test_negative_costs_reject_and_negative_external_continuation_is_a_counterexample(self):
        k,v=fixture();self.assertTrue(check(k,v)['conditional_retained_cost_stable_with_nonnegative_exterior'])
        graph=nx.DiGraph()
        for a in k+v:graph.add_edge(a['from'],a['to'],weight=a['length'])
        graph[5][3]['weight']=-10
        self.assertLess(nx.bellman_ford_path_length(graph,1,3,weight='weight'),4)
        k[-2]['length']=-10
        with self.assertRaises(ValueError):check(k,v)

    def test_unseen_core_attachment_invalidates_the_old_domain_and_new_certificate(self):
        k,v=fixture();self.assertTrue(check(k,v)['conditional_retained_cost_stable_with_nonnegative_exterior'])
        k.append(dict(id='new-core-attachment',way=88,**{'from':1,'to':5},length=0,travel_time=0))
        r=check(k,v);self.assertFalse(r['conditional_retained_cost_stable_with_nonnegative_exterior'])
        self.assertEqual(independent_history_truth(k+v,[],1,3,'length'),0)

    def test_supported_witness_must_stay_inside_the_core(self):
        k,v=fixture();k.append(dict(id='outside-step',way=89,**{'from':4,'to':5},length=1,travel_time=1))
        with self.assertRaises(ValueError):check(k,v,path=['exit','outside-step','return'])
        with self.assertRaises(ValueError):check(k,v,path=['exit',v[0]['id'],'return'])

    def test_prohibited_or_only_violating_witness_never_certifies_a_bound(self):
        k,v=fixture()
        with self.assertRaises(ValueError):check(k,v,patterns=[dict(id='no',kind='no',arc_sequence=['a','b'])])
        k.append(dict(id='required-other-departure',way=90,**{'from':2,'to':4},length=1,travel_time=1))
        with self.assertRaises(ValueError):check(k,v,patterns=[dict(id='only',kind='only',arc_sequence=['a','required-other-departure'])])

    def test_endpoint_direction_or_possible_geometry_relabeling_rejects(self):
        k,v=fixture()
        with self.assertRaises(ValueError):check(k,v,source=3,target=1)
        v[0]['modeled_permission']=True
        with self.assertRaises(ValueError):check(k,v)
