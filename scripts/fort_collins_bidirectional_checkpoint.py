"""Freeze both native query directions without transposing directed model costs."""
import argparse
import json
from fort_collins_core_exclusion_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_bounded_frontier import diagnostic_inputs,RAW_PARENT
from fort_collins_inert_bounds_checkpoint import account_declarations,WITNESS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_partition_checkpoint import RELATION_ZONES
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS
from road_posted_speed_graph import query,MAX_WAYS
from road_maneuver_probe import solve
from road_witness_core_exclusion import certify
from reference_via_node_compile import need,canonical_sha

REFERENCE=ROOT/'docs/research/fort-collins-bidirectional-query-bounds'


def evaluate_witness(nodes,known,possible,patterns,core,source,target,metric,path,expected_cost):
    value=certify(nodes,known,possible,patterns,core,source,target,path,metric)
    need(value['interior_supported_witness']['stored_cost_exact']==expected_cost,
         'Witness cost must be independently replayed in its exact named direction and metric')
    need(value['conditional_retained_cost_stable_with_nonnegative_exterior'] and value['may_compete_or_tie_count']==0,
         'Review changed directional finite/exterior cost bounds')
    return value


def project():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen source-bound 294-node parent required')
    union=baseline['reconciled_source'];nodes,known,possible,_,roads,_=diagnostic_inputs(union);core=union['seed_node_ids']
    raw=json.loads((RAW_PARENT/'report.json').read_text());patterns,accounting=account_declarations(union,raw['individual_restriction_compilations'],known,possible)
    need(MAX_WAYS==100 and len(roads)==107 and len(known)==869 and len(possible)==32 and len(accounting)==15,
         'No strict limit, source record or supplied control may change')
    original=json.loads((WITNESS/'report.json').read_text())['query_replays'];first=original['length']
    directions={'forward':(first['source'],first['target']),'reverse':(first['target'],first['source'])}
    matrix={};reverse_walks={};strict_queries={};by_node={n['id']:n for n in union['nodes']}
    for direction,(source,target) in directions.items():
        matrix[direction]={};strict_queries[direction]={}
        for metric in ('length','travel_time'):
            if direction=='forward':
                witness=original[metric]
            else:
                # This only proposes an explicit supported walk. The separate
                # certificate independently checks its geometry/history/cost.
                witness=solve(nodes,known,patterns,source,target,metric)
                need(witness['exact_stored_path_cost'] is not None,'A supported reverse witness is required; no partial matrix or modeled NoData')
                reverse_walks[metric]=dict(source=source,target=target,metric=metric,arc_path=witness['arc_path'],
                    exact_stored_path_cost=witness['exact_stored_path_cost'],proposal_sha256=canonical_sha(witness),
                    source_approach=witness['source_approach'],normal_graph_admitted=False,access_verified=False,release_eligible=False)
            certificate=evaluate_witness(nodes,known,possible,patterns,core,source,target,metric,witness['arc_path'],witness['exact_stored_path_cost'])
            need(certificate['first_exit_count']==47 and certificate['reachable_first_exit_count']==46,'Review changed directional first-exit set')
            if direction=='forward':need(certificate==baseline['conditional_query_exclusions'][metric],'Earlier forward certificates must remain exact')
            matrix[direction][metric]=certificate
            answer=query(roads,[by_node[n] for n in nodes],union['control_relations'],source,target,metric,
                default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
            need(answer['status']=='unsupported' and answer['result'] is None and not answer['route_cost_emitted'],
                 'Both strict query directions must remain budget-rejected without a fallback cost')
            strict_queries[direction][metric]=answer
    for metric in ('length','travel_time'):
        need(matrix['forward'][metric]['interior_supported_witness']['stored_cost_exact']!=matrix['reverse'][metric]['interior_supported_witness']['stored_cost_exact'],
             'Review changed directional asymmetry; never transpose the forward costs')
    return dict(schema='source-bound-bidirectional-native-query-cost-bounds-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=canonical_sha(union),
        source_evidence_binding=baseline['source_evidence_binding'],source_identity=baseline['source_identity'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('fort_collins_bidirectional_checkpoint.py',
            'fort_collins_core_exclusion_checkpoint.py','road_witness_core_exclusion.py','road_opaque_control_bounds.py',
            'road_maneuver_probe.py','fort_collins_inert_bounds_checkpoint.py','road_posted_speed_graph.py')},
        named_directions={name:dict(source=a,target=b) for name,(a,b) in directions.items()},
        query_count=4,conditional_query_matrix=matrix,reverse_supported_walk_proposals=reverse_walks,
        directional_costs_transposed=False,original_forward_certificates_preserved=True,
        strict_way_budget=MAX_WAYS,declared_road_candidate_ways=107,strict_queries=strict_queries,
        source_seed_nodes=294,raw_source_ways=179,retained_declarations=15,active_compiled_patterns=13,
        inactive_compiled_declarations=1,inert_no_prohibitions=1,known_supported_arcs=869,possible_geometry_arcs=32,
        unenumerated_outer_source_nodes=603,source_approach='unconstrained-declared-node-start',
        source_replay_required=True,source_replay_verified_in_this_process=False,
        outside_nonnegativity_is_a_domain_assumption=True,unseen_core_attachments_covered=False,
        connector_approach_history_modeled=False,limits_changed=False,normal_graph_admitted=False,
        route_query_result_returned=False,modeled_nodata_emitted=False,applied_exterior_route_exclusions=[],
        global_route_optimality_certified=False,geographic_coverage_certified=False,actual_access_verified=False,
        gate_state_assumed=False,whole_way_turn_permission_assumed=False,anchors_adopted=False,
        connector_costs_included=False,release_eligible=False,
        warning='Each direction and metric has its own independently replayed supported interior witness and conditional exact exterior bound. Reversing a query does not transpose costs or authorize travel. The source-bound completion domain, unconstrained native-node start, fixed scenario, nonnegative outside assumption and original-source replay requirement are inherited unchanged. The strict 107-way graph remains unsupported at its 100-way budget; connector approach/history, physical/legal access, anchors, other metros, geographic masks and public release are not approved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args();r=project();p=REFERENCE/'report.json'
    if args.write:p.write_text(json.dumps(r,indent=2,sort_keys=True)+'\n')
    elif json.loads(p.read_text())!=r:raise ValueError('Frozen bidirectional native query bounds differ')
    print(dict(queries=4,directions=list(r['named_directions']),conditional_native_bounds=True,normal_graph_admitted=False,actual_access_verified=False))
