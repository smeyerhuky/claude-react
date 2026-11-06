import copy
import json
import unittest
from fort_collins_opaque_source_core import inputs,validate_layout,REFERENCE,PARENT,RAW_PARENT
from fort_collins_opaque_source_checkpoint import project


class ExpandedOpaqueSourceTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=json.loads((REFERENCE/'report.json').read_text())
        cls.captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)]

    def test_frozen_two_capture_reconciliation_with_all_controls(self):
        self.assertEqual(project(),self.report)
        self.assertEqual(self.report['source_partition_way_counts'],[94,95])
        self.assertEqual(self.report['source_partition_seed_counts'],[156,91])
        self.assertEqual((self.report['source_seed_nodes'],self.report['raw_source_ways'],self.report['retained_controls']),(247,152,15))
        self.assertEqual(self.report['complete_source_nodes'],799)

    def test_old_whole_records_and_frozen_bounds_are_preserved_without_widening_their_claim(self):
        before=(PARENT/'report.json').read_bytes();old=json.loads((RAW_PARENT/'report.json').read_text())['reconciled_source']
        for kind in ('ways','nodes','control_relations'):
            by={r['id']:r for r in self.report['reconciled_source'][kind]}
            self.assertTrue(all(by[r['id']]==r for r in old[kind]))
        self.assertEqual(before,(PARENT/'report.json').read_bytes())
        self.assertIsNone(self.report['wider_cost_brackets'])
        self.assertFalse(self.report['old_cost_brackets_extended_to_this_universe'])
        self.assertTrue(all(r['conditional_stored_cost_stable_within_supplied_universe'] for r in json.loads(before)['metric_brackets'].values()))

    def test_the_rejected_prohibition_and_compilable_reverse_declaration_both_remain_explicit(self):
        rules=self.report['individual_restriction_compilations'];self.assertEqual(len(rules),15)
        self.assertEqual(self.report['unsupported_declaration_ids'],[11978581])
        self.assertEqual(sum(r['topology_compiled'] for r in rules.values()),14)
        self.assertFalse(rules['11978581']['topology_compiled']);self.assertTrue(rules['11978582']['topology_compiled'])
        self.assertIn('not permitted',rules['11978581']['reason'])
        raw=self.report['unsupported_declaration_raw_context']['11978581'];self.assertEqual(raw['raw_relation']['tags']['restriction'],'no_left_turn')
        chestnut=next(w for w in raw['complete_member_ways'] if w['id']==1216151139)
        self.assertEqual(chestnut['tags']['oneway'],'yes');self.assertEqual(chestnut['nodes'][-1][0],51123941)
        self.assertEqual(raw['raw_relation']['members'][2],dict(type='w',ref=1216151139,role='to'))

    def test_gate_and_whole_way_turn_tags_remain_unknown_not_denied_or_stripped(self):
        unknown=self.report['unsupported_model_roads'];self.assertEqual(set(unknown),{'201855578','1216151141'})
        self.assertEqual(unknown['1216151141']['complete_raw_way']['tags']['turn'],'right')
        self.assertEqual(len(unknown['1216151141']['complete_raw_way']['nodes']),11)
        gate=next(n for n in self.report['reconciled_source']['nodes'] if n['id']==8917794983)
        self.assertEqual(gate['tags'],{'barrier':'gate'})
        self.assertTrue(all(r['permission_assumed'] is False for r in unknown.values()))

    def test_missing_overlapping_or_promoted_layout_rejects(self):
        _,_,selection,_=inputs();base=json.loads((REFERENCE/'partition-layout.json').read_text())
        for change in ('missing','overlap','member','approval'):
            value=copy.deepcopy(base)
            if change=='missing':value['partitions'][0]['seed_node_ids'].pop()
            if change=='overlap':value['partitions'][1]['seed_node_ids']=sorted(value['partitions'][1]['seed_node_ids']+[value['partitions'][0]['seed_node_ids'][0]])
            if change=='member':value['partitions'][0]['requested_member_way_ids'].pop()
            if change=='approval':value['layout_is_access_evidence']=True
            with self.subTest(change=change),self.assertRaises(ValueError):validate_layout(value,selection)

    def test_capture_seed_omission_or_conflicting_shared_record_rejects_atomically(self):
        value=copy.deepcopy(self.captures);value[0]['seed_node_ids'].pop()
        with self.assertRaises(ValueError):project(value)
        value=copy.deepcopy(self.captures);common={w['id'] for w in value[0]['ways']}&{w['id'] for w in value[1]['ways']}
        next(w for w in value[1]['ways'] if w['id'] in common)['tags']['access']='yes'
        with self.assertRaises(ValueError):project(value)
        self.assertEqual(self.captures,[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)])

    def test_new_source_control_cannot_be_silently_omitted(self):
        value=copy.deepcopy(self.captures)
        for capture in value:capture['control_relations']=[r for r in capture['control_relations'] if r['id']!=11978581]
        with self.assertRaises(ValueError):project(value)

    def test_no_route_nodata_geographic_or_release_claim_and_existing_limits_unchanged(self):
        r=self.report
        for flag in ('per_capture_or_compiler_limits_changed','unknown_controls_omitted','gate_state_assumed','normal_graph_admitted',
                     'route_query_result_returned','modeled_nodata_emitted','global_route_optimality_certified',
                     'geographic_coverage_certified','actual_access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(r[flag],False)
        self.assertEqual((r['per_capture_way_limit'],r['raw_union_way_budget']),(100,200))
        self.assertEqual(r['unenumerated_outer_source_nodes'],552)
        self.assertIsNone(r['full_candidate_compilation']['graph'])
        for q in r['full_candidate_queries'].values():self.assertEqual(q['status'],'unsupported');self.assertIsNone(q['result'])
