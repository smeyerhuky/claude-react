"""Bind a conditional query-cut bound to enumerated source incidence, not physical access."""
import argparse
from fractions import Fraction
import hashlib
import json
from road_core_exit_bounds import screen_first_exits
from fort_collins_frontier_checkpoint import project as frontier_project,REFERENCE as FRONTIER_REFERENCE,CONTEXT
from reference_declared_graph_checkpoint import project as incumbent_project,REFERENCE as INCUMBENT_REFERENCE
from reference_seed_incidence import ROOT,need
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_reference_segment_costs import project as weights
from road_reference_mixed_graph import compile_graph
from road_reference_scenario import digest,load
from reference_via_node_compile import canonical_sha
from road_maneuver_probe import solve

REFERENCE=ROOT/'docs/research/fort-collins-query-cut'


def file_sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def core_inputs(core_ids,context=None):
    need(isinstance(core_ids,(list,tuple)) and 1<=len(core_ids)<=2000
         and all(type(nid) is int and nid>0 for nid in core_ids) and len(set(core_ids))==len(core_ids),
         'Explicit unique bounded positive core node IDs required')
    context=json.loads(CONTEXT.read_text()) if context is None else context
    frontier_project(context)  # Retain the wider blocked-candidate/unknown-road audit unchanged.
    core=set(core_ids);enumerated=set(context['seed_node_ids'])
    need(core and core<=enumerated,'Every core node requires completed original-source incidence enumeration')
    ways={way['id']:way for way in context['ways']};nodes={node['id']:node for node in context['nodes']}
    incident={wid for nid in core for wid in context['all_source_way_ids_at_seed_nodes'][str(nid)]}
    roads=[];outside=[];arcs=[];projections={}
    for wid in sorted(incident):
        way=ways[wid]
        if way['tags'].get('highway') not in HIGHWAYS:
            outside.append(wid);continue
        ids={p[0] for p in way['nodes']};value=weights(way,[nodes[nid] for nid in sorted(ids)],default_policy=DEFAULTS)
        need(value['status']=='supported_segment_weights','Unknown incident car-road control cannot be omitted from a query cut')
        roads.append(way);arcs+=value['arcs'];projections[str(wid)]=canonical_sha(value)
    wanted={p[0] for way in roads for p in way['nodes']}
    relations=[r for r in context['restrictions'] if any(m['type']=='w' and m['ref'] in incident for m in r['members'])]
    compiled=compile_graph(roads,[nodes[nid] for nid in sorted(wanted)],relations,default_policy=DEFAULTS,
        relation_zones={'20193102':'America/Denver'} if any(r['id']==20193102 for r in relations) else {})
    need(compiled['status']=='compiled_declared_mixed_graph','Every supplied incident relation must compile before checking an incumbent')
    return dict(nodes=sorted(wanted),arcs=arcs,model_graph=compiled['graph'],
        model_graph_sha256=compiled['graph_sha256'],way_projection_sha256=projections,
        all_source_incident_way_ids=sorted(incident),incident_model_way_ids=[way['id'] for way in roads],
        outside_declared_road_class_incident_way_ids=outside)


def project():
    frontier=frontier_project();parent_path=FRONTIER_REFERENCE/'report.json'
    need(frontier==json.loads(parent_path.read_text()),'Exact frozen expanded-frontier report required')
    incumbent=incumbent_project();incumbent_path=INCUMBENT_REFERENCE/'report.json'
    need(incumbent==json.loads(incumbent_path.read_text()),'Exact frozen original tiny-kernel queries required')
    initial=set(incumbent['original_member_way_ids'])
    context=json.loads(CONTEXT.read_text())
    base=sorted({p[0] for way in context['ways'] if way['id'] in initial for p in way['nodes']})
    absorbed=sorted(set(base)|{7416599515,6543050323})
    need(len(base)==8 and len(absorbed)==10,'Review changed source-bound core scope')
    cases={}
    for name,core in [('original_eight_node_core',base),('garage_branch_included_core',absorbed)]:
        inputs=core_inputs(core,context);by_arc={arc['id']:arc for arc in inputs['arcs']};metrics={}
        for metric in ('length','travel_time'):
            old=incumbent['query_replays'][f'adopted_reference:{metric}:forward']['result']
            total=sum((Fraction.from_float(by_arc[aid][metric]) for aid in old['arc_path']),Fraction(0))
            upper=Fraction(*map(int,old['exact_stored_path_cost']))
            need(total==upper,'The complete stored incumbent path cost must replay exactly')
            # Feasibility is checked against all declared incident constraints;
            # the bound helper itself still ignores constraints only for LOWER bounds.
            replay=solve(inputs['model_graph']['nodes'],inputs['model_graph']['arcs'],inputs['model_graph']['maneuvers'],old['source'],old['target'],metric)
            need(replay['arc_path']==old['arc_path'] and replay['exact_stored_path_cost']==old['exact_stored_path_cost'],
                 'Declared incumbent must retain exact path/cost with incident controls')
            result=screen_first_exits(inputs['nodes'],inputs['arcs'],core,old['source'],old['target'],metric=metric,incumbent_upper_bound=upper)
            need(result['conditional_exterior_routes_cannot_improve']==(name=='garage_branch_included_core'),
                 'Review changed conditional first-exit screening scope')
            if name=='garage_branch_included_core':
                need(result['reachable_first_exits']==2,'Exact two reachable first exits required')
            metrics[metric]=result
        cases[name]=dict(core_node_ids=core,original_source_incidence_enumerated_at_core=True,
            source_memberships={str(nid):context['all_source_way_ids_at_seed_nodes'][str(nid)] for nid in core},
            all_source_incident_way_ids=inputs['all_source_incident_way_ids'],incident_model_way_ids=inputs['incident_model_way_ids'],
            outside_declared_road_class_incident_way_ids=inputs['outside_declared_road_class_incident_way_ids'],
            model_graph_sha256=inputs['model_graph_sha256'],way_projection_sha256=inputs['way_projection_sha256'],metrics=metrics)
    return dict(schema='fort-collins-conditional-query-cut-v1',scenario_sha256=digest(load()),
        frontier_report_sha256=file_sha(parent_path),frontier_context_sha256=file_sha(CONTEXT),
        incumbent_report_sha256=file_sha(incumbent_path),cores=cases,
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('road_core_exit_bounds.py','fort_collins_query_cut_checkpoint.py','metro_competition_bounds.py','road_reference_mixed_graph.py',
             'road_reference_declared_graph.py','road_reference_segment_costs.py','road_reference_way_permissions.py',
             'road_reference_segment_permissions.py','road_reference_scenario.py','road_maneuver_probe.py')},
        wider_candidate_status=frontier['road_model_preflight']['status'],wider_candidate_graph=None,
        retained_unknown_model_road_ids=frontier['unknown_model_road_ids'],
        conditional_only=True,applied_exterior_route_exclusions=[],global_route_optimality_certified=False,
        geographic_coverage_certified=False,incumbent_physical_access_certified=False,
        route_query_result_returned=False,access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        unscreened_cases=['reverse query','active-window regression','other endpoints','metro/anchor or attachment costs','other source/model completions'],
        warning='Only a conditional first-exit argument for the existing unconstrained raw-node forward query. The eight-node core leaves a potentially competitive garage-service exit. Explicitly including its two source-enumerated nodes makes all remaining first-exit prefixes strictly exceed the retained incumbent for both metrics, assuming unchanged incident transitions/model and nonnegative continuation costs. No global speed ceiling or geometric-distance bound is inferred. Outside-class building/footway records remain retained context, not proof of real-world car exclusion. The full wider candidate remains blocked by the unresolved bollard; no graph, new query, public region, connector approval or geographic/global-access certificate is returned.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:
        path.parent.mkdir(parents=True,exist_ok=True);path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen conditional query-cut report differs')
    print(dict(conditional_only=True,source_enumerated_core_nodes=[8,10],
        absorbed_core_reachable_first_exits=2,metrics=['length','travel_time'],
        wider_candidate_still_blocked=True,geographic_coverage_certified=False,access_verified=False))
