"""Select and recapture a finite cost-inspection frontier without graph admission."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
from fort_collins_inert_bounds_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_opaque_source_checkpoint import REFERENCE as RAW_PARENT
from fort_collins_opaque_source_core import validate_layout
from road_reference_scenario import ROOT
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_posted_speed_weights import weights
from road_opaque_control_bounds import geometry_lower_bounds
from road_competitive_core import select_known_core
from road_source_incidence import extract as capture,need
from reference_via_node_compile import canonical_sha

REFERENCE=ROOT/'docs/research/fort-collins-bounded-cost-frontier'


def diagnostic_inputs(union):
    nodes={n['id']:n for n in union['nodes']};known=[];possible=[];catalogues={};roads=[];ids=set();projections={}
    for w in union['ways']:
        if w['tags'].get('highway') not in HIGHWAYS:continue
        roads.append(w);wanted={p[0] for p in w['nodes']};ids|=wanted;local=[nodes[n] for n in sorted(wanted)]
        result=weights(w,local,default_policy=DEFAULTS);projections[str(w['id'])]=canonical_sha(result)
        if result['arcs'] is not None:known.extend(result['arcs'])
        else:
            value=geometry_lower_bounds(w,local,default_policy=DEFAULTS);catalogues[str(w['id'])]=value;possible.extend(value['potential_arcs'])
    return sorted(ids),known,possible,catalogues,roads,projections


def select(union,bounds):
    nodes,known,possible,_,_,_=diagnostic_inputs(union);q=bounds['length']
    return select_known_core(nodes,known+possible,union['seed_node_ids'],q['source'],q['target'],
        incumbent_costs={m:Fraction(*map(int,b['supported_witness_upper_bound_exact'])) for m,b in bounds.items()})


def inputs():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen inert-prohibition parent required')
    raw=json.loads((RAW_PARENT/'report.json').read_text());selection=select(raw['reconciled_source'],baseline['metric_brackets'])
    need(len(selection['selected_source_node_ids'])==283 and len(selection['rounds'])==9,'Review changed source-inspection selection')
    layout=validate_layout(json.loads((REFERENCE/'partition-layout.json').read_text()),selection)
    return raw,baseline,selection,layout


def extract(source,index):
    need(type(index) is int and index in (0,1),'Explicit bounded partition index required')
    raw,_,_,parts=inputs();p=parts[index]
    return capture(source,source_identity=raw['source_identity'],seed_node_ids=p['seed_node_ids'],additional_way_ids=p['requested_member_way_ids'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--partition',type=int,choices=(0,1),required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();result=extract(args.osm,args.partition);args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(partition=args.partition,seeds=len(result['seed_node_ids']),ways=len(result['ways']),nodes=len(result['nodes']),
        controls=len(result['control_relations']),access_verified=False,release_eligible=False))
