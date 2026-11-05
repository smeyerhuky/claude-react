"""Bounded raw adjacent-segment weights; never graph coverage or access approval."""
import hashlib
import json
import math
import re
from fractions import Fraction
from road_reference_scenario import ROOT
from road_reference_segment_permissions import project as permissions

POLICY_PATH = ROOT / 'docs/research/reference-segment-costs/policy.json'
SPEED_KEYS = {'maxspeed', 'maxspeed:forward', 'maxspeed:backward'}


def sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def policy():
    return json.loads(POLICY_PATH.read_text())


def need(value, reason):
    if not value:
        raise ValueError(reason)


def speed(raw, model):
    need(isinstance(raw, str) and len(raw) <= 32, 'Bounded explicit speed string required')
    match = re.fullmatch(r'([0-9]{1,3}(?:\.[0-9]{1,3})?)(?: (mph|km/h|kph))?', raw)
    need(match, 'Unsupported speed syntax; no numeric-prefix parsing or default fallback')
    value = Fraction(match[1])
    if match[2] == 'mph':
        value *= Fraction(model['mph_to_kph'])
    bounds = model['supported_numeric_speed_kph']
    need(bounds['exclusive_min'] < value <= bounds['inclusive_max'], 'Speed outside the supported numeric model domain; never clamp')
    return value


def meters(a, b, radius):
    if a[1] == b[1] and (abs(a[1]) == 90 or math.remainder(a[0] - b[0], 360) == 0):
        return 0.
    lon1, lat1 = map(math.radians, a)
    lon2, lat2 = map(math.radians, b)
    delta = math.remainder(lon2 - lon1, 2 * math.pi)
    cross = math.hypot(math.cos(lat2) * math.sin(delta),
        math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(delta))
    dot = math.sin(lat1) * math.sin(lat2) + math.cos(lat1) * math.cos(lat2) * math.cos(delta)
    return radius * math.atan2(cross, dot)


def project(way, nodes, *, default_policy, scenario=None, feature_zones=None):
    projected = permissions(way, nodes, default_policy=default_policy,
                            scenario=scenario, feature_zones=feature_zones)
    model = policy()
    result = dict(schema='reference-car-segment-costs-v1', status='unsupported', arcs=None,
        scenario_sha256=projected['scenario_sha256'], cost_policy_sha256=sha(model),
        permission_projection_sha256=sha(projected), raw_input_sha256=projected['raw_input_sha256'],
        segment_weights_emitted=False, route_cost_emitted=False, turn_restrictions_evaluated=False,
        geographic_coverage_certified=False, global_speed_ceiling_certified=False,
        geographic_timezone_assignment_verified=False, access_verified=False,
        anchors_adopted=False, release_eligible=False,
        scope='Declared permitted adjacent raw segments only. Spherical surface distance and static modeled free-flow weights; no intersection/turn/surface delays, traffic, elevation, approved graph, anchor costs or real-world access certification.')
    if projected['status'] != 'supported_segment_projection':
        result['reason'] = projected['reason']
        return result
    try:
        tags = way['tags']
        need(not any(k.startswith('maxspeed') and k not in SPEED_KEYS for k in tags),
             'Unsupported speed namespace; no missing-direction fallback around unknown controls')
        need(not any(k.startswith('maxspeed') for node in nodes for k in node['tags']),
             'Node speed-control extent requires a separate contract')
        # Validate every supplied speed, including overridden/denied directions.
        values = {key: speed(tags[key], model) for key in SPEED_KEYS if key in tags}
        default = Fraction(model['default_speed_kph'][tags['highway']])
        arcs = []
        for segment in projected['segments']:
            geometry = segment['raw_geometry']
            distance = meters(geometry[0][1:], geometry[1][1:], model['earth_radius_m'])
            need(math.isfinite(distance) and distance > 0, 'Zero/nonfinite raw segment length requires a separate geometry contract')
            for direction, permission in segment['directions'].items():
                if not permission['modeled_permitted']:
                    continue
                key = 'maxspeed:' + direction if 'maxspeed:' + direction in values else ('maxspeed' if 'maxspeed' in values else None)
                selected = values[key] if key else default
                mps = selected * Fraction(5, 18)
                seconds = float(Fraction.from_float(distance) / mps)
                need(math.isfinite(seconds) and seconds > 0, 'Finite positive modeled time required')
                points = geometry if direction == 'forward' else list(reversed(geometry))
                arcs.append(dict(id=f'raw:{way["id"]}:{segment["raw_segment_index"]}:{direction}',
                    way=way['id'], raw_segment_index=segment['raw_segment_index'], direction=direction,
                    **{'from': permission['from_node'], 'to': permission['to_node']},
                    raw_geometry=points, length=distance, travel_time=seconds,
                    selected_speed_kph=float(selected), speed_mps_fraction=[mps.numerator, mps.denominator],
                    speed_basis='explicit_raw_limit' if key else 'declared_highway_model_default',
                    selected_speed_key=key, selected_raw_speed=tags[key] if key else None))
        result.update(status='supported_segment_weights', arcs=arcs, segment_weights_emitted=True,
                      denied_directed_segments=projected['denied_directed_segments'])
    except (ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result
