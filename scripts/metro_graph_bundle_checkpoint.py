"""Bind the retained 33-origin checkpoint to eight OSM inputs without approving it."""
import argparse
import json
from pathlib import Path
from las_vegas_ui_checkpoint import check_frozen, REFERENCE
from metro_graph_bundle_contract import (ROOT, SCHEMA, FALSE_FLAGS, sha256, canonical,
                                        verify_expected, verify_retained_inputs, bind_query, require)

OUTPUT = ROOT / 'docs/research/metro-graph-bundle-input-contract'
POLICY = Path('docs/research/las-vegas-probe-extension/retained33-manifest.json')


def build():
    baseline = check_frozen()
    policy = json.loads((ROOT / POLICY).read_text())
    ledger = ROOT / 'scripts/colorado_reviewed_connectors.json'
    require(json.loads(ledger.read_text())['approved_evidence'] == [],
            'Approval ledger changed; independently review and version this research checkpoint')
    paths = [REFERENCE / 'baseline.json', REFERENCE / 'manifest.json', ROOT / POLICY,
             ROOT / 'docs/research/utah-parent-reference/domains.json']
    bundle = dict(schema=SCHEMA, research_only=True,
                  osm_sources=sorted(baseline['source_provenance'], key=lambda source: source['name']),
                  bindings={key: baseline[key] for key in
                            ('graph_model_sha256', 'domains_sha256', 'query_endpoint_set_sha256')},
                  historical_scenario=dict(scenario_id=baseline['scenario_id'],
                                           fixed_reference_scenario_applied=False,
                                           fixed_reference_scenario_sha256=None),
                  retained_inputs={str(path.relative_to(ROOT)): sha256(path.read_bytes()) for path in paths},
                  **{key: False for key in FALSE_FLAGS})
    bundle['bindings']['native_origin_records_sha256'] = sha256(canonical(baseline['sources']))
    bundle['bindings']['retained_graph_policy_sha256'] = sha256(canonical({key: policy[key] for key in
        ('graph_source_sha256', 'graph_dependency_versions')}))
    expected = sha256(canonical(bundle))
    verified = verify_expected(bundle, expected)
    retained = verify_retained_inputs(bundle)
    contexts = [bind_query(bundle, expected_bundle_sha256=expected, bindings=bundle['bindings'],
                           scenario_id=baseline['scenario_id'], metric=metric, direction=direction)
                for metric in ('length', 'travel_time')
                for direction in ('metro-to-location', 'location-to-metro')]
    report = dict(schema='metro-graph-bundle-input-checkpoint-v1', bundle_sha256=expected,
                  declared_input_check=verified, retained_input_check=retained, query_contexts=contexts,
                  native_metro_origins=len(baseline['sources']), sample_nodes=len(baseline['probe_coordinates_lonlat']),
                  costs=baseline['finite_queries'] + baseline['unreachable_queries'],
                  finite_costs=baseline['finite_queries'], modeled_nodata_costs=baseline['unreachable_queries'],
                  source_bytes_verified=False, source_header_replayed=False, graph_rebuilt=False,
                  anchor_policy='historical-native-Census-road-leads-without-connectors',
                  fixed_reference_scenario_applied=False,
                  implementation_sha256={str(path.relative_to(ROOT)): sha256(path.read_bytes()) for path in
                      [ROOT / 'scripts/metro_graph_bundle_contract.py', Path(__file__).resolve(), ledger]},
                  **{key: False for key in FALSE_FLAGS},
                  warning='Input identity accounting only. Eight OSM files are distinct from 33 metro origins. '
                          'Metadata and retained hashes do not replay original PBF headers, rebuild the graph, '
                          'certify source synchronization, adopt anchors or verify current legal/physical access. '
                          'The fixed-departure scenario is not applied to these historical costs. No production '
                          'loader or approval-ledger integration is installed. #137, #138 and #139 remain open.')
    require((verified['osm_input_files'], report['native_metro_origins'], report['sample_nodes'], report['costs'],
             report['finite_costs'], report['modeled_nodata_costs']) == (8, 33, 19, 2508, 2356, 152),
            'Exact retained historical checkpoint accounting required')
    return bundle, report


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    bundle, report = build()
    for name, value in [('bundle.json', bundle), ('report.json', report)]:
        path = OUTPUT / name
        if args.write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(value, indent=2, sort_keys=True) + '\n')
        else:
            require(json.loads(path.read_text()) == value, 'Frozen graph bundle checkpoint differs: ' + name)
    print(json.dumps({key: report[key] for key in ('bundle_sha256', 'native_metro_origins', 'sample_nodes',
                     'costs', 'finite_costs', 'modeled_nodata_costs', 'source_bytes_verified', 'release_eligible')}, indent=2))
