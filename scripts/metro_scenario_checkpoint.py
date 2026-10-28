"""Check the frozen Census-origin road-node experiment; never certify access."""
import argparse
from fractions import Fraction
import hashlib
import json
import math
from pathlib import Path

REFERENCE = Path(__file__).resolve().parents[1] / 'docs/research/census-26-source-checkpoint'
FLAGS = ('access_certified', 'complete_global_competition', 'datum_alignment_verified',
         'parent_exterior_coverage_certified', 'release_eligible', 'road_coverage_certified')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def project(report):
    for flag in FLAGS:
        require(report.get(flag) is False, 'Research flag changed: ' + flag)
    sources = report['sources']
    ids = [s['cbsa'] for s in sources]
    require(len(set(ids)) == len(ids), 'Duplicate source identity')
    require(sorted(ids) == sorted(report['diagnostic_source_cbsa_ids']), 'Diagnostic source inventory differs')
    eligible = report['source_qualifying_cbsa_ids']
    unknown = report['unrepresented_source_qualifying_cbsa_ids']
    require(len(set(eligible)) == len(eligible) and len(set(unknown)) == len(unknown), 'Duplicate inventory identity')
    require(set(ids).isdisjoint(unknown) and set(ids) | set(unknown) == set(eligible), 'Missing competitor accounting')
    require(report['applied_source_exclusions'] == [], 'Source exclusion changed')
    for source in sources:
        require(source['access_verified'] is False and source['connector_costs_included'] is False,
                'Unapproved lead status changed')
    cases = {}
    finite = 0
    for case in report['comparisons']:
        metric, direction, probe = case['metric'], case['orientation'], case['probe']
        require(metric in ('length', 'travel_time') and direction in ('metro-to-location', 'location-to-metro'),
                'Unknown metric/direction')
        key = '|'.join((metric, direction, probe))
        require(key not in cases, 'Duplicate query case')
        costs = {}
        for record in case['source_costs']:
            identity = record['cbsa']
            require(identity not in costs, 'Duplicate source cost')
            cost, exact = record['graph_only_cost'], record['exact_stored_path_cost']
            if cost is None:
                require(exact is None, 'Unreachable result has a path cost')
            else:
                require(isinstance(cost, (int, float)) and not isinstance(cost, bool)
                        and math.isfinite(cost) and cost >= 0, 'Invalid finite cost')
                require(isinstance(exact, list) and len(exact) == 2, 'Missing exact replay cost')
                numerator, denominator = map(int, exact)
                require(denominator > 0 and numerator >= 0, 'Invalid exact replay cost')
                require(math.isclose(float(Fraction(numerator, denominator)), cost, rel_tol=1e-9, abs_tol=.002),
                        'Solver/replay cost disagreement')
                finite += 1
            costs[identity] = {'graph_only_cost': cost, 'exact_stored_path_cost': exact}
        require(set(costs) == set(ids), 'Missing source cost')
        cases[key] = costs
    require(len(cases) * len(ids) == report['source_costs_computed'], 'Computed cost count differs')
    require(finite == report['finite_queries_replayed'], 'Finite replay count differs')
    return {'schema': 'census-26-source-regression-v1',
            'scenario_id': 'census-native-origins-five-state-two-partition-v1',
            'source_provenance': report['source_provenance'],
            'domains_sha256': report['domains_sha256'], 'metric_units': report['metric_units'],
            'sources': sorted(sources, key=lambda s: s['cbsa']),
            'source_qualifying_cbsa_ids': sorted(eligible),
            'unrepresented_source_qualifying_cbsa_ids': sorted(unknown),
            'probe_coordinates_lonlat': report['probe_coordinates_lonlat'], 'cases': cases,
            'finite_queries': finite, 'unreachable_queries': len(cases) * len(ids) - finite,
            'release_eligible': False, 'access_certified': False}


def load_reference(root=REFERENCE):
    root = Path(root)
    manifest = json.loads((root / 'manifest.json').read_text())
    raw = (root / 'baseline.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest() == manifest['baseline_sha256'], 'Checkpoint bytes changed')
    return json.loads(raw)


def check(report, root=REFERENCE):
    expected = load_reference(root)
    actual = project(report)
    require(actual == expected, 'Frozen Census scenario changed; use a separate scenario for new origins or graph inputs')
    return {'scenario_id': actual['scenario_id'], 'sources_preserved': len(actual['sources']),
            'costs_preserved': len(actual['cases']) * len(actual['sources']),
            'finite_queries': actual['finite_queries'], 'unreachable_queries': actual['unreachable_queries'],
            'access_certified': False, 'release_eligible': False}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('report', type=Path)
    args = parser.parse_args()
    print(json.dumps(check(json.loads(args.report.read_text())), indent=2))
