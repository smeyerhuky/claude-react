import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from nevada_principal_city_source_screen import ROOT, INVENTORY, FOLDER as NV, check as check_nv
from wyoming_principal_city_source_screen import FOLDER as WY, check as check_wy


class SourceScopeTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for folder in (NV, WY):
            shutil.copytree(ROOT / folder, self.root / folder)
        (self.root / INVENTORY).parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(ROOT / INVENTORY, self.root / INVENTORY)

    def manifest(self, folder, mutate):
        path = self.root / folder / 'manifest.json'
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))

    def source(self, folder, slug, mutate):
        path = self.root / folder / (slug + '.json')
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        self.manifest(folder, lambda m: next(r for r in m['records'] if r['source_path'].endswith('/' + slug + '.json')).update(source_sha256=digest))

    def test_complete_city_work_with_explicit_gap_not_approvals(self):
        nv, wy = check_nv(self.root), check_wy(self.root)
        self.assertEqual((nv['principal_city_memberships'], nv['metros'], nv['publication_contexts_inspected']), (5, 2, 4))
        self.assertEqual(nv['source_work_counts']['unavailable'], 1)
        self.assertEqual((wy['principal_city_memberships'], wy['publication_contexts_inspected']), (1, 1))
        self.assertEqual(nv['connectors_approved'] + wy['connectors_approved'], 0)

    def test_shared_metro_cannot_substitute_city_for_paradise(self):
        def mutate(m):
            paradise = next(r for r in m['records'] if r['principal_city_id'] == '3254600')
            vegas = next(r for r in m['records'] if r['principal_city_id'] == '3240000')
            paradise.update(source_path=vegas['source_path'], source_sha256=vegas['source_sha256'])
        self.manifest(NV, mutate)
        with self.assertRaisesRegex(ValueError, 'another principal city'):
            check_nv(self.root)

    def test_unavailable_city_cannot_be_dropped(self):
        self.manifest(NV, lambda m: m.update(records=[r for r in m['records'] if r['principal_city_id'] != '3251800']))
        with self.assertRaisesRegex(ValueError, 'Complete unique'):
            check_nv(self.root)

    def test_county_venue_cannot_self_verify_cdp_geography(self):
        self.source(NV, 'paradise', lambda s: s['geographic_identity'].update(cdp_boundary_alignment_verified=True))
        with self.assertRaisesRegex(ValueError, 'County advisory area'):
            check_nv(self.root)

    def test_alternative_entrance_is_not_guaranteed_open(self):
        self.source(NV, 'henderson', lambda s: s['published_scope'].update(texas_avenue_guaranteed_unrestricted=True))
        with self.assertRaisesRegex(ValueError, 'event-closure review'):
            check_nv(self.root)

    def test_street_overnight_exemption_does_not_approve_garages(self):
        self.source(WY, 'cheyenne', lambda s: s['published_scope'].update(overnight_street_answer_generalized_to_garages=True))
        with self.assertRaisesRegex(ValueError, 'Street parking scope'):
            check_wy(self.root)


if __name__ == '__main__':
    unittest.main()
