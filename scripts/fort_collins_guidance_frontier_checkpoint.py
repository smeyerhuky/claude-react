"""Audit source incidence at all prior graph nodes without bypassing a new speed control."""
import argparse
import copy
import json
from fort_collins_guidance_road_frontier import inputs,REFERENCE,ADDITIONAL_WAYS,PARENT
from fort_collins_guidance_incidence_checkpoint import SOURCE as PRIOR_SOURCE
from fort_collins_control_checkpoint import ROOT,CONTEXT,FALSE_FLAGS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_frontier_checkpoint import index
from road_source_incidence import need
from road_guidance_segments import weights
from road_guidance_way_permissions import evaluate
from road_guidance_mixed_graph import compile_graph,query
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from reference_via_node_compile import canonical_sha
from road_reference_scenario import load,digest

SOURCE=REFERENCE/'source-context.json'
CONTROL_IDS={2512694,2569447,9677656,9677657,9677658,9680890,9680891,10475907,13135778}
OUTSIDE_IDS=[47472371,170833651,570104011,793155013,793155015,863454516,863454523,971271380]


def project(corpus=None):
    parent,seeds=inputs();old=json.loads(PRIOR_SOURCE.read_text());retained=json.loads(CONTEXT.read_text())
    corpus=json.loads(SOURCE.read_text()) if corpus is None else corpus;before=copy.deepcopy(corpus)
    need(set(corpus)==set(old) and corpus['schema']==old['schema'] and corpus['source']==old['source']
         and corpus['bounds']==old['bounds'],'Exact bounded original-source schema, identity and caps required')
    need(corpus['seed_node_ids']==seeds and corpus['requested_member_way_ids']==sorted(ADDITIONAL_WAYS),
         'All 45 parent graph nodes and five explicit complete member ways required')
    need(corpus['source_seed_incidence_enumerated'] is True and corpus['all_retained_way_and_node_members_present'] is True
         and all(corpus[key] is False for key in FALSE_FLAGS),'Source enumeration is not geographic/access/semantic approval')
    ways=index(corpus['ways'],{'id','tags','nodes'},100);nodes=index(corpus['nodes'],{'id','tags','lonlat'},2000)
    controls=index(corpus['control_relations'],{'id','tags','members'},100)
    need(len(ways)==40 and len(nodes)==169 and set(controls)==CONTROL_IDS,'Review changed complete source scope')
    for prior in (old,retained):
        for key,current in (('ways',ways),('nodes',nodes),('control_relations',controls)):
            previous={row['id']:row for row in prior[key]}
            for rid in current.keys()&previous.keys():need(current[rid]==previous[rid],'Shared complete original raw records cannot change')
        if prior is old:
            need({w['id'] for w in prior['ways']}<=set(ways) and {n['id'] for n in prior['nodes']}<=set(nodes),
                 'Retain every prior complete source way/node')
    wanted={p[0] for w in ways.values() for p in w['nodes']}
    need(set(nodes)==wanted and set(seeds)<=wanted,'Every complete member-node record required')
    incidence={str(nid):sorted(wid for wid,w in ways.items() if any(p[0]==nid for p in w['nodes'])) for nid in seeds}
    incident=sorted({wid for rows in incidence.values() for wid in rows})
    need(len(incident)==35 and corpus['incident_way_ids']==incident and corpus['all_source_way_ids_at_seed_nodes']==incidence
         and set(ways)-set(incident)==set(ADDITIONAL_WAYS),'Exact source incidence and explicit-member accounting required')
    for nid,rows in old['all_source_way_ids_at_seed_nodes'].items():need(incidence[nid]==rows,'Prior seed incidence cannot change')
    need(corpus['unenumerated_member_node_ids']==sorted(wanted-set(seeds)),'Keep every unenumerated outer member node explicit')
    for key in ('missing_touching_relation_member_way_ids','missing_touching_relation_node_ids','referenced_relation_member_ids'):
        need(corpus[key]==[],'No retained control member may be missing')
    for control in controls.values():
        need(all(m['type']=='w' and m['ref'] in ways or m['type']=='n' and m['ref'] in nodes for m in control['members']),
             'Every actual member must be present, without nested semantics')
    supported=[];outside=[];unknown=[];classifications={};directed=0;roads=[]
    for wid,way in sorted(ways.items()):
        local=[nodes[nid] for nid in sorted({p[0] for p in way['nodes']})]
        permission=evaluate(way,local,default_policy=DEFAULTS)
        need(permission['node_record_ids_match_way_geometry'],'Every raw geometry/node/tag record must validate')
        result=weights(way,local,default_policy=DEFAULTS)
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        else:
            roads.append(way)
            if result['status']=='supported_segment_weights':supported.append(wid);directed+=len(result['arcs'])
            else:unknown.append(wid)
        classifications[str(wid)]=dict(permission_status=permission['status'],weight_status=result['status'],
            reason=result.get('reason'),weight_projection_sha256=canonical_sha(result))
    need(len(supported)==31 and outside==OUTSIDE_IDS and unknown==[134584347] and directed==165,
         'Review changed model support; never remove the speed namespace to force weights')
    need(ways[134584347]['tags'].get('maxspeed:type')=='sign' and ways[134584347]['tags'].get('maxspeed')=='25 mph',
         'Retain the new complete Maple Street speed-tag context')
    compiled_controls={}
    for rid,control in sorted(controls.items()):
        memberways=[ways[wid] for wid in sorted({m['ref'] for m in control['members'] if m['type']=='w'})]
        nids={p[0] for w in memberways for p in w['nodes']}
        compiler=node_rule if [m['type'] for m in control['members'] if m['role']=='via']==['n'] else way_rule
        result=compiler(control,memberways,[nodes[nid] for nid in sorted(nids)],default_policy=DEFAULTS)
        need(result['topology_compiled'],'Every retained declaration must compile individually from full members')
        compiled_controls[str(rid)]=result
    rnids={p[0] for w in roads for p in w['nodes']};rnodes=[nodes[nid] for nid in sorted(rnids)]
    relations=[controls[rid] for rid in sorted(controls)];compilation=compile_graph(roads,rnodes,relations,default_policy=DEFAULTS)
    need(compilation['graph'] is None and '134584347' in compilation['reason'] and 'speed namespace' in compilation['reason'],
         'The unresolved speed-tag road must reject the entire graph')
    q=next(iter(parent['protected_original_query_replays'].values()));queries={}
    for metric in ('length','travel_time'):
        answer=query(roads,rnodes,relations,q['source'],q['target'],metric,default_policy=DEFAULTS)
        need(answer['status']=='unsupported' and answer['result'] is None and answer['route_cost_emitted'] is False,
             'Unsupported full context must never be reported as a solved route or modeled NoData')
        queries[metric]=answer
    need(corpus==before,'No raw records may be mutated')
    return dict(schema='fort-collins-guidance-road-frontier-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=canonical_sha(corpus),source_identity=corpus['source'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_source_incidence.py',
            'fort_collins_guidance_road_frontier.py','fort_collins_guidance_frontier_checkpoint.py',
            'road_guidance_segments.py','road_guidance_mixed_graph.py','road_guidance_way_permissions.py',
            'guidance_via_node_compile.py','reference_via_way_compile.py')},
        source_seed_nodes=45,newly_enumerated_parent_road_nodes=26,incident_ways=35,explicit_member_way_ids=sorted(ADDITIONAL_WAYS),
        complete_source_ways=40,complete_source_nodes=169,touching_controls=9,unenumerated_outer_nodes=len(wanted-set(seeds)),
        in_class_roads=len(roads),candidate_road_nodes=len(rnids),supported_weight_way_ids=supported,
        supported_individual_directed_weights=directed,outside_declared_road_class_ids=outside,unsupported_model_road_ids=unknown,
        classifications=classifications,individual_restriction_compilations=compiled_controls,
        full_candidate_compilation=compilation,full_candidate_queries=queries,source_seed_nodes_cover_all_parent_graph_nodes=True,
        unknown_controls_omitted=False,partial_graph_returned=False,modeled_nodata_emitted=False,
        all_graph_node_incidence_enumerated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='The 45 seeds enumerate all nodes of the previous 12-road model, not the new 121-node road candidate or complete geography. 124 outer source-member nodes remain unenumerated. All nine declarations compile individually; the whole 32-road candidate stays unsupported because Maple Street maxspeed:type=sign is outside the current speed grammar. Supported individual weights are not a partial graph. No tag is stripped, no control omitted and no unsupported query mislabeled as geographic disconnection or modeled NoData. Physical/legal access, reviewed anchors, connectors and public release remain unapproved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen expanded road-frontier report differs')
    print({key:result[key] for key in ('source_seed_nodes','newly_enumerated_parent_road_nodes','complete_source_ways',
        'complete_source_nodes','touching_controls','unenumerated_outer_nodes','candidate_road_nodes','unsupported_model_road_ids')})
