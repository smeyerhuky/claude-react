"""Freeze expanded raw context while retaining opaque roads and rejected declarations."""
import argparse
import json
from fort_collins_opaque_source_core import inputs,REFERENCE,PARENT,RAW_PARENT
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_partition_checkpoint import RELATION_ZONES
from road_source_partition_union import join_partitions
from road_posted_speed_weights import weights
from road_posted_speed_graph import compile_graph,query
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from reference_via_node_compile import canonical_sha
from road_source_incidence import need


def project(captures=None):
    raw,baseline,selection,layout=inputs()
    captures=[json.loads((REFERENCE/f'source-partition-{i}.json').read_text()) for i in range(2)] if captures is None else captures
    need(isinstance(captures,list) and len(captures)==2,'Exactly two full source captures required')
    for index,capture in enumerate(captures):
        need(capture['seed_node_ids']==layout[index]['seed_node_ids'] and capture['requested_member_way_ids']==layout[index]['requested_member_way_ids'],
             'Exact declared inspection partition required')
    union=join_partitions(captures);prior=raw['reconciled_source']
    for kind in ('ways','nodes','control_relations'):
        by={r['id']:r for r in union[kind]}
        need(all(by.get(r['id'])==r for r in prior[kind]),'Every earlier whole raw record must remain unchanged')
    ways={w['id']:w for w in union['ways']};nodes={n['id']:n for n in union['nodes']}
    need(union['seed_node_ids']==selection['selected_source_node_ids'] and len(ways)==152 and len(nodes)==799
         and len(union['control_relations'])==15 and union['all_retained_way_and_node_members_present'],
         'Complete expanded source/member context required')
    supported=[];unknown={};roads=[];arc_count=0;projections={}
    for wid,w in sorted(ways.items()):
        if w['tags'].get('highway') not in HIGHWAYS:continue
        roads.append(w);local=[nodes[n] for n in sorted({p[0] for p in w['nodes']})];value=weights(w,local,default_policy=DEFAULTS)
        projections[str(wid)]=canonical_sha(value)
        if value['arcs'] is not None:supported.append(wid);arc_count+=len(value['arcs'])
        else:unknown[str(wid)]=dict(complete_raw_way=w,reason=value['reason'],status=value['status'],permission_assumed=False)
    need(len(roads)==96 and len(supported)==94 and set(unknown)=={'201855578','1216151141'},'Retain gate and whole-way turn indication as unknown')
    individual={}
    for r in union['control_relations']:
        members=[ways[wid] for wid in sorted({m['ref'] for m in r['members'] if m['type']=='w'})];wanted={p[0] for w in members for p in w['nodes']}
        compiler=node_rule if [m['type'] for m in r['members'] if m['role']=='via']==['n'] else way_rule
        individual[str(r['id'])]=compiler(r,members,[nodes[n] for n in sorted(wanted)],default_policy=DEFAULTS,relation_zone=RELATION_ZONES.get(str(r['id'])))
    rejected=sorted(int(rid) for rid,r in individual.items() if not r['topology_compiled'])
    need(rejected==[11978581],'Review every unsupported declaration; never silently drop it')
    rejected_context={str(r['id']):dict(raw_relation=r,complete_member_ways=[ways[m['ref']] for m in r['members'] if m['type']=='w'])
        for r in union['control_relations'] if r['id'] in rejected}
    ids={p[0] for w in roads for p in w['nodes']};local=[nodes[n] for n in sorted(ids)]
    compilation=compile_graph(roads,local,union['control_relations'],default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
    need(compilation['graph'] is None and compilation['status']=='unsupported','No wider graph may be admitted')
    queries={}
    for metric,q in baseline['metric_brackets'].items():
        result=query(roads,local,union['control_relations'],q['source'],q['target'],metric,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
        need(result['status']=='unsupported' and result['result'] is None and not result['route_cost_emitted'],'No route, fallback or modeled NoData from an unsupported wider graph')
        queries[metric]=result
    return dict(schema='expanded-opaque-source-core-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),raw_parent_report_sha256=file_sha(RAW_PARENT/'report.json'),
        source_identity=union['source'],partition_layout_sha256=file_sha(REFERENCE/'partition-layout.json'),
        source_capture_sha256=[canonical_sha(c) for c in captures],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('fort_collins_opaque_source_core.py',
            'fort_collins_opaque_source_checkpoint.py','road_source_partition_union.py','road_competitive_core.py',
            'guidance_via_node_compile.py','reference_via_way_compile.py','road_posted_speed_weights.py','road_posted_speed_graph.py')},
        relaxed_inspection_selection=selection,source_partition_way_counts=[len(c['ways']) for c in captures],
        source_partition_seed_counts=[len(c['seed_node_ids']) for c in captures],per_capture_way_limit=100,raw_union_way_budget=200,
        per_capture_or_compiler_limits_changed=False,reconciled_source=union,old_raw_records_preserved=True,
        source_seed_nodes=247,raw_source_ways=152,complete_source_nodes=799,retained_controls=15,
        unenumerated_outer_source_nodes=len(union['unenumerated_member_node_ids']),declared_road_candidate_ways=96,
        declared_road_candidate_nodes=len(ids),supported_individual_weight_roads=len(supported),supported_individual_directed_weights=arc_count,
        weight_projection_sha256=projections,unsupported_model_roads=unknown,individual_restriction_compilations=individual,
        unsupported_declaration_ids=rejected,unsupported_declaration_raw_context=rejected_context,
        full_candidate_compilation=compilation,full_candidate_queries=queries,
        wider_cost_brackets=None,wider_cost_brackets_status='blocked_until_every_original_control_is_accounted',
        old_cost_brackets_extended_to_this_universe=False,unknown_controls_omitted=False,gate_state_assumed=False,
        normal_graph_admitted=False,route_query_result_returned=False,modeled_nodata_emitted=False,
        applied_exterior_route_exclusions=[],global_route_optimality_certified=False,geographic_coverage_certified=False,
        actual_access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Source inspection uses relaxed prefixes and hypothetical geometry only to choose nodes. All original records and declarations remain explicit. The wider graph and cost brackets stay blocked by unsupported controls. Earlier equal brackets apply only to their earlier finite universe. No gate state, ordinary-car access, anchors, global closure, metro completion or release is approved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen expanded opaque source differs')
    print(dict(source_seeds=247,raw_ways=152,roads=96,unknown_roads=list(result['unsupported_model_roads']),
        rejected_declarations=result['unsupported_declaration_ids'],wider_cost_brackets=None,access_verified=False))
