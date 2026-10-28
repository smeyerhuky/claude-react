import copy
import json
from pathlib import Path
import tempfile
import unittest

from denver_anchor_evidence import DEFAULT_ROOT, audit, load_bundle


class DenverEvidenceTests(unittest.TestCase):
    def setUp(self):
        self.manifest, self.data = load_bundle(DEFAULT_ROOT)

    def test_retained_report_reproduces_without_access_approval(self):
        report = audit(self.data)
        self.assertEqual(report, json.loads((DEFAULT_ROOT / 'report.json').read_text()))
        self.assertAlmostEqual(report['reference_displacement_m'], 1.89684, places=4)
        self.assertFalse(report['access_verified'])
        self.assertEqual(report['sign_records_without_description'], 13)
        self.assertEqual(report['parking_restriction_records_in_larger_query'], 0)

    def test_grade_direction_and_coded_value_changes_fail(self):
        for mutation in ('grade', 'direction', 'meaning'):
            data = copy.deepcopy(self.data)
            if mutation == 'meaning':
                field = next(f for f in data['streets-layer.json']['fields'] if f['name'] == 'ONEWAY')
                field['domain']['codedValues'][0]['name'] = 'Unknown'
            else:
                feature = next(f for f in data['streets.json']['features'] if f['attributes']['OBJECTID'] == 1002)
                feature['attributes']['F_ZLEV' if mutation == 'grade' else 'ONEWAY'] = 1
            with self.assertRaises(ValueError):
                audit(data)

    def test_nearby_disconnected_road_is_not_shared_junction(self):
        data = copy.deepcopy(self.data)
        for n in data['osm-extract.json']['ways'][0]['nodes']:
            if n[0] == 3033992180:
                n[0] = 123
        with self.assertRaises(ValueError):
            audit(data)

    def test_hash_tampering_and_query_truncation_fail(self):
        for mutation in ('hash', 'truncated', 'error'):
            with tempfile.TemporaryDirectory() as directory:
                root = Path(directory)
                manifest = copy.deepcopy(self.manifest)
                for name in manifest['files']:
                    (root / name).write_bytes((DEFAULT_ROOT / name).read_bytes())
                if mutation == 'hash':
                    (root / 'signs.json').write_text('{}')
                else:
                    import hashlib
                    data = json.loads((root / 'signs.json').read_text())
                    data['exceededTransferLimit' if mutation == 'truncated' else 'error'] = True
                    raw = json.dumps(data).encode()
                    (root / 'signs.json').write_bytes(raw)
                    manifest['files']['signs.json'].update(size_bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
                (root / 'manifest.json').write_text(json.dumps(manifest))
                with self.assertRaises(ValueError):
                    load_bundle(root)


if __name__ == '__main__':
    unittest.main()
