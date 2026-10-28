import copy
import json
import math
import unittest

from metro_competitor_review_queue import DOMAINS, build
from metro_scenario_checkpoint import load_reference


class CompetitorQueueTests(unittest.TestCase):
    def setUp(self):
        self.baseline=load_reference()
        self.domains=json.loads(DOMAINS.read_text())

    def test_every_unknown_identity_once_no_exclusions(self):
        report=build(self.baseline,self.domains)
        self.assertEqual(len(report['queue']),341)
        self.assertEqual({r['cbsa'] for r in report['queue']},set(self.baseline['unrepresented_source_qualifying_cbsa_ids']))
        self.assertEqual(report['applied_exclusions'],[])
        self.assertEqual(report['queue'][0]['cbsa'],'48660')
        self.assertEqual([r['investigation_rank'] for r in report['queue']],list(range(1,342)))
        self.assertFalse(report['release_eligible'])
        self.assertTrue(all(r['status']=='unknown_competitor' and r['access_verified'] is False for r in report['queue']))
        self.assertTrue(any(r['included_in_public_csv'] is False for r in report['queue']))

    def test_dropped_or_duplicate_domain_and_missing_competitor_fail(self):
        for mutation in ('domain','duplicate','unknown'):
            baseline=copy.deepcopy(self.baseline);domains=copy.deepcopy(self.domains)
            if mutation=='domain':domains['domains'].pop()
            elif mutation=='duplicate':domains['domains'].append(copy.deepcopy(domains['domains'][0]))
            else:baseline['unrepresented_source_qualifying_cbsa_ids'].pop()
            with self.assertRaises(ValueError):build(baseline,domains)

    def test_nonfinite_or_out_of_range_coordinate_rejected(self):
        for value in (math.nan,math.inf,181):
            domains=copy.deepcopy(self.domains)
            record=next(r for r in domains['domains'] if r['cbsa'] in self.baseline['unrepresented_source_qualifying_cbsa_ids'])
            record['native_representative_lonlat'][0]=value
            with self.assertRaises(ValueError):build(self.baseline,domains)


if __name__=='__main__':unittest.main()
