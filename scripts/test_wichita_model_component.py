import unittest
from wichita_model_component import IncidentScan

class IncidentScanTests(unittest.TestCase):
    def test_private_outward_road_is_retained_without_growing_model_component(self):
        nodes={1};coords={};scan=IncidentScan(nodes,coords,grow=True)
        scan.add(10,{'highway':'residential','access':'no'},[(1,-97.,37.),(2,-96.9,37.)])
        self.assertEqual(nodes,{1});self.assertFalse(scan.rows[10]['modeled']);self.assertEqual(scan.rows[10]['node_ids'],[1,2])
        self.assertEqual(len(scan.rows[10]['raw_way_fingerprint_sha256']),64)

    def test_supported_native_chain_grows_and_keeps_genuine_zero_geometry(self):
        nodes={1};coords={};scan=IncidentScan(nodes,coords,grow=True)
        scan.add(10,{'highway':'service'},[(1,-97.,37.),(2,-97.,37.),(3,-96.9,37.)])
        self.assertEqual(nodes,{1,2,3});self.assertEqual(coords[1],coords[2]);self.assertTrue(scan.rows[10]['modeled'])

    def test_budget_failure_cannot_resume_or_return_a_truncated_component(self):
        scan=IncidentScan({1},{},grow=True,max_nodes=1)
        with self.assertRaises(ValueError):scan.add(10,{'highway':'residential'},[(1,-97.,37.),(2,-96.9,37.)])
        with self.assertRaisesRegex(ValueError,'resume'):scan.add(11,{'highway':'residential'},[(1,-97.,37.),(3,-96.8,37.)])

    def test_duplicate_way_or_conflicting_native_geometry_fails(self):
        scan=IncidentScan({1},{},grow=True);way=(10,{'highway':'residential'},[(1,-97.,37.),(2,-96.9,37.)]);scan.add(*way)
        with self.assertRaises(ValueError):scan.add(*way)
        scan=IncidentScan({1},{1:[-97.,37.]})
        with self.assertRaises(ValueError):scan.add(12,{'highway':'residential'},[(1,-97.1,37.),(2,-96.9,37.)])

    def test_invalid_seed_inventory_or_resource_limit_rejected(self):
        for nodes,limit in [(set(),1000),({True},1000),({1},True),({1},1001)]:
            with self.assertRaises(ValueError):IncidentScan(nodes,{},max_nodes=limit)

if __name__=='__main__':unittest.main()
