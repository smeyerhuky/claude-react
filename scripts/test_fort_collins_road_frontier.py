import copy
import json
import unittest
from fort_collins_frontier_checkpoint import project,CONTEXT,MEMBER_CONTEXT,FALSE_FLAGS


class RoadFrontierTests(unittest.TestCase):
    def context(self):return json.loads(CONTEXT.read_text())

    def test_complete_frontier_keeps_unknown_car_road_and_returns_no_graph(self):
        context=self.context();before=copy.deepcopy(context);result=project(context)
        self.assertEqual((result['enumerated_seed_nodes'],result['incident_ways'],result['incident_member_nodes']),(27,27,94))
        self.assertEqual((result['complete_union_ways'],result['complete_union_nodes']),(29,106))
        self.assertEqual(len(result['unenumerated_union_node_ids']),79)
        self.assertEqual(result['unknown_model_road_ids'],[815164359])
        self.assertEqual(len(result['outside_declared_road_class_ids']),8)
        self.assertEqual((len(result['supported_weight_way_ids']),result['supported_directed_weights']),(20,103))
        self.assertEqual(set(result['supplied_relation_compilations']),{'9680890','9680891','20193102'})
        self.assertEqual(result['missing_supplied_relation_member_way_ids'],[])
        self.assertEqual(result['road_model_preflight']['status'],'unsupported')
        self.assertIsNone(result['road_model_preflight']['graph']);self.assertIsNone(result['query_result'])
        for key in ('graph_returned','route_cost_emitted','access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(result[key],False)
        self.assertEqual(context,before)

    def test_omitted_or_invented_incident_memberships_reject(self):
        for operation in ('omit','invent'):
            context=self.context();key=next(k for k,v in context['all_source_way_ids_at_seed_nodes'].items() if len(v)>1)
            if operation=='omit':context['all_source_way_ids_at_seed_nodes'][key].pop()
            else:context['all_source_way_ids_at_seed_nodes'][key].append(999)
            with self.subTest(operation=operation),self.assertRaises(ValueError):project(context)

    def test_seed_and_outer_frontier_gaps_cannot_be_hidden(self):
        context=self.context();context['seed_node_ids'].pop()
        with self.assertRaises(ValueError):project(context)
        context=self.context();context['unenumerated_member_node_ids'].pop()
        with self.assertRaises(ValueError):project(context)

    def test_bollard_tags_or_entire_unresolved_road_cannot_be_dropped(self):
        context=self.context();node=next(n for n in context['nodes'] if n['id']==7614361913)
        node['tags'].pop('barrier')
        with self.assertRaises(ValueError):project(context)
        context=self.context();context['ways']=[w for w in context['ways'] if w['id']!=815164359]
        with self.assertRaises(ValueError):project(context)

    def test_missing_duplicate_or_conflicting_full_node_records_reject(self):
        context=self.context();context['nodes'].pop()
        with self.assertRaises(ValueError):project(context)
        context=self.context();context['nodes'][-1]=copy.deepcopy(context['nodes'][0])
        with self.assertRaises(ValueError):project(context)
        context=self.context();context['ways'][0]['nodes'][0][1]+=.001
        with self.assertRaises(ValueError):project(context)

    def test_complete_external_restriction_members_and_shared_records_are_required(self):
        members=json.loads(MEMBER_CONTEXT.read_text());members['ways']=[w for w in members['ways'] if w['id']!=186582632]
        with self.assertRaises(ValueError):project(self.context(),members)
        context=self.context();next(r for r in context['restrictions'] if r['id']==9680890)['members'][0]['ref']=999
        with self.assertRaises(ValueError):project(context)

    def test_changed_source_or_parent_identity_and_fabricated_approval_reject(self):
        context=self.context();context['source']['sha256']='0'*64
        with self.assertRaises(ValueError):project(context)
        context=self.context();context['parent_incidence_witness_sha256']='0'*64
        with self.assertRaises(ValueError):project(context)
        for flag in FALSE_FLAGS:
            context=self.context();context[flag]=True
            with self.subTest(flag=flag),self.assertRaises(ValueError):project(context)
        context=self.context();context['approved_road_graph']=True
        with self.assertRaises(ValueError):project(context)

    def test_no_source_context_truncation_or_road_class_relabeling(self):
        context=self.context();context['ways']*=4
        with self.assertRaises(ValueError):project(context)
        context=self.context();next(w for w in context['ways'] if w['id']==54882910)['tags']['highway']='service'
        with self.assertRaises(ValueError):project(context)
