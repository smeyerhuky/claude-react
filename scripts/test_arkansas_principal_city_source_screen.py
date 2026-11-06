import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from arkansas_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class ArkansasSourceTests(unittest.TestCase):
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
        self.manifest(lambda m: next(r for r in m['records']
                                    if r['source_path'].endswith('/' + slug + '.json'))
                      .update(source_sha256=digest))

    def test_nine_cities_four_metros_with_explicit_blocked_retrieval(self):
        result = check(self.root)
        self.assertEqual((result['principal_city_memberships'], result['metros']), (9, 4))
        self.assertEqual(result['source_work_counts'], dict(direct_http=8, unavailable=1))
        self.assertEqual(result['publication_contexts_inspected'], 8)
        self.assertFalse(result['release_eligible'])

    def test_shared_cbsa_cannot_substitute_little_rock_for_north_little_rock(self):
        def substitute(m):
            a = next(r for r in m['records'] if r['city_name'] == 'Little Rock')
            b = next(r for r in m['records'] if r['city_name'] == 'North Little Rock')
            b.update(source_path=a['source_path'], source_sha256=a['source_sha256'])
        self.manifest(substitute)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_northwest_metro_cannot_be_collapsed_to_fayetteville(self):
        self.manifest(lambda m: m['records'].pop())
        with self.assertRaisesRegex(ValueError, 'Complete unique principal-city'):
            check(self.root)

    def test_scheduled_construction_does_not_verify_reference_date_operation(self):
        for flag in ('actual_start_or_completion_verified', 'construction_notice_is_reference_date_access_proof'):
            with self.subTest(flag=flag):
                self.source('conway', lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'timing/scope/retrieval'):
                    check(self.root)
                self.source('conway', lambda s: s['published_conditions'].update({flag: False}))

    def test_payment_hours_contact_addresses_and_accessibility_do_not_approve_entry(self):
        for slug, flag in [('bentonville', 'contact_address_is_reviewed_vehicle_entry'),
                           ('fayetteville', 'reserved_level_is_general_public_parking'),
                           ('jonesboro', 'office_hours_are_vehicle_access_hours'),
                           ('little-rock', 'free_meter_periods_are_alley_access_permission'),
                           ('north-little-rock', 'argenta_theater_opposite_lot_is_city_owned'),
                           ('rogers', 'museum_accessibility_is_driveway_grade_proof'),
                           ('springdale', 'office_hours_inferred_from_unrendered_page')]:
            with self.subTest(city=slug):
                self.source(slug, lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'timing/scope/retrieval'):
                    check(self.root)
                self.source(slug, lambda s: s['published_conditions'].update({flag: False}))

    def test_blocked_request_cannot_retain_search_result_as_inspected_evidence(self):
        self.source('fort-smith', lambda s: s.update(selected_quote='Monthly parking passes are available.'))
        with self.assertRaisesRegex(ValueError, 'Failed retrieval cannot become inspected evidence'):
            check(self.root)

    def test_official_redirect_record_requires_successful_same_publisher_request(self):
        self.source('jonesboro', lambda s: s['direct_http_attempt'].update(
            final_url='https://www.jonesboro.org/directory.aspx?did=28'))
        with self.assertRaisesRegex(ValueError, 'HTTP attempt identity'):
            check(self.root)

    def test_context_cannot_self_certify_connector_or_anchor(self):
        self.source('rogers', lambda s: s.update(access_verified=True))
        with self.assertRaisesRegex(ValueError, 'cannot self-certify'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
