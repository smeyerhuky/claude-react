import copy
import hashlib
from fractions import Fraction
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
from northern_urban_path_checkpoint import verify_witness, build, identity, BOUNDS, OUTPUT, verify_original, extract
from northern_urban_path_checkpoint import ROOT, SCENARIO


def arc(a,u,v,cost=1):return dict(id=a,way=ord(a),**{'from':u,'to':v},length=cost,travel_time=cost*2)


def witness(path,cost,source=1,target=3):
    exact=Fraction(cost)
    return dict(converged=True,partial_results_returned=False,arc_path=path,cost=cost,
                exact_stored_path_cost=[str(exact.numerator),str(exact.denominator)],source=source,target=target,metric='length')


class NorthernUrbanPathTests(unittest.TestCase):
    def test_three_pass_capture_keeps_remote_control_members_and_node_tags(self):
        xml='''<osm version="0.6">
          <node id="1" lat="40.5" lon="-105.1"/>
          <node id="2" lat="40.5" lon="-104.5"/>
          <node id="3" lat="40.5" lon="-104.4"><tag k="barrier" v="bollard"/></node>
          <node id="4" lat="40.5" lon="-104.3"/>
          <way id="10"><nd ref="1"/><nd ref="2"/><tag k="highway" v="primary"/></way>
          <way id="11"><nd ref="2"/><nd ref="3"/><tag k="highway" v="residential"/></way>
          <way id="12"><nd ref="3"/><nd ref="4"/><tag k="highway" v="secondary"/></way>
          <relation id="20"><member type="way" ref="10" role="from"/>
            <member type="node" ref="2" role="via"/><member type="way" ref="11" role="to"/>
            <tag k="type" v="restriction"/><tag k="restriction" v="only_right_turn"/>
          </relation></osm>'''
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(xml)
            with patch('northern_urban_path_checkpoint.verify_original') as verify:
                raw=extract(source)
                self.assertEqual(verify.call_count,2)
        self.assertEqual(raw['travel_way_ids'],[10])
        self.assertEqual({w['id'] for w in raw['ways']},{10,11})
        self.assertEqual(next(n for n in raw['nodes'] if n['id']==3)['tags'],{'barrier':'bollard'})
        self.assertEqual([r['id'] for r in raw['control_relations']],[20])

    def test_independent_witness_checks_original_controls_and_cost(self):
        g=dict(arcs=[arc('a',1,2),arc('b',2,3),arc('c',2,4)],original_active_maneuvers=[])
        verify_witness(witness(['a','b'],2),g)
        for mutation in ('missing','discontinuous','cost','endpoint','no','only','reverse','partial'):
            graph=copy.deepcopy(g);answer=witness(['a','b'],2)
            if mutation=='missing':answer['arc_path']=['foreign']
            if mutation=='discontinuous':answer['arc_path']=['b','a']
            if mutation=='cost':answer['cost']=3
            if mutation=='endpoint':answer['target']=4
            if mutation=='no':graph['original_active_maneuvers']=[dict(kind='no',arc_sequence=['a','b'])]
            if mutation=='only':graph['original_active_maneuvers']=[dict(kind='only',arc_sequence=['a','c'])]
            if mutation=='reverse':graph['arcs'][1].update(way=ord('a'),to=1);answer['target']=1
            if mutation=='partial':answer['partial_results_returned']=True
            with self.assertRaises(ValueError,msg=mutation):verify_witness(answer,graph)

    def test_terminal_only_prefix_allowed_unknown_has_no_witness(self):
        g=dict(arcs=[arc('a',1,2),arc('b',2,3)],original_active_maneuvers=[dict(kind='only',arc_sequence=['a','b'])])
        verify_witness(witness(['a'],1,target=2),g)
        answer=dict(converged=True,partial_results_returned=False,arc_path=[],cost=None,exact_stored_path_cost=None)
        verify_witness(answer,g)
        answer['arc_path']=['a']
        with self.assertRaises(ValueError):verify_witness(answer,g)

    def test_failed_control_quarantines_all_member_travel_ways(self):
        nodes=[dict(id=i,lonlat=[-105+i/1000,40.5],tags={}) for i in (1,2,3)]
        ways=[dict(id=i,tags=dict(highway='primary'),nodes=[[i,*nodes[i-1]['lonlat']],[i+1,*nodes[i]['lonlat']]]) for i in (1,2)]
        raw=dict(source_identity=identity(),bounds=BOUNDS,travel_way_ids=[1,2],ways=ways,nodes=nodes,
                 control_relations=[dict(id=1,tags=dict(type='connectivity'),members=[dict(type='w',ref=i,role='from' if i==1 else 'to') for i in (1,2)])],
                 missing_way_ids=[],missing_node_ids=[])
        g=build(raw)
        self.assertEqual(g['quarantined_way_ids'],[1,2]);self.assertEqual(g['arcs'],[])
        self.assertEqual(len(g['failed_relations']),1)
        raw['missing_node_ids']=[4]
        with self.assertRaises(ValueError):build(raw)

    def test_source_bytes_must_match_before_any_pbf_parsing(self):
        with patch('northern_urban_path_checkpoint.Path.stat') as stat:
            stat.return_value.st_size=1
            with self.assertRaisesRegex(ValueError,'Exact complete frozen'):verify_original('/wrong.pbf')

    def test_retained_checkpoint_keeps_research_unknowns_and_historical_profile(self):
        r=json.loads(OUTPUT.read_bytes());counts=r['counts']
        for relative, expected in {**r['implementation_sha256'],**r['retained_input_sha256']}.items():
            self.assertEqual(hashlib.sha256((ROOT/relative).read_bytes()).hexdigest(),expected,relative)
        self.assertEqual(hashlib.sha256(SCENARIO.read_bytes()).hexdigest(),r['scenario_sha256'])
        self.assertEqual((counts['queries'],counts['finite_witnesses'],counts['unresolved']),(40,12,28))
        self.assertEqual((counts['retained_nodes'],counts['retained_arcs'],counts['projected_maneuvers']),(24003,35186,242))
        self.assertEqual((counts['compiled_controls'],counts['failed_controls']),(602,265))
        for flag in ('access_verified','geographic_coverage_certified','anchors_adopted','release_eligible'):self.assertIs(r[flag],False)
        self.assertEqual(r['connectors_approved'],0)
        self.assertEqual([c['weak_component_nodes'] for c in r['weak_component_diagnostics']],[16340,16340,16340,226,233])
        for q in r['queries']:
            if q['result']['cost'] is None:self.assertEqual(q['status'],'unresolved-subset-no-witness')
            else:self.assertEqual(q['status'],'supported-subset-witness')
        from road_posted_speed_graph import MAX_WAYS
        self.assertEqual(MAX_WAYS,100)
