import copy
from fractions import Fraction
import json
import unittest
from fort_collins_guidance_incidence_checkpoint import project,SOURCE,REFERENCE,CONTEXT,FALSE_FLAGS
from road_maneuver_probe import solve
from test_road_maneuver_probe import independent_history_truth


class GuidanceIncidenceTests(unittest.TestCase):
    def raw(self):return json.loads(SOURCE.read_text())

    def test_frozen_original_source_scope_and_immutability(self):
        raw=self.raw();before=copy.deepcopy(raw);result=project(raw)
        self.assertEqual(result,json.loads((REFERENCE/'report.json').read_text()));self.assertEqual(raw,before)
        self.assertEqual((result['source_seed_nodes'],result['newly_enumerated_seed_nodes']),(19,18))
        self.assertEqual((result['complete_source_ways'],result['complete_source_nodes'],result['touching_controls']),(14,58,3))
        self.assertEqual((result['road_graph_nodes'],result['weighted_arcs'],result['unenumerated_outer_nodes']),(45,65,39))

    def test_all_4050_expanded_node_pair_metric_queries_match_independent_history_graph(self):
        report=json.loads((REFERENCE/'report.json').read_text());graph=report['declared_compilation']['graph']
        self.assertEqual(graph['supplied_raw_relation_ids'],[9680890,9680891,10475907])
        for metric in ('length','travel_time'):
            for source in graph['nodes']:
                for target in graph['nodes']:
                    actual=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source,target,metric)
                    truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                    cost=None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost']))
                    self.assertEqual(truth,cost,(source,target,metric))

    def test_newly_finite_paths_do_not_rewrite_old_frozen_results(self):
        report=json.loads((REFERENCE/'report.json').read_text())
        for metric in ('length','travel_time'):
            row=report['focused_pair_comparison'][metric]
            self.assertEqual((row['queries'],row['old_finite'],row['new_finite'],row['newly_finite']),(361,154,246,92))
            self.assertEqual(row['shorter'],0);self.assertIsNone(report['protected_original_query_replays'][metric]['cost'])
            for witness in report['newly_finite_local_witnesses'][metric]:
                self.assertIsNone(witness['old_local_result']['cost']);self.assertIsNotNone(witness['expanded_local_result']['cost'])
                self.assertFalse(witness['expanded_local_result']['access_certified'])

    def test_incident_way_or_membership_cannot_be_omitted(self):
        for mutation in ('way','membership','seed','extra'):
            raw=self.raw()
            if mutation=='way':raw['ways']=[w for w in raw['ways'] if w['id']!=793155013]
            if mutation=='membership':next(rows for rows in raw['all_source_way_ids_at_seed_nodes'].values() if rows).pop()
            if mutation=='seed':raw['seed_node_ids'].pop()
            if mutation=='extra':raw['requested_member_way_ids'].pop()
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_missing_controls_members_and_nodes_are_not_silent(self):
        for mutation in ('relation','way','node','member'):
            raw=self.raw()
            if mutation=='relation':raw['control_relations'].pop()
            if mutation=='way':raw['ways']=[w for w in raw['ways'] if w['id']!=6172542]
            if mutation=='node':raw['nodes'].pop()
            if mutation=='member':raw['control_relations'][0]['members'][0]['ref']=999
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_retained_raw_tags_and_exact_original_source_identity_cannot_change(self):
        for mutation in ('lane','source','restriction'):
            raw=self.raw()
            if mutation=='lane':next(w for w in raw['ways'] if w['id']==140486410)['tags'].pop('turn:lanes:backward')
            if mutation=='source':raw['source']['sha256']='0'*64
            if mutation=='restriction':raw['control_relations'][0]['tags']['restriction']='only_left_turn'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_new_unknown_way_or_node_controls_block_projection(self):
        old=json.loads(CONTEXT.read_text());oldnodes={n['id'] for n in old['nodes']}
        for mutation in ('way','node'):
            raw=self.raw()
            if mutation=='way':next(w for w in raw['ways'] if w['id']==190362906)['tags']['barrier']='bollard'
            else:next(n for n in raw['nodes'] if n['id'] not in oldnodes)['tags']['barrier']='gate'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_source_incidence_and_raw_context_do_not_approve_access_or_outer_closure(self):
        for flag in FALSE_FLAGS:
            raw=self.raw();raw[flag]=True
            with self.subTest(flag=flag),self.assertRaises(ValueError):project(raw)
        raw=self.raw();raw['unenumerated_member_node_ids'].pop()
        with self.assertRaises(ValueError):project(raw)

    def test_outside_road_class_records_remain_in_the_source_and_no_anchors_adopted(self):
        report=json.loads((REFERENCE/'report.json').read_text());raw=self.raw()
        self.assertEqual(report['outside_declared_road_class_ids'],[793155013,793155015])
        self.assertTrue({793155013,793155015}<={w['id'] for w in raw['ways']})
        for flag in ('unknown_controls_omitted','all_graph_node_incidence_enumerated','geographic_coverage_certified',
                     'access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(report[flag],False)
