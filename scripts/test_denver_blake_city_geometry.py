import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from denver_blake_city_geometry import BUNDLE, audit


class CityGeometryTests(unittest.TestCase):
    def test_replay_retains_historical_limits(self):
        report = audit()
        self.assertEqual(report, json.loads((BUNDLE / 'report.json').read_text()))
        self.assertEqual(report['parking_intersections'][0]['city_objectid'], 41640)
        self.assertFalse(report['parking_intersections'][0]['covers_road_junction'])
        self.assertFalse(report['access_verified'])
        self.assertFalse(report['same_grade_verified'])

    def test_tamper_is_rejected(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / 'bundle'
            shutil.copytree(BUNDLE, target)
            (target / 'lots.json').write_text('{}')
            with self.assertRaises(ValueError):
                audit(target)

    def test_empty_coverage_cannot_become_access_proof(self):
        with tempfile.TemporaryDirectory() as d:
            target = Path(d) / 'bundle'
            shutil.copytree(BUNDLE, target)
            path = target / 'lots.json'
            data = json.loads(path.read_text())
            data['features'] = []
            path.write_text(json.dumps(data))
            manifest_path = target / 'manifest.json'
            manifest = json.loads(manifest_path.read_text())
            record = next(r for r in manifest['files'] if r['name'] == 'lots')
            record.update(sha256=hashlib.sha256(path.read_bytes()).hexdigest(), size_bytes=path.stat().st_size)
            manifest_path.write_text(json.dumps(manifest))
            report = audit(target)
            self.assertEqual(report['parking_intersections'], [])
            self.assertFalse(report['access_verified'])
