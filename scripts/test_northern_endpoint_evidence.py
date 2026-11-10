import copy
from fractions import Fraction
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import northern_endpoint_evidence as evidence


class NorthernEndpointEvidenceTests(unittest.TestCase):
    def test_source_digest_ignores_only_json_presentation_and_id_inventory_order(self):
        a=b'{"objectIds":[1,2],"objectIdFieldName":"OBJECTID"}'
        b=b'{ "objectIdFieldName": "OBJECTID", "objectIds": [2,1] }'
        self.assertEqual(evidence.source_digest(a),evidence.source_digest(b))
        for other in [b'{"objectIds":[1,3],"objectIdFieldName":"OBJECTID"}',
                      b'{"objectIds":[1,2],"objectIdFieldName":"different"}']:
            self.assertNotEqual(evidence.source_digest(a),evidence.source_digest(other))
        with self.assertRaises(ValueError):evidence.source_digest(b'{"objectIds":[1,1]}')
        self.assertNotEqual(evidence.source_digest(b'{"features":[1,2]}'),evidence.source_digest(b'{"features":[2,1]}'))
        item=dict(id='f6380ef587ac4e54aaf988b15d8d1746',type='Feature Service',owner='ftc_geoevent',numViews=0,lastViewed=-1)
        changed=dict(item,numViews=190974,lastViewed=1794268800000)
        self.assertEqual(evidence.source_digest(json.dumps(item)),evidence.source_digest(json.dumps(changed)))
        changed['owner']='another-publisher'
        self.assertNotEqual(evidence.source_digest(json.dumps(item)),evidence.source_digest(json.dumps(changed)))

    def test_named_road_rejects_closer_unrelated_alley_and_preserves_duplicate_records(self):
        rows=[dict(object_id=1,distance_m=.01,attributes=dict(name='Artist Alley')),
              dict(object_id=2,distance_m=.8,attributes=dict(name='N Cleveland Ave')),
              dict(object_id=3,distance_m=.8,attributes=dict(name='N Cleveland Ave'))]
        self.assertEqual([r['object_id'] for r in evidence.named_matches(rows,'name','North Cleveland Avenue')],[2,3])
        with self.assertRaises(ValueError):evidence.named_matches(rows,'name','North College Avenue')

    def test_missing_truncated_or_duplicate_feature_inventory_never_means_complete(self):
        base=dict(objectIdFieldName='OBJECTID',geometryType='esriGeometryPolyline',features=[dict(attributes=dict(OBJECTID=1))])
        ids=dict(objectIdFieldName='OBJECTID',objectIds=[1])
        self.assertEqual(evidence.features(base,ids)[0],'OBJECTID')
        for mutation in ['truncated','missing','duplicate','error']:
            body=copy.deepcopy(base);inventory=copy.deepcopy(ids)
            if mutation=='truncated':body['exceededTransferLimit']=True
            if mutation=='missing':inventory['objectIds']=[1,2]
            if mutation=='duplicate':body['features'].append(copy.deepcopy(body['features'][0]))
            if mutation=='error':body['error']=dict(code=500)
            with self.assertRaises(ValueError,msg=mutation):evidence.features(body,inventory)

    def test_null_and_uncoded_values_do_not_acquire_another_agencys_direction_semantics(self):
        layer=dict(fields=[dict(name='ONEWAYDIR',domain=dict(type='codedValue',codedValues=[dict(code='FT',name='From-To'),dict(code='NA',name='Not Applicable')]))])
        self.assertEqual(evidence.decode('ONEWAYDIR','FT',layer)['decoded'],'From-To')
        self.assertEqual(evidence.decode('ONEWAYDIR','NA',layer)['decoded'],'Not Applicable')
        for value in [None,'FT','NA','TF']:
            result=evidence.decode('ONEWAY',value,dict(fields=[dict(name='ONEWAY',domain=None)]))
            self.assertIsNone(result['decoded']);self.assertFalse(result['code_definition_available'])
        self.assertIsNone(evidence.decode('ONEWAYDIR',None,layer)['decoded'])

    def test_closest_segment_is_bounded_and_preserves_native_direction(self):
        value=evidence.closest([1.,1.],[[[0.,0.],[2.,0.]]])
        self.assertEqual(value['projected_native'],[1.,0.]);self.assertEqual(value['distance_native'],1.)
        self.assertEqual(value['segment_native'],[[0.,0.],[2.,0.]])
        self.assertEqual(evidence.closest([3.,0.],[[[0.,0.],[2.,0.]]])['projected_native'],[2.,0.])
        for paths in [[],[[[0.,0.]]],[[[0.,0.],[0.,0.]]],[[[float('nan'),0.],[1.,0.]]]]:
            with self.assertRaises(ValueError):evidence.closest([0.,0.],paths)

    def test_wrong_city_publisher_is_rejected_even_for_same_dataset_title(self):
        org=dict(id='dLpFH5mwVvxSN4OE',name='City of Fort Collins',urlKey='fcgov')
        item=dict(orgId=org['id'],owner='ftc_geoevent',id='f6380ef587ac4e54aaf988b15d8d1746',url='https://services1.arcgis.com/'+org['id']+'/arcgis/rest/services/Street_Centerlines/FeatureServer')
        evidence.publisher(org,item)
        wrong=copy.deepcopy(org);wrong['name']='City of Norman'
        with self.assertRaises(ValueError):evidence.publisher(wrong,item)
        wrong_item=copy.deepcopy(item);wrong_item['url']='https://services1.arcgis.com/other/Street_Centerlines/FeatureServer'
        with self.assertRaises(ValueError):evidence.publisher(org,wrong_item)

    def test_native_projection_captures_three_original_vertices_and_selected_tags(self):
        c=dict(id='fixture',way=4,node=2,lonlat=[-105.,40.5])
        frozen=dict(source_identity=evidence.parent.identity(),candidates=[c])
        xml='''<osm version="0.6"><node id="1" lon="-105.001" lat="40.5"/><node id="2" lon="-105" lat="40.5"/>
        <node id="3" lon="-104.999" lat="40.5"/><way id="4"><nd ref="1"/><nd ref="2"/><nd ref="3"/>
        <tag k="name" v="Fixture Street"/><tag k="oneway" v="yes"/><tag k="note" v="Not exported"/></way></osm>'''
        with tempfile.TemporaryDirectory() as directory:
            source=Path(directory)/'fixture.osm';source.write_text(xml)
            path=Path(directory)/'report.json';path.write_text(json.dumps(frozen))
            with patch.object(evidence,'WITNESS',path),patch.object(evidence.parent,'verify_original') as verify:
                actual=evidence.extract_native(source)
                self.assertEqual(verify.call_count,2)
        row=actual['candidates'][0]
        self.assertEqual(row['raw_way']['local_geometry'],[[1,-105.001,40.5],[2,-105.,40.5],[3,-104.999,40.5]])
        self.assertEqual(row['raw_way']['tags'],dict(name='Fixture Street',oneway='yes'))
        self.assertEqual(row['raw_node']['tags'],{})

    def test_retained_binding_keeps_source_facts_distinct_from_access_certification(self):
        r=json.loads((evidence.OUTPUT/'report.json').read_bytes())
        self.assertEqual(r['implementation_sha256'],evidence.parent.digest(evidence.__file__))
        self.assertEqual(r['native_sha256'],evidence.parent.digest(evidence.OUTPUT/'native.json'))
        self.assertEqual(r['manifest_sha256'],evidence.parent.digest(evidence.OUTPUT/'manifest.json'))
        self.assertEqual(len(r['points']),5)
        self.assertTrue(all(row['route_matches_recorded_osm_route'] for p in r['points'] for row in p['cdot_context']))
        for flag in ['anchors_adopted','access_verified','geographic_coverage_certified','release_eligible']:self.assertIs(r[flag],False)
        self.assertEqual(r['approved_connectors'],0)
        cleveland=next(p for p in r['points'] if p['candidate']['id']=='loveland-cleveland')
        self.assertFalse(cleveland['unqualified_nearest_matches_named_road'])
        self.assertEqual(cleveland['unqualified_nearest_name'],'Artist Alley')
        self.assertEqual(cleveland['municipal_name'],'N Cleveland Ave')
        self.assertEqual(cleveland['municipal_direction']['decoded'],'From-To')
        self.assertGreater(cleveland['municipality_from_to_vs_osm_permitted_direction_cosine'],.99)
        ninth=next(p for p in r['points'] if p['candidate']['id']=='greeley-ninth')
        self.assertEqual(ninth['municipal_duplicate_geometry_ids'],[10216,23469])
        self.assertIsNone(ninth['municipal_direction']['decoded'])
