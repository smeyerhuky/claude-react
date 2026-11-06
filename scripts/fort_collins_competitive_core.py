"""Capture original source incidence at the known graph's competitive source-inspection core."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
from fort_collins_posted_speed_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_guidance_frontier_checkpoint import SOURCE as PRIOR_SOURCE
from road_reference_scenario import ROOT
from road_competitive_core import select_known_core
from road_source_incidence import extract as capture,need

REFERENCE=ROOT/'docs/research/fort-collins-competitive-core'
ADDITIONAL_WAYS=(6167040,6167072,132998251,170833649,696284588,1475543490)


def inputs():
    report=parent();need(report==json.loads((PARENT/'report.json').read_text()),'Exact frozen posted-sign source model required')
    prior=json.loads(PRIOR_SOURCE.read_text());graph=report['declared_compilation']['graph'];queries=report['query_replays']
    first=queries['length'];need(all((q['source'],q['target'])==(first['source'],first['target']) for q in queries.values()),'Same exact endpoints for both metric bounds required')
    upper={metric:Fraction(*map(int,q['exact_stored_path_cost'])) for metric,q in queries.items()}
    selected=select_known_core(graph['nodes'],graph['arcs'],prior['seed_node_ids'],first['source'],first['target'],incumbent_costs=upper)
    need(len(selected['selected_source_node_ids'])==96 and len(selected['rounds'])==17,'Review changed known competitive core selection')
    return report,selected


def extract(source):
    report,selected=inputs()
    return capture(source,source_identity=report['source_identity'],seed_node_ids=selected['selected_source_node_ids'],
                   additional_way_ids=list(ADDITIONAL_WAYS))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seeds=len(result['seed_node_ids']),incident_ways=len(result['incident_way_ids']),
        complete_source_ways=len(result['ways']),complete_nodes=len(result['nodes']),controls=len(result['control_relations']),
        missing_way_members=result['missing_touching_relation_member_way_ids'],outer_nodes=len(result['unenumerated_member_node_ids']),access_verified=False))
