import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from missouri_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class MissouriSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / FOLDER, self.root / FOLDER)
        (self.root / INVENTORY).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / INVENTORY, self.root / INVENTORY)

    def manifest(self, mutate):
        path = self.root / FOLDER / 'manifest.json'
        value = json.loads(path.read_text()); mutate(value)
        path.write_text(json.dumps(value))

    def source(self, slug, mutate):
        path = self.root / FOLDER / (slug + '.json')
        value = json.loads(path.read_text()); mutate(value)
        path.write_text(json.dumps(value))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.manifest(lambda m: next(r for r in m['records'] if r['source_path'].endswith('/' + slug + '.json')).update(source_sha256=digest))

    def test_all_eight_cities_seven_metros_and_retrieval_methods(self):
        result = check(self.root)
        self.assertEqual((result['principal_city_memberships'], result['metros']), (8, 7))
        self.assertEqual(result['source_work_counts'], dict(direct_http=5, web_rendered=3))
        self.assertEqual(result['publication_contexts_inspected'], 8)
        self.assertEqual(result['anchors_adopted'], 0)

    def test_st_charles_historical_closure_is_not_current_2026_condition(self):
        self.source('st-charles', lambda s: s['published_conditions'].update(project_is_current_2026=True))
        with self.assertRaisesRegex(ValueError, 'timing/scope'):
            check(self.root)

    def test_announced_st_joseph_conversion_is_not_confirmed_completed_access(self):
        self.source('st-joseph', lambda s: s['published_conditions'].update(subsequent_completion_verified=True))
        with self.assertRaisesRegex(ValueError, 'timing/scope'):
            check(self.root)

    def test_joplin_estimate_is_not_actual_work_start(self):
        self.source('joplin', lambda s: s['published_conditions'].update(work_start_or_completion_inferred=True))
        with self.assertRaisesRegex(ValueError, 'timing/scope'):
            check(self.root)

    def test_court_guidance_cannot_become_general_parking_or_another_springfield(self):
        self.source('springfield', lambda s: s.update(source_kind='municipal_parking_guidance'))
        with self.assertRaisesRegex(ValueError, 'juror guidance'):
            check(self.root)
        self.source('springfield', lambda s: s.update(source_kind='federal_juror_parking_guidance',
                                                    url='https://springfieldparkingauthority.com/'))
        with self.assertRaisesRegex(ValueError, 'primary publisher'):
            check(self.root)

    def test_paid_opening_and_monthly_employee_rates_cannot_become_free_unrestricted_entry(self):
        for slug, flag in (('kansas-city', 'introductory_free_period_is_current_default'),
                           ('st-louis', 'monthly_or_employee_24h_is_unrestricted_hourly_access')):
            with self.subTest(city=slug):
                self.source(slug, lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'timing/scope'):
                    check(self.root)
                self.source(slug, lambda s: s['published_conditions'].update({flag: False}))

    def test_entry_clearance_and_payment_hours_cannot_become_full_path_access(self):
        for slug, flag in (('columbia', 'entry_clearance_applies_to_entire_facility'),
                           ('jefferson-city', 'madison_garage_selected_as_open')):
            with self.subTest(city=slug):
                self.source(slug, lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'timing/scope'):
                    check(self.root)
                self.source(slug, lambda s: s['published_conditions'].update({flag: False}))

    def test_same_cbsa_does_not_allow_st_louis_source_for_st_charles(self):
        def mutate(manifest):
            destination = next(r for r in manifest['records'] if r['city_name'] == 'St. Charles')
            source = next(r for r in manifest['records'] if r['city_name'] == 'St. Louis')
            destination.update(source_path=source['source_path'], source_sha256=source['source_sha256'])
        self.manifest(mutate)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
