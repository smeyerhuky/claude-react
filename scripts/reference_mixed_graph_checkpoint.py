"""Freeze mixed maneuver queries while preserving every earlier tiny-kernel cost."""
import argparse
import hashlib
import json
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS
from road_reference_mixed_graph import compile_graph,query
from reference_via_way_checkpoint import project as way_project,CONTEXT,REFERENCE as WAY_REFERENCE
from reference_declared_graph_checkpoint import project as old_project,REFERENCE as OLD_REFERENCE,RAW

REFERENCE=ROOT/'docs/research/reference-mixed-graph'


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(value,reason):
    if not value:raise ValueError(reason)


def raw_inputs():
    static=json.loads(CONTEXT.read_text());old=json.loads(RAW.read_text())
    need(static['source']==old['source'],'Both member contexts must use the exact same original source')
    ids={696728766,1475543490}
    ways=static['ways']+[way for way in old['ways'] if way['id'] in ids]
    wanted={p[0] for way in ways for p in way['nodes']}
    indexed={}
    for node in static['nodes']+[n for n in old['nodes'] if n['id'] in wanted]:
        need(node['id'] not in indexed or indexed[node['id']]==node,'Shared raw node records must agree across contexts')
        indexed[node['id']]=node
    return ways,[indexed[nid] for nid in sorted(indexed)],static['restrictions']+old['restrictions']


def project():
    old=old_project()
    need(old==json.loads((OLD_REFERENCE/'report.json').read_text()),'Exact older two-member kernel checkpoint required')
    need(way_project()==json.loads((WAY_REFERENCE/'report.json').read_text()),'Exact static via-way source/compiler checkpoint required')
    ways,nodes,relations=raw_inputs();kwargs=dict(default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
    compiled=compile_graph(ways,nodes,relations,**kwargs)
    need(compiled['status']=='compiled_declared_mixed_graph','Exact mixed declared universe must compile')
    graph=compiled['graph'];need(len(ways)==7 and len(graph['nodes'])==23 and len(graph['arcs'])==22,'Review changed mixed source scope')
    preserved={};replays={}
    active=load();active['reference_instant_utc']='2026-10-30T01:00:00Z'
    for key,entry in old['query_replays'].items():
        scenario=active if key.startswith('active_window_regression:') else load()
        previous=entry['result']
        answer=query(ways,nodes,relations,previous['source'],previous['target'],previous['metric'],scenario=scenario,**kwargs)
        need(answer['status']=='solved_declared_mixed_graph','Preserved tiny-kernel query must converge')
        result=answer['result']
        for field in ('source','target','metric','cost','exact_stored_path_cost','arc_path'):
            need(result[field]==previous[field],'Protected earlier declared-kernel path/cost changed: '+field)
        preserved[key]=dict(scenario_sha256=answer['compilation']['scenario_sha256'],
            graph_sha256=answer['compilation']['graph_sha256'],result=result,
            geographic_coverage_certified=False,access_verified=False)
    cases=[('9680890:full_approach',5481546066,51193002,False),
           ('9680890:start_inside',1479189816,51193002,True),
           ('9680890:end_at_prefix',5481546066,51193003,True),
           ('9680891:full_approach',51193003,7416599567,False),
           ('9680891:start_inside',51193002,7416599567,True),
           ('9680891:end_at_prefix',51193003,1479189816,True)]
    for name,start,end,finite in cases:
        for metric in ('length','travel_time'):
            answer=query(ways,nodes,relations,start,end,metric,**kwargs)
            need(answer['status']=='solved_declared_mixed_graph' and (answer['result']['cost'] is not None)==finite,
                 'Review changed actual via-way approach-history behavior')
            replays[f'{name}:{metric}']=answer['result']
    return dict(schema='reference-mixed-graph-checkpoint-v1',scenario_sha256=digest(load()),
        static_via_way_report_sha256=file_sha(WAY_REFERENCE/'report.json'),
        old_declared_kernel_report_sha256=file_sha(OLD_REFERENCE/'report.json'),
        original_member_context_sha256=file_sha(CONTEXT),old_raw_context_sha256=file_sha(RAW),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('road_reference_mixed_graph.py','reference_mixed_graph_checkpoint.py','road_reference_declared_graph.py',
             'reference_via_way_compile.py','reference_via_node_compile.py','road_reference_turn_rules.py',
             'road_reference_segment_costs.py','road_reference_segment_permissions.py','road_reference_way_permissions.py',
             'road_reference_conditionals.py','road_reference_scenario.py','road_maneuver_probe.py','road_turn_aware_probe.py')},
        raw_member_way_ids=sorted(way['id'] for way in ways),raw_member_nodes=len(nodes),weighted_arcs=len(graph['arcs']),
        supplied_raw_relation_ids=graph['supplied_raw_relation_ids'],
        reference_active_pattern_ids=[p['id'] for p in graph['maneuvers']],
        graph_sha256=compiled['graph_sha256'],input_sha256=compiled['input_sha256'],
        cost_policy_sha256=compiled['cost_policy_sha256'],way_weight_stage_sha256=compiled['way_weight_stage_sha256'],
        preserved_kernel_queries=preserved,via_way_history_queries=replays,
        complete_geographic_graph_constructed=False,all_incident_ways_accounted=False,other_relations_accounted=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Declared seven-way universe only, with unconstrained raw-node starts/ends. Costs and missing paths are not global travel/access truth, metro-anchor costs, real-world network disconnection or geographic regions. No supplied relation can be dropped to fall back to a weight-only query. All earlier reports and public map behavior remain unchanged.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:
        path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:
        raise ValueError('Frozen mixed-maneuver checkpoint differs')
    print(dict(raw_ways=len(result['raw_member_way_ids']),raw_nodes=result['raw_member_nodes'],weighted_arcs=result['weighted_arcs'],
        supplied_relations=len(result['supplied_raw_relation_ids']),preserved_queries=len(result['preserved_kernel_queries']),
        via_way_queries=len(result['via_way_history_queries']),access_verified=False))
