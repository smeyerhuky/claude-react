"""Bounded raw-way permission projection, never route cost or access certification."""
import hashlib
import json
import math
from road_reference_scenario import load, validate, digest, local_reference
from road_reference_conditionals import parse_expression, matches, UnsupportedCondition

POLICY = 'reference-car-way-permissions-v1'
DEFAULTS = 'declared-us-common-road-car-defaults-v1'
MODES = ('access', 'vehicle', 'motor_vehicle', 'motorcar')
DIRECTIONS = ('forward', 'backward')
ACCESS_KEYS = {mode + suffix for mode in MODES for suffix in ('', ':forward', ':backward')}
ONEWAY_KEYS = ('oneway', 'oneway:vehicle', 'oneway:motor_vehicle', 'oneway:motorcar')
KEYS = ACCESS_KEYS | set(ONEWAY_KEYS)
HIGHWAYS = {'motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link',
            'secondary', 'secondary_link', 'tertiary', 'tertiary_link', 'residential',
            'unclassified', 'living_street', 'service'}
MAX_WAY_NODES = 1000
MAX_TAGS = 256
MAX_TAG_CHARACTERS = 200000


class UnsupportedWay(ValueError):
    pass


def need(condition, reason):
    if not condition:
        raise UnsupportedWay(reason)


def _tags(tags):
    need(isinstance(tags, dict) and len(tags) <= MAX_TAGS, 'Bounded raw tag dictionary required')
    need(all(isinstance(k, str) and isinstance(v, str) and 0 < len(k) <= 256 and len(v) <= 8192
             for k, v in tags.items()), 'Explicit bounded string tags required')
    return sum(len(k) + len(v) for k, v in tags.items())


def _raw_values(tags, feature, scenario, zones, traces):
    # Parse all relevant keys before composing any direction. An early yes or
    # a more-specific key cannot conceal unsupported conditional syntax.
    unknown = [k for k in tags if 'conditional' in k and not (k.endswith(':conditional') and k[:-12] in KEYS)]
    need(not unknown, 'Conditional control outside the supported permission/direction grammar')
    result = {}
    for key in sorted(KEYS):
        if key not in tags and key + ':conditional' not in tags:
            continue
        base = tags.get(key)
        need(base is None or (base.strip() and '@' not in base and len(base) <= 512),
             'Explicit nonconditional base value required')
        clauses = parse_expression(tags[key + ':conditional']) if key + ':conditional' in tags else []
        active = []
        if clauses:
            need(feature in zones, 'Explicit IANA zone required for each conditional feature')
            local = local_reference(scenario, zones[feature])
            active = [i for i, (_, condition) in enumerate(clauses) if matches(condition, local)]
        value = clauses[active[-1]][0] if active else base
        result[key] = value
        traces.append(dict(feature=feature, key=key, selected_raw_value=value,
                           matching_clause_indices=active,
                           source='conditional' if active else ('base' if base is not None else 'missing_explicit_base')))
    return result


def _other_controls(tags, *, node):
    # A new car-control namespace must not silently fall back to road defaults.
    # Other transport modes can coexist without governing this solo car.
    irrelevant_oneway_modes = {'bicycle', 'foot', 'bus', 'psv', 'taxi', 'hgv', 'motorcycle'}
    for key in tags:
        base = key[:-12] if key.endswith(':conditional') else key
        if any(base.startswith(mode + ':') for mode in MODES):
            need(base in ACCESS_KEYS, 'Unsupported car-access key or orientation')
        if base.startswith('oneway:'):
            need(base in ONEWAY_KEYS or base[7:] in irrelevant_oneway_modes,
                 'Unsupported one-way mode or orientation')
    need(not any(':lanes' in k or k.startswith(('lanes:bus', 'lanes:psv', 'busway')) for k in tags),
         'Lane context requires separate lane and maneuver evaluation')
    need(not any(k == 'hov' or k.startswith('hov:') for k in tags),
         'HOV context requires separate occupancy and lane evaluation')
    need(not any(k.startswith(('maxheight', 'maxwidth', 'maxlength', 'maxweight', 'maxweightrating',
                              'maxaxleload', 'width', 'minspeed')) for k in tags),
         'Dimensional or vehicle-performance control is unsupported by the unspecified vehicle profile')
    need(not any(k == 'opening_hours' or k.startswith('opening_hours:') for k in tags),
         'Opening-hours composition requires a separate contract')
    need(not tags.get('barrier') or tags['barrier'] == 'no', 'Physical barrier operation is not evaluated')
    need(not tags.get('traffic_sign'), 'Traffic-sign meaning and orientation require separate evaluation')
    need(not tags.get('ford') and tags.get('highway') != 'ford', 'Ford conditions are not evaluated')
    need(not any(k.startswith(('construction', 'proposed:', 'disused:', 'abandoned:')) for k in tags),
         'Lifecycle or construction state requires separate evaluation')
    if node:
        need(not any(k in tags or k + ':conditional' in tags for k in ACCESS_KEYS if ':' in k),
             'Directional node access needs an independently defined orientation')
        need(not any(k == 'oneway' or k.startswith('oneway:') for k in tags),
             'Node direction controls need a separate topology contract')


def _access(values, direction=None, *, highway_default=False):
    for mode in reversed(MODES):
        keys = (mode + ':' + direction, mode) if direction else (mode,)
        for key in keys:
            raw = values.get(key)
            if raw is None:
                continue
            value = raw.strip().lower()
            need(value in {'yes', 'permissive', 'designated', 'no', 'private'},
                 'Selected access value needs purpose, permit or other unsupported interpretation')
            return dict(key=key, raw_value=raw, modeled_permitted=value in {'yes', 'permissive', 'designated'},
                        basis='resolved_OSM_tag')
    # This is an explicit model default, not a fabricated raw access=yes tag.
    return dict(key=None, raw_value=None, modeled_permitted=True,
                basis='declared_US_highway_default' if highway_default else 'no_additional_node_access_tag')


def _oneway(values, tags):
    for key in reversed(ONEWAY_KEYS):
        raw = values.get(key)
        if raw is None:
            continue
        value = raw.strip().lower()
        if value in ('yes', 'true', '1'):
            return dict(forward=True, backward=False, key=key, raw_value=raw)
        if value == '-1':
            return dict(forward=False, backward=True, key=key, raw_value=raw)
        if value in ('no', 'false', '0'):
            return dict(forward=True, backward=True, key=key, raw_value=raw)
        raise UnsupportedWay('Unknown, reversible or alternating one-way value')
    need(tags.get('highway') != 'motorway_link' and tags.get('junction') != 'circular',
         'This road class requires an explicit one-way value in this bounded profile')
    forward_only = tags.get('highway') == 'motorway' or tags.get('junction') == 'roundabout'
    return dict(forward=True, backward=not forward_only, key=None, raw_value=None)


def evaluate(way, nodes, *, default_policy, scenario=None, feature_zones=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    if default_policy != DEFAULTS:
        raise ValueError('An explicit supported modeled-default policy is required')
    zones = {} if feature_zones is None else feature_zones
    result = dict(schema=POLICY, scenario_sha256=digest(scenario), default_policy=default_policy,
                  status='unsupported', direction_permissions=None, eligible_directions=[],
                  input_sha256=None, raw_value_traces=[], tags_mutated=False,
                  node_record_ids_match_way_geometry=False,
                  geographic_timezone_assignment_verified=False,
                  turn_restrictions_evaluated=False, speed_profile_evaluated=False,
                  route_cost_emitted=False, access_verified=False, anchors_adopted=False,
                  geographic_coverage_certified=False, release_eligible=False,
                  scope='Entire declared raw-way traversal with the supplied complete vertex-node records. Not partial-way reachability, lane/turn routing, real-world access, source/geographic coverage or an adopted anchor.')
    try:
        need(isinstance(way, dict) and type(way.get('id')) is int and way['id'] > 0, 'Explicit raw way identity required')
        need(isinstance(way.get('nodes'), list) and 2 <= len(way['nodes']) <= MAX_WAY_NODES,
             'Bounded complete raw way geometry required')
        geometry = {}
        for row in way['nodes']:
            need(isinstance(row, list) and len(row) == 3 and type(row[0]) is int and row[0] > 0,
                 'Explicit raw vertex identity and coordinates required')
            need(all(type(v) in (int, float) and math.isfinite(v) for v in row[1:])
                 and -180 <= row[1] <= 180 and -90 <= row[2] <= 90, 'Finite geographic coordinates required')
            need(row[0] not in geometry or geometry[row[0]] == row[1:], 'Repeated vertex geometry conflicts')
            geometry[row[0]] = row[1:]
        need(isinstance(nodes, list) and len(nodes) == len(geometry), 'Every way vertex requires one complete node record')
        indexed = {}
        characters = _tags(way.get('tags'))
        for node in nodes:
            need(isinstance(node, dict) and type(node.get('id')) is int and node['id'] in geometry
                 and node['id'] not in indexed, 'Missing, duplicate or foreign node context')
            coordinates = node.get('lonlat')
            need(isinstance(coordinates, list) and len(coordinates) == 2
                 and all(type(v) in (int, float) and math.isfinite(v) for v in coordinates)
                 and coordinates == geometry[node['id']], 'Node and way raw coordinates disagree')
            characters += _tags(node.get('tags'))
            indexed[node['id']] = node
        need(characters <= MAX_TAG_CHARACTERS, 'Full-way tag context budget exceeded')
        need(set(indexed) == set(geometry), 'Incomplete node records')
        need(isinstance(zones, dict) and set(zones) <= {f'way:{way["id"]}', *(f'node:{nid}' for nid in geometry)},
             'Only explicit zones for these declared features are allowed')
        for zone in zones.values():
            local_reference(scenario, zone)
        result['node_record_ids_match_way_geometry'] = True
        result['input_sha256'] = hashlib.sha256(json.dumps(dict(way=way, nodes=nodes, zones=zones),
            sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
        tags = way['tags']
        need(tags.get('highway') in HIGHWAYS, 'Highway class outside the explicit modeled road defaults')
        values = _raw_values(tags, f'way:{way["id"]}', scenario, zones, result['raw_value_traces'])
        node_values = {nid: _raw_values(n['tags'], f'node:{nid}', scenario, zones, result['raw_value_traces'])
                       for nid, n in indexed.items()}
        _other_controls(tags, node=False)
        for node in nodes:
            _other_controls(node['tags'], node=True)
        node_denials = [nid for nid, values_at_node in node_values.items()
                        if not _access(values_at_node)['modeled_permitted']]
        oneway = _oneway(values, tags)
        permissions = {}
        for direction in DIRECTIONS:
            access = _access(values, direction, highway_default=True)
            permitted = access['modeled_permitted'] and oneway[direction] and not node_denials
            permissions[direction] = dict(modeled_permitted=bool(permitted), access_selection=access,
                                          oneway_allows=oneway[direction], node_denials=node_denials)
        result.update(status='supported_tag_projection', direction_permissions=permissions,
                      eligible_directions=[d for d in DIRECTIONS if permissions[d]['modeled_permitted']],
                      selected_oneway=oneway)
    except (UnsupportedWay, UnsupportedCondition, ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result
