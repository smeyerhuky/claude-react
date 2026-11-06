"""Verify atomic graph admission and frozen focused query behavior."""
import argparse
import json
from fort_collins_guidance_maneuver_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_control_checkpoint import CONTEXT,ROOT
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_guidance_mixed_graph import compile_graph,query
from road_reference_scenario import load,digest
from reference_via_node_compile import canonical_sha

REFERENCE=ROOT/'docs/research/fort-collins-guidance-graph'


def project():
    previous=parent()
    if previous!=json.loads((PARENT/'report.json').read_text()):raise ValueError('Exact frozen maneuver parent required')
    raw=json.loads(CONTEXT.read_text());ways=[w for w in raw['ways'] if w['tags'].get('highway') in HIGHWAYS]
    ids={p[0] for w in ways for p in w['nodes']};nodes=[n for n in raw['nodes'] if n['id'] in ids]
    kwargs=dict(default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
    candidate=compile_graph(ways,nodes,raw['control_relations'],**kwargs)
    source=previous['focused_query']['source'];target=previous['focused_query']['target']
    blocked=query(ways,nodes,raw['control_relations'],source,target,**kwargs)
    if candidate['graph'] is not None or blocked['result'] is not None or '815164359' not in candidate['reason']:
        raise ValueError('Unknown original bollard must atomically reject graph and query')
    selected=[w for w in ways if w['id'] in previous['focused_way_ids']]
    nids={p[0] for w in selected for p in w['nodes']};local=[n for n in nodes if n['id'] in nids]
    controls=[r for r in raw['control_relations'] if r['id']==10475907]
    compiled=compile_graph(selected,local,controls,default_policy=DEFAULTS)
    if compiled['graph'] is None:raise ValueError('Focused complete supplied universe must compile')
    replays={}
    for metric in ('length','travel_time'):
        answer=query(selected,local,controls,source,target,metric,default_policy=DEFAULTS)
        expected=previous['focused_replays'][metric]['complete_supplied_two_way_control_result']
        if answer['result']!=expected:raise ValueError('Focused protected result changed')
        replays[metric]=answer
    return dict(schema='fort-collins-guidance-graph-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=file_sha(CONTEXT),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_guidance_mixed_graph.py',
            'fort_collins_guidance_graph_checkpoint.py','road_guidance_segments.py','guidance_via_node_compile.py',
            'reference_via_way_compile.py','reference_via_node_compile.py','road_maneuver_probe.py')},
        complete_road_candidate_ways=len(ways),complete_road_candidate_nodes=len(nodes),supplied_controls=10,
        full_candidate_compilation=candidate,full_candidate_query=blocked,
        focused_compilation_sha256=canonical_sha(compiled),focused_replays=replays,
        unknown_controls_omitted=False,partial_graph_returned=False,
        complete_geographic_graph_constructed=False,all_incident_ways_accounted=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Graph admission is atomic for the complete supplied universe, not evidence of geographic closure. The 35-road candidate retains the unknown bollard and returns neither graph nor query. Focused two-way results remain limited to that declared universe. No road/lane connectivity or physical/legal access, approved connector, adopted anchor or public release is certified.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen atomic graph checkpoint differs')
    print(dict(candidate_ways=result['complete_road_candidate_ways'],supplied_controls=result['supplied_controls'],
        full_candidate_status=result['full_candidate_compilation']['status'],partial_graph_returned=False,access_verified=False))
