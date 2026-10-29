import json
from pathlib import Path
import shutil
import tempfile
import unittest
from denver_rtd_anchor_evidence import DEFAULT, audit


class RTDAnchorTests(unittest.TestCase):
    def test_retained_screen_is_reproducible_and_never_approves(self):
        report = audit()
        self.assertEqual(report, json.loads((DEFAULT / 'report.json').read_text()))
        self.assertEqual(report['blake_operator_auto_spaces'], 200)
        self.assertFalse(report['access_verified'])
        self.assertFalse(report['displacement_is_connector_length'])
        self.assertIsNone(report['connector_cost_seconds'])

    def test_changed_operator_response_fails_closed(self):
        with tempfile.TemporaryDirectory() as d:
            dst = Path(d) / 'bundle'
            shutil.copytree(DEFAULT, dst)
            p = dst / 'rtd-denver-parking.json'
            p.write_text(p.read_text().replace('"AUTOS":200', '"AUTOS":0'))
            with self.assertRaises(ValueError):
                audit(dst)
