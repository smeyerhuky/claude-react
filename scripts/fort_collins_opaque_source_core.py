"""Reinspect a relaxed competitive core in two unchanged bounded source captures."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
from fort_collins_gate_bounds_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_partition_checkpoint import REFERENCE as RAW_PARENT
from fort_collins_competitive_checkpoint import REFERENCE as WITNESS
from road_reference_scenario import ROOT
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_posted_speed_weights import weights
from road_competitive_core import select_known_core
from road_source_incidence import extract as capture,need

REFERENCE=ROOT/'docs/research/fort-collins-opaque-source-core'
EXTRA=[6167040,6167072,132998251,170833649,179738363,696284588,1475543490]


def validate_layout(layout,selection):
    need(layout['schema']=='two-bounded-source-inspection-layout-v1'
         and layout['layout_is_access_evidence'] is False and layout['release_eligible'] is False,
         'Source-inspection layout cannot approve access')
    parts=layout['partitions'];need(isinstance(parts,list) and len(parts)==2,'Exactly two bounded replacement captures required')
    seen=set()
    for index,row in enumerate(parts):
        seeds=row['seed_node_ids']
        need(type(row['index']) is int and row['index']==index and isinstance(seeds,list) and 1<=len(seeds)<=2000
             and all(type(n) is int and n>0 for n in seeds) and seeds==sorted(set(seeds)) and not seen.intersection(seeds)
             and row['requested_member_way_ids']==EXTRA,'Exact distinct bounded source seeds and unchanged explicit members required')
        seen.update(seeds)
    need(sorted(seen)==selection['selected_source_node_ids'],'Every selected inspection node must appear exactly once')
    return parts


def inputs():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen opaque-gate parent required')
    raw=json.loads((RAW_PARENT/'report.json').read_text());u=raw['reconciled_source'];nodes={n['id']:n for n in u['nodes']}
    known=[];ids=set()
    for w in u['ways']:
        if w['tags'].get('highway') not in HIGHWAYS:continue
        wanted={p[0] for p in w['nodes']};ids|=wanted
        value=weights(w,[nodes[n] for n in sorted(wanted)],default_policy=DEFAULTS)
        if value['arcs'] is not None:known.extend(value['arcs'])
    possible=[a for c in baseline['opaque_way_geometry_catalogues'].values() for a in c['potential_arcs']]
    q=json.loads((WITNESS/'report.json').read_text())['query_replays'];first=q['length']
    upper={m:Fraction(*map(int,r['supported_witness_upper_bound_exact'])) for m,r in baseline['metric_brackets'].items()}
    selection=select_known_core(sorted(ids),known+possible,u['seed_node_ids'],first['source'],first['target'],incumbent_costs=upper)
    need(len(selection['selected_source_node_ids'])==247 and len(selection['rounds'])==9,'Review changed relaxed inspection scope')
    layout=json.loads((REFERENCE/'partition-layout.json').read_text());parts=validate_layout(layout,selection)
    return raw,baseline,selection,parts


def extract(source,index):
    need(type(index) is int and index in (0,1),'Explicit bounded partition index required')
    raw,_,_,parts=inputs();row=parts[index]
    return capture(source,source_identity=raw['source_identity'],seed_node_ids=row['seed_node_ids'],additional_way_ids=row['requested_member_way_ids'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--partition',type=int,choices=(0,1),required=True);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args();result=extract(args.osm,args.partition)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(partition=args.partition,seeds=len(result['seed_node_ids']),ways=len(result['ways']),nodes=len(result['nodes']),
        controls=len(result['control_relations']),access_verified=False,release_eligible=False))
