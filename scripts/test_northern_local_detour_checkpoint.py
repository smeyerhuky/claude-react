import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import northern_local_detour_checkpoint as detour
from reference_via_node_compile import canonical_sha


class NorthernLocalDetourTests(unittest.TestCase):
    def test_selection_keeps_the_declared_class_and_geographic_tiers_separate(self):
        select=detour.select_travel
        self.assertTrue(select('primary',{1},{1},set(),set()))
        self.assertTrue(select('tertiary',{2},set(),{2},set()))
        self.assertTrue(select('residential',{3},set(),set(),{3}))
        for highway,refs in [('tertiary',{1}),('residential',{2}),('service',{3}),('footway',{3})]:
            self.assertFalse(select(highway,refs,{1},{2},{3}))
        self.assertTrue(detour.inside([-104.71,40.41],detour.GREELEY_CORE))
        self.assertFalse(detour.inside([-104.710001,40.41],detour.GREELEY_CORE))

    def source_fixture(self,missing=False):
        return '''<osm version="0.6">
          <node id="1" lat="40.55" lon="-104.9"/><node id="2" lat="40.42" lon="-104.69"/>
          <node id="3" lat="40.60" lon="-105.1"/><node id="4" lat="40.60" lon="-105.3"/>
          <node id="5" lat="40.43" lon="-104.70"/><node id="6" lat="40.43" lon="-104.72"/>
          <node id="7" lat="40.55" lon="-104.8"/>
          <node id="8" lat="40.43" lon="-104.66"><tag k="barrier" v="bollard"/></node>
          <way id="10"><nd ref="1"/><nd ref="2"/><tag k="highway" v="primary"/></way>
          <way id="11"><nd ref="3"/><nd ref="4"/><tag k="highway" v="tertiary"/></way>
          <way id="12"><nd ref="5"/><nd ref="6"/><tag k="highway" v="residential"/></way>
          <way id="13"><nd ref="1"/><nd ref="7"/><tag k="highway" v="tertiary"/></way>
          <way id="14"><nd ref="1"/><nd ref="7"/><tag k="highway" v="residential"/></way>
          <way id="15"><nd ref="6"/><nd ref="8"/><tag k="highway" v="service"/></way>
          <relation id="20"><member type="way" ref="12" role="from"/>
            <member type="node" ref="6" role="via"/><member type="way" ref="TO" role="to"/>
            <tag k="type" v="restriction"/><tag k="restriction" v="only_right_turn"/>
          </relation></osm>'''.replace('ref="TO"','ref="999"' if missing else 'ref="15"')

    def test_original_capture_keeps_whole_remote_members_without_admitting_service_roads(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(self.source_fixture())
            with patch.object(detour.parent,'verify_original') as verify:
                raw=detour.extract(source)
                self.assertEqual(verify.call_count,2)
        self.assertEqual(raw['travel_way_ids'],[10,11,12])
        self.assertEqual({w['id'] for w in raw['ways']},{10,11,12,15})
        self.assertEqual(next(n for n in raw['nodes'] if n['id']==8)['tags'],{'barrier':'bollard'})
        self.assertEqual(next(w for w in raw['ways'] if w['id']==11)['nodes'][-1],[4,-105.3,40.6])
        self.assertEqual([r['id'] for r in raw['control_relations']],[20])

    def test_missing_control_member_stops_capture(self):
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(self.source_fixture(missing=True))
            with patch.object(detour.parent,'verify_original'):
                with self.assertRaisesRegex(ValueError,'Missing complete control-member way'):detour.extract(source)

    def test_parent_comparison_rejects_changed_arcs_endpoints_and_worsened_cost(self):
        arc=dict(id='a',way=1,**{'from':1,'to':2},length=1.,travel_time=2.)
        graph=dict(nodes=[1,2],arcs=[arc],maneuvers=[],original_active_maneuvers=[])
        answer=dict(source=1,target=2,metric='length',cost=1.,exact_stored_path_cost=['1','1'],arc_path=['a'],
                    converged=True,partial_results_returned=False)
        query=dict(source='one',target='two',metric='length',result=answer)
        raw=dict(fixture=True)
        frozen=dict(raw_context_sha256=canonical_sha(raw),weighted_subset_sha256=canonical_sha({k:graph[k] for k in ('nodes','arcs','maneuvers')}),
                    candidates=[dict(id='one')],queries=[query])
        with tempfile.TemporaryDirectory() as directory:
            path=Path(directory)/'parent.json';path.write_text(json.dumps(frozen))
            with patch.object(detour.parent,'OUTPUT',path),patch.object(detour,'parent_context',return_value=raw),patch.object(detour.parent,'build',return_value=graph):
                result=detour.compare_parent(raw,graph,copy.deepcopy(frozen))
                self.assertTrue(result['all_parent_finite_witnesses_revalidated'])
                for mutation in ('arc','endpoint','worse','lost'):
                    current=copy.deepcopy(graph);report=copy.deepcopy(frozen)
                    if mutation=='arc':current['arcs'][0]['length']=2.
                    if mutation=='endpoint':report['candidates'][0]['id']='changed'
                    if mutation=='worse':report['queries'][0]['result'].update(cost=2.,exact_stored_path_cost=['2','1'])
                    if mutation=='lost':report['queries'][0]['result']['cost']=None
                    with self.assertRaises(ValueError,msg=mutation):detour.compare_parent(raw,current,report)

    def test_retained_data_bindings_and_research_flags(self):
        r=json.loads(detour.OUTPUT.read_bytes())
        for name,expected in {**r['implementation_sha256'],**r['retained_input_sha256']}.items():
            self.assertEqual(hashlib.sha256((detour.ROOT/name).read_bytes()).hexdigest(),expected,name)
        self.assertEqual(r['parent_comparison']['parent_report_sha256'],detour.parent.digest(detour.parent.OUTPUT))
        self.assertEqual(r['counts']['queries'],40)
        self.assertEqual((r['counts']['finite_witnesses'],r['counts']['unresolved']),(40,0))
        self.assertEqual((r['counts']['retained_nodes'],r['counts']['retained_arcs'],r['counts']['projected_maneuvers']),(41799,68298,341))
        self.assertEqual(r['parent_comparison']['original_finite_queries'],12)
        self.assertEqual(r['parent_comparison']['newly_finite_queries'],28)
        self.assertEqual(r['parent_comparison']['strictly_improved_parent_queries'],12)
        self.assertTrue(r['parent_comparison']['all_parent_travel_arcs_unchanged'])
        self.assertTrue(r['parent_comparison']['all_parent_finite_witnesses_revalidated'])
        for flag in ('access_verified','geographic_coverage_certified','anchors_adopted','release_eligible'):self.assertIs(r[flag],False)
        self.assertEqual(r['connectors_approved'],0)
