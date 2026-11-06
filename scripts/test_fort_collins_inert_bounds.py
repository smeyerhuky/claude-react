import copy
from fractions import Fraction
import json
import random
import unittest
from fort_collins_inert_bounds_checkpoint import project,REFERENCE,PARENT,account_declarations
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_posted_speed_weights import weights
from road_opaque_control_bounds import geometry_lower_bounds
from test_road_maneuver_probe import independent_history_truth


def model():
    parent=json.loads((PARENT/'report.json').read_text());u=parent['reconciled_source'];nodes={n['id']:n for n in u['nodes']};known=[];possible=[]
    for w in u['ways']:
        if w['tags'].get('highway') not in HIGHWAYS:continue
        local=[nodes[n] for n in sorted({p[0] for p in w['nodes']})];value=weights(w,local,default_policy=DEFAULTS)
        if value['arcs'] is not None:known.extend(value['arcs'])
        else:possible.extend(geometry_lower_bounds(w,local,default_policy=DEFAULTS)['potential_arcs'])
    return parent,known,possible


class ActualInertBoundsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):cls.report=json.loads((REFERENCE/'report.json').read_text())

    def test_exact_frozen_expanded_brackets_and_every_original_declaration_accounted(self):
        r=project();self.assertEqual(r,self.report)
        self.assertEqual((r['retained_declarations'],r['active_compiled_patterns'],r['inactive_compiled_declarations'],r['inert_no_prohibitions']),(15,13,1,1))
        self.assertEqual((r['known_supported_arcs'],r['possible_geometry_arcs']),(743,32))
        self.assertEqual(r['declaration_accounting']['11978581']['audit']['oneway_denied_arc_ids'],['raw:1216151139:3:backward'])
        self.assertTrue(r['declaration_accounting']['11978582']['active'])
        self.assertFalse(r['declaration_accounting']['20193102']['active'])
        for q in r['metric_brackets'].values():
            self.assertEqual(q['gap_exact'],['0','1']);self.assertTrue(q['conditional_stored_cost_stable_within_supplied_universe'])
            self.assertFalse(q['optimistic_walk_uses_possible_geometry'])

    def test_original_prohibition_retained_by_independent_oracle_across_model_completions(self):
        parent,known,possible=model();patterns,accounting=account_declarations(parent['reconciled_source'],parent['individual_restriction_compilations'],known,possible)
        audit=accounting['11978581']['audit'];original=dict(id='retained-original-11978581',kind='no',arc_sequence=[t['id'] for t in audit['required_raw_transitions']])
        rng=random.Random(268)
        for metric,q in self.report['metric_brackets'].items():
            lower=Fraction(*map(int,q['optimistic_lower_bound_exact']));upper=Fraction(*map(int,q['supported_witness_upper_bound_exact']))
            for sample in range(14):
                arcs=copy.deepcopy(known)
                for a in possible:
                    if sample==0 or sample>=2 and rng.random()<.5:
                        edge=copy.deepcopy(a);edge[metric]+=0 if sample==0 else rng.choice((0,1,7,100));arcs.append(edge)
                truth=independent_history_truth(arcs,patterns+[original],q['source'],q['target'],metric)
                self.assertIsNotNone(truth);self.assertLessEqual(lower,truth);self.assertLessEqual(truth,upper)

    def test_reintroduced_denied_arc_or_hypothetical_member_geometry_rejects(self):
        p,known,possible=model();u=p['reconciled_source'];rules=p['individual_restriction_compilations']
        for change in ('raw-id','aliased-id','hypothetical-member'):
            k=copy.deepcopy(known);v=copy.deepcopy(possible)
            edge=dict(id='raw:1216151139:3:backward',way=1216151139,**{'from':51123941,'to':1216151139},length=1,travel_time=1)
            required=self.report['declaration_accounting']['11978581']['audit']['required_raw_transitions'][1]
            edge['to']=required['to']
            if change=='raw-id':k.append(edge)
            if change=='aliased-id':edge['id']='renamed-denied-transition';k.append(edge)
            if change=='hypothetical-member':edge['id']='possible-geometry:1216151139:3:backward';v.append(edge)
            with self.subTest(change=change),self.assertRaises(ValueError):account_declarations(u,rules,k,v)

    def test_omitted_or_rewritten_declaration_or_forged_old_compilation_rejects(self):
        p,k,v=model()
        for change in ('omit','rewrite','forged'):
            u=copy.deepcopy(p['reconciled_source']);rules=copy.deepcopy(p['individual_restriction_compilations'])
            if change=='omit':rules.pop('11978581')
            if change=='rewrite':next(r for r in u['control_relations'] if r['id']==11978581)['tags']['restriction']='only_right_turn'
            if change=='forged':rules['11978581']['topology_compiled']=True
            with self.subTest(change=change),self.assertRaises(ValueError):account_declarations(u,rules,k,v)

    def test_old_parent_strict_rejections_and_reports_remain_unchanged(self):
        before=(PARENT/'report.json').read_bytes();result=project();self.assertEqual(before,(PARENT/'report.json').read_bytes())
        self.assertIsNone(json.loads(before)['wider_cost_brackets'])
        self.assertIsNone(result['strict_parent_compilation']['graph'])
        for q in result['strict_parent_queries'].values():self.assertEqual(q['status'],'unsupported');self.assertIsNone(q['result'])

    def test_unknown_gate_and_turn_tags_remain_complete_and_unapproved(self):
        r=self.report;unknown=r['unknown_raw_way_context'];self.assertEqual(set(unknown),{'201855578','1216151141'})
        self.assertEqual(unknown['1216151141']['complete_raw_way']['tags']['turn'],'right')
        self.assertEqual(len(unknown['201855578']['complete_raw_way']['nodes']),7)
        self.assertEqual(len(unknown['1216151141']['complete_raw_way']['nodes']),11)
        for c in r['opaque_way_geometry_catalogues'].values():
            self.assertFalse(c['actual_gate_state_evaluated']);self.assertFalse(c['permission_claimed'])
            self.assertTrue(all(a['bound_only'] and a['modeled_permission'] is None and a['travel_time']==0 for a in c['potential_arcs']))

    def test_finite_domain_never_becomes_geographic_access_or_release_approval(self):
        r=self.report
        for flag in ('original_declarations_or_tags_changed','old_strict_compiler_replaced','unknown_controls_omitted','gate_state_assumed',
                     'whole_way_turn_permission_assumed','normal_graph_admitted','route_query_result_returned','global_route_optimality_certified',
                     'geographic_coverage_certified','actual_access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(r[flag],False)
        self.assertEqual(r['applied_exterior_route_exclusions'],[]);self.assertEqual(r['unenumerated_outer_source_nodes'],552)
        self.assertIn('no potential or new geometry',r['inertness_precondition'])
