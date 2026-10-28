"""Separate graph-start sensitivity experiment, not pickup/anchor approval."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import resource
import time

from scipy.sparse.csgraph import dijkstra
from colorado_adjacent_source_interfaces import HighwayReader, source_metadata
from colorado_exterior_parent_competition import SourceScan
from colorado_sparse_parent_oracle import trace_path
from denver_anchor_evidence import DEFAULT_ROOT, audit, load_bundle
from metro_scenario_checkpoint import REFERENCE as CENSUS_REFERENCE, load_reference
from road_partition_oracle import validate
from road_primitive_sparse import PrimitiveSparseBuilder

PROBE_CBSAS = ('14500', '17820', '19740', '22660', '39380')
SCENARIO = 'denver-wynkoop-17th-through-road-hypothesis-v1'


def solve(graph, scenarios, probes):
    validate(graph)
    if len(scenarios) != 2 or len(probes) != 5:
        raise ValueError('Exactly two scenarios and five fixed probes required')
    if (len({s['scenario_id'] for s in scenarios}) != 2 or
            len({p['node'] for p in probes}) != 5 or len({p['cbsa'] for p in probes}) != 5):
        raise ValueError('Distinct fixed scenarios and probes required')
    for record in [*scenarios, *probes]:
        node = record['node']
        if type(node) is not int or node <= 0 or node not in graph.node_index:
            raise ValueError('Required scenario endpoint missing; never drop or auto-snap')
        i = graph.node_index[node]
        if record['node_lonlat'] != [float(graph.longitude[i]), float(graph.latitude[i])]:
            raise ValueError('Endpoint coordinates disagree with graph')
    cases = []
    for orientation in ('metro-to-location', 'location-to-metro'):
        for metric in ('length', 'travel_time'):
            matrix = getattr(graph, metric)
            if orientation == 'location-to-metro':
                matrix = matrix.T.tocsr()
            for scenario in scenarios:
                start = graph.node_index[scenario['node']]
                labels, predecessors = dijkstra(matrix, directed=True, indices=start, return_predecessors=True)
                for probe in probes:
                    target = graph.node_index[probe['node']]
                    value = float(labels[target])
                    row = {'scenario_id': scenario['scenario_id'], 'probe_cbsa': probe['cbsa'],
                           'probe_node': probe['node'], 'orientation': orientation, 'metric': metric,
                           'graph_only_cost': None, 'exact_stored_path_cost': None,
                           'actual_directed_path_sha256': None, 'path_nodes': None}
                    if math.isfinite(value):
                        path, exact = trace_path(matrix, predecessors, start, target)
                        if not math.isclose(value, float(exact), abs_tol=.002, rel_tol=1e-9):
                            raise ValueError('Directed replay disagrees with solver')
                        actual = path if orientation == 'metro-to-location' else path[::-1]
                        ids = [int(graph.osm_ids[i]) for i in actual]
                        row.update(graph_only_cost=value,
                                   exact_stored_path_cost=[str(exact.numerator), str(exact.denominator)],
                                   actual_directed_path_sha256=hashlib.sha256(json.dumps(ids,separators=(',', ':')).encode()).hexdigest(),
                                   path_nodes=len(path))
                    cases.append(row)
                print('[waypoint] completed', orientation, metric, scenario['scenario_id'], flush=True)
    return cases


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    began = time.monotonic()
    manifest, evidence = load_bundle(DEFAULT_ROOT)
    reference = audit(evidence)
    expected = manifest['osm_source']
    actual = source_metadata(args.osm)
    if actual['sha256'] != expected['sha256'] or actual['size_bytes'] != expected['size_bytes']:
        raise ValueError('Exact dated Colorado input required')
    baseline = load_reference()
    sources = {s['cbsa']: s for s in baseline['sources']}
    old = sources['19740']
    scenarios = [
        {'scenario_id': 'preserved-census-denver-road-lead-v1', 'cbsa': '19740',
         'node': old['node'], 'node_lonlat': old['node_lonlat'],
         'native_census_origin_lonlat': old['native_origin_lonlat'], 'access_verified': False},
        {'scenario_id': SCENARIO, 'cbsa': '19740', 'node': reference['osm_node'],
         'node_lonlat': reference['osm_reference_lonlat'],
         'municipal_reference_lonlat': reference['municipal_reference_lonlat'],
         'reference_displacement_m': reference['reference_displacement_m'],
         'purpose': 'Hypothetical through-road graph-start waypoint, not station pickup/parking/entry approval.',
         'access_verified': False}]
    probes = [{'cbsa': c, 'node': sources[c]['node'], 'node_lonlat': sources[c]['node_lonlat']} for c in PROBE_CBSAS]
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    HighwayReader(SourceScan(builder)).apply_file(str(args.osm), locations=True, idx='sparse_mem_array')
    graph = builder.finish()
    print('[waypoint] graph', graph.report, flush=True)
    cases = solve(graph, scenarios, probes)
    report = {'schema': 'denver-waypoint-hypothesis-v1', 'source_provenance': actual,
              'scenario_id': SCENARIO, 'scenarios': scenarios, 'probes': probes,
              'cases': cases, 'graph': graph.report, 'metric_units': {'length':'meters', 'travel_time':'seconds'},
              'census_checkpoint_sha256': hashlib.sha256((CENSUS_REFERENCE/'baseline.json').read_bytes()).hexdigest(),
              'evidence_manifest_sha256': hashlib.sha256((DEFAULT_ROOT/'manifest.json').read_bytes()).hexdigest(),
              'cases_computed': len(cases), 'finite_queries_replayed': sum(c['graph_only_cost'] is not None for c in cases),
              'elapsed_seconds': time.monotonic()-began,
              'peak_process_rss_kib': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
              'access_verified': False, 'release_eligible': False, 'anchor_adopted': False,
              'connector_costs_included': False, 'road_coverage_certified': False,
              'warning': 'Colorado-only graph-start sensitivity; no certified curb access, off-road connector, global competitor winner, exterior completeness or geographic regions. Census five-state baseline remains separate and unchanged.'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, indent=2, sort_keys=True)+'\n')
    print(json.dumps({k:report[k] for k in ('cases_computed','finite_queries_replayed','release_eligible')}))


if __name__ == '__main__':
    main()
