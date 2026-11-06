"""Audit source-expanded competitive cores without claiming exterior or access closure."""
import argparse
import copy
from fractions import Fraction
import json
from fort_collins_competitive_core import inputs,REFERENCE,PARENT,ADDITIONAL_WAYS
from fort_collins_guidance_frontier_checkpoint import SOURCE as PRIOR_SOURCE
from fort_collins_control_checkpoint import ROOT,CONTEXT as RETAINED,FALSE_FLAGS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_frontier_checkpoint import index
from road_source_incidence import need
from road_reference_way_permissions import HIGHWAYS,DEFAULTS
from road_posted_speed_weights import weights
from road_guidance_way_permissions import evaluate
from road_posted_speed_graph import compile_graph,query
from road_core_exit_bounds import screen_first_exits
from road_reference_scenario import load,digest
from reference_via_node_compile import canonical_sha

SOURCE=REFERENCE/'source-context.json'
RELATION_ZONES={'20193102':'America/Denver'}


def exact(answer):return Fraction(*map(int,answer['exact_stored_path_cost']))


def project(corpus=None):
    parent,selection=inputs();prior=json.loads(PRIOR_SOURCE.read_text());retained=json.loads(RETAINED.read_text())
    corpus=json.loads(SOURCE.read_text()) if corpus is None else corpus;before=copy.deepcopy(corpus)
    need(set(corpus)==set(prior) and corpus['schema']==prior['schema'] and corpus['source']==prior['source']
         and corpus['bounds']==prior['bounds'],'Exact original-source identity, schema and unchanged bounds required')
    seeds=selection['selected_source_node_ids']
    need(corpus['seed_node_ids']==seeds and corpus['requested_member_way_ids']==sorted(ADDITIONAL_WAYS),
         'Exact known-core selection and complete requested member context required')
    need(corpus['source_seed_incidence_enumerated'] is True and corpus['all_retained_way_and_node_members_present'] is True
         and all(corpus[key] is False for key in FALSE_FLAGS),'Source incidence is not geographic/semantic/access approval')
    ways=index(corpus['ways'],{'id','tags','nodes'},100);nodes=index(corpus['nodes'],{'id','tags','lonlat'},2000)
    controls=index(corpus['control_relations'],{'id','tags','members'},100)
    need(len(ways)==76 and len(nodes)==343 and set(controls)=={r['id'] for r in retained['control_relations']},'Review changed complete source scope')
    for old in (prior,retained):
        for key,current in (('ways',ways),('nodes',nodes),('control_relations',controls)):
            previous={r['id']:r for r in old[key]}
            for rid in current.keys()&previous.keys():need(current[rid]==previous[rid],'Shared complete raw records must remain exact')
        if old is prior:
            for key,current in (('ways',ways),('nodes',nodes),('control_relations',controls)):
                need({row['id'] for row in old[key]}<=set(current),'Retain every prior source record')
    wanted={p[0] for w in ways.values() for p in w['nodes']}
    need(set(nodes)==wanted and set(seeds)<=wanted,'Every selected raw vertex needs a complete node record')
    incidence={str(nid):sorted(wid for wid,w in ways.items() if any(p[0]==nid for p in w['nodes'])) for nid in seeds}
    incident=sorted({wid for rows in incidence.values() for wid in rows})
    need(len(incident)==71 and corpus['incident_way_ids']==incident and corpus['all_source_way_ids_at_seed_nodes']==incidence
         and set(ways)==set(incident)|set(ADDITIONAL_WAYS),'Exact unfiltered incidence and explicit member accounting required')
    for nid,rows in prior['all_source_way_ids_at_seed_nodes'].items():need(incidence[nid]==rows,'Earlier source incidence cannot change')
    need(corpus['unenumerated_member_node_ids']==sorted(wanted-set(seeds)),'All remaining outer nodes must stay explicit')
    for key in ('missing_touching_relation_member_way_ids','missing_touching_relation_node_ids','referenced_relation_member_ids'):
        need(corpus[key]==[],'Complete retained control member context required')
    for control in controls.values():
        need(all(m['type']=='w' and m['ref'] in ways or m['type']=='n' and m['ref'] in nodes for m in control['members']),
             'All actual control members must exist; no omitted/nested semantics')
    roads=[];outside=[];projections={}
    for wid,way in sorted(ways.items()):
        local=[nodes[nid] for nid in sorted({p[0] for p in way['nodes']})]
        permission=evaluate(way,local,default_policy=DEFAULTS)
        need(permission['node_record_ids_match_way_geometry'],'Every retained way, including outside-class records, needs valid complete raw geometry')
        value=weights(way,local,default_policy=DEFAULTS);projections[str(wid)]=canonical_sha(value)
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        else:
            need(value['status']=='supported_segment_weights','Every supplied road control must be supported before composing a graph')
            roads.append(way)
    need(len(roads)==54 and len(outside)==22,'Review changed explicit car road classes')
    rnids={p[0] for w in roads for p in w['nodes']};localnodes=[nodes[nid] for nid in sorted(rnids)]
    relations=[controls[rid] for rid in sorted(controls)]
    compiled=compile_graph(roads,localnodes,relations,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
    need(compiled['graph'] is not None,'Every supplied original control must compile atomically before queries')
    graph=compiled['graph'];need(len(graph['nodes'])==216 and len(graph['arcs'])==359 and len(graph['maneuvers'])==9
        and len(graph['relation_compilations'])==10,'Review changed road/maneuver model scope')
    by_arc={a['id']:a for a in graph['arcs']};old_graph=parent['declared_compilation']['graph']
    need(all(a['id'] in by_arc and by_arc[a['id']]==a for a in old_graph['arcs']),'All 175 earlier weighted arcs must stay exact')
    need(graph['maneuvers']==old_graph['maneuvers'] and graph['scenario_sha256']==old_graph['scenario_sha256']
         and graph['cost_policy_sha256']==old_graph['cost_policy_sha256'],
         'Unchanged active maneuver, scenario and numeric policy required to preserve the old feasible incumbents')
    # Static via-way records have a different schema; identify the conditional
    # declaration through its original raw relation membership order.
    conditional=graph['relation_compilations'][graph['supplied_raw_relation_ids'].index(20193102)]
    need(conditional['topology_compiled'] and conditional['selection']['applies'] is False and conditional['active_pattern'] is None,
         'Inactive fixed-scenario conditional still requires complete geometry and its own zone')
    replays={};bounds={};old_path_costs={}
    for metric,old in parent['query_replays'].items():
        old_path_costs[metric]=sum((Fraction.from_float(by_arc[aid][metric]) for aid in old['arc_path']),Fraction(0))
        need(old_path_costs[metric]==exact(old),'The earlier full incumbent remains feasible with unchanged stored weights')
        answer=query(roads,localnodes,relations,old['source'],old['target'],metric,
                     default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
        need(answer['result'] is not None and answer['result']['cost'] is not None,'Expanded raw-input query must converge')
        current=answer['result'];need(exact(current)<=exact(old),'Adding source context may not lose the protected feasible cost')
        if metric=='length':need(exact(current)==exact(old) and current['arc_path']==old['arc_path'],'Protected shortest-distance replay must remain exact')
        else:need(exact(current)<exact(old) and current['arc_path']!=old['arc_path'],'Review changed faster modeled-time path')
        replays[metric]=current
        bound=screen_first_exits(graph['nodes'],graph['arcs'],seeds,current['source'],current['target'],
            metric=metric,incumbent_upper_bound=exact(current))
        need(len(bound['exits'])==30 and bound['reachable_first_exits']==29
             and sum(r['reason']=='may_compete_or_tie' for r in bound['exits'])==(15 if metric=='length' else 26)
             and bound['conditional_exterior_routes_cannot_improve'] is False,'New source context must not be mislabeled as closed geography')
        bounds[metric]=bound
    need(corpus==before,'Original raw geometry/tags cannot be mutated')
    tradeoff={name:{metric:float(sum((Fraction.from_float(by_arc[aid][metric]) for aid in replay['arc_path']),Fraction(0)))
        for metric in ('length','travel_time')} for name,replay in replays.items()}
    return dict(schema='fort-collins-source-expanded-competitive-core-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=canonical_sha(corpus),source_identity=corpus['source'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_competitive_core.py','road_core_exit_bounds.py',
            'fort_collins_competitive_core.py','fort_collins_competitive_checkpoint.py','road_source_incidence.py',
            'road_posted_speed_weights.py','road_posted_speed_graph.py','road_maneuver_probe.py')},
        known_graph_source_selection=selection,source_seed_nodes=96,newly_enumerated_source_nodes=51,incident_ways=71,
        requested_member_way_ids=sorted(ADDITIONAL_WAYS),complete_source_ways=76,complete_source_nodes=343,
        retained_controls=10,inactive_conditional_controls=1,unenumerated_outer_source_nodes=247,
        declared_roads=54,declared_road_nodes=216,weighted_arcs=359,unchanged_parent_weighted_arcs=175,
        outside_declared_road_class_ids=outside,weight_projection_sha256=projections,declared_compilation=compiled,
        query_replays=replays,metric_path_tradeoff=tradeoff,current_source_core_exit_bounds=bounds,
        relation_zones=RELATION_ZONES,unknown_controls_omitted=False,applied_exterior_route_exclusions=[],
        all_graph_node_incidence_enumerated=False,global_route_optimality_certified=False,geographic_coverage_certified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Known-graph saturation only selects source-inspection nodes. Original-source expansion exposes new competitive exits and a faster modeled-time route; distance and time use different paths. The 96-node source core still has 15 distance / 26 time first exits that may compete or tie, so no exterior exclusions or global optimum are certified. 247 outer source nodes remain unenumerated. Fixed-scenario declarations are not physical/legal access, lane/grade truth, reviewed anchors, approved connectors or public release. All older reports and public-map behavior remain unchanged.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen competitive source-core report differs')
    print(dict(source_seeds=96,source_ways=76,source_nodes=343,roads=54,road_nodes=216,arcs=359,controls=10,
        path_tradeoff=result['metric_path_tradeoff'],global_route_optimality_certified=False,access_verified=False))
