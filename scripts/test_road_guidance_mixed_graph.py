import copy
from fractions import Fraction
import json
import unittest
from road_guidance_mixed_graph import compile_graph,query
from road_reference_way_permissions import DEFAULTS
from fort_collins_guidance_graph_checkpoint import project,REFERENCE
from fort_collins_guidance_maneuver_checkpoint import REFERENCE as MANEUVERS
from fort_collins_control_checkpoint import CONTEXT
from test_road_reference_mixed_graph import mixed_fixture
from test_road_maneuver_probe import independent_history_truth


def compile_case(*args,**kwargs):return compile_graph(*args,default_policy=DEFAULTS,**kwargs)


class GuidanceMixedGraphTests(unittest.TestCase):
    def test_way_node_control_and_arc_budgets_never_return_a_partial_bundle(self):
        ways,nodes,controls=mixed_fixture()
        for w,n,r in ((ways*101,nodes,controls),(ways,nodes*2001,controls),(ways,nodes,controls*101)):
            result=compile_case(w,n,r);self.assertIsNone(result['graph']);self.assertFalse(result['declared_graph_compiled'])
        points=[[i+1,-105.+i*.00001,40.] for i in range(500)]
        parallel=[dict(id=i+1,tags={'highway':'residential'},nodes=copy.deepcopy(points)) for i in range(5)]
        records=[dict(id=p[0],lonlat=p[1:],tags={}) for p in points]
        result=compile_case(parallel,records,[])
        self.assertIsNone(result['graph']);self.assertIn('arc budget',result['reason'])

    def test_frozen_candidate_is_atomically_blocked_by_actual_bollard(self):
        result=project();self.assertEqual(result,json.loads((REFERENCE/'report.json').read_text()))
        self.assertEqual(result['complete_road_candidate_ways'],35)
        self.assertIsNone(result['full_candidate_compilation']['graph']);self.assertIsNone(result['full_candidate_query']['result'])
        self.assertFalse(result['partial_graph_returned']);self.assertFalse(result['unknown_controls_omitted'])

    def test_focused_compiled_bundle_matches_all_722_independent_queries(self):
        report=json.loads((MANEUVERS/'report.json').read_text());raw=json.loads(CONTEXT.read_text())
        ways=[w for w in raw['ways'] if w['id'] in report['focused_way_ids']]
        nodes=[n for n in raw['nodes'] if n['id'] in report['focused_nodes']]
        controls=[r for r in raw['control_relations'] if r['id']==10475907]
        before=copy.deepcopy((ways,nodes,controls));compiled=compile_case(ways,nodes,controls);graph=compiled['graph']
        self.assertEqual(graph['arcs'],report['focused_arcs']);self.assertEqual(graph['supplied_raw_relation_ids'],[10475907])
        for metric in ('length','travel_time'):
            for source in graph['nodes']:
                for target in graph['nodes']:
                    answer=query(ways,nodes,controls,source,target,metric,default_policy=DEFAULTS)
                    truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                    actual=answer['result'];self.assertIsNotNone(actual)
                    self.assertEqual(truth,None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])))
        self.assertEqual((ways,nodes,controls),before)

    def test_overlapping_static_via_way_and_guidance_node_rules_match_oracle(self):
        ways,nodes,controls=mixed_fixture()
        # This road is outside the strict via-way members, while still in the
        # same mixed bundle. Lane metadata cannot bypass either declaration.
        ways[-1]['tags'].update({'lanes':'2','lanes:forward':'1','lanes:backward':'1','turn:lanes:backward':'left'})
        compiled=compile_case(ways,nodes,controls);graph=compiled['graph'];self.assertIsNotNone(graph)
        self.assertEqual(len(graph['maneuvers']),2)
        for metric in ('length','travel_time'):
            for source,target in ((2,6),(3,6),(4,6),(2,8),(2,4),(2,2),(6,2)):
                answer=query(ways,nodes,controls,source,target,metric,default_policy=DEFAULTS)['result']
                truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                self.assertEqual(truth,None if answer['cost'] is None else Fraction(*map(int,answer['exact_stored_path_cost'])))

    def test_unknown_control_never_falls_back_to_a_successful_weight_stage(self):
        ways,nodes,controls=mixed_fixture();self.assertIsNotNone(compile_case(ways,nodes,[])['graph'])
        for tags in ({'type':'connectivity','connectivity':'1:1'},{'type':'restriction','restriction:conditional':'no_left_turn @ (We)'}):
            bad=copy.deepcopy(controls);bad[0]['tags']=tags
            result=compile_case(ways,nodes,bad);self.assertIsNone(result['graph'])
            answer=query(ways,nodes,bad,2,6,default_policy=DEFAULTS)
            self.assertIsNone(answer['result']);self.assertFalse(answer['route_cost_emitted'])

    def test_duplicate_members_missing_nodes_extra_zones_and_unknown_ways_reject(self):
        ways,nodes,controls=mixed_fixture()
        cases=[(ways,nodes,controls+[controls[0]],{}),(ways,nodes[:-1],controls,{}),
               (ways,nodes,controls,{'feature_zones':{'way:999':'America/Denver'}}),
               (ways,nodes,controls,{'relation_zones':{'999':'America/Denver'}})]
        bad=copy.deepcopy(ways);bad[-1]['tags']['barrier']='bollard';cases.append((bad,nodes,controls,{}))
        bad=copy.deepcopy(controls);bad[0]['members'][0]['ref']=999;cases.append((ways,nodes,bad,{}))
        for w,n,r,kwargs in cases:self.assertIsNone(compile_case(w,n,r,**kwargs)['graph'])

    def test_conflicting_only_rules_reject_before_graph_output(self):
        ways,nodes,controls=mixed_fixture();extra=copy.deepcopy(controls[1]);extra['id']=44
        extra['members'][-1]['ref']=10 # Same-way reversal conflicts with the existing only continuation.
        self.assertIsNone(compile_case(ways,nodes,controls+[extra])['graph'])

    def test_shared_coordinate_conflicts_and_foreign_nodes_cannot_be_hidden(self):
        ways,nodes,controls=mixed_fixture();ways[1]['nodes'][0][1]+=.0001
        self.assertIsNone(compile_case(ways,nodes,controls)['graph'])
        ways,nodes,controls=mixed_fixture();nodes.append(dict(id=999,lonlat=[0.,0.],tags={}))
        self.assertIsNone(compile_case(ways,nodes,controls)['graph'])

    def test_unknown_lane_controls_and_strict_via_way_members_stay_unsupported(self):
        for tags in ({'access:lanes':'yes|no'},{'turn:lanes:conditional':'left|through @ (We)'},
                     {'lanes':'2','lanes:forward':'1','lanes:backward':'1','turn:lanes:backward':'left'}):
            ways,nodes,controls=mixed_fixture();ways[0]['tags'].update(tags)
            self.assertIsNone(compile_case(ways,nodes,controls)['graph'])
