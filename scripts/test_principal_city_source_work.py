from copy import deepcopy
import json
import unittest

from principal_city_source_work import ROOT, PRINCIPAL, build, project
from build_principal_city_source_explorer import render


class SourceWorkTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = build()
        cls.principal = json.loads((ROOT / PRINCIPAL).read_text())

    def test_complete_official_membership_and_explicit_gaps(self):
        report = self.report
        self.assertEqual((report['membership_count'], report['metro_count'], len(report['states'])), (698, 367, 52))
        self.assertEqual(report['counts'], dict(context_retained=38, selected_publication_unavailable=5, not_recorded_here=655))
        self.assertEqual(sum(s['memberships'] for s in report['states']), 698)
        self.assertTrue(all(not r['anchor_adopted'] and r['access_review_status'] == 'unresolved' for r in report['cities']))
        dc = next(s for s in report['states'] if s['state'] == 'DC')
        self.assertGreater(dc['memberships'], 0)  # Native-point state grouping had zero DC metros.

    def test_empty_source_work_does_not_become_vacuous_coverage(self):
        report = project(self.principal, [])
        self.assertEqual(report['counts']['not_recorded_here'], 698)
        self.assertEqual(report['approved_anchors'], 0)
        self.assertFalse(report['release_eligible'])

    def test_foreign_duplicate_or_cross_city_assignment_rejected(self):
        base = next(r for r in self.report['cities'] if r['source_path'])
        with self.assertRaisesRegex(ValueError, 'duplicate city'):
            project(self.principal, [base, base])
        for change in (dict(cbsa='00000'), dict(state='XX'), dict(city_name='Another city')):
            row = deepcopy(base)
            row.update(change)
            with self.assertRaises(ValueError):
                project(self.principal, [row])

    def test_source_claim_cannot_self_approve(self):
        row = deepcopy(next(r for r in self.report['cities'] if r['source_path']))
        row['access_verified'] = True
        with self.assertRaisesRegex(ValueError, 'cannot assert adoption'):
            project(self.principal, [row])

    def test_source_text_cannot_close_embedded_script(self):
        report = deepcopy(self.report)
        attack = '</script><script>throw new Error("source executed")</script>'
        report['cities'][0]['city_name'] = attack
        html = render(report)
        self.assertNotIn(attack, html)
        payload = html.split('type="application/json">', 1)[1].split('</script>', 1)[0]
        self.assertEqual(json.loads(payload)['cities'][0]['city_name'], attack)


if __name__ == '__main__':
    unittest.main()
