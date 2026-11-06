from fractions import Fraction
import json
import unittest
import networkx as nx
from fort_collins_bidirectional_checkpoint import project,evaluate_witness,REFERENCE,PARENT,WITNESS
from fort_collins_bounded_frontier import diagnostic_inputs,RAW_PARENT
from fort_collins_inert_bounds_checkpoint import account_declarations
from test_road_maneuver_probe import independent_history_truth


class BidirectionalNativeBoundsTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=json.loads((REFERENCE/'report.json').read_text());cls.parent=json.loads((PARENT/'report.json').read_text())

    def model(self):
        u=self.parent['reconciled_source'];nodes,k,v,_,_,_=diagnostic_inputs(u);raw=json.loads((RAW_PARENT/'report.json').read_text())
        patterns,accounting=account_declarations(u,raw['individual_restriction_compilations'],k,v)
        return nodes,k,v,patterns,accounting

    def test_exact_frozen_four_queries_keep_their_named_endpoints_and_metrics(self):
        r=project();self.assertEqual(r,self.report);self.assertEqual(r['query_count'],4)
        self.assertEqual(r['named_directions']['forward'],dict(source=11268369829,target=11268369827))
        self.assertEqual(r['named_directions']['reverse'],dict(source=11268369827,target=11268369829))
        for direction,metrics in r['conditional_query_matrix'].items():
            for metric,c in metrics.items():
                self.assertEqual(c['metric'],metric);self.assertEqual((c['source'],c['target']),(r['named_directions'][direction]['source'],r['named_directions'][direction]['target']))
                self.assertTrue(c['conditional_retained_cost_stable_with_nonnegative_exterior'])

    def test_independent_history_oracle_retains_original_no_rule_in_both_directions(self):
        nodes,k,v,patterns,a=self.model();patterns.append(dict(id='original-no-11978581',kind='no',arc_sequence=[t['id'] for t in a['11978581']['audit']['required_raw_transitions']]))
        for metrics in self.report['conditional_query_matrix'].values():
            for metric,c in metrics.items():
                truth=independent_history_truth(k+v,patterns,c['source'],c['target'],metric)
                self.assertEqual(truth,Fraction(*map(int,c['interior_supported_witness']['stored_cost_exact'])))

    def test_directional_asymmetry_is_real_and_forward_certificates_are_unchanged(self):
        r=self.report
        for metric,c in r['conditional_query_matrix']['forward'].items():
            self.assertEqual(c,self.parent['conditional_query_exclusions'][metric])
            forward=Fraction(*map(int,c['interior_supported_witness']['stored_cost_exact']));reverse=Fraction(*map(int,r['conditional_query_matrix']['reverse'][metric]['interior_supported_witness']['stored_cost_exact']))
            self.assertGreater(forward,reverse*10)
        self.assertEqual(r['reverse_supported_walk_proposals']['length']['exact_stored_path_cost'],['32531639606578117','2251799813685248'])
        self.assertEqual(r['reverse_supported_walk_proposals']['travel_time']['exact_stored_path_cost'],['40374157195733851','18014398509481984'])
        self.assertEqual(r['reverse_supported_walk_proposals']['length']['arc_path'],r['reverse_supported_walk_proposals']['travel_time']['arc_path'])

    def test_forward_cost_or_forward_walk_cannot_be_reused_for_reverse_query(self):
        nodes,k,v,p,_=self.model();r=self.report;reverse=r['reverse_supported_walk_proposals']['length'];forward=r['conditional_query_matrix']['forward']['length']
        with self.assertRaises(ValueError):evaluate_witness(nodes,k,v,p,self.parent['reconciled_source']['seed_node_ids'],reverse['source'],reverse['target'],'length',reverse['arc_path'],forward['interior_supported_witness']['stored_cost_exact'])
        old=json.loads((WITNESS/'report.json').read_text())['query_replays']['length']
        with self.assertRaises(ValueError):evaluate_witness(nodes,k,v,p,self.parent['reconciled_source']['seed_node_ids'],reverse['source'],reverse['target'],'length',old['arc_path'],old['exact_stored_path_cost'])

    def test_reverse_prefix_bounds_match_independent_fraction_weighted_graph(self):
        nodes,k,v,p,_=self.model();core=set(self.parent['reconciled_source']['seed_node_ids'])
        for metric,c in self.report['conditional_query_matrix']['reverse'].items():
            graph=nx.MultiDiGraph();graph.add_nodes_from(core)
            for a in k+v:
                if a['from'] in core and a['to'] in core:graph.add_edge(a['from'],a['to'],weight=Fraction(a[metric]))
            distances=nx.single_source_dijkstra_path_length(graph,c['source'],weight='weight')
            values=[distances[a['from']]+Fraction(a[metric]) for a in k+v if a['from'] in distances and a['to'] not in core]
            upper=Fraction(*map(int,c['interior_supported_witness']['stored_cost_exact']))
            self.assertEqual(min(values)-upper,Fraction(*map(int,c['minimum_first_exit_gap_exact'])))
            self.assertGreater(min(values),upper)

    def test_every_strict_direction_stays_unsupported_without_fallback_or_nodata(self):
        r=self.report;self.assertEqual(r['strict_way_budget'],100);self.assertEqual(r['declared_road_candidate_ways'],107)
        for metrics in r['strict_queries'].values():
            for q in metrics.values():self.assertEqual(q['status'],'unsupported');self.assertIsNone(q['result']);self.assertFalse(q['route_cost_emitted'])

    def test_source_binding_original_report_and_all_controls_are_immutable(self):
        before=(PARENT/'report.json').read_bytes();r=project();self.assertEqual(before,(PARENT/'report.json').read_bytes())
        self.assertEqual(r['source_evidence_binding'],self.parent['source_evidence_binding'])
        self.assertEqual((r['retained_declarations'],r['active_compiled_patterns'],r['inactive_compiled_declarations'],r['inert_no_prohibitions']),(15,13,1,1))
        self.assertTrue(r['source_replay_required']);self.assertFalse(r['source_replay_verified_in_this_process'])

    def test_unconstrained_native_starts_are_not_connector_or_access_release_approval(self):
        r=self.report;self.assertEqual(r['source_approach'],'unconstrained-declared-node-start')
        for flag in ('directional_costs_transposed','connector_approach_history_modeled','limits_changed','normal_graph_admitted','route_query_result_returned',
                     'modeled_nodata_emitted','unseen_core_attachments_covered','global_route_optimality_certified','geographic_coverage_certified',
                     'actual_access_verified','gate_state_assumed','whole_way_turn_permission_assumed','anchors_adopted','connector_costs_included','release_eligible'):self.assertIs(r[flag],False)
        self.assertEqual(r['applied_exterior_route_exclusions'],[]);self.assertEqual(r['unenumerated_outer_source_nodes'],603)
