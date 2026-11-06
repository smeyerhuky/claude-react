"""Keep strict budget rejection separate from a bounded finite-cost certificate."""
import argparse
import json
from fort_collins_bounded_frontier import inputs,diagnostic_inputs,select,REFERENCE,PARENT,RAW_PARENT
from fort_collins_inert_bounds_checkpoint import account_declarations,WITNESS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_partition_checkpoint import RELATION_ZONES
from road_source_partition_union import join_partitions
from road_posted_speed_graph import compile_graph,query,MAX_WAYS
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS
from road_opaque_control_bounds import bracket_cost,MAX_NODES,MAX_ARCS
from reference_via_node_compile import need,canonical_sha


def project(captures=None):
    raw,baseline,selection,layout=inputs()
    captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)] if captures is None else captures
    need(isinstance(captures,list) and len(captures)==2,'Exactly two bounded source captures required')
    for i,c in enumerate(captures):
        need(c['seed_node_ids']==layout[i]['seed_node_ids'] and c['requested_member_way_ids']==layout[i]['requested_member_way_ids'],
             'Every selected seed and explicit raw member must match its declared inspection partition')
    union=join_partitions(captures)
    for kind in ('ways','nodes','control_relations'):
        by={r['id']:r for r in union[kind]}
        need(all(by.get(r['id'])==r for r in raw['reconciled_source'][kind]),'Every earlier whole source record must remain exactly preserved')
    need(union['seed_node_ids']==selection['selected_source_node_ids'] and len(union['ways'])==171 and len(union['nodes'])==877
         and len(union['control_relations'])==15 and union['all_retained_way_and_node_members_present'],'Complete bounded source/member reconciliation required')
    nodes,known,possible,catalogues,roads,projections=diagnostic_inputs(union)
    need(MAX_WAYS==100 and len(roads)==106 and len(roads)>MAX_WAYS,'Keep the original strict raw-way budget unchanged')
    need(MAX_NODES==2000 and MAX_ARCS==4000 and len(nodes)<=MAX_NODES and len(known)+len(possible)<=MAX_ARCS,
         'Keep the separately bounded diagnostic input contract unchanged')
    need(len(nodes)==493 and len(known)==857 and len(possible)==32 and set(catalogues)=={'201855578','1216151141'},
         'Retain both unknown whole ways and every supported individual weight')
    by_node={n['id']:n for n in union['nodes']};local=[by_node[n] for n in nodes]
    strict=compile_graph(roads,local,union['control_relations'],default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
    need(strict['status']=='unsupported' and strict['graph'] is None and strict['reason']=='Bounded complete raw way list required',
         'The strict API must reject before graph admission; budget rejection resolves no control semantics')
    witness=json.loads((WITNESS/'report.json').read_text());queries={}
    for metric,q in witness['query_replays'].items():
        answer=query(roads,local,union['control_relations'],q['source'],q['target'],metric,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
        need(answer['status']=='unsupported' and answer['result'] is None and not answer['route_cost_emitted'],
             'Strict queries must emit no route, fallback cost or modeled NoData')
        queries[metric]=answer
    patterns,accounting=account_declarations(union,raw['individual_restriction_compilations'],known,possible)
    need(len(accounting)==15 and len(patterns)==13 and accounting['11978581']['kind']=='oneway_inert_no_prohibition',
         'All original declarations, including inactive and inert controls, must stay explicitly accounted')
    brackets={}
    for metric,q in witness['query_replays'].items():
        value=bracket_cost(nodes,known,possible,patterns,q['source'],q['target'],q['arc_path'],metric)
        need(value['supported_witness_upper_bound_exact']==q['exact_stored_path_cost'] and value['conditional_stored_cost_stable_within_supplied_universe']
             and not value['optimistic_walk_uses_possible_geometry'],'Review changed conditional stored costs')
        brackets[metric]=value
    next_selection=select(union,brackets)
    need(len(next_selection['selected_source_node_ids'])==293,'Review changed next source-inspection scope')
    return dict(schema='strict-budget-rejection-and-separate-finite-cost-bounds-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),raw_parent_report_sha256=file_sha(RAW_PARENT/'report.json'),
        witness_report_sha256=file_sha(WITNESS/'report.json'),source_identity=union['source'],
        partition_layout_sha256=file_sha(REFERENCE/'partition-layout.json'),source_capture_sha256=[canonical_sha(c) for c in captures],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('fort_collins_bounded_frontier.py',
            'fort_collins_bounded_frontier_checkpoint.py','road_source_partition_union.py','road_competitive_core.py',
            'fort_collins_inert_bounds_checkpoint.py','road_inert_no_prohibition.py','road_posted_speed_graph.py',
            'road_posted_speed_weights.py','road_opaque_control_bounds.py')},
        source_inspection_selection=selection,next_source_inspection_selection=next_selection,reconciled_source=union,
        source_partition_way_counts=[len(c['ways']) for c in captures],source_partition_seed_counts=[len(c['seed_node_ids']) for c in captures],
        strict_way_budget=MAX_WAYS,per_capture_way_budget=100,source_union_way_budget=200,diagnostic_node_budget=MAX_NODES,diagnostic_arc_budget=MAX_ARCS,
        limits_changed=False,source_seed_nodes=283,raw_source_ways=171,complete_source_nodes=877,unenumerated_outer_source_nodes=594,
        declared_road_candidate_ways=106,declared_road_candidate_nodes=493,known_supported_arcs=857,possible_geometry_arcs=32,
        individual_weight_projection_sha256=projections,opaque_way_geometry_catalogues=catalogues,declaration_accounting=accounting,
        retained_declarations=15,active_compiled_patterns=13,inactive_compiled_declarations=1,inert_no_prohibitions=1,
        strict_compilation=strict,strict_queries=queries,strict_rejection_is_budget_only=True,
        strict_budget_rejection_resolves_other_control_semantics=False,strict_query_api_changed=False,strict_query_cost_emitted=False,
        separate_finite_model_brackets=brackets,inertness_precondition=baseline['inertness_precondition'],
        whole_raw_records_preserved=True,unknown_controls_omitted=False,gate_state_assumed=False,whole_way_turn_permission_assumed=False,
        normal_graph_admitted=False,route_query_result_returned=False,modeled_nodata_emitted=False,applied_exterior_route_exclusions=[],
        global_route_optimality_certified=False,geographic_coverage_certified=False,actual_access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='The 106-way candidate is rejected by the unchanged 100-way strict API before permissions are evaluated. This does not resolve its original gate or whole-way turn indication. A separately bounded finite diagnostic retains all source records and declarations, including the audited inert NO prohibition, and verifies unchanged exact cost brackets using hypothetical bidirectional zero-time unknown geometry. It does not admit a normal graph/query or certify coverage, physical/legal access, anchors or release. Further source inspection is required at ten selected nodes; all independent access and geographic/public release gates remain intact.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args();result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen bounded cost frontier differs')
    print(dict(source_seeds=283,raw_ways=171,roads=106,strict_way_budget=100,strict_status=result['strict_compilation']['status'],
        finite_cost_stability={m:r['conditional_stored_cost_stable_within_supplied_universe'] for m,r in result['separate_finite_model_brackets'].items()},
        normal_graph_admitted=False,access_verified=False))
