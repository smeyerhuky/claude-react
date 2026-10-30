import tempfile
from pathlib import Path
import unittest
from metro_principal_city_inventory import project, memberships, SOURCE, DOMAINS


class PrincipalCityInventoryTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report = project()
        cls.by_id = {m['cbsa']: m for m in cls.report['metros']}

    def test_all_qualifiers_and_omitted_public_csv_metros_remain_explicit(self):
        import json
        reference = json.loads(DOMAINS.read_text())
        self.assertEqual(self.report['qualifying_cbsa_ids'], reference['source_qualifying_cbsa_ids'])
        self.assertEqual(len(self.by_id), 367)
        self.assertEqual(self.report['principal_city_membership_count'], 698)
        self.assertEqual(len(self.report['qualifiers_absent_from_existing_csv']), 8)
        self.assertTrue(all(self.by_id[i]['principal_cities'] for i in self.report['qualifiers_absent_from_existing_csv']))

    def test_principal_cities_are_not_just_metro_title_tokens(self):
        denver = self.by_id['19740']
        self.assertEqual({c['name'] for c in denver['principal_cities']},
                         {'Aurora', 'Broomfield', 'Centennial', 'Commerce City', 'Denver'})
        self.assertEqual(len(self.by_id['38060']['principal_cities']), 7)
        self.assertEqual(len(self.by_id['33100']['principal_cities']), 13)
        self.assertEqual({c['name'] for c in self.by_id['43420']['principal_cities']}, {'Sierra Vista', 'Douglas'})

    def test_fips_leading_zeros_and_no_adoption(self):
        for metro in self.report['metros']:
            self.assertEqual(metro['anchor_selection_status'], 'not_selected')
            self.assertEqual(metro['adopted_anchor_ids'], [])
            self.assertFalse(metro['release_eligible']); self.assertFalse(metro['access_verified'])
            for city in metro['principal_cities']:
                self.assertEqual(city['principal_city_id'], city['state_fips']+city['place_fips'])
                self.assertEqual(len(city['principal_city_id']), 7)
        self.assertIn('0804000', {c['principal_city_id'] for c in self.by_id['19740']['principal_cities']})

    def test_duplicate_conflicting_malformed_records_fail_instead_of_fuzzy_join(self):
        row = ('99999', 'Synthetic Metro', 'Metropolitan Statistical Area', 'Synthetic City', '08', '00001')
        for bad in ([row, row], [row, ('99999', 'Different Metro', row[2], 'Other', '08', '00002')],
                    [row[:4]+('8','00001')], [row[:5]+('1',)], [('not-a-code',)+row[1:]]):
            with self.subTest(rows=bad), self.assertRaises(ValueError): memberships(bad)

    def test_changed_original_source_and_missing_domain_cannot_silently_pass(self):
        import json
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'source.xlsx'; path.write_bytes(SOURCE.read_bytes()+b'changed')
            with self.assertRaisesRegex(ValueError, 'Exact original'): project(source=path)
            ref = json.loads(DOMAINS.read_text()); ref['domains'].pop()
            path = Path(folder)/'domains.json'; path.write_text(json.dumps(ref))
            with self.assertRaisesRegex(ValueError, 'Complete unique'): project(domains_path=path)


if __name__ == '__main__': unittest.main()
