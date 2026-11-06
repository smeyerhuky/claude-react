"""Audit bounded source reconciliation and retain the unresolved physical gate."""
import argparse
import json
from fort_collins_partitioned_core import inputs,REFERENCE,PARENT,PRIOR_SOURCE
from fort_collins_guidance_checkpoint import file_sha
from road_reference_scenario import ROOT,load,digest
from road_source_partition_union import join_partitions,MAX_UNION_WAYS
from road_posted_speed_weights import weights
from road_posted_speed_graph import compile_graph,query
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from reference_via_node_compile import canonical_sha
from road_source_incidence import need,MAX_WAYS

SOURCE=REFERENCE/'new-node-source-context.json'
RELATION_ZONES={'20193102':'America/Denver'}


def project(complement=None):
    parent,prior,selection,seeds,extra=inputs()
    complement=json.loads(SOURCE.read_text()) if complement is None else complement
    need(complement['seed_node_ids']==seeds and complement['requested_member_way_ids']==extra,
         'Exact complementary source seeds and complete requested members required')
    need(len(complement['ways'])==79 and len(complement['nodes'])==485 and len(complement['control_relations'])==9,
         'Review changed complementary source scope')
    union=join_partitions([prior,complement]);ways={w['id']:w for w in union['ways']};nodes={n['id']:n for n in union['nodes']}
    controls={r['id']:r for r in union['control_relations']}
    need(len(ways)==123 and len(nodes)==613 and len(controls)==13 and len(union['seed_node_ids'])==177
         and union['all_retained_way_and_node_members_present'] is True,'Complete reconciled source/member context required')
    need(union['seed_node_ids']==selection['selected_source_node_ids'],'No competitive source seed may be lost during partition reconciliation')
    need(len(ways)>MAX_WAYS and len(ways)<=MAX_UNION_WAYS,'The raw source needs partitioning, not an increased per-pass limit')
    supported=[];outside=[];unknown=[];projections={};directed=0;roads=[]
    for wid,way in sorted(ways.items()):
        local=[nodes[n] for n in sorted({p[0] for p in way['nodes']})]
        value=weights(way,local,default_policy=DEFAULTS);projections[str(wid)]=canonical_sha(value)
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        else:
            roads.append(way)
            if value['status']=='supported_segment_weights':supported.append(wid);directed+=len(value['arcs'])
            else:unknown.append(wid)
    need(len(supported)==81 and len(outside)==41 and unknown==[201855578] and directed==606,
         'Unknown gate controls may not be stripped or classified as car exclusion')
    gate=nodes[8917794983];way=ways[201855578]
    need(gate['tags']=={'barrier':'gate'} and any(p[0]==gate['id'] for p in way['nodes'])
         and way['tags'].get('name')=='Old Firehouse Alley','Exact original gate/complete way context required')
    individual={}
    for rid,control in sorted(controls.items()):
        memberways=[ways[wid] for wid in sorted({m['ref'] for m in control['members'] if m['type']=='w'})]
        ids={p[0] for w in memberways for p in w['nodes']}
        compiler=node_rule if [m['type'] for m in control['members'] if m['role']=='via']==['n'] else way_rule
        result=compiler(control,memberways,[nodes[n] for n in sorted(ids)],default_policy=DEFAULTS,relation_zone=RELATION_ZONES.get(str(rid)))
        need(result['topology_compiled'],'All retained declarations require complete compilable members')
        individual[str(rid)]=result
    ids={p[0] for w in roads for p in w['nodes']};localnodes=[nodes[n] for n in sorted(ids)];relations=[controls[rid] for rid in sorted(controls)]
    compilation=compile_graph(roads,localnodes,relations,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
    need(compilation['graph'] is None and '201855578' in compilation['reason'] and 'barrier' in compilation['reason'],
         'Unresolved physical operation must atomically reject the wider graph')
    queries={}
    for metric,old in parent['query_replays'].items():
        answer=query(roads,localnodes,relations,old['source'],old['target'],metric,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)
        need(answer['status']=='unsupported' and answer['result'] is None and answer['route_cost_emitted'] is False,
             'No partial fallback, route or modeled NoData may be emitted from the unsupported union')
        queries[metric]=answer
    return dict(schema='fort-collins-bounded-source-partition-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),prior_source_capture_sha256=file_sha(PRIOR_SOURCE),
        complementary_source_capture_sha256=canonical_sha(complement),source_identity=union['source'],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_source_partition_union.py',
            'fort_collins_partitioned_core.py','fort_collins_partition_checkpoint.py','road_source_incidence.py',
            'road_competitive_core.py','road_posted_speed_weights.py','road_posted_speed_graph.py',
            'road_guidance_way_permissions.py','reference_via_node_compile.py','reference_via_way_compile.py')},
        next_known_graph_source_selection=selection,source_partition_way_counts=[76,79],source_partition_seed_counts=[96,81],
        per_capture_way_limit=100,raw_union_way_budget=200,union_node_budget=2000,per_capture_limits_changed=False,
        reconciled_source=union,source_seed_nodes=177,raw_source_ways=123,complete_source_nodes=613,retained_controls=13,
        unenumerated_outer_source_nodes=436,declared_road_candidate_ways=82,declared_road_candidate_nodes=len(ids),
        supported_individual_weight_roads=81,supported_individual_directed_weights=606,
        outside_declared_road_class_ids=outside,unsupported_model_road_ids=unknown,weight_projection_sha256=projections,
        individual_restriction_compilations=individual,full_candidate_compilation=compilation,full_candidate_queries=queries,
        gate_review_context=dict(raw_node=gate,complete_raw_way=way,operation_status='unknown',
            evidence_status='independent_operation_and_access_evidence_required',
            field_evidence_obtained=False,gate_assumed_open=False,gate_assumed_closed=False,
            access_verified=False,anchors_adopted=False,connector_approved=False,release_eligible=False),
        unknown_controls_omitted=False,partial_graph_returned=False,modeled_nodata_emitted=False,
        all_graph_node_incidence_enumerated=False,global_route_optimality_certified=False,
        geographic_coverage_certified=False,access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Two captures remain below the unchanged 100-way limit; a separately bounded raw-record union reconciles full ways/nodes/controls and all 177 seeds. This is source reconciliation, not physical connectivity or geographic closure. All thirteen declarations compile individually, but the 82-road candidate remains unsupported by the physical gate at node8917794983 on Old Firehouse Alley. The gate is neither assumed open nor closed; no unknown control is omitted and no partial graph/route/NoData is emitted. Independent operation/access evidence and all existing anchor, geographic and public release gates remain unresolved.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen bounded partition checkpoint differs')
    print(dict(partition_ways=result['source_partition_way_counts'],union_ways=123,source_nodes=613,source_seeds=177,
        controls=13,unknown_gate_roads=result['unsupported_model_road_ids'],full_candidate_status='unsupported',access_verified=False))
