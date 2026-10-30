import json
from pathlib import Path
import shutil
import tempfile
import unittest
from municipal_source_screen import ROOT, NATIVE, check

BATCH = Path('docs/research/new-mexico-anchor-source-batch')


class MunicipalSourceScreenTests(unittest.TestCase):
    def test_all_new_mexico_metros_remain_unapproved(self):
        result = check(ROOT/BATCH/'manifest.json')
        self.assertEqual(result['source_screened_metros'], 4)
        self.assertEqual(result['source_context_by_cbsa']['29740'], 'municipal_planning')
        self.assertEqual(result['source_context_by_cbsa']['22140'], 'municipal_facility_location')
        self.assertEqual(result['new_connectors_approved'], 0)
        self.assertFalse(result['release_eligible'])

    def test_missing_identity_or_source_context_cannot_become_access_approval(self):
        for mutation in ('missing', 'duplicate', 'certify', 'adopt', 'entry_complete', 'escape'):
            with self.subTest(mutation=mutation), tempfile.TemporaryDirectory() as folder:
                root = Path(folder); target = root/BATCH
                shutil.copytree(ROOT/BATCH, target)
                native = root/NATIVE.relative_to(ROOT); native.parent.mkdir(parents=True)
                native.write_bytes(NATIVE.read_bytes())
                path = target/'manifest.json'; doc = json.loads(path.read_text())
                if mutation == 'missing': doc['records'].pop()
                elif mutation == 'duplicate': doc['records'].append(doc['records'][0])
                elif mutation == 'certify': doc['access_verified'] = True
                elif mutation == 'adopt': doc['records'][0]['anchor_adopted'] = True
                elif mutation == 'entry_complete': doc['records'][0]['entry_review_status'] = 'verified'
                else: doc['records'][0]['source_path'] = str(NATIVE)
                path.write_text(json.dumps(doc))
                with self.assertRaises(ValueError): check(path, root)
