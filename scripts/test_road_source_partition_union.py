import copy
import hashlib
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from road_source_incidence import extract
from road_source_partition_union import join_partitions,missing
from test_fort_collins_control_corpus import XML


def captures(directory,*,overlap=False,reveal_way=False,nested=False):
    path=Path(directory)/'fixture.osm';xml=XML
    if nested:xml=xml.replace('<tag k="type" v="unknown"/>','<member type="relation" ref="999" role="nested"/><tag k="type" v="unknown"/>')
    path.write_text(xml);source=dict(name=path.name,size_bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    first=extract(path,source_identity=source,seed_node_ids=[1])
    second=extract(path,source_identity=source,seed_node_ids=[3],additional_way_ids=[10] if overlap else [30] if reveal_way else [])
    return [first,second]


class SourcePartitionUnionTests(unittest.TestCase):
    def test_cross_partition_missing_members_complete_without_semantic_approval(self):
        with tempfile.TemporaryDirectory() as directory:parts=captures(directory)
        self.assertFalse(parts[0]['all_retained_way_and_node_members_present']);self.assertFalse(parts[1]['all_retained_way_and_node_members_present'])
        result=join_partitions(parts)
        self.assertTrue(result['all_retained_way_and_node_members_present']);self.assertEqual(result['seed_node_ids'],[1,3])
        self.assertEqual([w['id'] for w in result['ways']],[10,20,30]);self.assertEqual(len(result['nodes']),5)
        self.assertEqual([r['id'] for r in result['control_relations']],[100,101,103])
        self.assertFalse(result['all_relation_semantics_evaluated']);self.assertFalse(result['access_verified'])

    def test_conflicting_shared_complete_way_node_and_control_records_reject(self):
        with tempfile.TemporaryDirectory() as directory:base=captures(directory,overlap=True)
        for mutation in ('way','node','control'):
            parts=copy.deepcopy(base)
            if mutation=='way':next(w for w in parts[1]['ways'] if w['id']==10)['tags']['name']='changed'
            if mutation=='node':next(n for n in parts[1]['nodes'] if n['id']==2)['tags']['barrier']='no'
            if mutation=='control':parts[1]['control_relations'][0]['tags']['restriction']='only_left_turn'
            with self.subTest(mutation=mutation),self.assertRaisesRegex(ValueError,'Conflicting shared'):join_partitions(parts)

    def test_union_cannot_hide_a_partition_omitting_source_incidence(self):
        with tempfile.TemporaryDirectory() as directory:parts=captures(directory,reveal_way=True)
        part=parts[0];part['ways']=[w for w in part['ways'] if w['id']!=30];part['nodes']=[n for n in part['nodes'] if n['id']!=5]
        part['incident_way_ids']=[10];part['all_source_way_ids_at_seed_nodes']={'1':[10]};part['unenumerated_member_node_ids']=[2]
        with self.assertRaisesRegex(ValueError,'omitted source incidence'):join_partitions(parts)

    def test_union_cannot_hide_a_partition_omitting_a_touching_control(self):
        with tempfile.TemporaryDirectory() as directory:parts=captures(directory)
        part=parts[0];part['control_relations']=[r for r in part['control_relations'] if r['id']!=100]
        with self.assertRaisesRegex(ValueError,'touching control omitted'):join_partitions(parts)

    def test_capture_and_union_limits_source_identity_and_false_approvals_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:base=captures(directory)
        with self.assertRaises(ValueError):join_partitions(base+[base[0]])
        for mutation in ('source','bounds','approval','geometry'):
            parts=copy.deepcopy(base)
            if mutation=='source':parts[1]['source']['sha256']='0'*64
            if mutation=='bounds':parts[1]['bounds']['max_ways']=101
            if mutation=='approval':parts[1]['access_verified']=True
            if mutation=='geometry':parts[1]['ways'][0]['nodes'][0][1]+=.1
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):join_partitions(parts)
        with patch('road_source_partition_union.MAX_UNION_NODES',4),self.assertRaises(ValueError):join_partitions(base)

    def test_nested_members_and_unknown_namespaces_remain_explicit(self):
        with tempfile.TemporaryDirectory() as directory:parts=captures(directory,nested=True)
        result=join_partitions(parts)
        self.assertEqual(result['referenced_relation_member_ids'],[999]);self.assertFalse(result['all_retained_way_and_node_members_present'])
        self.assertEqual(next(r for r in result['control_relations'] if r['id']==103)['tags']['type'],'unknown')
        self.assertNotIn('graph',result);self.assertFalse(result['all_relation_semantics_evaluated'])

    def test_inputs_and_returned_records_do_not_alias_and_reversal_preserves_source_content(self):
        with tempfile.TemporaryDirectory() as directory:parts=captures(directory,overlap=True)
        before=copy.deepcopy(parts);result=join_partitions(parts);reverse=join_partitions(list(reversed(parts)))
        for key in ('ways','nodes','control_relations','seed_node_ids','all_source_way_ids_at_seed_nodes'):
            self.assertEqual(result[key],reverse[key])
        result['ways'][0]['tags']['name']='caller edit';result['partitions'][0]['original_capture_bounds']['max_ways']=999
        self.assertEqual(parts,before);self.assertEqual(join_partitions(parts)['partitions'][0]['original_capture_bounds']['max_ways'],100)
        self.assertFalse(reverse['release_eligible']);self.assertFalse(reverse['geographic_coverage_certified'])
