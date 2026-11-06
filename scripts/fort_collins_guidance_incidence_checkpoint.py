"""Audit expanded source incidence and distinguish local NoData from model reachability."""
import argparse
import copy
from fractions import Fraction
import json
from fort_collins_guidance_query_incidence import inputs,REFERENCE,ADDITIONAL_WAYS
from fort_collins_control_checkpoint import ROOT,CONTEXT,FALSE_FLAGS
from fort_collins_guidance_graph_checkpoint import REFERENCE as PARENT
from fort_collins_guidance_maneuver_checkpoint import REFERENCE as FOCUSED
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_frontier_checkpoint import index
from road_source_incidence import need
from road_guidance_segments import weights
from road_guidance_way_permissions import evaluate
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_guidance_mixed_graph import compile_graph
from road_reference_scenario import load,digest
from road_maneuver_probe import solve
from reference_via_node_compile import canonical_sha

SOURCE=REFERENCE/'source-context.json'
WAY_IDS={6166084,134552324,134584350,140486410,190362906,322900293,322900298,
         793155013,793155015,1181513189,*ADDITIONAL_WAYS}
CONTROL_IDS={9680890,9680891,10475907}


def exact_cost(answer):
    value=answer['exact_stored_path_cost']
    return None if value is None else Fraction(*map(int,value))


def project(corpus=None):
    old,seeds=inputs();corpus=json.loads(SOURCE.read_text()) if corpus is None else corpus;before=copy.deepcopy(corpus)
    need(set(corpus)==set(old) and corpus['schema']==old['schema'] and corpus['source']==old['source']
         and corpus['bounds']==old['bounds'],'Exact bounded original-source incidence schema/identity required')
    need(corpus['seed_node_ids']==seeds and corpus['requested_member_way_ids']==sorted(ADDITIONAL_WAYS),
         'Every focused node and four explicitly completed member ways required')
    need(corpus['source_seed_incidence_enumerated'] is True and corpus['all_retained_way_and_node_members_present'] is True
         and all(corpus[key] is False for key in FALSE_FLAGS),'Source enumeration and structural presence establish no access/geographic approval')
    ways=index(corpus['ways'],{'id','tags','nodes'},100);nodes=index(corpus['nodes'],{'id','tags','lonlat'},2000)
    controls=index(corpus['control_relations'],{'id','tags','members'},100)
    need(set(ways)==WAY_IDS and len(nodes)==58 and set(controls)==CONTROL_IDS,'Review changed source scope; retain outside-class ways and every touching control')
    for key,current in (('ways',ways),('nodes',nodes),('control_relations',controls)):
        prior={row['id']:row for row in old[key]}
        for rid in current.keys()&prior.keys():need(current[rid]==prior[rid],'Previously retained complete raw records cannot change')
    wanted={p[0] for way in ways.values() for p in way['nodes']}
    need(set(nodes)==wanted and set(seeds)<=wanted,'Every complete member node required')
    incidence={str(nid):sorted(wid for wid,way in ways.items() if any(p[0]==nid for p in way['nodes'])) for nid in seeds}
    incident=sorted({wid for rows in incidence.values() for wid in rows})
    need(len(incident)==10 and corpus['incident_way_ids']==incident and corpus['all_source_way_ids_at_seed_nodes']==incidence
         and set(ways)-set(incident)==set(ADDITIONAL_WAYS),'Exact source incidence plus explicit member context required')
    need(corpus['unenumerated_member_node_ids']==sorted(wanted-set(seeds)),'Every unenumerated outer node must remain explicit')
    for key in ('missing_touching_relation_member_way_ids','missing_touching_relation_node_ids','referenced_relation_member_ids'):
        need(corpus[key]==[],'Every retained control member must be complete')
    for relation in controls.values():
        need(all(m['type']=='w' and m['ref'] in ways or m['type']=='n' and m['ref'] in nodes for m in relation['members']),
             'All actual raw control members must exist; no nested/missing context')
    supported=[];outside=[];projections={}
    for wid,way in sorted(ways.items()):
        local=[nodes[nid] for nid in sorted({p[0] for p in way['nodes']})]
        check=evaluate(way,local,default_policy=DEFAULTS)
        need(check['node_record_ids_match_way_geometry'],'Every raw way and member-node record must validate')
        value=weights(way,local,default_policy=DEFAULTS);projections[str(wid)]=canonical_sha(value)
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        else:
            need(value['status']=='supported_segment_weights','Unknown supplied in-class road cannot be omitted')
            supported.append(wid)
    need(len(supported)==12 and outside==[793155013,793155015],'Review changed declared road classes')
    roads=[ways[wid] for wid in supported];rnids={p[0] for w in roads for p in w['nodes']}
    compiled=compile_graph(roads,[nodes[nid] for nid in sorted(rnids)],[controls[rid] for rid in sorted(controls)],default_policy=DEFAULTS)
    need(compiled['graph'] is not None,'Every supplied road/control must compile before query replay')
    graph=compiled['graph'];need(len(graph['nodes'])==45 and len(graph['arcs'])==65 and len(graph['maneuvers'])==3,'Review changed expanded model universe')
    previous=json.loads((FOCUSED/'report.json').read_text());summary={};replays={};witnesses={}
    prior_patterns=[previous['individual_restriction_compilations']['10475907']['active_pattern']]
    for metric in ('length','travel_time'):
        counts=dict(queries=0,old_finite=0,new_finite=0,newly_finite=0,shorter=0,unchanged_cost=0);examples=[]
        for source in previous['focused_nodes']:
            for target in previous['focused_nodes']:
                baseline=solve(previous['focused_nodes'],previous['focused_arcs'],prior_patterns,source,target,metric)
                answer=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source,target,metric)
                before_cost=exact_cost(baseline);after_cost=exact_cost(answer)
                need(before_cost is None or after_cost is not None and after_cost<=before_cost,'Adding source context must preserve every old feasible cost')
                counts['queries']+=1;counts['old_finite']+=before_cost is not None;counts['new_finite']+=after_cost is not None
                counts['shorter']+=before_cost is not None and after_cost is not None and after_cost<before_cost
                counts['unchanged_cost']+=before_cost==after_cost
                if before_cost is None and after_cost is not None:
                    counts['newly_finite']+=1
                    if len(examples)<3:examples.append(dict(old_local_result=baseline,expanded_local_result=answer))
        need(counts==dict(queries=361,old_finite=154,new_finite=246,newly_finite=92,shorter=0,unchanged_cost=269),
             'Review changed finite/NoData behavior in the declared expanded universe')
        summary[metric]=counts;witnesses[metric]=examples
        q=previous['focused_query'];replay=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],q['source'],q['target'],metric)
        need(replay['cost'] is None,'Protected original no-left-turn query stays local NoData');replays[metric]=replay
    need(corpus==before,'Original raw records cannot be mutated')
    return dict(schema='fort-collins-guidance-query-incidence-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),focused_report_sha256=file_sha(FOCUSED/'report.json'),
        source_context_sha256=canonical_sha(corpus),source_identity=corpus['source'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_source_incidence.py',
            'fort_collins_guidance_query_incidence.py','fort_collins_guidance_incidence_checkpoint.py',
            'road_guidance_mixed_graph.py','road_guidance_segments.py','road_guidance_way_permissions.py',
            'road_static_lane_guidance.py','guidance_via_node_compile.py','reference_via_way_compile.py','road_maneuver_probe.py')},
        source_seed_nodes=19,previously_enumerated_seed_nodes=len(set(seeds)&set(old['seed_node_ids'])),
        newly_enumerated_seed_nodes=len(set(seeds)-set(old['seed_node_ids'])),incident_ways=10,
        explicit_member_way_ids=sorted(ADDITIONAL_WAYS),complete_source_ways=14,complete_source_nodes=58,
        touching_controls=3,unenumerated_outer_nodes=len(wanted-set(seeds)),
        supported_road_ids=supported,outside_declared_road_class_ids=outside,road_graph_nodes=45,weighted_arcs=65,
        weight_projection_sha256=projections,declared_compilation=compiled,focused_pair_comparison=summary,
        newly_finite_local_witnesses=witnesses,protected_original_query_replays=replays,
        unknown_controls_omitted=False,all_graph_node_incidence_enumerated=False,geographic_coverage_certified=False,
        independent_maneuver_geometry_verified=False,access_verified=False,anchors_adopted=False,
        connector_costs_included=False,release_eligible=False,
        warning='Source incidence is enumerated only at the 19 named nodes. All touching controls and complete requested member context are retained, but 39 outer member nodes remain unenumerated. The declared 12-road graph is not a complete geographic graph or actual access certificate. Newly finite paths prove that earlier two-way NoData was local model reachability, not geographic disconnection. No physical/legal access, lane connectivity, approved connectors, adopted anchors or public release is asserted; the separate larger bollard-bearing candidate remains unsupported.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen focused incidence report differs')
    print({key:result[key] for key in ('source_seed_nodes','newly_enumerated_seed_nodes','complete_source_ways',
        'complete_source_nodes','touching_controls','unenumerated_outer_nodes','road_graph_nodes','weighted_arcs','focused_pair_comparison')})
