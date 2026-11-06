import copy
from fractions import Fraction
import random
import unittest
import networkx as nx
from road_competitive_core import select_known_core


def arc(a,b,length,time=None):
    return dict(id=f'{a}:{b}',**{'from':a,'to':b},length=length,travel_time=length if time is None else time)


class CompetitiveCoreTests(unittest.TestCase):
    def test_selection_matches_independent_full_graph_dijkstra_with_zero_and_asymmetric_costs(self):
        rng=random.Random(140264)
        for _ in range(60):
            nodes=list(range(1,13));arcs=[arc(a,b,rng.randrange(10),rng.randrange(10)) for a in nodes for b in nodes if a!=b and rng.random()<.18]
            bounds=dict(length=Fraction(rng.randrange(20),2),travel_time=Fraction(rng.randrange(20),2));initial=[1,2,12]
            result=select_known_core(nodes,arcs,initial,1,2,incumbent_costs=bounds);expected=set(initial)
            for metric in ('length','travel_time'):
                g=nx.MultiDiGraph();g.add_nodes_from(nodes)
                for row in arcs:g.add_edge(row['from'],row['to'],weight=Fraction(row[metric]))
                costs=nx.single_source_dijkstra_path_length(g,1,cutoff=bounds[metric],weight='weight');expected.update(costs)
            self.assertEqual(result['selected_source_node_ids'],sorted(expected))

    def test_equal_cost_boundary_and_zero_cycles_are_absorbed(self):
        arcs=[arc(1,3,0),arc(3,4,0),arc(4,3,0),arc(4,5,2),arc(5,6,1)]
        result=select_known_core(list(range(1,7)),arcs,[1,2],1,2,incumbent_costs=dict(length=2,travel_time=2))
        self.assertEqual(result['selected_source_node_ids'],[1,2,3,4,5])
        self.assertEqual(result['final_known_graph_screens']['length']['exits'][0]['reason'],'strictly_exceeds_incumbent')

    def test_metric_union_preserves_nodes_competitive_for_either_cost(self):
        arcs=[arc(1,3,2,100),arc(1,4,100,2)]
        result=select_known_core([1,2,3,4],arcs,[1,2],1,2,incumbent_costs=dict(length=2,travel_time=2))
        self.assertEqual(result['selected_source_node_ids'],[1,2,3,4])

    def test_stored_binary_float_near_tie_is_not_rounded_into_an_exclusion(self):
        arcs=[arc(1,3,.1),arc(3,4,.2)]
        upper=Fraction.from_float(.1)+Fraction.from_float(.2)
        result=select_known_core([1,2,3,4],arcs,[1,2],1,2,incumbent_costs=dict(length=upper,travel_time=upper))
        self.assertEqual(result['selected_source_node_ids'],[1,2,3,4])

    def test_exhausted_round_budget_raises_without_partial_selection(self):
        arcs=[arc(n,n+1,1) for n in range(1,6)]
        with self.assertRaisesRegex(ValueError,'no partial selection'):
            select_known_core(list(range(1,7)),arcs,[1,6],1,6,incumbent_costs=dict(length=10,travel_time=10),max_rounds=1)

    def test_unknown_negative_nonfinite_and_duplicate_inputs_reject(self):
        for arcs,bounds in (([arc(1,3,-1)],dict(length=2,travel_time=2)),([arc(1,3,float('nan'))],dict(length=2,travel_time=2)),
                            ([arc(1,3,1),arc(1,3,2)],dict(length=2,travel_time=2)),([],dict(length=1)),
                            ([],dict(length=True,travel_time=2))):
            with self.assertRaises(ValueError):select_known_core([1,2,3],arcs,[1,2],1,2,incumbent_costs=bounds)

    def test_inputs_immutable_selection_deterministic_and_no_geographic_approval(self):
        nodes=[1,2,3,4];arcs=[arc(1,3,1),arc(3,4,1)];initial=[1,2];before=copy.deepcopy((nodes,arcs,initial))
        result=select_known_core(nodes,arcs,initial,1,2,incumbent_costs=dict(length=2,travel_time=2))
        again=select_known_core(list(reversed(nodes)),list(reversed(arcs)),list(reversed(initial)),1,2,incumbent_costs=dict(length=2,travel_time=2))
        self.assertEqual(result,again);self.assertEqual((nodes,arcs,initial),before)
        for flag in ('source_incidence_certified','incumbent_feasibility_certified','geographic_coverage_certified','access_verified','release_eligible'):
            self.assertIs(result[flag],False)
        self.assertTrue(result['known_graph_only']);self.assertTrue(result['source_inspection_selection_only'])
        self.assertEqual(result['applied_exterior_route_exclusions'],[])
