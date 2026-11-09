import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from iowa_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class IowaSourceTests(unittest.TestCase):
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

    def test_all_nine_cities_seven_metros_with_two_explicit_retrieval_gaps(self):
        result = check(self.root)
        self.assertEqual((result['principal_city_memberships'], result['metros']), (9, 7))
        self.assertEqual(result['source_work_counts'], dict(direct_http=7, unavailable=2))
        self.assertEqual(result['publication_contexts_inspected'], 7)
        self.assertFalse(result['release_eligible'])

    def test_des_moines_cannot_substitute_for_west_des_moines_in_same_metro(self):
        def substitute(m):
            a = next(r for r in m['records'] if r['city_name'] == 'Des Moines')
            b = next(r for r in m['records'] if r['city_name'] == 'West Des Moines')
            b.update(source_path=a['source_path'], source_sha256=a['source_sha256'])
        self.manifest(substitute)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_waterloo_cannot_substitute_for_cedar_falls_in_same_metro(self):
        def substitute(m):
            a = next(r for r in m['records'] if r['city_name'] == 'Waterloo')
            b = next(r for r in m['records'] if r['city_name'] == 'Cedar Falls')
            b.update(source_path=a['source_path'], source_sha256=a['source_sha256'])
        self.manifest(substitute)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_closed_five_seasons_ramp_cannot_be_selected_as_open(self):
        self.source('cedar-rapids', lambda s: s['published_conditions'].update(five_seasons_ramp_selected_as_open=True))
        with self.assertRaisesRegex(ValueError, 'publication scope, timing'):
            check(self.root)

    def test_operator_guidance_retains_its_publisher_scope(self):
        self.source('cedar-rapids', lambda s: s.update(source_kind='municipal_parking_guidance'))
        with self.assertRaisesRegex(ValueError, 'Operator listing'):
            check(self.root)

    def test_council_proposal_and_future_service_do_not_prove_adoption_or_operation(self):
        for flag in ('proposal_is_enacted_ordinance', 'future_reservation_system_operation_verified'):
            with self.subTest(flag=flag):
                self.source('des-moines', lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'publication scope, timing'):
                    check(self.root)
                self.source('des-moines', lambda s: s['published_conditions'].update({flag: False}))

    def test_blocked_pages_cannot_be_promoted_from_search_results(self):
        for slug in ('west-des-moines', 'iowa-city'):
            with self.subTest(city=slug):
                self.source(slug, lambda s: s.update(retrieval_method='web_rendered',
                            publication_status='retained_publication_observation', selected_quote='Search result',
                            observations=['Unverified search text.']))
                with self.assertRaisesRegex(ValueError, 'Blocked selected publication'):
                    check(self.root)
                self.source(slug, lambda s: s.update(retrieval_method='unavailable',
                            publication_status='selected_publication_unavailable', selected_quote='', observations=[]))

    def test_parking_programs_skywalks_and_office_hours_are_not_car_connectors(self):
        for slug, flag in [('ames', 'employee_tag_is_unrestricted_public_parking'),
                           ('davenport', 'prepayment_is_connector_access_evidence'),
                           ('sioux-city', 'skywalk_is_motor_vehicle_connector'),
                           ('cedar-falls', 'shared_business_lots_are_unrestricted_city_roads'),
                           ('waterloo', 'office_hours_are_car_access_hours')]:
            with self.subTest(city=slug):
                self.source(slug, lambda s: s['published_conditions'].update({flag: True}))
                with self.assertRaisesRegex(ValueError, 'publication scope, timing'):
                    check(self.root)
                self.source(slug, lambda s: s['published_conditions'].update({flag: False}))

    def test_complete_city_accounting_required(self):
        self.manifest(lambda m: m['records'].pop())
        with self.assertRaisesRegex(ValueError, 'Complete unique principal-city'):
            check(self.root)

    def test_source_context_cannot_adopt_an_anchor(self):
        self.source('ames', lambda s: s.update(anchor_adopted=True))
        with self.assertRaisesRegex(ValueError, 'cannot self-certify'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
