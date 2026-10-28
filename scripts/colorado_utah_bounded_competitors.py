#!/usr/bin/env python3
"""Add three unapproved Utah competitors in bounded same-graph experiments."""
import argparse
import copy
import json
from pathlib import Path
import resource
import time

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_exterior_parent_competition import SourceScan, compare_exterior, same_cost
from colorado_expanded_parent_competition import FLAGS, winners
from colorado_metro_winners import read_metros
from colorado_neighbor_metro_competition import validate_inventory
from colorado_utah_exterior_competition import digest
from road_primitive_sparse import PrimitiveSparseBuilder

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/utah-batch-reference/manifest.json'
DOMAINS = ROOT/'docs/research/utah-parent-reference/domains.json'
ADDITIONS = ['30860', '36260', '41620']
SAFETY = (*FLAGS, 'parent_exterior_coverage_certified', 'datum_alignment_verified')


def case_map(report):
    rows = report['comparisons']
    cases = {(r['orientation'], r['metric'], r['probe']): r for r in rows}
    expected = {(o, m, p) for o in ('metro-to-location', 'location-to-metro')
                for m in ('length', 'travel_time') for p in report['probe_coordinates_lonlat']}
    if len(cases) != len(rows) or set(cases) != expected:
        raise ValueError('Complete unique directed metric/probe cases required')
    return cases


def combine_batches(baseline, batches, additions):
    """Union source labels only when every batch uses the identical graph/scenario."""
    old = {s['cbsa']: s for s in baseline['sources']}
    ids = baseline['source_qualifying_cbsa_ids']
    if (not 1 <= len(batches) == len(additions) <= 3 or len(set(additions)) != len(additions)
            or len(old) != len(baseline['sources']) or not 1 <= len(old) <= 15
            or set(additions) & set(old) or not set(additions) <= set(ids)
            or len(ids) != len(set(ids))):
        raise ValueError('Distinct bounded additions and complete baseline required')
    if any(baseline.get(f) is not False for f in SAFETY) or baseline['applied_source_exclusions']:
        raise ValueError('Research-only baseline without exclusions required')
    refs = case_map(baseline)
    cases = {key: {'probe': key[2], 'metric': key[1], 'orientation': key[0], 'source_costs': []}
             for key in refs}
    sources = dict(old)
    repeated = {}
    for batch, added in zip(batches, additions):
        if (any(batch.get(f) is not False for f in SAFETY)
                or batch['applied_source_exclusions'] != []
                or batch['primitive_parent_graph'] != baseline['primitive_parent_graph']
                or batch['source_qualifying_cbsa_ids'] != ids
                or batch['probe_coordinates_lonlat'] != baseline['probe_coordinates_lonlat']
                or batch['metric_units'] != baseline['metric_units']
                or batch['improved_original_source_cost_cases'] != 0):
            raise ValueError('Identical graph, scenario and research-only flags required')
        cut = batch['weighted_prefix_interface']
        if (cut['prefix_directed_pairs_preserved'] != baseline['primitive_parent_graph']['unique_directed_pairs']
                or cut['all_prefix_modeled_paths_preserved_with_nonincreased_cost'] is not True
                or any(cut[k] for k in ('inbound_directed_pairs', 'outbound_directed_pairs', 'weighted_interface_node_count'))
                or cut['weighted_interface_nodes'] or any(cut['cheaper_prefix_arc_counts'].values())):
            raise ValueError('A source-only batch must not change the graph or cut')
        selected = {s['cbsa']: s for s in batch['sources']}
        if (len(selected) != len(batch['sources']) or set(selected) != set(old) | {added}
                or len(selected) > 16 or any(selected[k] != v for k, v in old.items())
                or any(s['access_verified'] is not False or s['connector_costs_included'] is not False
                       for s in selected.values())):
            raise ValueError('Preserved leads and exactly one unapproved addition required')
        if batch['diagnostic_source_cbsa_ids'] != sorted(selected):
            raise ValueError('Batch source inventory mismatch')
        if batch['unrepresented_source_qualifying_cbsa_ids'] != sorted(set(ids)-set(selected)):
            raise ValueError('No omitted competitor may be excluded')
        rows = case_map(batch)
        if set(rows) != set(refs):
            raise ValueError('Batch probes differ')
        finite = 0
        for key, row in rows.items():
            options = {o['cbsa']: o for o in row['source_costs']}
            prior = {o['cbsa']: o for o in refs[key]['source_costs']}
            if (len(options) != len(row['source_costs']) or set(options) != set(selected)
                    or len(prior) != len(refs[key]['source_costs']) or set(prior) != set(old)):
                raise ValueError('Complete unique per-source costs required')
            for cbsa, option in options.items():
                cost = option['graph_only_cost']
                if not same_cost(cost, cost):
                    raise ValueError('Invalid source cost')
                finite += cost is not None
                if cbsa in old:
                    if (not same_cost(cost, prior[cbsa]['graph_only_cost'])
                            or not same_cost(option['prefix_cost'], cost)):
                        raise ValueError('Same-graph baseline costs changed')
                    if (key, cbsa) in repeated:
                        if repeated[key, cbsa] != option:
                            raise ValueError('Repeated baseline result differs between batches')
                        continue
                    repeated[key, cbsa] = copy.deepcopy(option)
                elif option['prefix_cost'] is not None:
                    raise ValueError('New source prefix cost was not computed')
                entry = copy.deepcopy(option)
                entry['prefix_cost_status'] = ('not_computed_for_previously_unrepresented_source'
                    if cbsa not in old else 'unreachable_in_prefix_graph' if cost is None else 'computed_in_prefix_graph')
                cases[key]['source_costs'].append(entry)
        if (batch['source_costs_computed'] != len(refs)*len(selected)
                or batch['original_prefix_costs_reproduced'] != len(refs)*len(old)
                or batch['primitive_paths_replayed'] != finite):
            raise ValueError('Batch computation/replay accounting mismatch')
        sources[added] = selected[added]
    for key, row in cases.items():
        row['source_costs'].sort(key=lambda o: o['cbsa'])
        tied, best = winners(row['source_costs'], 'graph_only_cost')
        previous, _ = winners(refs[key]['source_costs'], 'graph_only_cost')
        row.update(prefix_subset_winner_ids=previous, exterior_subset_winner_ids=tied,
                   best_graph_only_cost=best, subset_winner_changed=tied != previous)
    return {**{f: False for f in SAFETY}, 'applied_source_exclusions': [],
        'source_qualifying_cbsa_ids': ids, 'diagnostic_source_cbsa_ids': sorted(sources),
        'unrepresented_source_qualifying_cbsa_ids': sorted(set(ids)-set(sources)),
        'sources': [sources[k] for k in sorted(sources)],
        'primitive_parent_graph': baseline['primitive_parent_graph'],
        'probe_coordinates_lonlat': baseline['probe_coordinates_lonlat'],
        'metric_units': baseline['metric_units'], 'comparisons': list(cases.values()),
        'source_costs_computed': len(cases)*len(sources),
        'finite_unique_source_costs': sum(o['graph_only_cost'] is not None for r in cases.values() for o in r['source_costs']),
        'batch_source_counts': [len(b['sources']) for b in batches],
        'baseline_cost_reproduction_checks': sum(b['original_prefix_costs_reproduced'] for b in batches),
        'source_cost_evaluations_including_repeated_baseline': sum(b['source_costs_computed'] for b in batches),
        'primitive_path_replays_including_repeated_baseline': sum(b['primitive_paths_replayed'] for b in batches),
        'changed_subset_winner_cases': sum(r['subset_winner_changed'] for r in cases.values()),
        'warning': 'Same supplied graph; bounded batch union of unapproved sources. No connectors, turns/grade, geographic or exterior closure certification. Path replay is not independent ground truth.'}


def load_reference():
    m = json.loads(REFERENCE.read_text())
    path = REFERENCE.parent/'baseline.json'
    if (m['schema'] != 'utah-batch-reference-v1' or m['release_eligible'] is not False
            or digest(path) != m['baseline_sha256'] or digest(DOMAINS) != m['domains_sha256']):
        raise ValueError('Exact checksum-bound reference required')
    b = json.loads(path.read_text()); d = json.loads(DOMAINS.read_text())
    if (b['source_provenance'] != m['source_provenance'] or b['domains_sha256'] != m['domains_sha256']
            or len(b['sources']) != 15 or len(case_map(b)) != 60 or b['source_costs_computed'] != 900
            or any(b.get(f) is not False for f in SAFETY) or b['applied_source_exclusions']):
        raise ValueError('Complete passed 15-source reference required')
    validate_sources(m['source_provenance'])
    return m, d, b


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--metros', type=Path, required=True)
    p.add_argument('--parent-osm', type=Path, nargs='+', required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    m, domains, baseline = load_reference()
    if digest(args.metros) != domains['source_provenance']['metros_csv_sha256']:
        raise ValueError('Exact Census CSV required')
    validate_inventory(domains, read_metros(args.metros), set(ADDITIONS) | {s['cbsa'] for s in baseline['sources']})
    metadata = [source_metadata(path) for path in args.parent_osm]
    if metadata != m['source_provenance']:
        raise ValueError('Exact ordered four-state sources required')
    began = time.monotonic()
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    for path in args.parent_osm:
        scan = SourceScan(builder)
        HighwayReader(scan).apply_file(str(path), locations=True, idx='sparse_mem_array')
        del scan
        print(f'[bounded Utah] {path.name}: {len(builder.ids)} nodes /{len(builder.u)} arcs', flush=True)
    graph = builder.finish(); del builder
    batches = []
    for cbsa in ADDITIONS:
        batches.append(compare_exterior(graph, graph, domains, baseline, [cbsa]))
        print(f'[bounded Utah] completed 15+1 source batch {cbsa}', flush=True)
    result = combine_batches(baseline, batches, ADDITIONS)
    result.update(source_provenance=metadata, baseline_report_sha256=m['baseline_sha256'],
        domains_sha256=m['domains_sha256'], reference_manifest_sha256=digest(REFERENCE), upstream_ci=m['upstream_ci'],
        elapsed_seconds=time.monotonic()-began, peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+'\n')
    print(json.dumps({k: result[k] for k in ('source_costs_computed', 'baseline_cost_reproduction_checks',
        'primitive_path_replays_including_repeated_baseline', 'changed_subset_winner_cases', 'release_eligible')}))


if __name__ == '__main__':
    main()
