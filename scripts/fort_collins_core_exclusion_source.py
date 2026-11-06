"""Recapture a declared native-node core containing the prior required inspection set."""
import argparse
import json
from pathlib import Path
from fort_collins_bounded_frontier_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_opaque_source_core import validate_layout
from road_reference_scenario import ROOT
from road_source_incidence import extract as capture,need

REFERENCE=ROOT/'docs/research/fort-collins-conditional-core-exits'


def validate_core_layout(layout,prior_selection):
    extra=layout['declared_additional_seed_node_ids'];required=prior_selection['selected_source_node_ids']
    need(isinstance(extra,list) and len(extra)==1 and all(type(n) is int and n>0 for n in extra)
         and not set(extra)&set(required),'One explicit additional inspection node, never an access anchor, required')
    need(layout['additional_seed_basis']=='explicit_source_inspection_superset','Explicit inspection-only layout basis required')
    return validate_layout(layout,dict(selected_source_node_ids=sorted(required+extra)))


def inputs():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen 283-node budget-rejected parent required')
    selection=baseline['next_source_inspection_selection'];need(len(selection['selected_source_node_ids'])==293,'Exact prior required inspection set retained')
    layout=json.loads((REFERENCE/'partition-layout.json').read_text());parts=validate_core_layout(layout,selection)
    return baseline,selection,parts


def extract(source,index):
    need(type(index) is int and index in (0,1),'Explicit bounded partition index required')
    parent,_,parts=inputs();p=parts[index]
    return capture(source,source_identity=parent['source_identity'],seed_node_ids=p['seed_node_ids'],additional_way_ids=p['requested_member_way_ids'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--partition',type=int,choices=(0,1),required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();r=extract(args.osm,args.partition);args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(r,indent=2,sort_keys=True)+'\n')
    print(dict(partition=args.partition,seeds=len(r['seed_node_ids']),ways=len(r['ways']),nodes=len(r['nodes']),controls=len(r['control_relations']),access_verified=False,release_eligible=False))
