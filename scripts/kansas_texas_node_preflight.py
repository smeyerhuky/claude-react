"""Reproduce a bounded neighbor-shard resource counterexample; no graph approval."""
import argparse
import json
from pathlib import Path

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_node_union_preflight import BoundedNodeUnion, LimitReached

REFERENCE=Path(__file__).resolve().parents[1]/'docs/research/kansas-texas-source-preflight/node-preflight.json'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--osm',type=Path,nargs=3,required=True);p.add_argument('--output',type=Path,required=True)
    args=p.parse_args();expected=json.loads(REFERENCE.read_text())
    sources=[source_metadata(path) for path in args.osm];validate_sources(sources)
    if sources!=expected['source_provenance'] or expected['node_limit']!=15000000:
        raise ValueError('Exact complete ordered sources and unchanged cap required')
    if any(expected[f] is not False for f in ('release_eligible','access_certified','road_coverage_certified')):
        raise ValueError('Research-only preflight required')
    scan=BoundedNodeUnion(expected['node_limit']);counts=[];stopped=None
    for source,path in zip(sources,args.osm):
        try:HighwayReader(scan).apply_file(str(path),locations=True,idx='sparse_mem_array')
        except LimitReached:
            stopped=source['name'];break
        counts.append({'source':source['name'],'union_modeled_node_ids':len(scan.nodes)})
        print(counts[-1],flush=True)
    result=dict(expected,completed_sources=counts,source_scan_complete=stopped is None,
                stopped_source=stopped,union_node_count_lower_bound=len(scan.nodes),
                first_limit_exceeding_witness=scan.witness)
    if result!=expected:raise ValueError('Bounded resource result changed')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print('Reproduced node-cap failure without constructing a road matrix or raising limits')


if __name__=='__main__':main()
