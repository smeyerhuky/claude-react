"""Bind an opaque-gate cost bracket without admitting the unsupported road graph."""
import argparse
import datetime
import json
import re
from urllib.parse import urlsplit
from fort_collins_partition_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_competitive_checkpoint import REFERENCE as WITNESS
from fort_collins_guidance_checkpoint import file_sha
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_posted_speed_weights import weights
from road_opaque_control_bounds import geometry_lower_bounds,bracket_cost
from reference_via_node_compile import canonical_sha
from road_source_incidence import need

REFERENCE=ROOT/'docs/research/fort-collins-gate-uncertainty'
SOURCES=REFERENCE/'source-observations.json'
URLS={
 'dda-west':('https://downtownfortcollins.com/alley-project/old-firehouse-alley-west','alley_design_context'),
 'dda-east':('https://downtownfortcollins.com/alley-project/old-firehouse-alley-east-and-seckner-alley','neighboring_alley_design_context'),
 'city-parking':('https://www.fortcollins.gov/Services/Parking/Where-to-Park','parking_garage_guidance')}


def validate_sources(value):
    need(value['schema']=='municipal-gate-context-observations-v1' and value['retrieval_method']=='direct_public_https'
         and all(value[k] is False for k in ('full_source_bodies_published','independent_access_evidence_approved',
             'actual_gate_state_established','access_verified','release_eligible')),'Municipal context cannot certify gate state or access')
    when=datetime.datetime.fromisoformat(value['captured_at_utc'])
    need(when.utcoffset()==datetime.timedelta(0),'Explicit UTC capture time required')
    rows=value['records'];need(len(rows)==3 and {r['name'] for r in rows}==set(URLS),'All three distinct source scopes required')
    for row in rows:
        expected,scope=URLS[row['name']];url=urlsplit(row['url'])
        need(row['url']==row['final_url']==expected and row['source_scope']==scope and url.scheme=='https'
             and not url.username and not url.password and row['http_status']==200,'Exact public primary-source provenance required')
        need(re.fullmatch('[0-9a-f]{64}',row['body_sha256']) and type(row['body_bytes']) is int and 0<row['body_bytes']<=2000000
             and isinstance(row['quote'],str) and 1<=len(row['quote'].split())<=25 and row['observation']
             and row['selected_excerpt_observed_in_captured_body'] is True,'Bounded inspectable excerpts and body fingerprint required')
        need(all(row[k] is False for k in ('exact_gate_operation_established','ordinary_car_gate_access_established','access_verified','release_eligible')),
             'Design/garage descriptions do not approve this gate')
    return value


def project():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen unsupported partition parent required')
    sources=validate_sources(json.loads(SOURCES.read_text()));union=baseline['reconciled_source'];by_node={n['id']:n for n in union['nodes']}
    known=[];catalogues={};unknown=[];road_nodes=set();roads=0
    for way in union['ways']:
        if way['tags'].get('highway') not in HIGHWAYS:continue
        ids={p[0] for p in way['nodes']};road_nodes|=ids;roads+=1;local=[by_node[n] for n in sorted(ids)]
        value=weights(way,local,default_policy=DEFAULTS)
        if value['arcs'] is not None:known.extend(value['arcs'])
        else:
            unknown.append(way['id']);catalogues[str(way['id'])]=geometry_lower_bounds(way,local,default_policy=DEFAULTS)
    need(roads==82 and len(known)==606 and unknown==[201855578],'No unknown road may be omitted or admitted through the diagnostic')
    potential=[a for catalogue in catalogues.values() for a in catalogue['potential_arcs']]
    need(len(potential)==12 and all(a['bound_only'] and a['modeled_permission'] is None and a['travel_time']==0 for a in potential),
         'Both-direction geometry and zero time remain hypothetical lower bounds')
    known_ids={a['id'] for a in known};patterns=[]
    for record in baseline['individual_restriction_compilations'].values():
        need(record['topology_compiled'] and set(record['declared_arc_sequence'])<=known_ids,
             'Every supplied declaration must resolve on supported members before bounding an opaque way')
        if record['active_pattern'] is not None:patterns.append(record['active_pattern'])
    witness=json.loads((WITNESS/'report.json').read_text());brackets={}
    for metric,old in witness['query_replays'].items():
        need(old['source_approach']=='unconstrained-declared-node-start','Exact same start-history contract required')
        result=bracket_cost(sorted(road_nodes),known,potential,patterns,old['source'],old['target'],old['arc_path'],metric)
        need(result['supported_witness_upper_bound_exact']==old['exact_stored_path_cost']
             and result['conditional_stored_cost_stable_within_supplied_universe'] is True
             and result['optimistic_walk_uses_possible_geometry'] is False,'Review changed conditional stored-cost bracket')
        brackets[metric]=result
    gate=baseline['gate_review_context'];need(gate['operation_status']=='unknown' and gate['field_evidence_obtained'] is False,
         'Gate operation remains unverified despite an equal cost bracket')
    endpoints={gate['complete_raw_way']['nodes'][0][0],gate['complete_raw_way']['nodes'][-1][0]}
    attachments=[dict(raw_way_id=w['id'],raw_name=w['tags'].get('name'),shared_node_ids=sorted(endpoints&{p[0] for p in w['nodes']}))
        for w in union['ways'] if w['id']!=gate['complete_raw_way']['id'] and endpoints&{p[0] for p in w['nodes']}]
    need({r['raw_way_id'] for r in attachments}=={524168682,1068300299},'Retain exact raw spur/end-point topology, not an inferred garage entry')
    return dict(schema='fort-collins-opaque-gate-stored-cost-bracket-v1',scenario_sha256=digest(load()),
        partition_parent_report_sha256=file_sha(PARENT/'report.json'),supported_witness_report_sha256=file_sha(WITNESS/'report.json'),
        source_context_sha256=canonical_sha(union),municipal_source_observations_sha256=file_sha(SOURCES),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_opaque_control_bounds.py',
            'fort_collins_gate_bounds_checkpoint.py','road_maneuver_probe.py','road_reference_segment_costs.py',
            'road_guidance_way_permissions.py','road_posted_speed_weights.py','road_posted_speed_graph.py')},
        strict_parent_status=baseline['full_candidate_compilation']['status'],strict_parent_graph=None,
        strict_parent_queries=baseline['full_candidate_queries'],gate_review_context=gate,raw_endpoint_attachments=attachments,
        source_scope_findings={r['name']:dict(url=r['url'],source_scope=r['source_scope'],exact_gate_operation_established=False)
            for r in sources['records']},known_supported_arcs=606,opaque_geometry_possibilities=12,active_known_maneuvers=len(patterns),
        opaque_way_geometry_catalogues=catalogues,metric_brackets=brackets,
        source_seed_nodes=177,unenumerated_outer_source_nodes=436,
        gate_state_assumed=False,strict_profile_or_source_tags_changed=False,normal_graph_admitted=False,
        route_query_result_returned=False,applied_exterior_route_exclusions=[],global_route_optimality_certified=False,
        geographic_coverage_certified=False,actual_access_verified=False,anchors_adopted=False,
        connector_costs_included=False,release_eligible=False,
        warning='Equal exact brackets show that the two retained query costs do not depend on opaque gate operation within the stated finite stored-weight completion domain. Potential geometry is not a feasible route or a gate-open/closed decision. The strict wider graph remains unsupported; no normal query result or geographic/global optimum is admitted. Municipal alley-design and garage guidance do not establish operation of the exact retained gate. Independent access/anchor and public release gates remain unresolved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen opaque-gate bracket differs')
    print(dict(metric_stability={m:r['conditional_stored_cost_stable_within_supplied_universe'] for m,r in result['metric_brackets'].items()},
        strict_parent_status=result['strict_parent_status'],normal_graph_admitted=False,actual_access_verified=False))
