import copy
from fractions import Fraction
import json
import unittest
from road_reference_mixed_graph import compile_graph,query
from road_reference_way_permissions import DEFAULTS
from road_reference_scenario import load
from reference_via_way_checkpoint import CONTEXT
from test_reference_via_way_compile import fixture
from test_road_maneuver_probe import independent_history_truth


def compile_case(*args,**kwargs):
    return compile_graph(*args,default_policy=DEFAULTS,**kwargs)


def query_case(*args,**kwargs):
    return query(*args,default_policy=DEFAULTS,**kwargs)


def mixed_fixture():
    relation,ways,nodes=fixture()
    ways.extend([dict(id=40,tags={'highway':'residential','oneway':'no'},nodes=[[4,*nodes[3]['lonlat']],[8,-104.992,40.]]),
                 dict(id=50,tags={'highway':'residential','oneway':'no'},nodes=[[8,-104.992,40.],[6,*nodes[5]['lonlat']]])])
    nodes.append(dict(id=8,lonlat=[-104.992,40.],tags={}))
    node_rule=dict(id=43,tags={'type':'restriction','restriction':'only_straight_on'},
        members=[dict(type='w',ref=10,role='from'),dict(type='n',ref=3,role='via'),dict(type='w',ref=20,role='to')])
    return ways,nodes,[relation,node_rule]


class ReferenceMixedGraphTests(unittest.TestCase):
    def rejected(self, result):
        self.assertEqual(result['status'],'unsupported',result)
        self.assertIsNone(result['graph']);self.assertFalse(result['declared_graph_compiled'])

    def test_overlapping_node_and_way_patterns_match_independent_history_oracle(self):
        ways,nodes,relations=mixed_fixture();before=copy.deepcopy((ways,nodes,relations))
        compiled=compile_case(ways,nodes,relations)
        self.assertEqual(compiled['status'],'compiled_declared_mixed_graph')
        graph=compiled['graph'];self.assertEqual(len(graph['maneuvers']),2)
        for metric in ('length','travel_time'):
            for source,target in ((2,6),(3,6),(4,6),(2,8),(2,4),(2,2),(6,2)):
                actual=query_case(ways,nodes,relations,source,target,metric)['result']
                truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                self.assertEqual(truth,None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])))
        self.assertEqual(query_case(ways,nodes,relations,2,6)['result']['arc_path'],
                         ['raw:10:1:forward','raw:20:0:forward','raw:40:0:forward','raw:50:0:forward'])
        self.assertEqual((ways,nodes,relations),before)

    def test_every_supplied_relation_is_compiled_and_raw_inputs_are_bound(self):
        ways,nodes,relations=mixed_fixture();result=compile_case(ways,nodes,relations)
        self.assertEqual(result['graph']['supplied_raw_relation_ids'],[42,43])
        self.assertEqual(len(result['graph']['relation_compilations']),2)
        reduced=compile_case(ways,nodes,relations[:1])
        self.assertNotEqual(result['input_sha256'],reduced['input_sha256'])
        self.assertNotEqual(result['graph_sha256'],reduced['graph_sha256'])
        self.assertEqual(result['way_weight_stage_sha256'],reduced['way_weight_stage_sha256'])

    def test_unknown_relation_cannot_fall_back_to_successful_weight_stage(self):
        ways,nodes,relations=mixed_fixture()
        self.assertEqual(compile_case(ways,nodes,[])['status'],'compiled_declared_mixed_graph')
        relations[0]['tags']['restriction:conditional']='no_left_turn @ (We)'
        self.rejected(compile_case(ways,nodes,relations))
        answer=query_case(ways,nodes,relations,1,2)
        self.assertIsNone(answer['result']);self.assertFalse(answer['route_cost_emitted'])

    def test_missing_member_and_mixed_via_types_reject_whole_bundle(self):
        ways,nodes,relations=mixed_fixture();relations[0]['members'][2]['ref']=999
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=mixed_fixture();relations[0]['members'].append(dict(type='n',ref=4,role='via'))
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=mixed_fixture();relations[0]['members'][1]['role']='unsupported'
        self.rejected(compile_case(ways,nodes,relations))

    def test_duplicates_extra_zones_and_conflicting_only_rules_reject(self):
        ways,nodes,relations=mixed_fixture();self.rejected(compile_case(ways,nodes,relations+[copy.deepcopy(relations[0])]))
        self.rejected(compile_case(ways,nodes,relations,relation_zones={'999':'America/Denver'}))
        ways.append(dict(id=60,tags={'highway':'residential','oneway':'no'},nodes=[[3,*nodes[2]['lonlat']],[9,-104.991,40.001]]))
        nodes.append(dict(id=9,lonlat=[-104.991,40.001],tags={}))
        conflict=copy.deepcopy(relations[1]);conflict['id']=44;conflict['members'][-1]['ref']=60
        # Both only declarations compile separately, but demand different next arcs.
        self.assertEqual(compile_case(ways,nodes,[conflict])['status'],'compiled_declared_mixed_graph')
        self.rejected(compile_case(ways,nodes,relations+[conflict]))

    def test_conditional_node_rule_uses_same_clock_and_does_not_rewrite_static_way_rule(self):
        ways,nodes,relations=mixed_fixture()
        relations[1]['tags']={'type':'restriction','restriction:conditional':'only_straight_on @ (We)'}
        self.rejected(compile_case(ways,nodes,relations))
        fixed=compile_case(ways,nodes,relations,relation_zones={'43':'America/Denver'})
        other=load();other['reference_instant_utc']='2026-10-29T18:00:00Z'
        alternate=compile_case(ways,nodes,relations,scenario=other,relation_zones={'43':'America/Denver'})
        self.assertEqual(len(fixed['graph']['maneuvers']),2);self.assertEqual(len(alternate['graph']['maneuvers']),1)
        for compiled in (fixed,alternate):
            self.assertTrue(all(row['scenario_sha256']==compiled['scenario_sha256'] for row in compiled['graph']['relation_compilations']))

    def test_unknown_disconnected_way_and_foreign_raw_context_are_not_cropped(self):
        ways,nodes,relations=mixed_fixture();ways[-1]['tags']['maxspeed']='signals'
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=mixed_fixture();nodes[-1]['tags']['barrier']='gate'
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=mixed_fixture();self.rejected(compile_case(ways,nodes[:-1],relations))

    def test_no_adoption_coverage_or_approved_graph_input(self):
        result=compile_case(*mixed_fixture())
        for key in ('access_verified','anchors_adopted','connector_costs_included','release_eligible',
                    'complete_geographic_graph_constructed','all_incident_ways_accounted','other_relations_accounted'):
            self.assertIs(result[key],False)
        answer=query_case(*mixed_fixture(),999,1);self.assertEqual(answer['status'],'unsupported');self.assertIsNone(answer['result'])
        answer=query_case(*mixed_fixture(),1,2,'unknown');self.assertEqual(answer['status'],'unsupported')

    def test_actual_five_way_all_pairs_match_independent_history_solver(self):
        raw=json.loads(CONTEXT.read_text());compiled=compile_case(raw['ways'],raw['nodes'],raw['restrictions'])
        self.assertEqual(compiled['status'],'compiled_declared_mixed_graph')
        graph=compiled['graph'];self.assertEqual(len(graph['nodes']),15);self.assertEqual(len(graph['maneuvers']),2)
        for metric in ('length','travel_time'):
            for source in graph['nodes']:
                for target in graph['nodes']:
                    actual=query_case(raw['ways'],raw['nodes'],raw['restrictions'],source,target,metric)['result']
                    truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                    self.assertEqual(truth,None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])))

    def test_actual_via_way_prohibition_requires_complete_approach_history(self):
        raw=json.loads(CONTEXT.read_text())
        blocked=query_case(raw['ways'],raw['nodes'],raw['restrictions'],5481546066,51193002)['result']
        self.assertIsNone(blocked['cost'])
        from_inside=query_case(raw['ways'],raw['nodes'],raw['restrictions'],1479189816,51193002)['result']
        self.assertEqual(from_inside['arc_path'],['raw:134584349:0:forward','raw:290286621:0:forward'])
        prefix=query_case(raw['ways'],raw['nodes'],raw['restrictions'],5481546066,51193003)['result']
        self.assertEqual(prefix['arc_path'],['raw:186582632:4:forward','raw:134584349:0:forward'])
