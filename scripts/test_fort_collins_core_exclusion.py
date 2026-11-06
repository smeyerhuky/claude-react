import copy
from fractions import Fraction
import json
import random
import unittest
import networkx as nx
from fort_collins_core_exclusion_source import inputs,validate_core_layout,REFERENCE,PARENT
from fort_collins_core_exclusion_checkpoint import project
from fort_collins_bounded_frontier import diagnostic_inputs,RAW_PARENT
from fort_collins_inert_bounds_checkpoint import account_declarations
from test_road_maneuver_probe import independent_history_truth


class SourceCoreExclusionTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=json.loads((REFERENCE/'report.json').read_text())
        cls.captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)]

    def test_frozen_source_bound_core_and_all_declarations(self):
        r=project();self.assertEqual(r,self.report)
        self.assertEqual(r['source_partition_way_counts'],[96,98]);self.assertEqual(r['source_partition_seed_counts'],[130,164])
        self.assertEqual((r['source_seed_nodes'],r['raw_source_ways'],r['complete_source_nodes'],r['retained_declarations']),(294,179,897,15))
        self.assertEqual((r['known_supported_arcs'],r['possible_geometry_arcs']),(869,32))
        self.assertEqual(r['final_inspection_selection']['selected_source_node_ids'],r['reconciled_source']['seed_node_ids'])

    def test_every_core_seed_incidence_and_outside_class_record_is_bound(self):
        r=self.report;u=r['reconciled_source'];binding=r['source_evidence_binding']
        for nid in u['seed_node_ids']:
            expected=sorted(w['id'] for w in u['ways'] if any(p[0]==nid for p in w['nodes']))
            self.assertEqual(u['all_source_way_ids_at_seed_nodes'][str(nid)],expected)
        self.assertEqual(len(binding['outside_model_class_way_ids']),72)
        self.assertTrue(binding['all_core_incident_raw_way_records_retained']);self.assertTrue(binding['source_replay_required'])
        self.assertFalse(binding['source_replay_verified_in_this_process']);self.assertFalse(binding['outside_class_is_legal_access_exclusion'])

    def test_independent_fraction_weighted_prefix_graph_matches_every_first_exit(self):
        r=self.report;u=r['reconciled_source'];nodes,k,v,_,_,_=diagnostic_inputs(u);core=set(u['seed_node_ids'])
        for metric,c in r['conditional_query_exclusions'].items():
            graph=nx.MultiDiGraph();graph.add_nodes_from(core)
            for a in k+v:
                if a['from'] in core and a['to'] in core:graph.add_edge(a['from'],a['to'],weight=Fraction(a[metric]))
            distances=nx.single_source_dijkstra_path_length(graph,c['source'],weight='weight')
            expected={a['id']:None if a['from'] not in distances else distances[a['from']]+Fraction(a[metric]) for a in k+v if a['from'] in core and a['to'] not in core}
            actual={row['arc_id']:None if row['first_exit_cost_lower_bound_exact'] is None else Fraction(*map(int,row['first_exit_cost_lower_bound_exact'])) for row in c['exact_first_exit_screen']['exits']}
            self.assertEqual(actual,expected);self.assertEqual((len(actual),sum(v is not None for v in actual.values())),(47,46))
            upper=Fraction(*map(int,c['interior_supported_witness']['stored_cost_exact']))
            self.assertEqual(Fraction(*map(int,c['minimum_first_exit_gap_exact'])),min(v for v in expected.values() if v is not None)-upper)
            self.assertGreater(Fraction(*map(int,c['minimum_first_exit_gap_exact'])),0)
        gap=Fraction(*map(int,r['conditional_query_exclusions']['travel_time']['minimum_first_exit_gap_exact']))
        self.assertGreater(gap,Fraction(46,1000));self.assertLess(gap,Fraction(47,1000))

    def test_independent_history_oracle_with_original_inert_no_and_outside_shortcuts(self):
        r=self.report;u=r['reconciled_source'];nodes,k,v,_,_,_=diagnostic_inputs(u);old=json.loads((RAW_PARENT/'report.json').read_text())
        patterns,accounting=account_declarations(u,old['individual_restriction_compilations'],k,v)
        patterns.append(dict(id='retained-original-no',kind='no',arc_sequence=[t['id'] for t in accounting['11978581']['audit']['required_raw_transitions']]))
        outside=sorted(set(nodes)-set(u['seed_node_ids']));rng=random.Random(270)
        for metric,c in r['conditional_query_exclusions'].items():
            upper=Fraction(*map(int,c['interior_supported_witness']['stored_cost_exact']))
            for sample in range(10):
                arcs=copy.deepcopy(k+v)
                for index in range(12):
                    a,b=rng.sample(outside,2);newnode=10**15+index
                    for suffix,start,end in (('a',a,newnode),('b',newnode,b)):
                        arcs.append(dict(id=f'outside-{index}-{suffix}',way=10**12+index,**{'from':start,'to':end},length=rng.randrange(3),travel_time=rng.randrange(3)))
                self.assertEqual(independent_history_truth(arcs,patterns,c['source'],c['target'],metric),upper)

    def test_wrong_source_incidence_shared_record_or_control_cannot_bind_the_certificate(self):
        for change in ('identity','incidence','shared','control'):
            captures=copy.deepcopy(self.captures)
            if change=='identity':
                for c in captures:c['source']['sha256']='0'*64
            if change=='incidence':next(iter(captures[0]['all_source_way_ids_at_seed_nodes'].values())).clear()
            if change=='shared':
                common={w['id'] for w in captures[0]['ways']}&{w['id'] for w in captures[1]['ways']}
                next(w for w in captures[1]['ways'] if w['id'] in common)['tags']['access']='yes'
            if change=='control':
                for c in captures:c['control_relations']=[r for r in c['control_relations'] if r['id']!=11978581]
            with self.subTest(change=change),self.assertRaises(ValueError):project(captures)

    def test_required_inspection_nodes_and_explicit_extra_are_not_access_anchors(self):
        _,required,_=inputs();base=json.loads((REFERENCE/'partition-layout.json').read_text())
        self.assertEqual(base['declared_additional_seed_node_ids'],[9016011070])
        for change in ('omit','extra','basis','approval'):
            layout=copy.deepcopy(base)
            if change=='omit':layout['partitions'][0]['seed_node_ids'].pop()
            if change=='extra':layout['declared_additional_seed_node_ids'].append(1)
            if change=='basis':layout['additional_seed_basis']='reviewed_anchor'
            if change=='approval':layout['layout_is_access_evidence']=True
            with self.subTest(change=change),self.assertRaises(ValueError):validate_core_layout(layout,required)

    def test_original_parents_whole_records_and_unknown_gate_turn_remain_unchanged(self):
        before=(PARENT/'report.json').read_bytes();r=project();self.assertEqual(before,(PARENT/'report.json').read_bytes())
        old=json.loads(before)['reconciled_source']
        for kind in ('ways','nodes','control_relations'):
            by={row['id']:row for row in r['reconciled_source'][kind]};self.assertTrue(all(by[row['id']]==row for row in old[kind]))
        gate=next(n for n in r['reconciled_source']['nodes'] if n['id']==8917794983);self.assertEqual(gate['tags'],{'barrier':'gate'})
        turn=next(w for w in r['reconciled_source']['ways'] if w['id']==1216151141);self.assertEqual(turn['tags']['turn'],'right')
        self.assertTrue(all(c['permission_claimed'] is False for c in r['opaque_way_geometry_catalogues'].values()))

    def test_strict_graph_geography_access_anchors_and_release_remain_unapproved(self):
        r=self.report;self.assertEqual(r['strict_way_budget'],100);self.assertEqual(r['declared_road_candidate_ways'],107)
        self.assertIsNone(r['strict_compilation']['graph'])
        for q in r['strict_queries'].values():self.assertEqual(q['status'],'unsupported');self.assertIsNone(q['result']);self.assertFalse(q['route_cost_emitted'])
        for flag in ('limits_changed','unseen_core_attachments_covered','original_source_replayed_in_this_process','normal_graph_admitted','route_query_result_returned',
                     'modeled_nodata_emitted','global_route_optimality_certified','geographic_coverage_certified','actual_access_verified','gate_state_assumed',
                     'whole_way_turn_permission_assumed','anchors_adopted','connector_costs_included','release_eligible'):self.assertIs(r[flag],False)
        self.assertEqual(r['applied_exterior_route_exclusions'],[]);self.assertEqual(r['unenumerated_outer_source_nodes'],603)
