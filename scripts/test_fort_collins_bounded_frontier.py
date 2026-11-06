import copy
from fractions import Fraction
import json
import random
import unittest
from fort_collins_bounded_frontier import diagnostic_inputs,inputs,REFERENCE,RAW_PARENT,validate_layout
from fort_collins_bounded_frontier_checkpoint import project
from fort_collins_inert_bounds_checkpoint import account_declarations
from road_posted_speed_graph import compile_graph,query,MAX_WAYS
from road_reference_way_permissions import DEFAULTS
from test_road_maneuver_probe import independent_history_truth


class BoundedFrontierTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=json.loads((REFERENCE/'report.json').read_text())
        cls.captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)]

    def test_frozen_two_capture_frontier_and_exact_cost_brackets(self):
        r=project();self.assertEqual(r,self.report)
        self.assertEqual(r['source_partition_way_counts'],[94,93]);self.assertEqual(r['source_partition_seed_counts'],[141,142])
        self.assertEqual((r['source_seed_nodes'],r['raw_source_ways'],r['complete_source_nodes'],r['retained_declarations']),(283,171,877,15))
        self.assertEqual((r['known_supported_arcs'],r['possible_geometry_arcs']),(857,32))
        for q in r['separate_finite_model_brackets'].values():
            self.assertEqual(q['gap_exact'],['0','1']);self.assertTrue(q['conditional_stored_cost_stable_within_supplied_universe'])
            self.assertFalse(q['optimistic_walk_uses_possible_geometry'])

    def test_actual_strict_api_remains_budget_rejected_even_though_separate_bounds_exist(self):
        r=self.report;u=r['reconciled_source'];ids,_,_,_,roads,_=diagnostic_inputs(u);by={n['id']:n for n in u['nodes']};nodes=[by[n] for n in ids]
        self.assertEqual(MAX_WAYS,100);self.assertEqual(len(roads),106)
        compiled=compile_graph(roads,nodes,u['control_relations'],default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
        self.assertEqual(compiled['reason'],'Bounded complete raw way list required');self.assertIsNone(compiled['graph'])
        for metric,q in r['separate_finite_model_brackets'].items():
            answer=query(roads,nodes,u['control_relations'],q['source'],q['target'],metric,default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
            self.assertEqual(answer['status'],'unsupported');self.assertIsNone(answer['result']);self.assertFalse(answer['route_cost_emitted'])

    def test_independent_oracle_retains_original_no_prohibition_across_larger_completions(self):
        r=self.report;u=r['reconciled_source'];_,known,possible,_,_,_=diagnostic_inputs(u)
        old=json.loads((RAW_PARENT/'report.json').read_text());patterns,accounting=account_declarations(u,old['individual_restriction_compilations'],known,possible)
        inert=accounting['11978581']['audit'];patterns.append(dict(id='original-no-11978581',kind='no',arc_sequence=[t['id'] for t in inert['required_raw_transitions']]))
        rng=random.Random(269)
        for metric,q in r['separate_finite_model_brackets'].items():
            lo=Fraction(*map(int,q['optimistic_lower_bound_exact']));hi=Fraction(*map(int,q['supported_witness_upper_bound_exact']))
            for sample in range(12):
                arcs=copy.deepcopy(known)
                for a in possible:
                    if sample==0 or sample>=2 and rng.random()<.5:
                        edge=copy.deepcopy(a);edge[metric]+=0 if sample==0 else rng.choice((0,1,7,100));arcs.append(edge)
                truth=independent_history_truth(arcs,patterns,q['source'],q['target'],metric)
                self.assertIsNotNone(truth);self.assertLessEqual(lo,truth);self.assertLessEqual(truth,hi)

    def test_every_parent_whole_record_and_input_capture_remains_unchanged(self):
        old=json.loads((RAW_PARENT/'report.json').read_text())['reconciled_source'];before=copy.deepcopy(self.captures);r=project(self.captures)
        self.assertEqual(self.captures,before)
        for kind in ('ways','nodes','control_relations'):
            by={row['id']:row for row in r['reconciled_source'][kind]}
            self.assertTrue(all(by[row['id']]==row for row in old[kind]))
        self.assertEqual(len(r['reconciled_source']['ways'])-len(old['ways']),19)

    def test_missing_seed_incidence_conflicting_record_or_omitted_control_rejects(self):
        for change in ('seed','incidence','shared','control'):
            captures=copy.deepcopy(self.captures)
            if change=='seed':captures[0]['seed_node_ids'].pop()
            if change=='incidence':next(iter(captures[0]['all_source_way_ids_at_seed_nodes'].values())).clear()
            if change=='shared':
                common={w['id'] for w in captures[0]['ways']}&{w['id'] for w in captures[1]['ways']}
                next(w for w in captures[1]['ways'] if w['id'] in common)['tags']['access']='yes'
            if change=='control':
                for c in captures:c['control_relations']=[v for v in c['control_relations'] if v['id']!=11978581]
            with self.subTest(change=change),self.assertRaises(ValueError):project(captures)

    def test_layout_cannot_drop_overlap_or_promote_selected_nodes(self):
        _,_,selection,_=inputs();base=json.loads((REFERENCE/'partition-layout.json').read_text())
        for change in ('missing','overlap','approval'):
            layout=copy.deepcopy(base)
            if change=='missing':layout['partitions'][0]['seed_node_ids'].pop()
            if change=='overlap':layout['partitions'][1]['seed_node_ids']=sorted(layout['partitions'][1]['seed_node_ids']+[layout['partitions'][0]['seed_node_ids'][0]])
            if change=='approval':layout['layout_is_access_evidence']=True
            with self.subTest(change=change),self.assertRaises(ValueError):validate_layout(layout,selection)

    def test_original_unknown_gate_and_turn_tags_cannot_be_erased(self):
        for way_id,key in ((201855578,'oneway'),(1216151141,'turn')):
            captures=copy.deepcopy(self.captures)
            for c in captures:
                for w in c['ways']:
                    if w['id']==way_id:w['tags'].pop(key,None)
            with self.subTest(way_id=way_id),self.assertRaises(ValueError):project(captures)

    def test_future_inspection_and_all_access_geography_release_gates_remain_explicit(self):
        r=self.report;future=r['next_source_inspection_selection']['selected_source_node_ids'];present=r['reconciled_source']['seed_node_ids']
        self.assertEqual(len(future),293);self.assertEqual(len(set(future)-set(present)),10)
        self.assertEqual(r['unenumerated_outer_source_nodes'],594)
        for flag in ('limits_changed','strict_query_api_changed','strict_query_cost_emitted','strict_budget_rejection_resolves_other_control_semantics',
                     'unknown_controls_omitted','gate_state_assumed','whole_way_turn_permission_assumed','normal_graph_admitted','route_query_result_returned',
                     'modeled_nodata_emitted','global_route_optimality_certified','geographic_coverage_certified','actual_access_verified','anchors_adopted',
                     'connector_costs_included','release_eligible'):
            self.assertIs(r[flag],False)
        self.assertEqual(r['applied_exterior_route_exclusions'],[])
