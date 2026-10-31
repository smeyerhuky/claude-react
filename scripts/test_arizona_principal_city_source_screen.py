import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from arizona_principal_city_source_screen import ROOT, FOLDER, INVENTORY, check


class PrincipalCityTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        shutil.copytree(ROOT / FOLDER, self.root / FOLDER)
        for relative in (INVENTORY, Path('docs/research/tucson-parking-publication/visitor-excerpts.json')):
            (self.root / relative).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(ROOT / relative, self.root / relative)

    def manifest(self, mutate):
        path = self.root / FOLDER / 'manifest.json'
        data = json.loads(path.read_text())
        mutate(data)
        path.write_text(json.dumps(data))

    def source(self, cid, mutate):
        manifest = json.loads((self.root / FOLDER / 'manifest.json').read_text())
        row = next(r for r in manifest['records'] if r['principal_city_id'] == cid)
        path = self.root / row['source_path']
        source = json.loads(path.read_text())
        mutate(source)
        path.write_text(json.dumps(source))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.manifest(lambda m: next(r for r in m['records'] if r['principal_city_id'] == cid).update(source_sha256=digest))

    def test_complete_work_not_approval(self):
        result = check(self.root)
        self.assertEqual(result['principal_city_memberships'], 16)
        self.assertEqual(result['metros'], 7)
        self.assertEqual(result['publication_contexts_inspected'], 12)
        self.assertEqual(result['source_work_counts']['unavailable'], 4)
        self.assertEqual(result['connectors_approved'], 0)

    def test_missing_or_duplicate_city(self):
        self.manifest(lambda m: m['records'].pop())
        with self.assertRaisesRegex(ValueError, 'Complete unique'):
            check(self.root)

    def test_same_metro_does_not_make_cities_interchangeable(self):
        def mutate(m):
            chandler = next(r for r in m['records'] if r['principal_city_id'] == '0412000')
            mesa = next(r for r in m['records'] if r['principal_city_id'] == '0446000')
            chandler.update(source_path=mesa['source_path'], source_sha256=mesa['source_sha256'])
        self.manifest(mutate)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check(self.root)

    def test_unavailable_source_cannot_gain_observations(self):
        self.source('0427400', lambda s: s.update(observations=['Search snippet is not inspected evidence']))
        with self.assertRaisesRegex(ValueError, 'Failed retrieval'):
            check(self.root)

    def test_renderer_cannot_become_successful_http_capture(self):
        self.source('0446000', lambda s: s.update(source_http_status=200))
        with self.assertRaisesRegex(ValueError, 'Rendered content'):
            check(self.root)

    def test_rehashed_source_cannot_self_approve(self):
        self.source('0412000', lambda s: s.update(access_verified=True))
        with self.assertRaisesRegex(ValueError, 'self-certify'):
            check(self.root)


if __name__ == '__main__':
    unittest.main()
