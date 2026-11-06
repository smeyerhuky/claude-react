"""Capture the complementary source partition while retaining the audited 96-node partition."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
from fort_collins_competitive_checkpoint import project as parent,REFERENCE as PARENT,SOURCE as PRIOR_SOURCE
from road_reference_scenario import ROOT
from road_competitive_core import select_known_core
from road_source_incidence import extract as capture,need

REFERENCE=ROOT/'docs/research/fort-collins-partitioned-core'
ADDITIONAL_MEMBER=179738363


def inputs():
    report=parent();need(report==json.loads((PARENT/'report.json').read_text()),'Exact frozen 96-node source/core parent required')
    prior=json.loads(PRIOR_SOURCE.read_text());graph=report['declared_compilation']['graph'];q=report['query_replays']['length']
    upper={metric:Fraction(*map(int,r['exact_stored_path_cost'])) for metric,r in report['query_replays'].items()}
    selection=select_known_core(graph['nodes'],graph['arcs'],prior['seed_node_ids'],q['source'],q['target'],incumbent_costs=upper)
    seeds=sorted(set(selection['selected_source_node_ids'])-set(prior['seed_node_ids']))
    need(len(selection['selected_source_node_ids'])==177 and len(seeds)==81,'Review changed complementary inspection scope')
    extra=sorted(set(prior['requested_member_way_ids'])|{ADDITIONAL_MEMBER})
    return report,prior,selection,seeds,extra


def extract(source):
    report,_,_,seeds,extra=inputs()
    return capture(source,source_identity=report['source_identity'],seed_node_ids=seeds,additional_way_ids=extra)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(source_seeds=len(result['seed_node_ids']),source_ways=len(result['ways']),nodes=len(result['nodes']),
        controls=len(result['control_relations']),missing_way_members=result['missing_touching_relation_member_way_ids'],
        source_or_model_caps_changed=False,access_verified=False))
