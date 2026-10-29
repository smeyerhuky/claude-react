import copy
import unittest
from shapely.geometry import box
from metro_native_state_inventory import classify


class NativeStateTests(unittest.TestCase):
    def setUp(self):
        self.domains={'native_crs':'EPSG:4269','source_qualifying_cbsa_ids':['10000','20000','30000'],
                      'domains':[{'cbsa':'10000','native_representative_lonlat':[0.5,0.5]},
                                 {'cbsa':'20000','native_representative_lonlat':[1,0.5]},
                                 {'cbsa':'30000','native_representative_lonlat':[5,5]}]}
        self.states=[({'GEOID':'01','STUSPS':'AA','NAME':'First'},box(0,0,1,1)),
                     ({'GEOID':'02','STUSPS':'BB','NAME':'Second'},box(1,0,2,1))]

    def test_boundary_and_absence_stay_explicit(self):
        r=classify(self.domains,self.states)
        self.assertEqual([row['membership_status'] for row in r['rows']],['unique','boundary_multiple','unmatched'])
        self.assertEqual(r['multiple_state_cbsa_ids'],['20000'])
        self.assertEqual(r['unmatched_cbsa_ids'],['30000'])
        self.assertFalse(r['geographic_coverage_certified'])
        self.assertFalse(r['access_verified'])

    def test_wrong_crs_and_duplicate_inventory_fail(self):
        for mutate in ['crs','duplicate','missing']:
            d=copy.deepcopy(self.domains)
            if mutate=='crs':d['native_crs']='EPSG:4326'
            elif mutate=='duplicate':d['domains'].append(d['domains'][0])
            else:d['domains'].pop()
            with self.assertRaises(ValueError):classify(d,self.states)

    def test_invalid_point_and_state_fail(self):
        d=copy.deepcopy(self.domains);d['domains'][0]['native_representative_lonlat']=[float('nan'),0]
        with self.assertRaises(ValueError):classify(d,self.states)
        with self.assertRaises(ValueError):classify(self.domains,self.states+self.states[:1])
