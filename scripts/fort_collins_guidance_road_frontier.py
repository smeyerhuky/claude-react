"""Capture every incident way at the expanded model's 45 road nodes."""
import argparse
import json
from pathlib import Path
from road_source_incidence import extract as capture,need
from fort_collins_control_checkpoint import ROOT
from fort_collins_guidance_incidence_checkpoint import project as parent,REFERENCE as PARENT

REFERENCE=ROOT/'docs/research/fort-collins-guidance-road-frontier'
ADDITIONAL_WAYS=(6167040,6167072,132998251,170833649,696284588)


def inputs():
    report=parent()
    need(report==json.loads((PARENT/'report.json').read_text()),'Exact frozen 19-node incidence parent required')
    seeds=report['declared_compilation']['graph']['nodes']
    need(len(seeds)==45,'Every expanded declared road node required')
    return report,seeds


def extract(source):
    report,seeds=inputs()
    return capture(source,source_identity=report['source_identity'],seed_node_ids=seeds,additional_way_ids=list(ADDITIONAL_WAYS))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seeds=len(result['seed_node_ids']),incident_ways=len(result['incident_way_ids']),
        complete_nodes=len(result['nodes']),touching_controls=len(result['control_relations']),
        missing_way_members=result['missing_touching_relation_member_way_ids'],
        unenumerated_outer_nodes=len(result['unenumerated_member_node_ids']),access_verified=False))
