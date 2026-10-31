import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from oklahoma_principal_city_source_screen import ROOT, INVENTORY, FOLDER, check


class OklahomaSourceTests(unittest.TestCase):
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

    def comparison(self, mutate):
        path = self.root / FOLDER / 'tulsa.json'
        value = json.loads(path.read_text())
        mutate(value['address_comparison'])
        path.write_text(json.dumps(value))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.manifest(lambda m: next(r for r in m['records'] if r['principal_city_id'] == '4075000').update(source_sha256=digest))

    def test_three_city_contexts_not_approvals(self):
        result = check(self.root)
        self.assertEqual(result['principal_city_memberships'], 3)
        self.assertEqual(result['metros'], 3)
        self.assertEqual(result['unresolved_address_comparisons'], 1)
        self.assertEqual(result['connectors_approved'], 0)

    def test_missing_city(self):
        self.manifest(lambda m: m['records'].pop())
        with self.assertRaisesRegex(ValueError, 'Complete unique'):
            check(self.root)

    def test_rehashed_address_correction_is_not_verified(self):
        self.comparison(lambda c: c.update(city_literal='520 W. 3rd St.'))
        with self.assertRaisesRegex(ValueError, 'Literal city/operator'):
            check(self.root)

    def test_name_matching_cannot_establish_same_facility(self):
        self.comparison(lambda c: c.update(same_facility_verified=True))
        with self.assertRaisesRegex(ValueError, 'cannot resolve identity'):
            check(self.root)

    def test_no_origin_selected_from_address(self):
        self.comparison(lambda c: c.update(selected_origin_lonlat=[-96.0, 36.0]))
        with self.assertRaisesRegex(ValueError, 'cannot resolve identity'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
