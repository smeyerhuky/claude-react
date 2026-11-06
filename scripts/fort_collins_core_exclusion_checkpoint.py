"""Bind source incidence and supported witnesses to a conditional native-core exclusion."""
import argparse
import json
from fort_collins_core_exclusion_source import inputs,REFERENCE,PARENT
from fort_collins_bounded_frontier import diagnostic_inputs,select,RAW_PARENT
from fort_collins_inert_bounds_checkpoint import account_declarations,WITNESS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_partition_checkpoint import RELATION_ZONES
from road_reference_scenario import ROOT,load,digest
from road_source_partition_union import join_partitions
from road_posted_speed_graph import compile_graph,query,MAX_WAYS
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_witness_core_exclusion import certify
from reference_via_node_compile import need,canonical_sha


def project(captures=None):
    baseline,required,layout=inputs()
    captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)] if captures is None else captures
    need(isinstance(captures,list) and len(captures)==2,'Exactly two original bounded source captures required')
    for i,c in enumerate(captures):
        need(c['seed_node_ids']==layout[i]['seed_node_ids'] and c['requested_member_way_ids']==layout[i]['requested_member_way_ids'],
             'Exact declared core inspection partitions required')
    union=join_partitions(captures)
    need(union['source']==baseline['source_identity'],'The core evidence must bind the same exact original source')
    for kind in ('ways','nodes','control_relations'):
        by={r['id']:r for r in union[kind]}
        need(all(by.get(r['id'])==r for r in baseline['reconciled_source'][kind]),'Every earlier whole raw record must remain exactly preserved')
    core=union['seed_node_ids']
    need(len(core)==294 and len(union['ways'])==179 and len(union['nodes'])==897 and len(union['control_relations'])==15
         and union['all_retained_way_and_node_members_present'],'Complete source/core/control reconciliation required')
    # Retain ALL raw classes. The exclusion concerns only this declared car model.
    outside=[w['id'] for w in union['ways'] if w['tags'].get('highway') not in HIGHWAYS]
    nodes,known,possible,catalogues,roads,projections=diagnostic_inputs(union)
    need(MAX_WAYS==100 and len(roads)==107 and len(nodes)==498 and len(known)==869 and len(possible)==32
         and set(catalogues)=={'201855578','1216151141'},'Keep strict limits and both original unknown whole ways unchanged')
    by_node={n['id']:n for n in union['nodes']};local=[by_node[n] for n in nodes]
    strict=compile_graph(roads,local,union['control_relations'],default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
    need(strict['graph'] is None and strict['reason']=='Bounded complete raw way list required','Strict API must retain atomic budget rejection')
    raw=json.loads((RAW_PARENT/'report.json').read_text());patterns,accounting=account_declarations(union,raw['individual_restriction_compilations'],known,possible)
    need(len(accounting)==15 and len(patterns)==13 and accounting['11978581']['kind']=='oneway_inert_no_prohibition','Every original declaration must remain explicitly accounted')
    witness=json.loads((WITNESS/'report.json').read_text());certificates={};queries={};bounds={}
    for metric,q in witness['query_replays'].items():
        answer=query(roads,local,union['control_relations'],q['source'],q['target'],metric,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
        need(answer['status']=='unsupported' and answer['result'] is None and not answer['route_cost_emitted'],'Strict queries cannot emit a fallback cost or modeled NoData')
        queries[metric]=answer
        certificate=certify(nodes,known,possible,patterns,core,q['source'],q['target'],q['arc_path'],metric)
        need(certificate['conditional_retained_cost_stable_with_nonnegative_exterior']
             and certificate['interior_supported_witness']['stored_cost_exact']==q['exact_stored_path_cost']
             and certificate['first_exit_count']==47 and certificate['reachable_first_exit_count']==46
             and certificate['may_compete_or_tie_count']==0,'Review changed exact conditional core exclusion')
        certificates[metric]=certificate;bounds[metric]=certificate['finite_model_bracket']
    selection=select(union,bounds);need(selection['selected_source_node_ids']==core,'No still-competitive known node may remain uninspected')
    source_binding=dict(source_identity=union['source'],source_context_sha256=canonical_sha(union),core_node_ids=core,
        source_capture_sha256=[canonical_sha(c) for c in captures],incidence_sha256=canonical_sha(union['all_source_way_ids_at_seed_nodes']),
        source_seed_incidence_assertions_reconciled=True,source_replay_required=True,source_replay_verified_in_this_process=False,
        all_core_incident_raw_way_records_retained=True,all_touching_declared_controls_accounted=True,
        car_model_classes=sorted(HIGHWAYS),outside_model_class_way_ids=outside,outside_class_is_legal_access_exclusion=False,
        default_policy=DEFAULTS,scenario_sha256=digest(load()),declaration_accounting_sha256=canonical_sha(accounting),
        supported_and_possible_arc_universe_sha256=canonical_sha(dict(nodes=nodes,known=known,possible=possible,patterns=patterns)),
        adjacency_contract='Original native OSM node/adjacent-vertex identity only; no extra interior/intersection/connector attachments. Every raw incident way at every core seed must reproduce against the exact named PBF. Known member permissions/weights/scenario stay fixed; all unknown eligible way geometry is retained in the relaxation.',
        geographic_coverage_certified=False,actual_access_verified=False,release_eligible=False)
    return dict(schema='source-bound-conditional-native-core-exit-exclusion-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),witness_report_sha256=file_sha(WITNESS/'report.json'),
        partition_layout_sha256=file_sha(REFERENCE/'partition-layout.json'),source_identity=union['source'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('fort_collins_core_exclusion_source.py',
            'fort_collins_core_exclusion_checkpoint.py','road_witness_core_exclusion.py','road_core_exit_bounds.py',
            'road_source_partition_union.py','fort_collins_bounded_frontier.py','fort_collins_inert_bounds_checkpoint.py',
            'road_inert_no_prohibition.py','road_opaque_control_bounds.py','road_posted_speed_graph.py','road_posted_speed_weights.py')},
        reconciled_source=union,source_evidence_binding=source_binding,prior_required_inspection_selection=required,
        final_inspection_selection=selection,source_partition_way_counts=[len(c['ways']) for c in captures],
        source_partition_seed_counts=[len(c['seed_node_ids']) for c in captures],source_seed_nodes=294,raw_source_ways=179,
        complete_source_nodes=897,unenumerated_outer_source_nodes=603,declared_road_candidate_ways=107,declared_road_candidate_nodes=498,
        known_supported_arcs=869,possible_geometry_arcs=32,individual_weight_projection_sha256=projections,
        opaque_way_geometry_catalogues=catalogues,declaration_accounting=accounting,retained_declarations=15,
        active_compiled_patterns=13,inactive_compiled_declarations=1,inert_no_prohibitions=1,
        strict_way_budget=MAX_WAYS,limits_changed=False,strict_compilation=strict,strict_queries=queries,
        conditional_query_exclusions=certificates,conditional_native_model_exterior_exclusion=True,
        outside_nonnegativity_is_a_domain_assumption=True,unseen_core_attachments_covered=False,
        original_source_replayed_in_this_process=False,normal_graph_admitted=False,route_query_result_returned=False,
        modeled_nodata_emitted=False,applied_exterior_route_exclusions=[],global_route_optimality_certified=False,
        geographic_coverage_certified=False,actual_access_verified=False,gate_state_assumed=False,whole_way_turn_permission_assumed=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Only the two exact native-node model queries are conditionally bounded against exterior detours, subject to original-source replay, unchanged declared model permissions/weights/attachments and nonnegative exterior continuation. Each of 46 reachable exits strictly exceeds its validated interior witness; one unreachable exit remains explicit. Exact ties would block exclusion. The 107-way strict API remains budget-rejected; gate/turn access, actual geography, other origins/metros, masks, independently reviewed anchors and public release are not approved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args();r=project();p=REFERENCE/'report.json'
    if args.write:p.write_text(json.dumps(r,indent=2,sort_keys=True)+'\n')
    elif json.loads(p.read_text())!=r:raise ValueError('Frozen source-bound core exclusion differs')
    print(dict(source_seeds=294,raw_ways=179,roads=107,strict_way_budget=100,reachable_exits_per_metric=46,
        conditional_native_model_exterior_exclusion=True,geographic_coverage_certified=False,actual_access_verified=False))
