#!/usr/bin/env python3
"""Research-only bounded CO/NM/AZ/UT + Oklahoma primitive partition comparison."""
import argparse
import json
from pathlib import Path
import resource
import time

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_exterior_parent_competition import SourceScan, same_cost
from colorado_expanded_parent_competition import nearest_primitive_lead, winners
from colorado_metro_winners import read_metros
from colorado_neighbor_metro_competition import validate_inventory
from colorado_raw_boundary_interfaces import fingerprint
from colorado_utah_exterior_competition import digest
from road_partition_oracle import TwoPartitionOracle
from road_primitive_sparse import PrimitiveSparseBuilder

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/oklahoma-partition-reference/manifest.json'
DOMAINS = ROOT/'docs/research/utah-parent-reference/domains.json'
ADDITIONS = {'29740': 0, '38060': 0, '43420': 0, '46060': 0, '49740': 0,
             '30020': 1, '36420': 1, '46140': 1}
SAFETY = ('release_eligible', 'access_certified', 'road_coverage_certified',
          'complete_global_competition', 'parent_exterior_coverage_certified', 'datum_alignment_verified')


def load_reference():
    m = json.loads(REFERENCE.read_text()); p = REFERENCE.parent/'baseline.json'
    if (m['schema'] != 'oklahoma-two-partition-reference-v1' or m['release_eligible'] is not False
            or digest(p) != m['baseline_sha256'] or digest(DOMAINS) != m['domains_sha256']):
        raise ValueError('Exact checksum-bound18-source reference required')
    baseline = json.loads(p.read_text()); domains = json.loads(DOMAINS.read_text())
    if (len(baseline['sources']) != 18 or baseline['source_costs_computed'] != 1080
            or len(baseline['comparisons']) != 60 or baseline['domains_sha256'] != m['domains_sha256']
            or baseline['source_provenance'] != m['source_provenance'][:4]
            or any(baseline.get(f) is not False for f in SAFETY) or baseline['applied_source_exclusions']):
        raise ValueError('Complete research-only18-source reference required')
    validate_sources(m['source_provenance'])
    return m, domains, baseline


class OverlapScan(SourceScan):
    def __init__(self, builder, other):
        super().__init__(builder)
        self.other, self.shared = other, set()

    def add(self, way, tags, points):
        if way in self.other:
            if self.other[way] != fingerprint(way, tags, points):
                raise ValueError('Cross-shard raw highway fingerprint conflict')
            self.shared.add(way)
        super().add(way, tags, points)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--metros', type=Path, required=True)
    p.add_argument('--parent-osm', type=Path, nargs='+', required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    m, domains, baseline = load_reference()
    if digest(args.metros) != domains['source_provenance']['metros_csv_sha256']:
        raise ValueError('Exact Census input required')
    old = {s['cbsa']: s for s in baseline['sources']}
    selected = set(old) | set(ADDITIONS)
    if len(old) != 18 or set(old) & set(ADDITIONS) or len(selected) != 26:
        raise ValueError('Distinct preserved and additional source identities required')
    validate_inventory(domains, read_metros(args.metros), selected)
    metadata = [source_metadata(path) for path in args.parent_osm]
    if metadata != m['source_provenance']:
        raise ValueError('Exact ordered five-state inputs required')
    began = time.monotonic()
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    scan = SourceScan(builder)
    HighwayReader(scan).apply_file(str(args.parent_osm[-1]), locations=True, idx='sparse_mem_array')
    del scan
    overlap = dict(builder.fingerprints)
    addition = builder.finish(); del builder
    print('[partition] Oklahoma shard', addition.report, flush=True)
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    shared_ways = set()
    for path in args.parent_osm[:-1]:
        scan = OverlapScan(builder, overlap)
        HighwayReader(scan).apply_file(str(path), locations=True, idx='sparse_mem_array')
        shared_ways.update(scan.shared); del scan
        print(f'[partition] prefix {path.name}: {len(builder.ids)} nodes /{len(builder.u)} arcs', flush=True)
    prefix = builder.finish(); del builder, overlap
    if prefix.report != baseline['primitive_parent_graph']:
        raise ValueError('Exact retained prefix graph/model changed')
    records = {r['cbsa']: r for r in domains['domains']}
    sources = []
    for cbsa in sorted(selected):
        point = records[cbsa]['native_representative_lonlat']
        if cbsa in old:
            s = old[cbsa]
            if (s['native_origin_lonlat'] != point or s['access_verified'] is not False
                    or s['connector_costs_included'] is not False or s['node'] not in prefix.node_index):
                raise ValueError('Preserved native source/lead changed')
            i = prefix.node_index[s['node']]
            if s['node_lonlat'] != [float(prefix.longitude[i]), float(prefix.latitude[i])]:
                raise ValueError('Preserved source node geometry changed')
            sources.append(dict(s))
        else:
            shard = ADDITIONS[cbsa]
            sources.append({'cbsa': cbsa, 'native_origin_lonlat': point,
                **nearest_primitive_lead((prefix, addition)[shard], point),
                'lead_policy': 'unapproved-nearest-primitive-vertex-in-declared-shard', 'source_shard': shard,
                'access_verified': False, 'connector_costs_included': False})
    coordinates = dict(baseline['probe_coordinates_lonlat'])
    for node, point in coordinates.items():
        i = prefix.node_index[int(node)]
        if point != [float(prefix.longitude[i]), float(prefix.latitude[i])]:
            raise ValueError('Preserved probe geometry changed')
    destination_leads = [s for s in sources if s['cbsa'] in {'30020', '36420', '46140'}]
    for lead in destination_leads:
        coordinates[str(lead['node'])] = lead['node_lonlat']
    if len(coordinates) != 18 or len({s['node'] for s in sources}) != 26:
        raise ValueError('Distinct bounded raw-node source/destination scenarios required')
    refs = {(r['orientation'], r['metric'], r['probe']): r for r in baseline['comparisons']}
    expected = {(o, metric, n) for o in ('metro-to-location', 'location-to-metro')
                for metric in ('length', 'travel_time') for n in baseline['probe_coordinates_lonlat']}
    if set(refs) != expected or len(refs) != len(baseline['comparisons']):
        raise ValueError('Complete unique original cases required')
    oracle = TwoPartitionOracle(prefix, addition)
    if (oracle.audit['shared_vertices'] != m['expected_shared_vertices']
            or oracle.audit['conceptual_union_nodes'] != m['expected_conceptual_union_nodes']
            or not set(oracle.ports) <= set(m['conservative_raw_port_ids']) or not oracle.ports):
        raise ValueError('Exact bounded interface investigation did not reproduce')
    print('[partition] interface audit', oracle.audit, flush=True)
    cases, runs, checks, improvements, finite = [], [], 0, 0, 0
    for orientation in ('metro-to-location', 'location-to-metro'):
        for metric in ('length', 'travel_time'):
            run = oracle.solve([s['node'] for s in sources], list(map(int, coordinates)), metric,
                               reverse=orientation == 'location-to-metro')
            values = {(r['source'], r['target']): r for r in run['results']}
            for probe in coordinates:
                options = []
                for source in sources:
                    row = values[source['node'], int(probe)]
                    key = (orientation, metric, probe)
                    if source['cbsa'] in old and key in refs:
                        previous = refs[key]['source_costs']
                        if len(previous) != 18 or {r['cbsa'] for r in previous} != set(old):
                            raise ValueError('Incomplete baseline source costs')
                        value = next(r['graph_only_cost'] for r in previous if r['cbsa'] == source['cbsa'])
                        if row['prefix_cost_status'] == 'not_computed_endpoint_outside_prefix' or not same_cost(value, row['prefix_cost']):
                            raise ValueError('Fresh prefix cost disagrees with18-source reference')
                        checks += 1
                        if value is not None and (row['cost'] is None or row['cost'] > value+max(.002, abs(value)*1e-9)):
                            raise ValueError('Partition solver lost a retained modeled route')
                        improvements += row['cost'] is not None and (value is None or row['cost'] < value-max(.002, abs(value)*1e-9))
                    options.append({'cbsa': source['cbsa'], 'graph_only_cost': row['cost'],
                        'prefix_cost': row['prefix_cost'], 'prefix_cost_status': row['prefix_cost_status'],
                        'exact_stored_path_cost': row['exact_stored_path_cost'], 'segments': row['segments']})
                tied, best = winners(options, 'graph_only_cost')
                old_winners = winners(refs[orientation, metric, probe]['source_costs'], 'graph_only_cost')[0] if (orientation, metric, probe) in refs else None
                retained_winners = winners([o for o in options if o['cbsa'] in old], 'graph_only_cost')[0]
                cases.append({'orientation': orientation, 'metric': metric, 'probe': probe,
                    'source_costs': options, 'subset_winner_ids': tied, 'best_graph_only_cost': best,
                    'old_subset_winner_ids': old_winners, 'retained_source_winner_ids': retained_winners,
                    'road_only_winner_changed': None if old_winners is None else retained_winners != old_winners,
                    'added_source_winner_changed': retained_winners != tied})
            finite += run['finite_queries_replayed']
            runs.append({k: v for k, v in run.items() if k != 'results'})
            print('[partition] completed', orientation, metric, run['local_dijkstra_calls'], 'local oracles;', run['finite_queries_replayed'], 'replays', flush=True)
    if checks != 1080:
        raise ValueError('All1080 original prefix costs must reproduce')
    result = {**{f: False for f in SAFETY}, 'applied_source_exclusions': [],
        'source_qualifying_cbsa_ids': domains['source_qualifying_cbsa_ids'],
        'diagnostic_source_cbsa_ids': sorted(selected),
        'unrepresented_source_qualifying_cbsa_ids': sorted(set(domains['source_qualifying_cbsa_ids'])-selected),
        'sources': sources, 'probe_coordinates_lonlat': coordinates,
        'additional_raw_node_destination_leads': destination_leads,
        'source_provenance': metadata, 'baseline_report_sha256': m['baseline_sha256'],
        'reference_manifest_sha256': digest(REFERENCE), 'domains_sha256': m['domains_sha256'],
        'upstream_ci': m['upstream_ci'], 'partition_graphs': [prefix.report, addition.report],
        'shared_raw_highways_fingerprint_verified': len(shared_ways), 'interface_audit': oracle.audit,
        'comparisons': cases, 'source_costs_computed': len(cases)*len(sources),
        'original_prefix_costs_reproduced': checks, 'improved_original_source_cost_cases': improvements,
        'finite_queries_replayed': finite, 'local_oracle_runs': runs,
        'road_only_winner_changes_at_original_probes': sum(c['road_only_winner_changed'] is True for c in cases),
        'added_source_winner_changes_at_original_probes': sum(c['added_source_winner_changed'] and c['old_subset_winner_ids'] is not None for c in cases),
        'metric_units': {'length': 'meters', 'travel_time': 'seconds'},
        'elapsed_seconds': time.monotonic()-began, 'peak_process_rss_kib': resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
        'warning': 'Graph-only26-source subset with unapproved leads and raw road-node destinations, not arbitrary geographic access or Oklahoma geographic coverage. Missing competitors, exterior, connectors/costs, turns/grade, land/water/datum and independent golden evidence remain unresolved.'}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+'\n')
    print(json.dumps({k: result[k] for k in ('source_costs_computed', 'original_prefix_costs_reproduced',
        'finite_queries_replayed', 'improved_original_source_cost_cases', 'road_only_winner_changes_at_original_probes',
        'added_source_winner_changes_at_original_probes', 'release_eligible')}))


if __name__ == '__main__':
    main()
