"""Adjacent raw segments and static weights under the lane-indication road profile."""
import math
from fractions import Fraction
from road_guidance_way_permissions import evaluate
from road_reference_way_permissions import DIRECTIONS
from road_reference_segment_costs import policy,speed,meters,sha,SPEED_KEYS,need


def project(way,nodes,*,default_policy,scenario=None,feature_zones=None):
    whole=evaluate(way,nodes,default_policy=default_policy,scenario=scenario,feature_zones=feature_zones)
    result=dict(schema='static-guidance-segment-permissions-v1',status='unsupported',segments=None,
        scenario_sha256=whole['scenario_sha256'],raw_input_sha256=whole['input_sha256'],
        whole_way_projection_sha256=sha(whole),default_policy=default_policy,
        eligible_directed_segments=None,denied_directed_segments=None,
        lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,
        turn_restrictions_evaluated=False,route_cost_emitted=False,access_verified=False,release_eligible=False)
    if whole['status']!='supported_tag_projection':result['reason']=whole['reason'];return result
    points=way['nodes']
    if any(a[0]==b[0] for a,b in zip(points,points[1:])):
        result['reason']='Consecutive identical raw node IDs require separate geometry';return result
    segments=[]
    for index,(a,b) in enumerate(zip(points,points[1:])):
        permissions={}
        for direction in DIRECTIONS:
            selection=whole['direction_permissions'][direction]
            denied=[nid for nid in (a[0],b[0]) if nid in selection['node_denials']]
            source,target=(a,b) if direction=='forward' else (b,a)
            permissions[direction]=dict(modeled_permitted=bool(selection['access_selection']['modeled_permitted']
                and selection['oneway_allows'] and not denied),from_node=source[0],to_node=target[0],
                access_selection=dict(selection['access_selection']),oneway_allows=selection['oneway_allows'],
                endpoint_node_denials=denied)
        segments.append(dict(way_id=way['id'],raw_segment_index=index,raw_geometry=[list(a),list(b)],directions=permissions))
    eligible=sum(p['modeled_permitted'] for s in segments for p in s['directions'].values())
    result.update(status='supported_segment_projection',segments=segments,
        eligible_directed_segments=eligible,denied_directed_segments=2*len(segments)-eligible)
    return result


def weights(way,nodes,*,default_policy,scenario=None,feature_zones=None):
    projected=project(way,nodes,default_policy=default_policy,scenario=scenario,feature_zones=feature_zones)
    model=policy()
    result=dict(schema='static-guidance-segment-costs-v1',status='unsupported',arcs=None,
        scenario_sha256=projected['scenario_sha256'],cost_policy_sha256=sha(model),
        permission_projection_sha256=sha(projected),raw_input_sha256=projected['raw_input_sha256'],
        segment_weights_emitted=False,route_cost_emitted=False,turn_restrictions_evaluated=False,
        lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,
        geographic_coverage_certified=False,global_speed_ceiling_certified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False)
    if projected['status']!='supported_segment_projection':result['reason']=projected['reason'];return result
    try:
        tags=way['tags']
        need(not any(k.startswith('maxspeed') and k not in SPEED_KEYS for k in tags),'Unsupported speed namespace')
        need(not any(k.startswith('maxspeed') for n in nodes for k in n['tags']),'Node speed extent remains unsupported')
        values={key:speed(tags[key],model) for key in SPEED_KEYS if key in tags}
        default=Fraction(model['default_speed_kph'][tags['highway']]);arcs=[]
        for segment in projected['segments']:
            geometry=segment['raw_geometry'];distance=meters(geometry[0][1:],geometry[1][1:],model['earth_radius_m'])
            need(math.isfinite(distance) and distance>0,'Positive finite segment length required')
            for direction,permission in segment['directions'].items():
                if not permission['modeled_permitted']:continue
                key='maxspeed:'+direction if 'maxspeed:'+direction in values else 'maxspeed' if 'maxspeed' in values else None
                selected=values[key] if key else default;mps=selected*Fraction(5,18)
                seconds=float(Fraction.from_float(distance)/mps)
                need(math.isfinite(seconds) and seconds>0,'Positive finite modeled time required')
                arcs.append(dict(id=f'raw:{way["id"]}:{segment["raw_segment_index"]}:{direction}',
                    way=way['id'],raw_segment_index=segment['raw_segment_index'],direction=direction,
                    **{'from':permission['from_node'],'to':permission['to_node']},
                    raw_geometry=geometry if direction=='forward' else list(reversed(geometry)),
                    length=distance,travel_time=seconds,selected_speed_kph=float(selected),
                    speed_mps_fraction=[mps.numerator,mps.denominator],
                    speed_basis='explicit_raw_limit' if key else 'declared_highway_model_default',
                    selected_speed_key=key,selected_raw_speed=tags[key] if key else None))
        result.update(status='supported_segment_weights',arcs=arcs,segment_weights_emitted=True,
            denied_directed_segments=projected['denied_directed_segments'])
    except (ValueError,TypeError) as error:result['reason']=str(error)
    return result
