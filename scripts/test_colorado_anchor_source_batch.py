import copy
import json
import unittest
from colorado_anchor_source_batch import FOLDER, audit, public_parking_inventory


class ColoradoSourceScreenTests(unittest.TestCase):
    def test_retained_restrictions_do_not_certify_any_connector(self):
        result = audit()
        self.assertEqual((result['new_anchors_adopted'], result['new_connectors_approved']), (0, 0))
        self.assertEqual(result['greeley']['feature_count'], 75)
        self.assertEqual(result['greeley']['ambiguous_removed_zone_ids'], [9, 25, 26])
        self.assertFalse(result['release_eligible'])
        self.assertEqual(len(result['source_screened_cbsa_ids']), 6)

    def test_operational_flag_cannot_override_removed_zone_label(self):
        doc = json.loads((FOLDER/'greeley-public-parking.json').read_text())
        for feature in doc['features']:
            feature['attributes']['LifeCycleStatus'] = 'Operational'
        result = public_parking_inventory(doc)
        self.assertEqual(result['ambiguous_removed_zone_ids'], [9, 25, 26])
        self.assertFalse(result['access_verified'])

    def test_truncated_duplicate_or_foreign_crs_records_are_rejected(self):
        for mutation in ('truncated', 'duplicate', 'crs', 'api_error'):
            with self.subTest(mutation=mutation):
                doc = json.loads((FOLDER/'greeley-public-parking.json').read_text())
                if mutation == 'truncated': doc['exceededTransferLimit'] = True
                elif mutation == 'duplicate': doc['features'].append(copy.deepcopy(doc['features'][0]))
                elif mutation == 'crs': doc['spatialReference']['wkid'] = 3857
                else: doc['error'] = {'message': 'Service unavailable'}
                with self.assertRaises(ValueError): public_parking_inventory(doc)
