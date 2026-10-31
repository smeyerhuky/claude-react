"""Project exact adjacent raw segments; no turns, routing costs or access approval."""
import hashlib
import json
from road_reference_way_permissions import evaluate, DIRECTIONS


def project(way, nodes, *, default_policy, scenario=None, feature_zones=None):
    # Validate the ENTIRE raw way and complete vertex records with the parent
    # contract. Never synthesize shorter ways, delete tags or mask remote nodes.
    whole = evaluate(way, nodes, default_policy=default_policy,
                     scenario=scenario, feature_zones=feature_zones)
    result = dict(schema='reference-car-segment-permissions-v1', status='unsupported', segments=None,
                  scenario_sha256=whole['scenario_sha256'], default_policy=default_policy,
                  raw_input_sha256=whole['input_sha256'],
                  whole_way_projection_sha256=hashlib.sha256(json.dumps(whole, sort_keys=True,
                      separators=(',', ':'), allow_nan=False).encode()).hexdigest(),
                  eligible_directed_segments=None, denied_directed_segments=None,
                  route_cost_emitted=False, turn_restrictions_evaluated=False,
                  speed_profile_evaluated=False, geographic_timezone_assignment_verified=False,
                  geographic_coverage_certified=False, access_verified=False,
                  anchors_adopted=False, release_eligible=False,
                  scope='Exact consecutive raw vertex segments only. Complete whole-way context required; unknown controls reject every segment. No turn transitions, vertex attachment, partial-edge geometry, route reachability or real-world access certification.')
    if whole['status'] != 'supported_tag_projection':
        result['reason'] = whole['reason']
        return result
    points = way['nodes']
    # Closed ways with nonadjacent repeated vertices are fine as indexed raw
    # segments. A consecutive identical ID would not define a distinct arc.
    if any(a[0] == b[0] for a, b in zip(points, points[1:])):
        result['reason'] = 'Consecutive identical raw node IDs need a separate self-segment contract'
        return result
    segments = []
    for index, (a, b) in enumerate(zip(points, points[1:])):
        permissions = {}
        for direction in DIRECTIONS:
            selection = whole['direction_permissions'][direction]
            endpoint_denials = [nid for nid in (a[0], b[0]) if nid in selection['node_denials']]
            permitted = (selection['access_selection']['modeled_permitted']
                         and selection['oneway_allows'] and not endpoint_denials)
            source, target = (a, b) if direction == 'forward' else (b, a)
            permissions[direction] = dict(modeled_permitted=bool(permitted),
                from_node=source[0], to_node=target[0],
                access_selection=dict(selection['access_selection']),
                oneway_allows=selection['oneway_allows'], endpoint_node_denials=endpoint_denials)
        segments.append(dict(way_id=way['id'], raw_segment_index=index,
                             raw_geometry=[list(a), list(b)], directions=permissions))
    eligible = sum(p['modeled_permitted'] for segment in segments for p in segment['directions'].values())
    result.update(status='supported_segment_projection', segments=segments,
                  eligible_directed_segments=eligible, denied_directed_segments=2 * len(segments) - eligible)
    return result
