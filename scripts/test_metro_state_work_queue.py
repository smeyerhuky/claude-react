import copy
import json
import unittest
from metro_state_work_queue import ROOT, build, project
from las_vegas_ui_checkpoint import check_frozen
from metro_competitor_review_queue import DOMAINS, build as priorities


class StateWorkQueueTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.baseline = check_frozen()
        cls.domains = json.loads(DOMAINS.read_text())
        cls.native = json.loads((ROOT/'docs/research/native-state-inventory/report.json').read_text())
        cls.ranks = {r['cbsa']: r['investigation_rank'] for r in priorities(cls.baseline, cls.domains)['queue']}

    def test_national_inventory_and_empty_dc_never_become_covered_states(self):
        data = build(); rows = {r['state']: r for r in data['states']}
        self.assertEqual(len(rows), 52)
        self.assertEqual(sum(r['native_point_qualifiers'] for r in rows.values()), 367)
        self.assertEqual(sum(r['routed_research_leads'] for r in rows.values()), 33)
        self.assertEqual(sum(len(r['unrouted_cbsa_ids']) for r in rows.values()), 334)
        self.assertEqual(sum(len(r['absent_public_csv_cbsa_ids']) for r in rows.values()), 8)
        self.assertEqual((rows['CA']['native_point_qualifiers'], rows['PR']['native_point_qualifiers'], rows['DC']['native_point_qualifiers']), (25, 5, 0))
        self.assertTrue(all(r['release_eligible'] is False for r in rows.values()))
        self.assertEqual(rows['AZ']['modeled_nodata_costs'], 76)
        self.assertEqual(rows['KS']['modeled_nodata_costs'], 76)
        self.assertEqual(data['states'][0]['state'], 'CO')

    def test_missing_duplicate_or_ambiguous_native_identity_is_rejected(self):
        for mutation in ('missing', 'duplicate', 'ambiguous', 'moved'):
            with self.subTest(mutation=mutation):
                native = copy.deepcopy(self.native)
                if mutation == 'missing': native['rows'].pop()
                elif mutation == 'duplicate': native['rows'].append(native['rows'][0])
                elif mutation == 'ambiguous': native['rows'][0]['point_states'] *= 2
                else: native['rows'][0]['native_representative_lonlat'][0] += 1
                with self.assertRaises(ValueError): project(self.baseline, self.domains, native, self.ranks, {}, {})

    def test_unknown_competitor_cannot_disappear_or_be_claimed_approved(self):
        ranks = dict(self.ranks); ranks.pop(next(iter(ranks)))
        with self.assertRaises(ValueError): project(self.baseline, self.domains, self.native, ranks, {}, {})
        baseline = copy.deepcopy(self.baseline); baseline['access_certified'] = True
        with self.assertRaises(ValueError): project(baseline, self.domains, self.native, self.ranks, {}, {})
