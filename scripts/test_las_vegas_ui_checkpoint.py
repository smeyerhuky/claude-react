import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

from las_vegas_ui_checkpoint import REFERENCE, PARENT, check_frozen, project


class LasVegasUICheckpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.parent = json.loads((PARENT / 'retained33-source-report.json').read_text())
        cls.probe = json.loads((REFERENCE / 'probe-report.json').read_text())

    def test_union_preserves_every_inherited_cost_and_zero_self_identity(self):
        data = check_frozen()
        self.assertEqual((len(data['cases']), data['finite_queries'], data['unreachable_queries']), (76, 2356, 152))
        for case in self.parent['comparisons']:
            key = '|'.join((case['metric'], case['orientation'], case['probe']))
            for row in case['source_costs']:
                self.assertEqual(data['cases'][key][row['cbsa']], {k: row[k] for k in ('graph_only_cost', 'exact_stored_path_cost')})
        node = str(next(s['node'] for s in data['sources'] if s['cbsa'] == '29820'))
        for metric in ('length', 'travel_time'):
            for direction in ('metro-to-location', 'location-to-metro'):
                self.assertEqual(data['cases']['|'.join((metric, direction, node))]['29820']['graph_only_cost'], 0)
        self.assertTrue(all(s['access_verified'] is False and s['connector_costs_included'] is False for s in data['sources']))

    def test_cost_direction_budget_and_approval_tampering_fail_audit(self):
        for mutation in ('missing', 'direction', 'budget', 'approval', 'parent'):
            with self.subTest(mutation=mutation):
                parent, probe = copy.deepcopy(self.parent), copy.deepcopy(self.probe)
                if mutation == 'missing': probe['comparisons'][0]['source_costs'].pop()
                elif mutation == 'direction': probe['oriented_probe_runs'][0]['native_reverse'] = False
                elif mutation == 'budget': probe['oriented_probe_runs'][0]['combined_local_dijkstra_calls'] = 513
                elif mutation == 'approval': probe['sources'][0]['access_verified'] = True
                else: parent['comparisons'][0]['source_costs'][0]['graph_only_cost'] = None
                with self.assertRaises(ValueError): project(parent, probe)

    def test_rehashed_snapshot_still_requires_raw_native_evidence(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('manifest.json', 'baseline.json', 'probe-report.json'):
                (root / name).write_bytes((REFERENCE / name).read_bytes())
            baseline = json.loads((root / 'baseline.json').read_text())
            baseline['finite_queries'] -= 1
            raw = json.dumps(baseline).encode()
            (root / 'baseline.json').write_bytes(raw)
            manifest = json.loads((root / 'manifest.json').read_text())
            manifest['baseline_sha256'] = hashlib.sha256(raw).hexdigest()
            (root / 'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'costs differ'): check_frozen(root)
