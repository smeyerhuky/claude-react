import copy
import json
from pathlib import Path
import tempfile
import unittest

from metro_scenario_checkpoint import FLAGS, REFERENCE, check, load_reference


class ScenarioCheckpointTests(unittest.TestCase):
    def setUp(self):
        baseline = load_reference()
        self.report = {k: copy.deepcopy(baseline[k]) for k in (
            'source_provenance', 'domains_sha256', 'metric_units', 'sources',
            'source_qualifying_cbsa_ids', 'unrepresented_source_qualifying_cbsa_ids',
            'probe_coordinates_lonlat')}
        self.report.update({flag: False for flag in FLAGS})
        self.report.update(diagnostic_source_cbsa_ids=[s['cbsa'] for s in baseline['sources']],
                           applied_source_exclusions=[], source_costs_computed=1872,
                           finite_queries_replayed=1800, comparisons=[])
        for key, costs in baseline['cases'].items():
            metric, orientation, probe = key.split('|')
            self.report['comparisons'].append({'metric': metric, 'orientation': orientation, 'probe': probe,
                'source_costs': [dict(cbsa=cbsa, **record) for cbsa, record in costs.items()]})

    def test_all_costs_and_unreachable_cases_retained(self):
        result = check(self.report)
        self.assertEqual(result['costs_preserved'], 1872)
        self.assertEqual(result['unreachable_queries'], 72)
        self.assertFalse(result['release_eligible'])

    def test_origin_node_graph_units_and_eligibility_changes_fail(self):
        for mutation in ('origin', 'node', 'graph', 'units', 'eligible'):
            report = copy.deepcopy(self.report)
            if mutation == 'origin':
                report['sources'][0]['native_origin_lonlat'][0] += .1
            elif mutation == 'node':
                report['sources'][0]['node'] += 1
            elif mutation == 'graph':
                report['source_provenance'][0]['sha256'] = '0' * 64
            elif mutation == 'units':
                report['metric_units']['length'] = 'miles'
            else:
                report['unrepresented_source_qualifying_cbsa_ids'].pop()
            with self.assertRaises(ValueError):
                check(report)

    def test_missing_cost_duplicate_case_and_unreachable_zero_substitution_fail(self):
        for mutation in ('missing', 'duplicate', 'zero'):
            report = copy.deepcopy(self.report)
            if mutation == 'missing':
                report['comparisons'][0]['source_costs'].pop()
            elif mutation == 'duplicate':
                report['comparisons'].append(copy.deepcopy(report['comparisons'][0]))
            else:
                cost = next(c for c in report['comparisons'][0]['source_costs'] if c['graph_only_cost'] is None)
                cost.update(graph_only_cost=0., exact_stored_path_cost=['0', '1'])
                report['finite_queries_replayed'] += 1
            with self.assertRaises(ValueError):
                check(report)

    def test_retained_bytes_tampering_fails(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            for name in ('manifest.json', 'baseline.json'):
                (root / name).write_bytes((REFERENCE / name).read_bytes())
            with (root / 'baseline.json').open('a') as stream:
                stream.write(' ')
            with self.assertRaises(ValueError):
                load_reference(root)


if __name__ == '__main__':
    unittest.main()
