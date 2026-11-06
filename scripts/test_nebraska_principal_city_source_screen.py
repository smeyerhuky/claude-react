import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from nebraska_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class NebraskaSourceTests(unittest.TestCase):
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

    def test_two_qualifying_cities_two_metros_both_direct_http(self):
        result = check(self.root)
        self.assertEqual((result['principal_city_memberships'], result['metros']), (2, 2))
        self.assertEqual(result['source_work_counts'], dict(direct_http=2))
        self.assertEqual(result['publication_contexts_inspected'], 2)
        self.assertFalse(result['release_eligible'])

    def test_facility_point_monthly_keycard_and_clearance_are_not_connector_evidence(self):
        for flag in ('monthly_keycard_is_unrestricted_public_entry',
                     'facility_map_point_is_surveyed_vehicle_entry',
                     'published_clearance_applies_to_complete_path', 'vehicle_dimensions_assumed'):
            with self.subTest(flag=flag):
                self.source('lincoln', lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'scope without vehicle-access'):
                    check(self.root)
                self.source('lincoln', lambda s: s['published_conditions'].update({flag: False}))

    def test_juror_reimbursement_and_pedestrian_entrance_cannot_be_general_car_access(self):
        for flag in ('reimbursement_is_general_public_entitlement',
                     'courthouse_building_entrance_is_vehicle_connector',
                     'printed_garage_hours_are_reference_date_access_proof',
                     'publication_or_revision_date_inferred'):
            with self.subTest(flag=flag):
                self.source('omaha', lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'scope without vehicle-access'):
                    check(self.root)
                self.source('omaha', lambda s: s['published_conditions'].update({flag: False}))

    def test_federal_juror_guidance_retains_its_visitor_scope(self):
        self.source('omaha', lambda s: s.update(source_kind='municipal_parking_guidance'))
        with self.assertRaisesRegex(ValueError, 'Federal juror guidance'):
            check(self.root)

    def test_no_qualifying_city_may_be_omitted(self):
        self.manifest(lambda m: m['records'].pop())
        with self.assertRaisesRegex(ValueError, 'Complete unique principal-city'):
            check(self.root)

    def test_court_district_includes_lincoln_but_cannot_substitute_omaha_record(self):
        def substitute(m):
            a = next(r for r in m['records'] if r['city_name'] == 'Omaha')
            b = next(r for r in m['records'] if r['city_name'] == 'Lincoln')
            b.update(source_path=a['source_path'], source_sha256=a['source_sha256'])
        self.manifest(substitute)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_context_cannot_adopt_an_anchor(self):
        self.source('lincoln', lambda s: s.update(anchor_adopted=True))
        with self.assertRaisesRegex(ValueError, 'cannot self-certify'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
