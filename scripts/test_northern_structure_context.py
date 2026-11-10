import copy
import json
import math
import unittest
from urllib.parse import parse_qs,urlsplit
import northern_structure_context as context


def feature(oid=1,key='structure-A',kind='Bridge'):
    attrs={k:None for k in context.STRUCTURE_FIELDS}
    attrs.update(OBJECTID=oid,STRUCTURE_KEY=key,STRUCTURE_CLASS=kind)
    return dict(attributes=attrs,geometry=dict(x=3.,y=4.))


def body(rows):
    return dict(objectIdFieldName='OBJECTID',geometryType='esriGeometryPoint',spatialReference=dict(wkid=26913),features=rows)


class NorthernStructureContextTests(unittest.TestCase):
    def test_explicit_null_empty_inventory_is_distinct_from_missing_inventory(self):
        inventory=dict(objectIdFieldName='OBJECTID',objectIds=None)
        self.assertEqual(context.complete_features(body([]),inventory,0),[])
        for bad in [dict(objectIdFieldName='OBJECTID'),dict(objectIdFieldName='OBJECTID',objectIds=[1])]:
            with self.assertRaises(ValueError):context.complete_features(body([]),bad,0)
        with self.assertRaises(ValueError):context.complete_features(body([feature()]),inventory,0)

    def test_truncation_errors_duplicates_and_incomplete_ids_cannot_be_called_complete(self):
        for mutation in ['truncated','inventory-truncated','error','duplicate','missing','bad-id','missing-field']:
            b=body([feature()]);ids=dict(objectIdFieldName='OBJECTID',objectIds=[1])
            if mutation=='truncated':b['exceededTransferLimit']=True
            if mutation=='inventory-truncated':ids['exceededTransferLimit']=True
            if mutation=='error':ids['error']=dict(code=500)
            if mutation=='duplicate':b['features'].append(feature())
            if mutation=='missing':ids['objectIds']=[1,2]
            if mutation=='bad-id':ids['objectIds']=[True]
            if mutation=='missing-field':del b['features'][0]['attributes']['ON_UNDER']
            with self.assertRaises(ValueError,msg=mutation):context.complete_features(b,ids,31)

    def test_geometry_and_native_crs_are_explicit_even_for_empty_queries(self):
        ids=dict(objectIdFieldName='OBJECTID',objectIds=[])
        for mutation in ['line','datum','latest','missing']:
            b=body([])
            if mutation=='line':b['geometryType']='esriGeometryPolyline'
            if mutation=='datum':b['spatialReference']['wkid']=4326
            if mutation=='latest':b['spatialReference']['latestWkid']=2876
            if mutation=='missing':del b['spatialReference']
            with self.assertRaises(ValueError,msg=mutation):context.complete_features(b,ids,0)

    def test_normalization_sorts_only_inventory_ids_without_erasing_empty_representation_or_data(self):
        self.assertEqual(context.source_sha(b'{"objectIds":[2,1]}'),context.source_sha(b'{ "objectIds" : [1,2] }'))
        self.assertNotEqual(context.source_sha(b'{"objectIds":null}'),context.source_sha(b'{"objectIds":[]}'))
        self.assertNotEqual(context.source_sha(b'{"features":[1,2]}'),context.source_sha(b'{"features":[2,1]}'))
        self.assertNotEqual(context.source_sha(b'{"FEATINT":"NBND ML"}'),context.source_sha(b'{"FEATINT":"SBND ML"}'))
        for raw in [b'{"objectIds":[1,1]}',b'{"objectIds":[true]}',b'{"objectIds":[0]}']:
            with self.assertRaises(ValueError):context.source_sha(raw)

    def test_cross_layer_object_ids_are_not_structure_identities_or_independent_corroboration(self):
        a=context.point_rows([feature(1,'A')],[0.,0.]);b=context.point_rows([feature(1,'B')],[0.,0.])
        mismatch=context.compare_bridges(a,b)
        self.assertFalse(mismatch['same_inventory']);self.assertEqual(mismatch['shared_structure_keys'],[])
        same=context.compare_bridges(a,context.point_rows([feature(999,'A')],[0.,0.]))
        self.assertTrue(same['same_inventory']);self.assertEqual(same['shared_structure_keys'],['A'])
        self.assertFalse(same['independent_corroboration']);self.assertFalse(same['absence_is_grade_proof'])
        with self.assertRaises(ValueError):context.compare_bridges(a+a,b)

    def test_empty_bridge_queries_never_prove_absence_of_decks_or_same_grade(self):
        result=context.compare_bridges([],[])
        self.assertTrue(result['same_inventory']);self.assertFalse(result['absence_is_grade_proof'])
        extra=context.compare_bridges([],context.point_rows([feature()],[0.,0.]))
        self.assertEqual(extra['layer31_only_structure_keys'],['structure-A'])
        self.assertFalse(extra['absence_is_grade_proof'])

    def test_point_registration_is_finite_and_does_not_invent_footprints(self):
        result=context.point_rows([feature()],[0.,0.])[0]
        self.assertEqual(result['nominal_point_distance_m'],5.)
        self.assertEqual(result['source_point_native_m'],[3.,4.])
        self.assertNotIn('bridge_footprint',result)
        for value in [float('nan'),float('inf'),None,True]:
            f=feature();f['geometry']['x']=value
            with self.assertRaises(ValueError):context.point_rows([f],[0.,0.])

    def test_source_requests_bind_exact_native_candidates_separate_ids_and_500m_queries(self):
        native,manifest=context.inputs()
        self.assertEqual(len(manifest['sources']),33)
        for entry in native['candidates']:
            for layer in context.LAYERS:
                normal=parse_qs(urlsplit(context.query_url(entry['candidate'],layer)).query)
                ids=parse_qs(urlsplit(context.query_url(entry['candidate'],layer,True)).query)
                self.assertEqual(normal['distance'],['500']);self.assertEqual(normal['outSR'],['26913'])
                point=json.loads(normal['geometry'][0]);self.assertEqual([point['x'],point['y']],entry['candidate']['lonlat'])
                self.assertEqual(ids['returnIdsOnly'],['true']);self.assertNotIn('outFields',ids)
        with self.assertRaises(ValueError):context.query_url(native['candidates'][0]['candidate'],99)

    def test_real_inventory_disagreement_and_nearby_wrong_route_signals_remain_explicit(self):
        r=json.loads((context.OUTPUT/'report.json').read_bytes());points={p['candidate']['id']:p for p in r['points']}
        fort=points['fort-college']
        self.assertEqual(fort['inventories']['0']['feature_count'],0)
        self.assertEqual(fort['inventories']['31']['class_counts'],dict(Bridge=1,Signal=22))
        self.assertEqual(len(fort['bridge_inventory_comparison']['layer31_only_structure_keys']),1)
        cleveland=points['loveland-cleveland']
        self.assertEqual(cleveland['osm_way_tags']['CDOT_route'],'287Z')
        self.assertTrue(all(v['attributes']['ROUTE']=='287C' for v in cleveland['inventories']['31']['nearest_four_signals']))
        ninth=points['greeley-ninth']
        self.assertEqual(ninth['inventories']['31']['nearest_four_signals'][0]['attributes']['FEATINT'],'WBND ML')
        self.assertFalse(ninth['nearby_direction_labels_assign_lane'])

    def test_retained_report_binds_parent_sources_and_preserves_every_release_gate(self):
        native,manifest=context.inputs();r=json.loads((context.OUTPUT/'report.json').read_bytes())
        self.assertEqual(r['implementation_sha256'],context.digest(context.__file__))
        self.assertEqual(r['manifest_sha256'],context.digest(context.OUTPUT/'manifest.json'))
        self.assertEqual([p['candidate'] for p in r['points']],[e['candidate'] for e in native['candidates']])
        self.assertEqual(r['approved_connectors'],0)
        for flag in ['anchors_adopted','access_verified','geographic_coverage_certified','release_eligible']:
            self.assertIs(r[flag],False)
        for p in r['points']:
            for flag in ['query_is_complete_world_inventory','nearby_direction_labels_assign_lane',
                         'access_categories_grant_vehicle_permission','grade_certified','access_verified','anchor_adopted']:
                self.assertIs(p[flag],False)
            self.assertFalse(p['coordinate_operation']['stated_accuracy_is_error_bound'])


if __name__=='__main__':unittest.main()
