import copy
from fractions import Fraction
import json
import random
import unittest
from fort_collins_gate_bounds_checkpoint import project,REFERENCE,SOURCES,validate_sources
from fort_collins_partition_checkpoint import REFERENCE as STRICT,project as strict_project
from fort_collins_competitive_checkpoint import REFERENCE as WITNESS
from road_posted_speed_weights import weights
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_opaque_control_bounds import geometry_lower_bounds,bracket_cost
from test_road_maneuver_probe import independent_history_truth


def model():
    raw=json.loads((STRICT/'report.json').read_text());u=raw['reconciled_source'];nodes={n['id']:n for n in u['nodes']}
    known=[];potential=[];ids=set()
    for w in u['ways']:
        if w['tags'].get('highway') not in HIGHWAYS:continue
        localids={p[0] for p in w['nodes']};ids|=localids;local=[nodes[n] for n in sorted(localids)]
        result=weights(w,local,default_policy=DEFAULTS)
        if result['arcs'] is not None:known.extend(result['arcs'])
        else:potential.extend(geometry_lower_bounds(w,local,default_policy=DEFAULTS)['potential_arcs'])
    rules=[r['active_pattern'] for r in raw['individual_restriction_compilations'].values() if r['active_pattern'] is not None]
    return sorted(ids),known,potential,rules


class ActualGateBoundsTests(unittest.TestCase):
    def test_frozen_equal_exact_brackets_and_unresolved_strict_parent(self):
        result=project();self.assertEqual(result,json.loads((REFERENCE/'report.json').read_text()))
        self.assertEqual((result['known_supported_arcs'],result['opaque_geometry_possibilities'],result['active_known_maneuvers']),(606,12,12))
        self.assertEqual(result['strict_parent_status'],'unsupported');self.assertIsNone(result['strict_parent_graph'])
        for row in result['metric_brackets'].values():
            self.assertTrue(row['conditional_stored_cost_stable_within_supplied_universe']);self.assertEqual(row['gap_exact'],['0','1'])
            self.assertFalse(row['optimistic_walk_uses_possible_geometry']);self.assertFalse(row['normal_graph_admitted'])

    def test_sampled_model_completions_match_independent_history_truth_and_bounds(self):
        nodes,known,potential,rules=model();witness=json.loads((WITNESS/'report.json').read_text())['query_replays'];rng=random.Random(266)
        for metric,q in witness.items():
            result=bracket_cost(nodes,known,potential,rules,q['source'],q['target'],q['arc_path'],metric)
            lo=Fraction(*map(int,result['optimistic_lower_bound_exact']));hi=Fraction(*map(int,result['supported_witness_upper_bound_exact']))
            for sample in range(22):
                completed=copy.deepcopy(known)
                for arc in potential:
                    if sample==0 or sample>=2 and rng.random()<.5:
                        row=copy.deepcopy(arc);row[metric]+=0 if sample==0 else rng.choice((0,1,7,100));completed.append(row)
                expected=independent_history_truth(completed,rules,q['source'],q['target'],metric)
                self.assertIsNotNone(expected);self.assertLessEqual(lo,expected);self.assertLessEqual(expected,hi)

    def test_gate_tag_context_and_old_frozen_strict_report_are_unchanged(self):
        path=STRICT/'report.json';before=path.read_bytes();result=project()
        self.assertEqual(before,path.read_bytes());self.assertEqual(strict_project(),json.loads(before))
        gate=result['gate_review_context'];self.assertEqual(gate['raw_node']['tags'],{'barrier':'gate'})
        self.assertEqual(gate['operation_status'],'unknown');self.assertFalse(gate['field_evidence_obtained'])
        self.assertFalse(gate['gate_assumed_open']);self.assertFalse(gate['gate_assumed_closed'])

    def test_municipal_source_scopes_cannot_be_promoted_to_gate_operation_evidence(self):
        base=json.loads(SOURCES.read_text())
        for change in ('scope','gate','approval','long-quote'):
            value=copy.deepcopy(base)
            if change=='scope':value['records'][0]['source_scope']='gate_operation_rule'
            if change=='gate':value['records'][0]['exact_gate_operation_established']=True
            if change=='approval':value['independent_access_evidence_approved']=True
            if change=='long-quote':value['records'][0]['quote']=' '.join(['word']*26)
            with self.subTest(change=change),self.assertRaises(ValueError):validate_sources(value)

    def test_exact_raw_spur_endpoints_do_not_establish_a_garage_entry_or_design_extent_match(self):
        result=json.loads((REFERENCE/'report.json').read_text())
        self.assertEqual({r['raw_way_id'] for r in result['raw_endpoint_attachments']},{524168682,1068300299})
        self.assertEqual({r['raw_name'] for r in result['raw_endpoint_attachments']},{'Walnut Street','Old Firehouse Alley'})
        self.assertTrue(all(r['exact_gate_operation_established'] is False for r in result['source_scope_findings'].values()))

    def test_new_geometry_outside_the_completion_domain_invalidates_the_bracket(self):
        nodes,known,potential,rules=model();q=json.loads((WITNESS/'report.json').read_text())['query_replays']['length']
        # A deliberately synthetic attachment is outside the frozen raw universe.
        # This counterexample prevents presenting finite-model stability as global.
        new=dict(id='possible-geometry:999999:0:forward',way=999999,**{'from':q['source'],'to':q['target']},
                 length=1,travel_time=0,bound_only=True,modeled_permission=None)
        result=bracket_cost(nodes,known,potential+[new],rules,q['source'],q['target'],q['arc_path'],'length')
        self.assertFalse(result['conditional_stored_cost_stable_within_supplied_universe'])
        self.assertTrue(result['optimistic_walk_uses_possible_geometry']);self.assertFalse(result['access_verified'])

    def test_no_route_admission_global_optimality_anchors_or_access_approval_is_returned(self):
        result=json.loads((REFERENCE/'report.json').read_text())
        for flag in ('gate_state_assumed','strict_profile_or_source_tags_changed','normal_graph_admitted','route_query_result_returned',
                     'global_route_optimality_certified','geographic_coverage_certified','actual_access_verified','anchors_adopted',
                     'connector_costs_included','release_eligible'):
            self.assertIs(result[flag],False)
        self.assertEqual(result['applied_exterior_route_exclusions'],[])
        self.assertEqual(result['unenumerated_outer_source_nodes'],436)
