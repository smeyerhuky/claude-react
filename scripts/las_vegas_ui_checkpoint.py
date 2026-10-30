"""Audit the frozen union of the independent 33-source and Las Vegas reports."""
import argparse
import copy
import hashlib
import json
from pathlib import Path

from las_vegas_checkpoint import ROOT
from las_vegas_probe_checkpoint import project as project_probe
from las_vegas_probe_reference import REFERENCE as PARENT, verify
from metro_scenario_checkpoint import FLAGS, require

REFERENCE = ROOT / 'docs/research/census-33-source-checkpoint'
SCENARIO = 'census-eight-state-33-source-19-sample-v1'


def digest(raw):
    return hashlib.sha256(raw).hexdigest()


def project(parent, probe):
    retained, old, model = verify(PARENT / 'retained33-source-report.json')
    require(parent == retained, 'Exact independent parent report required')
    extra = project_probe(probe, parent)
    require(set(old['cases']).isdisjoint(extra['cases']), 'Additional sample overlaps inherited cases')
    require(set(old['probe_coordinates_lonlat']).isdisjoint(extra['probe_coordinates_lonlat']),
            'Additional sample overlaps inherited probes')
    result = copy.deepcopy(old)
    result.update(schema='census-33-source-19-sample-regression-v1', scenario_id=SCENARIO,
                  solver_policy='audited-parent-and-protected-probe-union-v1',
                  graph_model_sha256=model, **{flag: False for flag in FLAGS})
    result['cases'].update(extra['cases'])
    result['probe_coordinates_lonlat'].update(extra['probe_coordinates_lonlat'])
    result['finite_queries'] += extra['finite_queries']
    result['unreachable_queries'] += extra['unreachable_queries']
    require((len(result['sources']), len(result['probe_coordinates_lonlat']), len(result['cases']),
             result['finite_queries'], result['unreachable_queries']) == (33, 19, 76, 2356, 152),
            'Complete 2508-cost research inventory required')
    result['report_sha256'] = dict(parent=digest((PARENT / 'retained33-source-report.json').read_bytes()),
                                  probe=digest(json.dumps(probe, sort_keys=True, separators=(',', ':')).encode()))
    return result


def check_frozen(root=REFERENCE):
    root = Path(root)
    manifest = json.loads((root / 'manifest.json').read_text())
    require(manifest['schema'] == 'census-33-source-19-sample-manifest-v1'
            and manifest['scenario_id'] == SCENARIO and all(manifest.get(f) is False for f in FLAGS),
            'Research-only 19-sample manifest required')
    baseline = (root / 'baseline.json').read_bytes()
    probe = (root / 'probe-report.json').read_bytes()
    require(digest(baseline) == manifest['baseline_sha256'], 'Frozen 19-sample checkpoint bytes changed')
    require(digest(probe) == manifest['probe_report_sha256'], 'Independent probe report bytes changed')
    parent = (PARENT / 'retained33-source-report.json').read_bytes()
    require(digest(parent) == manifest['parent_report_sha256'], 'Independent parent report bytes changed')
    actual = project(json.loads(parent), json.loads(probe))
    require(json.loads(baseline) == actual, 'Frozen costs differ from independently audited native reports')
    return actual


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check-frozen', action='store_true', required=True)
    parser.parse_args()
    data = check_frozen()
    print(json.dumps(dict(sources=33, samples=19, costs=2508, finite=data['finite_queries'],
                         modeled_nodata=data['unreachable_queries'], access_certified=False), indent=2))
