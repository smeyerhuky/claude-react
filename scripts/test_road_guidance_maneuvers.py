import copy
from fractions import Fraction
import json
import unittest
from road_guidance_segments import project as segments,weights
from guidance_via_node_compile import compile_relation
from road_reference_way_permissions import DEFAULTS
from road_reference_segment_costs import project as historical_weights
from road_reference_scenario import load
from fort_collins_control_checkpoint import CONTEXT
from fort_collins_guidance_maneuver_checkpoint import project,REFERENCE
from road_maneuver_probe import solve
from test_road_maneuver_probe import independent_history_truth
from test_reference_via_node_compile import fixture


def lane_fixture():
    relation,ways,nodes=fixture()
    ways[0]['tags'].update({'lanes':'2','lanes:forward':'1','lanes:backward':'1','turn:lanes:backward':'left'})
    return relation,ways,nodes


def compile_case(r,w,n,**kwargs):return compile_relation(r,w,n,default_policy=DEFAULTS,**kwargs)


class GuidanceManeuverTests(unittest.TestCase):
    def test_frozen_source_controls_and_full_candidate_stay_blocked(self):
        report=project();self.assertEqual(report,json.loads((REFERENCE/'report.json').read_text()))
        self.assertEqual(report['supported_directed_weights'],169)
        self.assertEqual(len(report['individual_restriction_compilations']),10)
        self.assertEqual(report['unsupported_model_road_ids'],[815164359])
        self.assertIsNone(report['full_corpus_graph']);self.assertIsNone(report['full_corpus_query_result'])
        self.assertFalse(report['unknown_controls_omitted']);self.assertFalse(report['access_verified'])

    def test_all_focused_node_pairs_match_independent_history_graph(self):
        report=json.loads((REFERENCE/'report.json').read_text());nodes=report['focused_nodes'];arcs=report['focused_arcs']
        patterns=[report['individual_restriction_compilations']['10475907']['active_pattern']]
        for metric in ('length','travel_time'):
            for source in nodes:
                for target in nodes:
                    answer=solve(nodes,arcs,patterns,source,target,metric)
                    expected=independent_history_truth(arcs,patterns,source,target,metric)
                    actual=None if answer['cost'] is None else Fraction(*map(int,answer['exact_stored_path_cost']))
                    self.assertEqual(actual,expected,(source,target,metric))

    def test_indications_cannot_change_independent_no_or_only_patterns(self):
        relation,ways,nodes=lane_fixture();before=copy.deepcopy((relation,ways,nodes))
        for raw in ('no_left_turn','only_left_turn'):
            relation['tags']['restriction']=raw;first=compile_case(relation,ways,nodes)
            ways[0]['tags']['turn:lanes:backward']='right';second=compile_case(relation,ways,nodes)
            self.assertTrue(first['topology_compiled']);self.assertEqual(first['active_pattern'],second['active_pattern'])
            self.assertNotEqual(first['member_projection_sha256'],second['member_projection_sha256'])
            ways[0]['tags']['turn:lanes:backward']='left'
        relation['tags']['restriction']=before[0]['tags']['restriction']
        self.assertEqual((relation,ways,nodes),before)

    def test_missing_context_remote_unknown_and_unknown_relation_never_emit_pattern(self):
        for mutation in ('missing','barrier','lane_access','connectivity','unknown_rule'):
            relation,ways,nodes=lane_fixture()
            if mutation=='missing':nodes=nodes[:-1]
            if mutation=='barrier':nodes[0]['tags']['barrier']='bollard'
            if mutation=='lane_access':ways[0]['tags']['access:lanes:forward']='yes'
            if mutation=='connectivity':relation['tags']['type']='connectivity'
            if mutation=='unknown_rule':relation['tags']['restriction']='no_magic_turn'
            result=compile_case(relation,ways,nodes)
            self.assertFalse(result['topology_compiled'],mutation);self.assertIsNone(result['active_pattern'])

    def test_lane_indications_cannot_override_road_or_via_node_denial(self):
        for mutation in ('oneway','via_access'):
            relation,ways,nodes=lane_fixture()
            if mutation=='oneway':ways[0]['tags']['oneway']='-1'
            else:next(n for n in nodes if n['id']==3)['tags']['motorcar']='no'
            result=compile_case(relation,ways,nodes)
            self.assertFalse(result['topology_compiled']);self.assertIsNone(result['declared_arc_sequence'])

    def test_conditional_relation_and_feature_clocks_remain_separate(self):
        relation,ways,nodes=lane_fixture();relation['tags']={'type':'restriction','restriction:conditional':'no_left_turn @ (Th-Sa 19:00-00:00)'}
        inactive=compile_case(relation,ways,nodes,relation_zone='America/Denver')
        self.assertTrue(inactive['topology_compiled']);self.assertIsNone(inactive['active_pattern'])
        scenario=load();scenario['reference_instant_utc']='2026-10-30T01:00:00Z'
        active=compile_case(relation,ways,nodes,relation_zone='America/Denver',scenario=scenario)
        self.assertIsNotNone(active['active_pattern']);self.assertEqual(active['declared_arc_sequence'],inactive['declared_arc_sequence'])
        ways[0]['tags']['motorcar:conditional']='yes @ (We)'
        self.assertFalse(compile_case(relation,ways,nodes,relation_zone='America/Denver')['topology_compiled'])

    def test_endpoint_local_known_denial_and_remote_unknown_control_differ(self):
        _,ways,nodes=lane_fixture();way=ways[0];local=[n for n in nodes if n['id'] in {p[0] for p in way['nodes']}]
        local[0]['tags']['access']='no';result=segments(way,local,default_policy=DEFAULTS)
        self.assertFalse(result['segments'][0]['directions']['forward']['modeled_permitted'])
        self.assertTrue(result['segments'][1]['directions']['forward']['modeled_permitted'])
        local[0]['tags']={'barrier':'gate'};result=segments(way,local,default_policy=DEFAULTS)
        self.assertEqual(result['status'],'unsupported');self.assertIsNone(result['segments'])

    def test_actual_other_weights_are_exactly_unchanged(self):
        raw=json.loads(CONTEXT.read_text());nodes={n['id']:n for n in raw['nodes']}
        for way in raw['ways']:
            if way['id']==140486410:continue
            local=[nodes[nid] for nid in sorted({p[0] for p in way['nodes']})]
            old=historical_weights(way,local,default_policy=DEFAULTS);new=weights(way,local,default_policy=DEFAULTS)
            self.assertEqual(new['status'],old['status'])
            self.assertEqual(new['arcs'],old['arcs'])

    def test_guidance_speed_validation_cannot_hide_overridden_or_denied_controls(self):
        for tag,value in [('maxspeed','walk'),('maxspeed:backward','0'),('maxspeed:lanes','25|30'),('maxspeed:conditional','25 @ (We)')]:
            _,ways,nodes=lane_fixture();way=ways[0];way['tags'].update({'oneway':'yes','maxspeed:forward':'25',tag:value})
            local=[n for n in nodes if n['id'] in {p[0] for p in way['nodes']}]
            result=weights(way,local,default_policy=DEFAULTS)
            self.assertEqual(result['status'],'unsupported',(tag,value));self.assertIsNone(result['arcs'])

    def test_directional_limits_and_original_geometry_are_retained(self):
        _,ways,nodes=lane_fixture();way=ways[0];way['tags'].update({'maxspeed':'25 mph','maxspeed:backward':'10'})
        local=[n for n in nodes if n['id'] in {p[0] for p in way['nodes']}];before=copy.deepcopy((way,local))
        result=weights(way,local,default_policy=DEFAULTS);arcs=result['arcs']
        self.assertEqual(len(arcs),4)
        self.assertAlmostEqual(arcs[0]['selected_speed_kph'],40.2336)
        self.assertEqual(arcs[1]['selected_speed_kph'],10)
        self.assertEqual(arcs[1]['raw_geometry'],list(reversed(arcs[0]['raw_geometry'])))
        self.assertEqual((way,local),before);self.assertFalse(result['lane_indications_used_as_restrictions'])
