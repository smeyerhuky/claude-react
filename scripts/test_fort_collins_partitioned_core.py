import copy
import json
import unittest
from fort_collins_partition_checkpoint import project,SOURCE,REFERENCE


class PartitionedCoreTests(unittest.TestCase):
    def raw(self):return json.loads(SOURCE.read_text())

    def test_frozen_complete_reconciliation_and_raw_immutability(self):
        raw=self.raw();before=copy.deepcopy(raw);report=project(raw)
        self.assertEqual(report,json.loads((REFERENCE/'report.json').read_text()));self.assertEqual(raw,before)
        self.assertEqual(report['source_partition_way_counts'],[76,79]);self.assertEqual(report['source_partition_seed_counts'],[96,81])
        self.assertEqual((report['raw_source_ways'],report['complete_source_nodes'],report['source_seed_nodes'],report['retained_controls']),(123,613,177,13))
        self.assertEqual((report['declared_road_candidate_ways'],report['declared_road_candidate_nodes']),(82,353))
        self.assertEqual(report['supported_individual_directed_weights'],606);self.assertFalse(report['per_capture_limits_changed'])

    def test_gate_cannot_be_removed_retagged_or_reclassified_as_outside(self):
        for mutation in ('remove','retag','roadclass'):
            raw=self.raw()
            if mutation=='remove':raw['nodes']=[n for n in raw['nodes'] if n['id']!=8917794983]
            if mutation=='retag':next(n for n in raw['nodes'] if n['id']==8917794983)['tags']['barrier']='no'
            if mutation=='roadclass':next(w for w in raw['ways'] if w['id']==201855578)['tags']['highway']='footway'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_full_candidate_returns_no_graph_query_or_modeled_nodata(self):
        report=project();self.assertEqual(report['unsupported_model_road_ids'],[201855578])
        self.assertIsNone(report['full_candidate_compilation']['graph'])
        for answer in report['full_candidate_queries'].values():
            self.assertEqual(answer['status'],'unsupported');self.assertIsNone(answer['result']);self.assertFalse(answer['route_cost_emitted'])
        for flag in ('partial_graph_returned','unknown_controls_omitted','modeled_nodata_emitted','release_eligible'):
            self.assertIs(report[flag],False)

    def test_all_thirteen_declared_controls_have_complete_members(self):
        report=json.loads((REFERENCE/'report.json').read_text());records=report['individual_restriction_compilations']
        self.assertEqual(len(records),13)
        self.assertTrue(all(r['topology_compiled'] for r in records.values()))
        self.assertEqual(sum(r['active_pattern'] is not None for r in records.values()),12)
        raw=self.raw();raw['ways']=[w for w in raw['ways'] if w['id']!=179738363]
        with self.assertRaises(ValueError):project(raw)

    def test_source_membership_or_shared_raw_record_conflict_rejects(self):
        for mutation in ('source','shared','seed','incidence','control'):
            raw=self.raw()
            if mutation=='source':raw['source']['sha256']='0'*64
            if mutation=='shared':next(w for w in raw['ways'] if w['id']==1475543490)['tags']['name']='changed shared record'
            if mutation=='seed':raw['seed_node_ids'].pop()
            if mutation=='incidence':next(rows for rows in raw['all_source_way_ids_at_seed_nodes'].values() if rows).pop()
            if mutation=='control':raw['control_relations'].pop()
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_independent_gate_review_context_never_asserts_operation_or_approval(self):
        report=json.loads((REFERENCE/'report.json').read_text());context=report['gate_review_context']
        self.assertEqual(context['raw_node']['id'],8917794983);self.assertEqual(context['raw_node']['tags'],{'barrier':'gate'})
        self.assertEqual(context['operation_status'],'unknown')
        self.assertEqual(context['evidence_status'],'independent_operation_and_access_evidence_required')
        for flag in ('field_evidence_obtained','gate_assumed_open','gate_assumed_closed','access_verified','anchors_adopted','connector_approved','release_eligible'):
            self.assertIs(context[flag],False)

    def test_geometry_including_outside_class_records_and_original_capture_caps_validate(self):
        raw=self.raw();raw['bounds']['max_ways']=200
        with self.assertRaises(ValueError):project(raw)
        raw=self.raw();outside=next(w for w in raw['ways'] if w['tags'].get('highway')=='footway');outside['nodes'][0][1]+=.01
        with self.assertRaises(ValueError):project(raw)

    def test_outer_nodes_and_all_existing_release_gates_stay_unresolved(self):
        report=json.loads((REFERENCE/'report.json').read_text())
        self.assertEqual(report['unenumerated_outer_source_nodes'],436)
        self.assertTrue(report['reconciled_source']['all_retained_way_and_node_members_present'])
        for flag in ('all_graph_node_incidence_enumerated','global_route_optimality_certified','geographic_coverage_certified',
                     'access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(report[flag],False)
