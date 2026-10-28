#!/usr/bin/env python3
"""Necessary raw-node resource preflight; never a full graph/access audit."""
import argparse
import json
from pathlib import Path

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_raw_boundary_interfaces import supported

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/oklahoma-preflight-reference.json'
SAFETY = ('release_eligible', 'access_certified', 'road_coverage_certified',
          'complete_global_competition', 'parent_exterior_coverage_certified', 'datum_alignment_verified')


class LimitReached(Exception):
    pass


class BoundedNodeUnion:
    def __init__(self, limit):
        if type(limit) is not int or not 1 <= limit <= 15000000:
            raise ValueError('Bounded integer node limit required')
        self.limit, self.nodes, self.witness = limit, set(), None

    def add(self, way, tags, points):
        if self.witness is not None:
            raise ValueError('Cannot resume a stopped node preflight')
        if not supported(tags):
            return
        for node, x, y in points:
            self.nodes.add(node)
            if len(self.nodes) > self.limit:
                self.witness = {'osm_way_id': way, 'osm_node_id': node, 'lonlat': [x, y]}
                raise LimitReached()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--parent-osm', type=Path, nargs='+', required=True)
    p.add_argument('--output', type=Path, required=True)
    args = p.parse_args()
    expected = json.loads(REFERENCE.read_text())
    if any(expected.get(flag) is not False for flag in SAFETY) or expected['applied_source_exclusions']:
        raise ValueError('Research-only preflight without exclusions required')
    sources = [source_metadata(p) for p in args.parent_osm]
    validate_sources(sources)
    if sources != expected['source_provenance'] or len(sources) != 5:
        raise ValueError('Exact ordered five-state source bytes required')
    counter = BoundedNodeUnion(expected['node_limit'])
    counts, stopped = [], False
    for index, path in enumerate(args.parent_osm):
        try:
            HighwayReader(counter).apply_file(str(path), locations=True, idx='sparse_mem_array')
        except LimitReached:
            if index != 4:
                raise ValueError('Previously verified prefix exceeded the limit')
            stopped = True
            break
        counts.append({'source': path.name, 'union_modeled_node_ids': len(counter.nodes)})
        print(json.dumps(counts[-1]), flush=True)
        if index < 4 and counts[-1] != expected['completed_prefix_counts'][index]:
            raise ValueError('Previously verified prefix node inventory changed')
    result = dict(expected, completed_prefix_counts=counts, source_scan_complete=not stopped,
                  union_node_count_lower_bound=len(counter.nodes), first_limit_exceeding_witness=counter.witness)
    if result != expected:
        raise ValueError('Exact bounded preflight result did not reproduce')
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+'\n')
    print('Reproduced necessary resource failure; no graph limit raised or coverage certified')


if __name__ == '__main__':
    main()
