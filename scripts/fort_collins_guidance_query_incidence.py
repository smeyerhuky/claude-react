"""Enumerate original-source incident ways at every focused guidance-query node."""
import argparse
import json
from pathlib import Path
from road_source_incidence import extract as capture,need
from fort_collins_control_checkpoint import ROOT,CONTEXT
from fort_collins_guidance_graph_checkpoint import project as parent,REFERENCE as PARENT

REFERENCE=ROOT/'docs/research/fort-collins-guidance-query-incidence'
ADDITIONAL_WAYS=(6172542,134584349,186582632,290286621)


def inputs():
    report=parent()
    need(report==json.loads((PARENT/'report.json').read_text()),'Exact frozen atomic graph parent required')
    raw=json.loads(CONTEXT.read_text())
    selected=[w for w in raw['ways'] if w['id'] in (140486410,322900293)]
    seeds=sorted({p[0] for w in selected for p in w['nodes']})
    need(len(selected)==2 and len(seeds)==19,'Exact focused raw-way/node universe required')
    return raw,seeds


def extract(source):
    raw,seeds=inputs()
    return capture(source,source_identity=raw['source'],seed_node_ids=seeds,additional_way_ids=list(ADDITIONAL_WAYS))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seeds=len(result['seed_node_ids']),incident_ways=len(result['incident_way_ids']),
        complete_nodes=len(result['nodes']),touching_controls=len(result['control_relations']),
        missing_way_members=result['missing_touching_relation_member_way_ids'],
        unenumerated_outer_nodes=len(result['unenumerated_member_node_ids']),access_verified=False))
