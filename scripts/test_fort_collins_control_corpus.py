import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from road_source_incidence import extract
from fort_collins_control_checkpoint import project,CONTEXT,ADDITIONAL_WAYS,FALSE_FLAGS


XML='''<osm version="0.6">
<node id="1" version="1" lat="40" lon="-105"/><node id="2" version="1" lat="40" lon="-104.999"><tag k="barrier" v="gate"/></node>
<node id="3" version="1" lat="40.001" lon="-105"/><node id="4" version="1" lat="40.001" lon="-104.999"/><node id="5" version="1" lat="40.002" lon="-105"/>
<way id="10" version="1"><nd ref="1"/><nd ref="2"/><tag k="building" v="yes"/></way>
<way id="20" version="1"><nd ref="3"/><nd ref="4"/><tag k="highway" v="residential"/></way>
<way id="30" version="1"><nd ref="1"/><nd ref="5"/><tag k="highway" v="footway"/></way>
<relation id="100" version="1"><member type="way" ref="10" role="from"/><member type="node" ref="2" role="via"/><member type="way" ref="20" role="to"/><tag k="type" v="restriction"/><tag k="restriction" v="no_left_turn"/></relation>
<relation id="101" version="1"><member type="way" ref="10" role="from"/><member type="node" ref="2" role="via"/><member type="way" ref="20" role="to"/><tag k="type" v="connectivity"/><tag k="connectivity" v="1:1"/></relation>
<relation id="102" version="1"><member type="way" ref="10" role=""/><tag k="type" v="route"/></relation>
<relation id="103" version="1"><member type="way" ref="10" role="from"/><tag k="type" v="unknown"/><tag k="connectivity:motorcar" v="unreviewed"/></relation>
</osm>'''


class ControlCorpusTests(unittest.TestCase):
    def test_original_source_corpus_completes_members_without_approving_semantics(self):
        raw=json.loads(CONTEXT.read_text());before=copy.deepcopy(raw);result=project(raw)
        self.assertEqual((result['seeds'],result['incident_ways'],result['complete_member_ways'],result['complete_member_nodes']),(40,42,48,175))
        self.assertEqual(result['retained_restrictions'],10);self.assertEqual(result['retained_connectivity_relations'],0)
        self.assertEqual(result['unsupported_model_road_ids'],[140486410,815164359])
        self.assertEqual(result['supported_directed_weights'],151)
        self.assertEqual(result['individual_restriction_compilations']['10475907']['status'],'unsupported')
        self.assertEqual(sum(r['topology_compiled'] for r in result['individual_restriction_compilations'].values()),9)
        self.assertIsNone(result['historical_road_model_preflight']['graph']);self.assertIsNone(result['query_result'])
        self.assertTrue(result['all_retained_way_and_node_members_present']);self.assertFalse(result['all_relation_semantics_evaluated'])
        self.assertEqual(raw,before)

    def test_any_requested_member_or_raw_node_cannot_be_omitted(self):
        for wid in ADDITIONAL_WAYS:
            raw=json.loads(CONTEXT.read_text());raw['ways']=[w for w in raw['ways'] if w['id']!=wid]
            with self.subTest(wid=wid),self.assertRaises(ValueError):project(raw)
        raw=json.loads(CONTEXT.read_text());raw['nodes'].pop()
        with self.assertRaises(ValueError):project(raw)

    def test_incidence_unknown_controls_and_source_identity_cannot_be_rewritten(self):
        raw=json.loads(CONTEXT.read_text());raw['all_source_way_ids_at_seed_nodes'][str(raw['seed_node_ids'][0])].append(999)
        with self.assertRaises(ValueError):project(raw)
        raw=json.loads(CONTEXT.read_text());next(n for n in raw['nodes'] if n['id']==7614361913)['tags'].pop('barrier')
        with self.assertRaises(ValueError):project(raw)
        raw=json.loads(CONTEXT.read_text());next(w for w in raw['ways'] if w['id']==140486410)['tags'].pop('turn:lanes:backward')
        with self.assertRaises(ValueError):project(raw)
        raw=json.loads(CONTEXT.read_text());raw['source']['sha256']='0'*64
        with self.assertRaises(ValueError):project(raw)

    def test_fake_approval_and_unknown_retained_control_are_rejected(self):
        for flag in FALSE_FLAGS:
            raw=json.loads(CONTEXT.read_text());raw[flag]=True
            with self.subTest(flag=flag),self.assertRaises(ValueError):project(raw)
        raw=json.loads(CONTEXT.read_text());raw['control_relations'].append(dict(id=999,tags={'type':'connectivity'},members=[]))
        with self.assertRaises(ValueError):project(raw)

    def source(self,directory):
        path=Path(directory)/'fixture.osm';path.write_text(XML)
        return path,dict(name=path.name,size_bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest())

    def test_generic_capture_keeps_nonhighways_explicit_members_and_connectivity(self):
        with tempfile.TemporaryDirectory() as directory:
            path,identity=self.source(directory)
            result=extract(path,source_identity=identity,seed_node_ids=[1],additional_way_ids=[20])
        self.assertEqual(result['incident_way_ids'],[10,30]);self.assertEqual([w['id'] for w in result['ways']],[10,20,30])
        self.assertEqual([r['id'] for r in result['control_relations']],[100,101,103])
        self.assertEqual(next(n for n in result['nodes'] if n['id']==2)['tags'],{'barrier':'gate'})
        self.assertTrue(result['all_retained_way_and_node_members_present']);self.assertFalse(result['all_relation_semantics_evaluated'])
        self.assertFalse(result['access_verified']);self.assertFalse(result['release_eligible'])

    def test_generic_capture_reports_missing_members_and_rejects_missing_requested_way(self):
        with tempfile.TemporaryDirectory() as directory:
            path,identity=self.source(directory)
            result=extract(path,source_identity=identity,seed_node_ids=[1])
            self.assertEqual(result['missing_touching_relation_member_way_ids'],[20]);self.assertFalse(result['all_retained_way_and_node_members_present'])
            with self.assertRaises(ValueError):extract(path,source_identity=identity,seed_node_ids=[1],additional_way_ids=[999])

    def test_generic_source_integrity_and_budgets_fail_without_truncation(self):
        with tempfile.TemporaryDirectory() as directory:
            path,identity=self.source(directory);bad=dict(identity,sha256='0'*64)
            with self.assertRaises(ValueError):extract(path,source_identity=bad,seed_node_ids=[1])
            with patch('road_source_incidence.MAX_WAYS',2),self.assertRaises(ValueError):
                extract(path,source_identity=identity,seed_node_ids=[1],additional_way_ids=[20])
            with patch('road_source_incidence.MAX_NODES',4),self.assertRaises(ValueError):
                extract(path,source_identity=identity,seed_node_ids=[1],additional_way_ids=[20])
