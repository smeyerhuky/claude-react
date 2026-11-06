"""Freeze original-source static lane metadata without emitting a graph or route."""
import argparse
import copy
import hashlib
import json
from fort_collins_control_checkpoint import project as parent,REFERENCE as PARENT,CONTEXT,ROOT
from road_guidance_way_permissions import evaluate,POLICY
from road_reference_way_permissions import DEFAULTS,HIGHWAYS,evaluate as historical
from road_reference_scenario import load,digest
from reference_via_node_compile import canonical_sha

REFERENCE=ROOT/'docs/research/fort-collins-static-guidance'
SOURCE_NOTES=REFERENCE/'semantic-sources.json'


def file_sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def project():
    if parent()!=json.loads((PARENT/'report.json').read_text()):raise ValueError('Exact frozen complete-member parent required')
    corpus=json.loads(CONTEXT.read_text());before=copy.deepcopy(corpus)
    nodes={n['id']:n for n in corpus['nodes']};results={};supported=[];outside=[];unknown=[]
    for way in corpus['ways']:
        ids={p[0] for p in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
        old=historical(way,local,default_policy=DEFAULTS)
        result=evaluate(way,local,default_policy=DEFAULTS)
        if way['id']!=140486410:
            if old['status']!=result['status']:raise ValueError('Other raw-way classifications must remain unchanged')
            if old['status']=='supported_tag_projection' and old['direction_permissions']!=result['direction_permissions']:
                raise ValueError('Other raw-way permissions must remain unchanged')
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(way['id'])
        elif result['status']=='supported_tag_projection':supported.append(way['id'])
        else:unknown.append(way['id'])
        results[str(way['id'])]=result
    if corpus!=before:raise ValueError('Original source records cannot be mutated')
    supported.sort();outside.sort();unknown.sort()
    if len(supported)!=34 or len(outside)!=13 or unknown!=[815164359]:raise ValueError('Review changed bounded profile support')
    lane=results['140486410']
    if lane['eligible_directions']!=['forward','backward']:raise ValueError('Review changed road direction semantics')
    rows=lane['static_lane_guidance']['indications_by_raw_direction']['backward']['lanes']
    if [r['indications'] for r in rows]!=[['left'],['through']]:raise ValueError('Retain source driving-direction lane order')
    return dict(schema='fort-collins-static-guidance-checkpoint-v1',policy=POLICY,scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=file_sha(CONTEXT),
        semantic_source_notes_sha256=file_sha(SOURCE_NOTES),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_static_lane_guidance.py',
            'road_guidance_way_permissions.py','fort_collins_guidance_checkpoint.py','road_reference_way_permissions.py',
            'road_reference_conditionals.py','road_reference_scenario.py','reference_via_node_compile.py')},
        complete_member_ways=48,complete_member_nodes=175,retained_controls=10,
        supported_permission_way_ids=supported,outside_declared_road_class_ids=outside,
        unsupported_model_road_ids=unknown,way_permission_projections=results,
        raw_tags_mutated=False,historical_reports_changed=False,lane_indications_used_as_restrictions=False,
        lane_connectivity_evaluated=False,lane_changes_evaluated=False,lane_level_graph_constructed=False,
        turn_restrictions_evaluated=False,graph_returned=False,query_result=None,route_cost_emitted=False,
        all_graph_node_incidence_enumerated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Road-level static indication metadata only. Restriction 10475907 is retained separately and has not been recompiled under this profile. Indications do not establish legal turn permissions or bans. Per-lane access, lane changes, speeds, HOV, dynamic guidance and connectivity controls remain unsupported. The removable bollard is still unknown. No graph, route, geographic closure, actual access, adopted anchors or public-map release is asserted.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen static-guidance report differs')
    print(dict(supported_permission_ways=len(result['supported_permission_way_ids']),
        unsupported_model_road_ids=result['unsupported_model_road_ids'],graph_returned=False,access_verified=False))
