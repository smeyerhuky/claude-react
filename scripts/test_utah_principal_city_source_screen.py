import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from utah_principal_city_source_screen import ROOT, INVENTORY, FOLDER, check


class UtahSourceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / FOLDER, self.root / FOLDER)
        (self.root / INVENTORY).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / INVENTORY, self.root / INVENTORY)

    def manifest(self, mutate):
        path = self.root / FOLDER / 'manifest.json'
        data = json.loads(path.read_text())
        mutate(data)
        path.write_text(json.dumps(data))

    def test_eight_cities_five_metros_no_approval(self):
        result = check(self.root)
        self.assertEqual(result['principal_city_memberships'], 8)
        self.assertEqual(result['metros'], 5)
        self.assertEqual(result['source_work_counts'], {'direct_http': 3, 'web_rendered': 5})
        self.assertFalse(result['access_verified'])
        self.assertFalse(result['release_eligible'])

    def test_missing_city_and_duplicate_city(self):
        self.manifest(lambda m: m['records'].__setitem__(0, m['records'][1]))
        with self.assertRaisesRegex(ValueError, 'Complete unique'):
            check(self.root)

    def test_provo_cannot_cover_orem(self):
        def mutate(m):
            orem = next(r for r in m['records'] if r['principal_city_id'] == '4957300')
            provo = next(r for r in m['records'] if r['principal_city_id'] == '4962470')
            orem.update(source_path=provo['source_path'], source_sha256=provo['source_sha256'])
        self.manifest(mutate)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_rehashed_record_cannot_adopt_anchor(self):
        relative = FOLDER / 'orem.json'
        source = json.loads((self.root / relative).read_text())
        source['anchor_adopted'] = True
        (self.root / relative).write_text(json.dumps(source))
        digest = hashlib.sha256((self.root / relative).read_bytes()).hexdigest()
        self.manifest(lambda m: next(r for r in m['records'] if r['principal_city_id'] == '4957300').update(source_sha256=digest))
        with self.assertRaisesRegex(ValueError, 'self-certify'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
