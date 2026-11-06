import copy
from fractions import Fraction
import json
import random
import unittest
import networkx as nx
from road_core_exit_bounds import screen_first_exits
from fort_collins_query_cut_checkpoint import project,core_inputs,CONTEXT


def arcs():
    return [dict(id='a',**{'from':1,'to':2},length=1,travel_time=2),
            dict(id='b',**{'from':2,'to':3},length=4,travel_time=8),
            dict(id='exit',**{'from':2,'to':4},length=5,travel_time=10),
            dict(id='return',**{'from':4,'to':3},length=0,travel_time=0)]


def bound(edges=None,**kwargs):
    return screen_first_exits([1,2,3,4],arcs() if edges is None else edges,[1,2,3],1,3,
                              metric='length',incumbent_upper_bound=5,**kwargs)


class CoreExitBoundTests(unittest.TestCase):
    def test_first_exit_prefix_strictly_dominates_without_any_exterior_speed_bound(self):
        for metric,upper,expected in [('length',5,6),('travel_time',10,12)]:
            result=screen_first_exits([1,2,3,4],arcs(),[1,2,3],1,3,metric=metric,incumbent_upper_bound=upper)
            self.assertTrue(result['conditional_exterior_routes_cannot_improve'])
            self.assertEqual(Fraction(*map(int,result['exits'][0]['first_exit_cost_lower_bound_exact'])),expected)
            self.assertTrue(result['conditional_only']);self.assertEqual(result['applied_exterior_route_exclusions'],[])
            for flag in ('source_incidence_certified','incumbent_feasibility_certified','geographic_coverage_certified','access_verified','release_eligible'):
                self.assertIs(result[flag],False)

    def test_ties_and_margins_are_never_strictly_excluded(self):
        edges=arcs();edges[2]['length']=4
        self.assertFalse(bound(edges)['conditional_exterior_routes_cannot_improve'])
        self.assertEqual(bound(edges)['exits'][0]['reason'],'may_compete_or_tie')
        self.assertFalse(bound(margin=1)['conditional_exterior_routes_cannot_improve'])

    def test_prefix_relaxation_keeps_competitive_exit_and_zero_cost_edges(self):
        edges=arcs();edges[0]['length']=0;edges[2]['length']=1
        result=bound(edges)
        self.assertFalse(result['conditional_exterior_routes_cannot_improve'])
        self.assertEqual(result['exits'][0]['first_exit_cost_lower_bound_exact'],['1','1'])
        self.assertIn('ignores all maneuver',result['prefix_relaxation'])

    def test_unreachable_first_exit_is_explicit_without_world_inaccessibility_claim(self):
        edges=arcs();edges[2]['from']=5
        result=screen_first_exits([1,2,3,4,5],edges,[1,2,3,5],1,3,metric='length',incumbent_upper_bound=5)
        self.assertEqual(result['reachable_first_exits'],0)
        self.assertEqual(result['exits'][0]['reason'],'unreachable_in_prefix_relaxation')
        self.assertIsNone(result['exits'][0]['first_exit_cost_lower_bound_exact'])
        self.assertFalse(result['source_incidence_certified'])

    def test_exact_rational_comparison_survives_binary64_rounding_tie(self):
        upper=Fraction(2**53);exit_cost=upper+1
        self.assertEqual(float(exit_cost),float(upper))
        edges=[dict(id='inside',**{'from':1,'to':2},length=upper),dict(id='exit',**{'from':1,'to':3},length=exit_cost)]
        result=screen_first_exits([1,2,3],edges,[1,2],1,2,metric='length',incumbent_upper_bound=upper)
        self.assertTrue(result['conditional_exterior_routes_cannot_improve'])
        self.assertEqual(result['exits'][0]['first_exit_cost_lower_bound_exact'],[str(2**53+1),'1'])

    def test_malformed_negative_nonfinite_and_duplicate_inputs_reject(self):
        for value in (-1,float('nan'),float('inf'),True,None):
            edges=arcs();edges[0]['length']=value
            with self.subTest(value=value),self.assertRaises(ValueError):bound(edges)
        edges=arcs();edges[1]['id']='a'
        with self.assertRaises(ValueError):bound(edges)
        edges=arcs();edges[0]['to']=999
        with self.assertRaises(ValueError):bound(edges)
        with self.assertRaises(ValueError):bound(margin=-1)
        with self.assertRaises(ValueError):screen_first_exits([1,2],[],[1,1],1,2,metric='length',incumbent_upper_bound=1)
        with self.assertRaises(ValueError):screen_first_exits([1,2],[],[1],1,2,metric='length',incumbent_upper_bound=1)
        with self.assertRaises(ValueError):screen_first_exits(list(range(1,2002)),[],[1,2],1,2,metric='length',incumbent_upper_bound=1)

    def test_random_nonnegative_parent_excursions_match_independent_bellman_ford(self):
        rng=random.Random(256);nodes=list(range(1,7));core=[1,2,3]
        for case in range(40):
            edges=[dict(id='incumbent',**{'from':1,'to':3},length=5,travel_time=7)]
            for u in nodes:
                for v in nodes:
                    if u!=v and rng.random()<.28:
                        edges.append(dict(id=f'{u}:{v}',**{'from':u,'to':v},length=rng.randrange(10),travel_time=rng.randrange(10)))
            for metric in ('length','travel_time'):
                internal=nx.MultiDiGraph();internal.add_nodes_from(core)
                expanded=nx.MultiDiGraph();expanded.add_nodes_from((n,flag) for n in nodes for flag in (False,True))
                for edge in edges:
                    u,v=edge['from'],edge['to'];weight=edge[metric]
                    if u in core and v in core:internal.add_edge(u,v,weight=weight)
                    for flag in (False,True):expanded.add_edge((u,flag),(v,flag or v not in core),weight=weight)
                upper=nx.shortest_path_length(internal,1,3,weight='weight',method='bellman-ford')
                result=screen_first_exits(nodes,edges,core,1,3,metric=metric,incumbent_upper_bound=upper)
                try:outside=nx.shortest_path_length(expanded,(1,False),(3,True),weight='weight',method='bellman-ford')
                except nx.NetworkXNoPath:outside=None
                if result['conditional_exterior_routes_cannot_improve']:
                    self.assertTrue(outside is None or outside>upper,(case,metric,result,outside))
                for row in result['exits']:
                    try:prefix=nx.shortest_path_length(internal,1,row['from_node'],weight='weight',method='bellman-ford')
                    except nx.NetworkXNoPath:prefix=None
                    if prefix is None:self.assertIsNone(row['first_exit_cost_lower_bound_exact'])
                    else:
                        edge=next(e for e in edges if e['id']==row['arc_id'])
                        self.assertEqual(Fraction(*map(int,row['first_exit_cost_lower_bound_exact'])),prefix+edge[metric])

    def test_actual_source_absorption_changes_only_the_conditional_bound(self):
        result=project();before=result['cores']['original_eight_node_core'];after=result['cores']['garage_branch_included_core']
        for metric in ('length','travel_time'):
            self.assertFalse(before['metrics'][metric]['conditional_exterior_routes_cannot_improve'])
            self.assertTrue(after['metrics'][metric]['conditional_exterior_routes_cannot_improve'])
            self.assertEqual(after['metrics'][metric]['reachable_first_exits'],2)
            self.assertEqual(after['metrics'][metric]['applied_exterior_route_exclusions'],[])
        self.assertEqual(after['outside_declared_road_class_incident_way_ids'],[54882910,793154984])
        self.assertEqual(result['retained_unknown_model_road_ids'],[815164359])
        self.assertEqual(result['wider_candidate_status'],'unsupported');self.assertIsNone(result['wider_candidate_graph'])
        for flag in ('global_route_optimality_certified','geographic_coverage_certified','incumbent_physical_access_certified',
                     'route_query_result_returned','access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(result[flag],False)

    def test_unenumerated_core_node_and_unknown_incident_control_cannot_be_hidden(self):
        context=json.loads(CONTEXT.read_text())
        with self.assertRaises(ValueError):core_inputs([6543050330.0],context)
        with self.assertRaises(ValueError):core_inputs([6543050330,6543050330],context)
        with self.assertRaises(ValueError):core_inputs([context['unenumerated_member_node_ids'][0]],context)
        blocked=next(w for w in context['ways'] if w['id']==815164359)
        shared=next(p[0] for p in blocked['nodes'] if p[0] in context['seed_node_ids'])
        with self.assertRaisesRegex(ValueError,'Unknown incident car-road'):core_inputs([shared],context)

    def test_input_records_and_existing_query_costs_remain_unchanged(self):
        edges=arcs();before=copy.deepcopy(edges);bound(edges);self.assertEqual(edges,before)
        context=json.loads(CONTEXT.read_text());before=copy.deepcopy(context)
        core_inputs([6543050330,6543050322,51052581],context)
        self.assertEqual(context,before)
