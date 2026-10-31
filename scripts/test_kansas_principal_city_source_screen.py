import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from kansas_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class KansasSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / FOLDER, self.root / FOLDER)
        (self.root / INVENTORY).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / INVENTORY, self.root / INVENTORY)

    def manifest(self, mutate):
        path = self.root / FOLDER / 'manifest.json'
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))

    def conditions(self, slug, mutate):
        path = self.root / FOLDER / (slug + '.json')
        value = json.loads(path.read_text())
        mutate(value['published_conditions'])
        path.write_text(json.dumps(value))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.manifest(lambda m: next(r for r in m['records'] if r['source_path'].endswith('/' + slug + '.json')).update(source_sha256=digest))

    def test_seven_cities_five_metros_with_one_publication_gap(self):
        result = check(self.root)
        self.assertEqual((result['principal_city_memberships'], result['metros']), (7, 5))
        self.assertEqual(result['publication_contexts_inspected'], 6)
        self.assertEqual(result['source_work_counts'], dict(direct_http=4, web_rendered=2, unavailable=1))
        self.assertEqual(result['connectors_approved'], 0)

    def test_shared_cbsa_does_not_allow_substituting_lenexa_for_kck(self):
        def mutate(m):
            kck = next(r for r in m['records'] if r['principal_city_id'] == '2036000')
            lenexa = next(r for r in m['records'] if r['principal_city_id'] == '2039350')
            kck.update(source_path=lenexa['source_path'], source_sha256=lenexa['source_sha256'])
        self.manifest(mutate)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_parking_ban_cannot_become_road_closure(self):
        self.conditions('lenexa', lambda c: c.update(road_entry_closure_inferred=True))
        with self.assertRaisesRegex(ValueError, 'parking rule cannot'):
            check(self.root)

    def test_free_hours_do_not_remove_registration(self):
        self.conditions('manhattan', lambda c: c.update(visitor_registration_required=False))
        with self.assertRaisesRegex(ValueError, 'cannot erase registration'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
