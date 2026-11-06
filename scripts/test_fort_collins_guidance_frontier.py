import copy
import json
import unittest
from fort_collins_guidance_frontier_checkpoint import project,SOURCE,REFERENCE,FALSE_FLAGS,CONTROL_IDS,OUTSIDE_IDS


class GuidanceFrontierTests(unittest.TestCase):
    def raw(self):return json.loads(SOURCE.read_text())

    def test_frozen_complete_source_scope_and_raw_immutability(self):
        raw=self.raw();before=copy.deepcopy(raw);report=project(raw)
        self.assertEqual(report,json.loads((REFERENCE/'report.json').read_text()));self.assertEqual(raw,before)
        self.assertEqual((report['source_seed_nodes'],report['newly_enumerated_parent_road_nodes']),(45,26))
        self.assertEqual((report['complete_source_ways'],report['complete_source_nodes'],report['touching_controls']),(40,169,9))
        self.assertEqual((report['candidate_road_nodes'],report['unenumerated_outer_nodes']),(121,124))
        self.assertEqual((len(report['supported_weight_way_ids']),report['supported_individual_directed_weights']),(31,165))

    def test_unknown_speed_metadata_cannot_be_removed_or_rewritten_to_force_graph(self):
        for mutation in ('remove','value','limit'):
            raw=self.raw();way=next(w for w in raw['ways'] if w['id']==134584347)
            if mutation=='remove':way['tags'].pop('maxspeed:type')
            if mutation=='value':way['tags']['maxspeed:type']='dynamic'
            if mutation=='limit':way['tags']['maxspeed']='30 mph'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_unsupported_queries_are_neither_routes_nor_modeled_nodata(self):
        report=project();self.assertEqual(report['unsupported_model_road_ids'],[134584347])
        self.assertIsNone(report['full_candidate_compilation']['graph'])
        for answer in report['full_candidate_queries'].values():
            self.assertEqual(answer['status'],'unsupported');self.assertIsNone(answer['result'])
            self.assertFalse(answer['route_cost_emitted']);self.assertIsNone(answer['compilation']['graph'])
        for flag in ('modeled_nodata_emitted','partial_graph_returned','unknown_controls_omitted'):
            self.assertIs(report[flag],False)

    def test_all_nine_individual_control_declarations_still_compile(self):
        report=json.loads((REFERENCE/'report.json').read_text())
        self.assertEqual(set(map(int,report['individual_restriction_compilations'])),CONTROL_IDS)
        for result in report['individual_restriction_compilations'].values():
            self.assertTrue(result['topology_compiled']);self.assertIsNotNone(result['active_pattern'])
            self.assertFalse(result['access_verified']);self.assertFalse(result['release_eligible'])

    def test_missing_context_or_changed_prior_incidence_is_rejected(self):
        for mutation in ('way','node','control','member','incidence','seed','extra'):
            raw=self.raw()
            if mutation=='way':raw['ways']=[w for w in raw['ways'] if w['id']!=6167040]
            if mutation=='node':raw['nodes'].pop()
            if mutation=='control':raw['control_relations'].pop()
            if mutation=='member':raw['control_relations'][0]['members'][0]['ref']=999
            if mutation=='incidence':next(rows for rows in raw['all_source_way_ids_at_seed_nodes'].values() if rows).pop()
            if mutation=='seed':raw['seed_node_ids'].pop()
            if mutation=='extra':raw['requested_member_way_ids'].pop()
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_source_identity_shared_raw_tags_and_unknown_controls_cannot_change(self):
        for mutation in ('source','lane','node','extra_control'):
            raw=self.raw()
            if mutation=='source':raw['source']['sha256']='0'*64
            if mutation=='lane':next(w for w in raw['ways'] if w['id']==140486410)['tags'].pop('turn:lanes:backward')
            if mutation=='node':raw['nodes'][0]['tags']['barrier']='bollard'
            if mutation=='extra_control':raw['control_relations'].append(dict(id=999,tags={'type':'connectivity'},members=[]))
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_outer_node_or_access_approval_claims_cannot_be_added(self):
        for flag in FALSE_FLAGS:
            raw=self.raw();raw[flag]=True
            with self.subTest(flag=flag),self.assertRaises(ValueError):project(raw)
        raw=self.raw();raw['unenumerated_member_node_ids'].pop()
        with self.assertRaises(ValueError):project(raw)

    def test_all_outside_class_ways_are_retained_without_certifying_geography(self):
        raw=self.raw();report=json.loads((REFERENCE/'report.json').read_text())
        self.assertEqual(report['outside_declared_road_class_ids'],OUTSIDE_IDS)
        self.assertTrue(set(OUTSIDE_IDS)<={w['id'] for w in raw['ways']})
        self.assertTrue(report['source_seed_nodes_cover_all_parent_graph_nodes'])
        for flag in ('all_graph_node_incidence_enumerated','geographic_coverage_certified','access_verified',
                     'anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(report[flag],False)
