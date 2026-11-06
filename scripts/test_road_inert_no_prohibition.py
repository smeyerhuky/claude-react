import copy
import itertools
import unittest
from road_inert_no_prohibition import audit
from road_guidance_segments import weights
from road_reference_way_permissions import DEFAULTS
from test_road_maneuver_probe import independent_history_truth


def fixture():
    ways=[dict(id=10,tags={'highway':'residential'},nodes=[[1,-105.,40.],[2,-104.999,40.]]),
          dict(id=20,tags={'highway':'residential','oneway':'yes'},nodes=[[3,-104.998,40.],[2,-104.999,40.]])]
    nodes=[dict(id=p[0],lonlat=p[1:],tags={}) for p in (ways[0]['nodes'][0],ways[0]['nodes'][1],ways[1]['nodes'][0])]
    rule=dict(id=99,tags={'type':'restriction','restriction':'no_left_turn'},members=[dict(type='w',ref=10,role='from'),dict(type='n',ref=2,role='via'),dict(type='w',ref=20,role='to')])
    return rule,ways,nodes


class InertNoProhibitionTests(unittest.TestCase):
    def test_complete_original_denied_departure_and_immutable_inputs(self):
        r,w,n=fixture();before=copy.deepcopy((r,w,n));v=audit(r,w,n,default_policy=DEFAULTS)
        self.assertEqual(v['status'],'inert_declared_no_prohibition');self.assertEqual(v['oneway_denied_arc_ids'],['raw:20:0:backward'])
        self.assertEqual((r,w,n),before);self.assertIsNone(v['active_pattern']);self.assertTrue(v['raw_relation_retained'])
        for flag in ('strict_compiler_replaced','normal_graph_admitted','physical_or_legal_access_verified','anchors_adopted','release_eligible'):self.assertFalse(v[flag])

    def test_every_source_target_cost_with_original_no_rule_matches_without_inert_pattern(self):
        r,w,n=fixture();proof=audit(r,w,n,default_policy=DEFAULTS);arcs=[]
        for way in w:
            ids={p[0] for p in way['nodes']};arcs+=weights(way,[node for node in n if node['id'] in ids],default_policy=DEFAULTS)['arcs']
        # Independent oracle can retain a prohibition containing an absent arc;
        # no production compiler or active-prefix implementation is used here.
        rule=dict(id='original',kind='no',arc_sequence=[t['id'] for t in proof['required_raw_transitions']])
        for metric in ('length','travel_time'):
            for source,target in itertools.product((1,2,3),repeat=2):
                self.assertEqual(independent_history_truth(arcs,[rule],source,target,metric),independent_history_truth(arcs,[],source,target,metric))

    def test_only_rules_are_never_inert_and_would_change_reachable_costs(self):
        r,w,n=fixture();r['tags']['restriction']='only_right_turn';self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')
        arcs=[dict(id='a',way=10,**{'from':1,'to':2},length=1,travel_time=1),dict(id='alternative',way=30,**{'from':2,'to':4},length=1,travel_time=1)]
        self.assertIsNotNone(independent_history_truth(arcs,[],1,4,'length'))
        self.assertIsNone(independent_history_truth(arcs,[dict(id='only',kind='only',arc_sequence=['a','absent-departure'])],1,4,'length'))

    def test_denied_approach_reverse_oneway_and_mirrored_endpoint_orientation(self):
        r,w,n=fixture();w[1]['tags'].pop('oneway');w[0]['tags']['oneway']='-1'
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['oneway_denied_arc_ids'],['raw:10:0:forward'])
        for way in w:way['nodes'].reverse()
        w[0]['tags']['oneway']='yes'
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['oneway_denied_arc_ids'],['raw:10:0:backward'])

    def test_restoring_the_direction_invalidates_inertness_and_original_rule_can_matter(self):
        r,w,n=fixture();w[1]['tags']['oneway']='no';self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')
        arcs=[]
        for way in w:
            ids={p[0] for p in way['nodes']};arcs+=weights(way,[node for node in n if node['id'] in ids],default_policy=DEFAULTS)['arcs']
        self.assertIsNotNone(independent_history_truth(arcs,[],1,3,'length'))
        self.assertIsNone(independent_history_truth(arcs,[dict(id='no',kind='no',arc_sequence=['raw:10:0:forward','raw:20:0:backward'])],1,3,'length'))

    def test_unknown_gate_whole_way_turn_dimensions_and_unsupported_tags_cannot_be_hidden(self):
        for change in ('gate','turn','dimension','unknown-oneway','access-only'):
            r,w,n=fixture()
            if change=='gate':n[0]['tags']['barrier']='gate'
            if change=='turn':w[0]['tags']['turn']='right'
            if change=='dimension':w[0]['tags']['maxheight']='2'
            if change=='unknown-oneway':w[0]['tags']['oneway']='sometimes'
            if change=='access-only':w[1]['tags'].pop('oneway');w[1]['tags']['access']='no'
            with self.subTest(change=change):self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')

    def test_missing_duplicate_foreign_mismatched_and_ambiguous_raw_context_rejects(self):
        for change in ('missing','duplicate','foreign','geometry','interior','wrong-way'):
            r,w,n=fixture()
            if change=='missing':n.pop()
            if change=='duplicate':n[-1]=copy.deepcopy(n[0])
            if change=='foreign':n[-1]['id']=90
            if change=='geometry':n[0]['lonlat'][0]=-104.
            if change=='interior':w[1]['nodes'].append(copy.deepcopy(w[0]['nodes'][0]))
            if change=='wrong-way':w[0]['id']=98
            with self.subTest(change=change):self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')

    def test_conditional_applicability_requires_explicit_zone_and_inactive_exempt_rules_reject(self):
        r,w,n=fixture();r['tags']={'type':'restriction','restriction:conditional':'no_left_turn @ (We 12:00-13:00)'}
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS,relation_zone='America/Denver')['status'],'inert_declared_no_prohibition')
        r['tags']['restriction:conditional']='no_left_turn @ (We 13:00-14:00)'
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS,relation_zone='America/Denver')['status'],'unsupported')
        r['tags']={'type':'restriction','restriction':'no_left_turn','except':'motorcar'}
        self.assertEqual(audit(r,w,n,default_policy=DEFAULTS)['status'],'unsupported')
