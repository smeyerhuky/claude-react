"""Reproduce the complete bounded six-source cut inventory, not road coverage."""
import argparse
import json
from pathlib import Path

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_exterior_parent_competition import SourceScan
from road_longitude_preflight import LongitudeCutSweep

REFERENCE=Path(__file__).resolve().parents[1]/'docs/research/kansas-partition-layouts/longitude-sweep.json'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--parent-osm',type=Path,nargs=6,required=True)
    p.add_argument('--output',type=Path,required=True)
    args=p.parse_args();expected=json.loads(REFERENCE.read_text())
    metadata=[source_metadata(path) for path in args.parent_osm];validate_sources(metadata)
    if metadata!=expected['source_provenance']:raise ValueError('Exact ordered six-source bytes required')
    scan=LongitudeCutSweep([row['longitude_cut'] for row in expected['cuts']])
    for path in args.parent_osm:
        HighwayReader(SourceScan(scan)).apply_file(str(path),locations=True,idx='sparse_mem_array')
        print('[cut sweep]',path.name,len(scan.index),'modeled node identities',flush=True)
    result=scan.finish()
    for key in ('cuts','selected_candidate','union_modeled_nodes','raw_directed_arcs','raw_fingerprint_records','duplicate_raw_highways_verified'):
        if result[key]!=expected[key]:raise ValueError('Cut inventory changed: '+key)
    if not result['fingerprint_database_bytes']<=1000000000:raise ValueError('Scratch database budget exceeded')
    result.update(source_provenance=metadata,schema='longitude-midpoint-sweep-preflight-v1',
                  note='Scheduling/partition preflight only. No tested unscoped cut establishes a shared-node upper bound of 128 ports. Query-preserving views require their own proof and endpoint contract.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'union_modeled_nodes':result['union_modeled_nodes'],'candidate_cuts':len(result['cuts']),'selected_candidate':result['selected_candidate']}))


if __name__=='__main__':main()
