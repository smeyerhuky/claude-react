import copy
from fractions import Fraction
import json
import unittest
from road_posted_speed_weights import weights
from road_posted_speed_graph import compile_graph,query
from fort_collins_posted_speed_checkpoint import project,REFERENCE,SOURCE
from fort_collins_guidance_incidence_checkpoint import REFERENCE as CORE
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_guidance_segments import weights as strict_weights
from test_road_static_lane_guidance import fixture
from test_road_maneuver_probe import independent_history_truth
from road_maneuver_probe import solve


def weighted(way,nodes,**kwargs):return weights(way,nodes,default_policy=DEFAULTS,**kwargs)


def raw_graph():
    raw=json.loads(SOURCE.read_text());ways=[w for w in raw['ways'] if w['tags'].get('highway') in HIGHWAYS]
    ids={p[0] for w in ways for p in w['nodes']};nodes=[n for n in raw['nodes'] if n['id'] in ids]
    return ways,nodes,raw['control_relations']


class PostedSpeedTests(unittest.TestCase):
    def test_frozen_source_profile_preserves_strict_parent_and_all_old_arcs(self):
        report=project();self.assertEqual(report,json.loads((REFERENCE/'report.json').read_text()))
        self.assertEqual((report['declared_roads'],report['declared_road_nodes'],report['weighted_arcs'],report['supplied_controls']),(32,121,175,9))
        self.assertEqual(report['unchanged_previously_supported_arcs'],165)
        ways,nodes,_=raw_graph();way=next(w for w in ways if w['id']==134584347)
        local=[n for n in nodes if n['id'] in {p[0] for p in way['nodes']}]
        self.assertEqual(strict_weights(way,local,default_policy=DEFAULTS)['status'],'unsupported')

    def test_static_literal_sign_requires_an_explicit_valid_numeric_base(self):
        for raw in (None,'walk','0','-1','170','25;30','DE:urban'):
            way,nodes=fixture();way['tags'].update({'maxspeed:type':'sign','maxspeed:forward':'25'})
            if raw is not None:way['tags']['maxspeed']=raw
            result=weighted(way,nodes);self.assertEqual(result['status'],'unsupported',raw);self.assertIsNone(result['arcs'])

    def test_other_type_values_namespaces_and_source_conflicts_reject(self):
        for tags in ({'maxspeed:type':'electronic_sign'},{'maxspeed:type':'construction'},{'maxspeed:type':'US:urban'},
                     {'maxspeed:type':'SIGN'},{'maxspeed:type:forward':'sign'},{'maxspeed:conditional':'25 @ (We)'},
                     {'maxspeed:lanes':'25|30'},{'maxspeed:type':'sign','source:maxspeed':'US:urban'}):
            way,nodes=fixture();way['tags'].update({'maxspeed':'25 mph',**tags})
            result=weighted(way,nodes);self.assertEqual(result['status'],'unsupported',tags);self.assertIsNone(result['arcs'])

    def test_directional_speed_selection_and_exact_units_are_unchanged(self):
        way,nodes=fixture();way['tags'].update({'maxspeed:type':'sign','maxspeed':'25 mph','maxspeed:backward':'10'})
        result=weighted(way,nodes);self.assertEqual(result['status'],'supported_segment_weights')
        forward,backward=result['arcs'];self.assertEqual(forward['speed_mps_fraction'],[1397,125])
        self.assertEqual(backward['speed_mps_fraction'],[25,9])
        self.assertEqual(backward['raw_geometry'],list(reversed(forward['raw_geometry'])))
        self.assertFalse(result['posted_speed_metadata']['creates_speed_value'])
        self.assertEqual(result['posted_speed_metadata']['raw_numeric_base'],'25 mph')

    def test_denied_or_overridden_direction_does_not_hide_invalid_speed(self):
        way,nodes=fixture();way['tags'].update({'oneway':'yes','maxspeed:type':'sign','maxspeed':'25 mph','maxspeed:backward':'walk'})
        self.assertIsNone(weighted(way,nodes)['arcs'])

    def test_node_extent_and_hidden_physical_or_lane_controls_stay_unsupported(self):
        for node_tags,way_tags in (({'maxspeed':'25'},{}),({'maxspeed:type':'sign'},{}),({'barrier':'bollard'},{}),
                                   ({},{'hov':'designated'}),({},{'access:lanes:forward':'yes|no'})):
            way,nodes=fixture();way['tags'].update({'maxspeed':'25 mph','maxspeed:type':'sign',**way_tags});nodes[0]['tags'].update(node_tags)
            result=weighted(way,nodes);self.assertIsNone(result['arcs']);self.assertEqual(result['status'],'unsupported')

    def test_4292_core_and_source_star_queries_match_independent_history_graph(self):
        report=json.loads((REFERENCE/'report.json').read_text());graph=report['declared_compilation']['graph']
        core=json.loads((CORE/'report.json').read_text())['declared_compilation']['graph']['nodes']
        pairs=[(a,b) for a in core for b in core]+[(11268369829,b) for b in graph['nodes']]
        self.assertEqual(len(pairs)*2,4292)
        for metric in ('length','travel_time'):
            for source,target in pairs:
                actual=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source,target,metric)
                truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                self.assertEqual(truth,None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])) )

    def test_unknown_supplied_control_rejects_whole_bundle_without_weight_fallback(self):
        ways,nodes,controls=raw_graph();self.assertIsNotNone(compile_graph(ways,nodes,controls,default_policy=DEFAULTS)['graph'])
        bad=copy.deepcopy(controls);bad[0]['tags']={'type':'connectivity','connectivity':'1:1'}
        result=query(ways,nodes,bad,11268369829,11268369827,default_policy=DEFAULTS)
        self.assertEqual(result['status'],'unsupported');self.assertIsNone(result['result']);self.assertIsNone(result['compilation']['graph'])

    def test_original_records_and_no_access_approval_claims(self):
        way,nodes=fixture();way['tags'].update({'maxspeed':'25 mph','maxspeed:type':'sign'});before=copy.deepcopy((way,nodes))
        result=weighted(way,nodes);self.assertEqual((way,nodes),before)
        for flag in ('actual_speed_sign_verified','access_verified','global_speed_ceiling_certified','release_eligible',
                     'anchors_adopted','connector_costs_included','geographic_coverage_certified'):
            self.assertIs(result[flag],False)

    def test_conditional_member_clock_is_not_inferred_from_speed_metadata(self):
        way,nodes=fixture();way['tags'].update({'maxspeed':'25 mph','maxspeed:type':'sign','motorcar:conditional':'yes @ (We)'})
        self.assertEqual(weighted(way,nodes)['status'],'unsupported')
        self.assertEqual(weighted(way,nodes,feature_zones={f'way:{way["id"]}':'America/Denver'})['status'],'supported_segment_weights')
