import json
from pathlib import Path
import shutil
import tempfile
import unittest
from tucson_parking_publication import audit, REFERENCE


class TucsonParkingPublicationTests(unittest.TestCase):
    def test_retained_operator_use_context_does_not_approve_a_connector(self):
        result = audit()
        self.assertEqual(result['published_entry_exit_street'], 'Scott Avenue')
        self.assertFalse(result['entry_path_verified']); self.assertFalse(result['anchor_adopted'])
        self.assertFalse(result['access_verified']); self.assertFalse(result['release_eligible'])

    def test_shifted_event_window_or_adoption_claim_is_rejected(self):
        for field, value in [('closure_event', dict(start_local='2026-10-30T00:00:00', end_local='2026-11-01T03:00:00', map_export_date='2026-10-29')), ('access_verified', True)]:
            with self.subTest(field=field), tempfile.TemporaryDirectory() as folder:
                root = Path(folder)/'evidence'; shutil.copytree(REFERENCE, root)
                path = root/'manifest.json'; manifest = json.loads(path.read_text()); manifest[field] = value
                path.write_text(json.dumps(manifest))
                with self.assertRaises(ValueError): audit(root)

    def test_altered_closure_pdf_cannot_keep_the_original_identity(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)/'evidence'; shutil.copytree(REFERENCE, root)
            path = root/'congress-closure-20261029.pdf'; path.write_bytes(path.read_bytes()+b'changed')
            with self.assertRaisesRegex(ValueError, 'bytes changed'): audit(root)


if __name__ == '__main__': unittest.main()
