"""Freeze the separate posted-sign metadata model without changing strict parents."""
import argparse
import copy
import json
from fort_collins_guidance_frontier_checkpoint import project as parent,REFERENCE as PARENT,SOURCE
from fort_collins_control_checkpoint import ROOT
from fort_collins_guidance_checkpoint import file_sha
from road_posted_speed_weights import weights,model_policy,POLICY_PATH
from road_posted_speed_graph import compile_graph,query
from road_guidance_segments import weights as strict_weights
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_source_incidence import need
from reference_via_node_compile import canonical_sha
from road_reference_scenario import load,digest

REFERENCE=ROOT/'docs/research/fort-collins-posted-speed'


def project():
    previous=parent();need(previous==json.loads((PARENT/'report.json').read_text()),'Exact frozen strict-profile source parent required')
    raw=json.loads(SOURCE.read_text());before=copy.deepcopy(raw);nodes={n['id']:n for n in raw['nodes']}
    roads=[];classifications={};unchanged=0;maple=None
    for way in raw['ways']:
        ids={p[0] for p in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
        old=strict_weights(way,local,default_policy=DEFAULTS);new=weights(way,local,default_policy=DEFAULTS)
        if way['id']==134584347:
            need(old['status']=='unsupported' and new['status']=='supported_segment_weights' and len(new['arcs'])==10,
                 'Only the new explicit posted-sign metadata case gains weight support')
            need(new['posted_speed_metadata']['raw_value']=='sign' and all(a['selected_raw_speed']=='25 mph' for a in new['arcs']),
                 'Retain original metadata and explicit numeric speed selection')
            maple=new
        else:
            need(old['status']==new['status'] and old['arcs']==new['arcs'],'Every other classification and raw weighted arc must remain exact')
            unchanged+=len(new['arcs'] or [])
        classifications[str(way['id'])]=dict(strict_status=old['status'],posted_sign_status=new['status'],
            strict_projection_sha256=canonical_sha(old),posted_sign_projection_sha256=canonical_sha(new))
        if way['tags'].get('highway') in HIGHWAYS:roads.append(way)
    ids={p[0] for w in roads for p in w['nodes']};localnodes=[nodes[nid] for nid in sorted(ids)]
    compiled=compile_graph(roads,localnodes,raw['control_relations'],default_policy=DEFAULTS)
    need(compiled['status']=='compiled_declared_posted_sign_graph','Every original supplied control must compile under the new version')
    graph=compiled['graph'];need(len(roads)==32 and len(graph['nodes'])==121 and len(graph['arcs'])==175
        and len(graph['maneuvers'])==9 and unchanged==165,'Review changed supplied model universe')
    replays={}
    for metric in ('length','travel_time'):
        old=previous['full_candidate_queries'][metric]
        need(old['status']=='unsupported' and old['result'] is None,'Strict profile remains unsupported, never overwritten')
        answer=query(roads,localnodes,raw['control_relations'],11268369829,11268369827,metric,default_policy=DEFAULTS)
        need(answer['status']=='solved_declared_posted_sign_graph' and answer['result']['cost'] is not None,'Expanded supplied model query must converge')
        path=answer['result']['arc_path'];forbidden=['raw:140486410:8:forward','raw:322900293:0:forward']
        need(not any(path[i:i+2]==forbidden for i in range(len(path)-1)),'Independent no-left-turn may not be bypassed')
        replays[metric]=answer['result']
    need(raw==before,'Original raw tags and geometry cannot be mutated')
    return dict(schema='fort-collins-posted-speed-checkpoint-v1',scenario_sha256=digest(load()),
        strict_parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=file_sha(SOURCE),
        source_identity=raw['source'],model_policy_sha256=canonical_sha(model_policy()),metadata_policy_sha256=file_sha(POLICY_PATH),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_posted_speed_weights.py',
            'road_posted_speed_graph.py','fort_collins_posted_speed_checkpoint.py','road_guidance_segments.py',
            'road_guidance_way_permissions.py','road_static_lane_guidance.py','guidance_via_node_compile.py',
            'reference_via_node_compile.py','reference_via_way_compile.py','road_reference_segment_costs.py','road_maneuver_probe.py')},
        raw_source_ways=40,raw_source_nodes=169,source_seed_nodes=45,unenumerated_outer_source_nodes=124,
        declared_roads=32,declared_road_nodes=121,weighted_arcs=175,unchanged_previously_supported_arcs=165,
        supplied_controls=9,classifications=classifications,maple_original_tag_weight_projection=maple,
        declared_compilation=compiled,query_replays=replays,strict_parent_changed=False,raw_tags_mutated=False,
        actual_speed_sign_verified=False,lane_connectivity_evaluated=False,all_graph_node_incidence_enumerated=False,
        geographic_coverage_certified=False,access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='A separate numeric posted-sign metadata model over the complete supplied raw universe, not geographic closure or actual physical/legal access. All strict historical profiles and reports stay unchanged and unsupported for this tag. The numeric sign value is retained as source metadata, never field-verified or used to create a speed/access right. 124 outer source nodes remain unenumerated; no global route optimum, reviewed anchors, approved connectors or public release is certified.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen posted-sign profile differs')
    print(dict(roads=32,nodes=121,arcs=175,controls=9,unchanged_old_arcs=165,
        query_costs={metric:r['cost'] for metric,r in result['query_replays'].items()},access_verified=False))
