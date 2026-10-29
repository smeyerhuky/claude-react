"""Reproduce the full-source seven-state metadata sweep; never construct a union matrix."""
import argparse
import json
from pathlib import Path
from colorado_adjacent_source_interfaces import HighwayReader,source_metadata,validate_sources
from colorado_exterior_parent_competition import SourceScan
from road_longitude_preflight import LongitudeCutSweep
from metro_scenario_checkpoint import require

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/cheyenne-partition-layouts/full-source-cut-sweep.json'


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--parent-osm',type=Path,nargs=7,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    reference=json.loads(REFERENCE.read_text());metadata=[source_metadata(p) for p in a.parent_osm];validate_sources(metadata)
    require(metadata==reference['source_provenance'],'Exact ordered seven-source bytes required')
    scanner=LongitudeCutSweep([r['longitude_cut'] for r in reference['cuts']])
    for p in a.parent_osm:
        HighwayReader(SourceScan(scanner)).apply_file(str(p),locations=True,idx='sparse_mem_array');print('[Sweep]',p.name,len(scanner.index),flush=True)
    result=scanner.finish()
    for key in ['cuts','union_modeled_nodes','raw_directed_arcs','raw_fingerprint_records','duplicate_raw_highways_verified']:require(result[key]==reference[key],'Full-source cut inventory changed: '+key)
    require(result['fingerprint_database_bytes']<=1000000000,'Original fingerprint scratch budget exceeded')
    result.update(source_provenance=metadata,source_costs_computed=0)
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')

if __name__=='__main__':main()
