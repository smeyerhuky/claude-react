import copy
import json
from fractions import Fraction
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import northern_detour_geometry as geometry
from northern_detour_geometry import load_geometry,validate,report
from build_northern_detour_explorer import payload,render,render_data

ROOT=Path(__file__).resolve().parents[1]


class NorthernDetourExplorerTests(unittest.TestCase):
    def fixture(self):
        way=dict(id=1,tags=dict(highway='primary',name='Fixture road'),nodes=[[1,-105.,40.5],[2,-104.999,40.5]])
        nodes=[dict(id=p[0],lonlat=p[1:],tags={}) for p in way['nodes']]
        weighted=geometry.weights(way,nodes,default_policy=geometry.DEFAULTS,scenario=geometry.load(),feature_zones=geometry.parent.zones([way],nodes))
        arc=next(a for a in weighted['arcs'] if a['direction']=='forward');exact=Fraction(arc['length'])
        frozen=dict(source_identity=geometry.parent.identity(),scenario_sha256=geometry.parent.digest(geometry.parent.SCENARIO),
            candidates=[dict(id='a',node=1,lonlat=[-105.,40.5]),dict(id='b',node=2,lonlat=[-104.999,40.5])],
            queries=[dict(source='a',target='b',metric='length',result=dict(arc_path=[arc['id']],cost=arc['length'],exact_stored_path_cost=[str(exact.numerator),str(exact.denominator)]))])
        xml='''<osm version="0.6"><node id="1" lat="40.5" lon="-105"/>
          <node id="2" lat="40.5" lon="-104.999">CONTROL</node>
          <way id="1"><nd ref="1"/><nd ref="2"/><tag k="highway" v="primary"/><tag k="name" v="Fixture road"/></way></osm>'''
        return frozen,xml

    def test_original_export_keeps_only_exact_witness_direction_and_checks_source_twice(self):
        frozen,xml=self.fixture()
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(xml.replace('CONTROL',''))
            with patch.object(geometry,'report',return_value=frozen),patch.object(geometry.parent,'verify_original') as verify:
                files=geometry.extract(source)
                self.assertEqual(verify.call_count,2)
        data=json.loads(files['geometry.json'])
        self.assertEqual(set(data['arcs']),{'raw:1:0:forward'})
        self.assertEqual(set(data['nodes']),{'1','2'})
        self.assertEqual(data['ways']['1']['name'],'Fixture road')
        self.assertFalse(data['release_eligible'])

    def test_export_cannot_discard_raw_node_barrier_controls(self):
        frozen,xml=self.fixture()
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(xml.replace('CONTROL','<tag k="barrier" v="bollard"/>'))
            with patch.object(geometry,'report',return_value=frozen),patch.object(geometry.parent,'verify_original'):
                with self.assertRaisesRegex(ValueError,'Frozen witness way is no longer supported'):geometry.extract(source)

    def test_exact_frozen_html_and_all_metric_costs_bind_to_the_checkpoint(self):
        data=payload();frozen=report()
        self.assertEqual(render(),(ROOT/'src/research/metro-northern-detours.html').read_text())
        self.assertEqual(len(data['queries']),40)
        for q,original in zip(data['queries'],frozen['queries']):
            self.assertEqual(q['path'],original['result']['arc_path'])
            self.assertEqual(q['cost_exact'],original['result']['exact_stored_path_cost'])
        self.assertEqual(sum(q['parent_cost'] is None for q in data['queries']),28)
        self.assertEqual(len(data['geometry']['ways']),820)
        self.assertEqual(len(data['geometry']['arcs']),6632)
        self.assertEqual(len(data['geometry']['nodes']),4746)
        self.assertIn("default-src 'none'",render())

    def test_asset_mutations_do_not_turn_into_different_drawable_witnesses(self):
        original,_=load_geometry();frozen=report();first=frozen['queries'][0]['result']['arc_path'][0]
        for mutation in ('binding','cost','endpoint','candidate','vertex','speed','extra_node','extra_arc','adoption','direction'):
            data=copy.deepcopy(original)
            if mutation=='binding':data['report_sha256']='0'*64
            if mutation=='cost':data['arcs'][first]['length']+=1
            if mutation=='endpoint':data['arcs'][first]['from']=999
            if mutation=='candidate':data['nodes'][str(frozen['candidates'][0]['node'])][0]+=.001
            if mutation=='vertex':data['nodes'][str(data['arcs'][first]['to'])][0]+=.001
            if mutation=='speed':data['arcs'][first]['speed_mps_fraction'][0]+=1
            if mutation=='extra_node':data['nodes']['99999999999999']=[0,0]
            if mutation=='extra_arc':data['arcs']['raw:1:0:forward']=copy.deepcopy(data['arcs'][first])
            if mutation=='adoption':data['anchors_adopted']=True
            if mutation=='direction':data['arcs'][first]['direction']='backward'
            with self.assertRaises(ValueError,msg=mutation):validate(data,frozen)

    def test_osm_names_and_script_end_tags_remain_inert_json_text(self):
        data=payload();key=next(iter(data['geometry']['ways']))
        malicious='</script><script>window.unexpectedExecution=true</script><img src=x onerror=alert(1)>&'
        data['geometry']['ways'][key]['name']=malicious
        html=render_data(data)
        self.assertNotIn(malicious,html)
        encoded=html.split('id="detour-data">',1)[1].split('</script>',1)[0]
        self.assertEqual(json.loads(encoded)['geometry']['ways'][key]['name'],malicious)
        self.assertNotIn('fetch(',html);self.assertNotIn('XMLHttpRequest',html)
