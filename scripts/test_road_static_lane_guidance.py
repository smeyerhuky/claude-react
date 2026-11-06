import copy
import json
import unittest
from road_static_lane_guidance import parse
from road_guidance_way_permissions import evaluate
from road_reference_way_permissions import evaluate as historical,DEFAULTS
from road_reference_scenario import load
from fort_collins_control_checkpoint import CONTEXT


def fixture():
    way=dict(id=10,tags={'highway':'residential','lanes':'4','lanes:forward':'2','lanes:backward':'2',
                        'turn:lanes:backward':'left|through'},nodes=[[1,-105.,40.],[2,-105.001,40.]])
    nodes=[dict(id=p[0],lonlat=p[1:],tags={}) for p in way['nodes']]
    return way,nodes


def project(way,nodes,**kwargs):return evaluate(way,nodes,default_policy=DEFAULTS,**kwargs)


class StaticLaneGuidanceTests(unittest.TestCase):
    def test_frozen_original_source_checkpoint_and_no_release_claims(self):
        from fort_collins_guidance_checkpoint import project as checkpoint,REFERENCE
        result=checkpoint()
        self.assertEqual(result,json.loads((REFERENCE/'report.json').read_text()))
        self.assertEqual(len(result['supported_permission_way_ids']),34)
        self.assertEqual(result['unsupported_model_road_ids'],[815164359])
        for flag in ('lane_connectivity_evaluated','turn_restrictions_evaluated','graph_returned','access_verified','release_eligible'):
            self.assertIs(result[flag],False)

    def test_driver_facing_backward_lane_order_is_not_reversed(self):
        way,_=fixture();parsed=parse(way['tags']);rows=parsed['indications_by_raw_direction']['backward']['lanes']
        self.assertEqual([r['indications'] for r in rows],[['left'],['through']])
        self.assertEqual([r['lane_index_left_to_right_in_driving_direction'] for r in rows],[1,2])
        self.assertNotIn('forward',parsed['indications_by_raw_direction'])
        self.assertFalse(parsed['indications_create_turn_prohibitions']);self.assertFalse(parsed['indications_create_turn_permissions'])

    def test_empty_none_and_multivalue_indications_do_not_become_bans(self):
        way,_=fixture();way['tags']['turn:lanes:backward']='none|left;through'
        rows=parse(way['tags'])['indications_by_raw_direction']['backward']['lanes']
        self.assertTrue(rows[0]['indication_absent']);self.assertEqual(rows[1]['indications'],['left','through'])
        way['tags']['turn:lanes:backward']='|through'
        self.assertEqual(parse(way['tags'])['indications_by_raw_direction']['backward']['lanes'][0]['indications'],[])

    def test_unqualified_indications_require_explicit_static_oneway(self):
        for raw,direction in [('yes','forward'),('-1','backward')]:
            tags={'highway':'residential','lanes':'2','oneway':raw,'turn:lanes':'left|through'}
            self.assertIn(direction,parse(tags)['indications_by_raw_direction'])
        with self.assertRaises(ValueError):parse({'lanes':'2','turn:lanes':'left|through'})
        with self.assertRaises(ValueError):parse({'lanes':'2','oneway':'yes','oneway:motorcar':'no','turn:lanes':'left|through'})

    def test_counts_cardinality_and_conflicting_indication_sources_reject(self):
        for key,value in [('lanes','3'),('lanes:backward','3'),('turn:lanes:backward','left'),('lanes','4.0')]:
            way,_=fixture();way['tags'][key]=value
            with self.subTest(key=key,value=value),self.assertRaises(ValueError):parse(way['tags'])
        way,_=fixture();way['tags']['turn:lanes']='left|through'
        with self.assertRaises(ValueError):parse(way['tags'])

    def test_unknown_dynamic_and_per_lane_controls_are_never_annotations(self):
        for key,value in [('access:lanes','yes|no'),('motorcar:lanes','yes|no'),('change:lanes','no|no'),
                          ('maxspeed:lanes','20|30'),('hov:lanes','no|yes'),('turn:lanes:conditional','left|through @ (We)'),
                          ('lanes:both_ways','1'),('turn:bus:lanes','left|through'),('busway','lane'),('busway:right','lane')]:
            way,_=fixture();way['tags'][key]=value
            with self.subTest(key=key),self.assertRaises(ValueError):parse(way['tags'])

    def test_unknown_duplicate_or_ambiguous_indication_tokens_reject(self):
        for raw in ('left;left|through','none;left|through','slide_left|through','LEFT|through','left| through','left|next_right'):
            way,_=fixture();way['tags']['turn:lanes:backward']=raw
            with self.subTest(raw=raw),self.assertRaises(ValueError):parse(way['tags'])

    def test_road_access_is_independent_of_changed_indication_tokens(self):
        way,nodes=fixture();before=copy.deepcopy((way,nodes));first=project(way,nodes)
        self.assertEqual(first['status'],'supported_tag_projection')
        self.assertEqual(first['eligible_directions'],['forward','backward'])
        self.assertEqual((way,nodes),before)
        way['tags']['turn:lanes:backward']='right|through'
        changed=project(way,nodes)
        self.assertEqual(first['direction_permissions'],changed['direction_permissions'])
        self.assertNotEqual(first['input_sha256'],changed['input_sha256'])
        self.assertFalse(first['lane_indications_used_as_restrictions']);self.assertFalse(first['lane_connectivity_evaluated'])

    def test_car_mode_precedence_and_direction_controls_remain_enforced(self):
        way,nodes=fixture();way['tags'].update({'access':'no','motorcar':'yes','oneway':'-1'})
        result=project(way,nodes);self.assertEqual(result['eligible_directions'],['backward'])
        way['tags']['motorcar']='private';self.assertEqual(project(way,nodes)['eligible_directions'],[])
        way['tags']['motorcar']='destination';self.assertEqual(project(way,nodes)['status'],'unsupported')

    def test_member_conditional_controls_need_their_own_explicit_feature_clock(self):
        way,nodes=fixture();way['tags']['motorcar:conditional']='no @ (We)'
        self.assertEqual(project(way,nodes)['status'],'unsupported')
        fixed=project(way,nodes,feature_zones={'way:10':'America/Denver'})
        self.assertEqual(fixed['eligible_directions'],[])
        other=load();other['reference_instant_utc']='2026-10-29T18:00:00Z'
        result=project(way,nodes,scenario=other,feature_zones={'way:10':'America/Denver'})
        self.assertEqual(result['eligible_directions'],['forward','backward'])

    def test_lane_acceptance_does_not_hide_later_way_control_guards(self):
        for key,value in [('barrier','gate'),('traffic_sign','US:R3-2'),('maxheight','2'),('hov','designated'),
                          ('opening_hours','24/7'),('ford','yes'),('construction','yes')]:
            way,nodes=fixture();way['tags'][key]=value
            with self.subTest(key=key):self.assertEqual(project(way,nodes)['status'],'unsupported')

    def test_nodes_are_fully_checked_after_historical_way_lane_rejection(self):
        for tags in ({'barrier':'bollard'},{'oneway':'yes'},{'access:forward':'no'},{'maxwidth':'2'},
                     {'motorcar:conditional':'yes @ (PH)'},{'turn:lanes':'left|through'}):
            way,nodes=fixture();nodes[0]['tags']=tags
            with self.subTest(tags=tags):self.assertEqual(project(way,nodes)['status'],'unsupported')

    def test_missing_duplicate_and_misaligned_node_context_stays_unsupported(self):
        way,nodes=fixture();self.assertEqual(project(way,nodes[:-1])['status'],'unsupported')
        self.assertEqual(project(way,[nodes[0],nodes[0]])['status'],'unsupported')
        nodes[0]['lonlat'][0]+=.001;self.assertEqual(project(way,nodes)['status'],'unsupported')

    def test_zero_lane_direction_and_model_direction_conflict_rejects(self):
        way,nodes=fixture();way['tags'].update({'lanes:forward':'0','lanes:backward':'4','turn:lanes:backward':'left|through|through|through'})
        self.assertEqual(project(way,nodes)['status'],'unsupported')

    def test_actual_source_guidance_is_parsed_but_historical_profile_stays_frozen(self):
        raw=json.loads(CONTEXT.read_text());way=next(w for w in raw['ways'] if w['id']==140486410)
        ids={p[0] for p in way['nodes']};nodes=[n for n in raw['nodes'] if n['id'] in ids];before=copy.deepcopy((way,nodes))
        old=historical(way,nodes,default_policy=DEFAULTS);result=project(way,nodes)
        self.assertEqual(old['status'],'unsupported');self.assertEqual(result['status'],'supported_tag_projection')
        self.assertEqual(result['eligible_directions'],['forward','backward'])
        self.assertEqual(result['static_lane_guidance']['raw_lane_keys']['turn:lanes:backward'],'left|through')
        self.assertEqual((way,nodes),before)

    def test_all_other_actual_corpus_permission_semantics_match_the_historical_profile(self):
        raw=json.loads(CONTEXT.read_text());nodes={n['id']:n for n in raw['nodes']}
        for way in raw['ways']:
            if way['id']==140486410:continue
            ids={p[0] for p in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
            old=historical(way,local,default_policy=DEFAULTS);result=project(way,local)
            self.assertEqual(result['status'],old['status'],way['id'])
            if old['status']=='supported_tag_projection':self.assertEqual(result['direction_permissions'],old['direction_permissions'],way['id'])

    def test_no_routing_access_approval_or_lane_connectivity_claims(self):
        result=project(*fixture())
        for flag in ('lane_connectivity_evaluated','lane_changes_evaluated','lane_level_graph_constructed','turn_restrictions_evaluated',
                     'route_cost_emitted','geographic_coverage_certified','access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(result[flag],False)
