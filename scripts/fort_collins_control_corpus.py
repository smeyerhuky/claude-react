"""Capture the 40-seed control corpus and six explicitly missing relation members."""
import argparse
import json
from pathlib import Path
from road_source_incidence import extract as capture,need
from reference_seed_incidence import ROOT,RAW
from reference_seed_incidence_checkpoint import project as seed_project,REFERENCE as SEED_REFERENCE
from reference_via_way_checkpoint import project as member_project,CONTEXT as MEMBER_CONTEXT,REFERENCE as MEMBER_REFERENCE

ADDITIONAL_WAYS=(170833649,696284588,6167072,322900293,6167040,132998251)


def extract(source):
    need(seed_project()==json.loads((SEED_REFERENCE/'report.json').read_text()),'Frozen first-hop parent required')
    need(member_project()==json.loads((MEMBER_REFERENCE/'report.json').read_text()),'Frozen complete via-way member parent required')
    witness=json.loads((SEED_REFERENCE/'source-incidence.json').read_text());members=json.loads(MEMBER_CONTEXT.read_text())
    seeds={int(nid) for nid in witness['complete_node_record_sha256']}|{node['id'] for node in members['nodes']}
    need(len(seeds)==40,'Exact 40-node control-corpus seed union required')
    identity=json.loads(RAW.read_text())['source']
    return capture(source,source_identity={key:identity[key] for key in ('name','sha256','size_bytes')},
                   seed_node_ids=sorted(seeds),additional_way_ids=list(ADDITIONAL_WAYS))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seeds=len(result['seed_node_ids']),incident_ways=len(result['incident_way_ids']),
        all_ways=len(result['ways']),complete_nodes=len(result['nodes']),touching_relations=len(result['control_relations']),
        missing_members=result['missing_touching_relation_member_way_ids'],access_verified=False))
