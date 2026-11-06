"""Static numeric segment weights retaining validated posted-sign type metadata."""
import json
import math
from fractions import Fraction
from road_guidance_segments import project as permissions
from road_reference_segment_costs import policy,speed,meters,sha,SPEED_KEYS,need
from road_reference_scenario import ROOT

POLICY_PATH=ROOT/'docs/research/fort-collins-posted-speed/policy.json'


def model_policy():return dict(numeric_model=policy(),posted_sign_metadata=json.loads(POLICY_PATH.read_text()))


def weights(way,nodes,*,default_policy,scenario=None,feature_zones=None):
    projected=permissions(way,nodes,default_policy=default_policy,scenario=scenario,feature_zones=feature_zones)
    model=policy()
    result=dict(schema='posted-sign-static-guidance-segment-costs-v1',status='unsupported',arcs=None,
        scenario_sha256=projected['scenario_sha256'],cost_policy_sha256=sha(model_policy()),
        permission_projection_sha256=sha(projected),raw_input_sha256=projected['raw_input_sha256'],
        posted_speed_metadata=None,segment_weights_emitted=False,route_cost_emitted=False,
        turn_restrictions_evaluated=False,lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,
        geographic_coverage_certified=False,global_speed_ceiling_certified=False,access_verified=False,
        actual_speed_sign_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False)
    if projected['status']!='supported_segment_projection':result['reason']=projected['reason'];return result
    try:
        tags=way['tags']
        need(not any(k.startswith('maxspeed') and k not in SPEED_KEYS|{'maxspeed:type'} for k in tags),'Unsupported speed namespace')
        need(not any(k.startswith('maxspeed') for n in nodes for k in n['tags']),'Node speed extent remains unsupported')
        values={key:speed(tags[key],model) for key in SPEED_KEYS if key in tags}
        if 'maxspeed:type' in tags:
            need(tags['maxspeed:type']=='sign','Only the exact static posted-sign metadata value is supported')
            need('maxspeed' in values,'Posted-sign metadata requires an explicit valid numeric base maxspeed; never invent a speed')
            need('source:maxspeed' not in tags or tags['source:maxspeed']=='sign','Conflicting posted-sign source metadata requires separate interpretation')
            result['posted_speed_metadata']=dict(key='maxspeed:type',raw_value='sign',numeric_base_key='maxspeed',
                raw_numeric_base=tags['maxspeed'],source_maxspeed=tags.get('source:maxspeed'),
                creates_speed_value=False,establishes_physical_sign_truth=False,access_verified=False)
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
