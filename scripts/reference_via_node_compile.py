"""Match a time-selected raw via-node rule to exact permitted raw segment IDs."""
import hashlib
import json
from road_reference_scenario import load, validate, digest
from road_reference_turn_rules import resolve
from road_reference_segment_permissions import project as segments
from road_reference_way_permissions import DEFAULTS
from road_turn_aware_probe import _positive_id


def need(value, message):
    if not value:
        raise ValueError(message)


def canonical_sha(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def metadata(feature, required):
    need(isinstance(feature, dict) and set(required) <= set(feature)
         and set(feature) <= set(required) | {'version', 'timestamp'}
         and _positive_id(feature['id']), 'Bounded complete raw feature fields required')
    if 'version' in feature:
        need(type(feature['version']) is int and 0 < feature['version'] < 2**31, 'Bounded raw version required')
    if 'timestamp' in feature:
        need(isinstance(feature['timestamp'], str) and len(feature['timestamp']) <= 64, 'Bounded raw timestamp required')


def compile_relation(relation, ways, nodes, *, default_policy, scenario=None,
                     relation_zone=None, feature_zones=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    need(default_policy == DEFAULTS, 'Explicit supported road-default policy required')
    selection = resolve(relation, zone=relation_zone, scenario=scenario)
    result = dict(schema='reference-via-node-segment-compiler-v1', status='unsupported',
        scenario_sha256=digest(scenario), default_policy=default_policy, selection=selection,
        input_sha256=None, declared_arc_sequence=None, transition=None, active_pattern=None,
        topology_compiled=False, all_incident_ways_accounted=False, other_relations_accounted=False,
        independent_maneuver_geometry_verified=False, geographic_timezone_assignment_verified=False,
        speed_profile_evaluated=False, route_cost_emitted=False, access_verified=False,
        anchors_adopted=False, release_eligible=False,
        scope='Exact endpoint-connected from-way/via-node/to-way declaration and supplied complete member-node records only; not all incident ways, signed turn geometry, grade/access certification, an approved graph or a route cost.')
    if selection['status'] != 'resolved_relation_applicability':
        result['reason'] = selection['reason']
        return result
    try:
        roles = {m['role']: m['ref'] for m in relation['members']}
        need(isinstance(ways, list) and 1 <= len(ways) <= 2, 'Exact bounded member-way collection required')
        by_way = {}
        wanted = set()
        for way in ways:
            metadata(way, {'id', 'nodes', 'tags'})
            need(way['id'] not in by_way and isinstance(way['nodes'], list)
                 and 2 <= len(way['nodes']) <= 1000, 'Unique complete bounded member ways required')
            for row in way['nodes']:
                need(isinstance(row, list) and len(row) == 3 and _positive_id(row[0]), 'Explicit raw member vertex IDs required')
                wanted.add(row[0])
            by_way[way['id']] = way
        need(set(by_way) == {roles['from'], roles['to']}, 'Exact from/to member-way set required; never substitute a parallel road')
        need(isinstance(nodes, list) and len(nodes) == len(wanted) <= 2000,
             'Every distinct member vertex requires its full raw node record')
        by_node = {}
        for node in nodes:
            metadata(node, {'id', 'lonlat', 'tags'})
            need(node['id'] in wanted and node['id'] not in by_node, 'Missing, foreign or duplicate member-node context')
            by_node[node['id']] = node
        need(set(by_node) == wanted, 'Incomplete member-node context')
        zones = {} if feature_zones is None else feature_zones
        allowed = {*(f'way:{wid}' for wid in by_way), *(f'node:{nid}' for nid in wanted)}
        need(isinstance(zones, dict) and set(zones) <= allowed, 'Only explicit zones for these member features are allowed')
        projected = {}
        for wid, way in by_way.items():
            ids = {row[0] for row in way['nodes']}
            local_keys = {f'way:{wid}', *(f'node:{nid}' for nid in ids)}
            value = segments(way, [by_node[nid] for nid in sorted(ids)], default_policy=default_policy,
                scenario=scenario, feature_zones={key: zones[key] for key in zones if key in local_keys})
            need(value['status'] == 'supported_segment_projection',
                 'Unsupported complete member-way context: ' + str(value.get('reason')))
            projected[wid] = value
        via = roles['via']; arcs = []
        for role in ('from', 'to'):
            wid = roles[role]; points = by_way[wid]['nodes']
            positions = [i for i, row in enumerate(points) if row[0] == via]
            need(len(positions) == 1 and positions[0] in (0, len(points) - 1),
                 'Via must be one unambiguous raw endpoint; interior joins need a separate split contract')
            at_start = positions[0] == 0
            index = 0 if at_start else len(points) - 2
            direction = ('backward' if at_start else 'forward') if role == 'from' else ('forward' if at_start else 'backward')
            permitted = projected[wid]['segments'][index]['directions'][direction]
            need(permitted['modeled_permitted'], 'Raw approach/departure direction or node access is not permitted by the declared profile')
            arcs.append(dict(id=f'raw:{wid}:{index}:{direction}', way=wid, raw_segment_index=index,
                             direction=direction, **{'from': permitted['from_node'], 'to': permitted['to_node']}))
        need(arcs[0]['to'] == via == arcs[1]['from'], 'Exact declared via-node continuity required')
        # All validation precedes output. Inactive or excepted rules retain their
        # declaration but add no pattern; they never establish a legal turn.
        sequence = [arc['id'] for arc in arcs]
        pattern = None
        if selection['applies']:
            kind = selection['selected_raw_value']
            pattern = dict(id=f'reference-relation-{relation["id"]}',
                kind='only' if kind.startswith('only_') else 'no', arc_sequence=list(sequence),
                raw_relation_id=relation['id'], raw_restriction_kind=kind,
                scenario_sha256=digest(scenario), access_verified=False, release_eligible=False)
        result.update(status='compiled_declared_transition', topology_compiled=True,
            input_sha256=canonical_sha(dict(relation=relation, ways=ways, nodes=nodes,
                relation_zone=relation_zone, feature_zones=zones, default_policy=default_policy)),
            declared_arc_sequence=sequence, transition=arcs, active_pattern=pattern,
            member_projection_sha256={str(wid): canonical_sha(value) for wid, value in projected.items()})
    except (ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result
