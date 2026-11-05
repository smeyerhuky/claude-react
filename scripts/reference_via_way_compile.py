"""Compile strict static via-way declarations under complete fixed-reference permissions."""
from road_reference_scenario import load, validate, digest, local_reference
from road_reference_segment_permissions import project as segments
from road_reference_way_permissions import DEFAULTS
from road_turn_aware_probe import KINDS, _positive_id
from reference_via_node_compile import metadata, canonical_sha, need

MAX_VIA_WAYS = 16
MAX_PATTERN_ARCS = 128
CAR_KEYS = ('restriction', 'restriction:motor_vehicle', 'restriction:motorcar')
RELATION_KEYS = {'type', *CAR_KEYS, 'name', 'note', 'source', 'fixme', 'created_by', 'description', 'check_date'}


def compile_relation(relation, ways, nodes, *, default_policy, scenario=None,
                     relation_zone=None, feature_zones=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    need(default_policy == DEFAULTS, 'Explicit supported road-default policy required')
    result = dict(schema='reference-static-via-way-segment-compiler-v1', status='unsupported',
        scenario_sha256=digest(scenario), default_policy=default_policy, input_sha256=None,
        declared_arc_sequence=None, transition=None, active_pattern=None,
        relation_time_policy='static-only; conditional/exception/legacy relation rules unsupported',
        topology_compiled=False, all_incident_ways_accounted=False, other_relations_accounted=False,
        independent_maneuver_geometry_verified=False, geographic_timezone_assignment_verified=False,
        speed_profile_evaluated=False, route_cost_emitted=False, access_verified=False,
        anchors_adopted=False, release_eligible=False,
        scope='One declared endpoint-connected ordered via-way chain with complete member-way/node permissions at the same fixed instant. No physical turn-label, grade/access, all-incident/other-restriction or geographic graph certification.')
    try:
        metadata(relation, {'id', 'tags', 'members'})
        tags = relation['tags']; members = relation['members']
        need(isinstance(tags, dict) and len(tags) <= 64 and set(tags) <= RELATION_KEYS
             and all(isinstance(k,str) and isinstance(v,str) and 0 < len(k) <= 128 and len(v) <= 8192 for k,v in tags.items())
             and sum(len(k)+len(v) for k,v in tags.items()) <= 32768, 'Bounded supported static raw relation tags required; no conditional/exception/unknown control namespace')
        need(tags.get('type') == 'restriction' and any(key in tags for key in CAR_KEYS), 'Explicit static car-relevant restriction required')
        need(all(tags[key] in KINDS for key in CAR_KEYS if key in tags), 'Every supplied car restriction kind must be supported')
        selected_key = next(key for key in reversed(CAR_KEYS) if key in tags)
        kind = tags[selected_key]
        if relation_zone is not None:
            local_reference(scenario, relation_zone)
        need(isinstance(members,list) and 3 <= len(members) <= MAX_VIA_WAYS+2, 'Bounded full from/via-way/to member list required')
        roles = {'from':[], 'via':[], 'to':[]}
        for member in members:
            need(isinstance(member,dict) and set(member) == {'type','ref','role'}
                 and member['type'] == 'w' and _positive_id(member['ref']) and member['role'] in roles,
                 'Only positive explicit way members with from/via/to roles supported')
            roles[member['role']].append(member['ref'])
        need(len(roles['from']) == len(roles['to']) == 1 and 1 <= len(roles['via']) <= MAX_VIA_WAYS,
             'Exactly one from/to and ordered via ways required')
        chain = roles['from'] + roles['via'] + roles['to']
        need(len(set(chain)) == len(chain), 'Repeated member ways require separate semantics')
        need(isinstance(ways,list) and len(ways) == len(chain), 'Exact complete member-way set required')
        by_way = {}; wanted = set()
        for way in ways:
            metadata(way, {'id','nodes','tags'})
            need(way['id'] not in by_way and isinstance(way['nodes'],list) and 2 <= len(way['nodes']) <= 1000,
                 'Unique bounded complete member-way geometry required')
            ids = []
            for row in way['nodes']:
                need(isinstance(row,list) and len(row) == 3 and _positive_id(row[0]), 'Raw member vertex identities required')
                ids.append(row[0]); wanted.add(row[0])
            need(len(set(ids)) == len(ids), 'Repeated member vertices require separately reviewed topology')
            by_way[way['id']] = way
        need(set(by_way) == set(chain), 'Never substitute or omit a relation member way')
        need(isinstance(nodes,list) and len(nodes) == len(wanted) <= 2000, 'Every distinct member vertex needs a full bounded raw node record')
        by_node = {}
        for node in nodes:
            metadata(node, {'id','lonlat','tags'})
            need(node['id'] in wanted and node['id'] not in by_node, 'Missing, foreign or duplicate raw member-node context')
            by_node[node['id']] = node
        need(set(by_node) == wanted, 'Complete member-node records required')
        zones = {} if feature_zones is None else feature_zones
        need(isinstance(zones,dict) and set(zones) <= {*(f'way:{wid}' for wid in by_way), *(f'node:{nid}' for nid in wanted)},
             'Only explicit zones for these raw member features allowed')
        projected = {}
        for wid, way in by_way.items():
            ids = {row[0] for row in way['nodes']}; keys = {f'way:{wid}', *(f'node:{nid}' for nid in ids)}
            value = segments(way,[by_node[nid] for nid in sorted(ids)],default_policy=default_policy,
                scenario=scenario,feature_zones={key:zones[key] for key in zones if key in keys})
            need(value['status'] == 'supported_segment_projection', 'Unsupported complete member context: '+str(value.get('reason')))
            projected[wid] = value
        joins = []
        for left, right in zip(chain,chain[1:]):
            a = [row[0] for row in by_way[left]['nodes']]; b = [row[0] for row in by_way[right]['nodes']]
            shared = set(a) & set(b)
            need(len(shared) == 1, 'One unambiguous shared raw node required at each consecutive join')
            node = next(iter(shared))
            need(node in (a[0],a[-1]) and node in (b[0],b[-1]), 'Interior joins require a separate split contract')
            joins.append(node)
        arcs = []
        def append(wid, index, direction):
            need(len(arcs) < MAX_PATTERN_ARCS, 'Compiled maneuver arc budget exceeded; never truncate')
            value = projected[wid]['segments'][index]['directions'][direction]
            need(value['modeled_permitted'], 'Every declared approach/via/departure direction and incident node must be permitted')
            arcs.append(dict(id=f'raw:{wid}:{index}:{direction}',way=wid,raw_segment_index=index,direction=direction,
                             **{'from':value['from_node'],'to':value['to_node']}))
        first = chain[0]; at_start = by_way[first]['nodes'][0][0] == joins[0]
        append(first,0 if at_start else len(by_way[first]['nodes'])-2,'backward' if at_start else 'forward')
        for i, wid in enumerate(roles['via']):
            points = by_way[wid]['nodes']; entry, exit = joins[i:i+2]
            need(entry != exit and {entry,exit} == {points[0][0],points[-1][0]}, 'Each via way must be traversed fully endpoint to endpoint')
            forward = points[0][0] == entry
            indexes = range(len(points)-1) if forward else range(len(points)-2,-1,-1)
            for index in indexes:
                append(wid,index,'forward' if forward else 'backward')
        last = chain[-1]; at_start = by_way[last]['nodes'][0][0] == joins[-1]
        append(last,0 if at_start else len(by_way[last]['nodes'])-2,'forward' if at_start else 'backward')
        need(all(a['to'] == b['from'] for a,b in zip(arcs,arcs[1:])), 'Exact contiguous declared raw segment chain required')
        sequence = [arc['id'] for arc in arcs]
        pattern = dict(id=f'reference-relation-{relation["id"]}',kind='only' if kind.startswith('only_') else 'no',
            arc_sequence=list(sequence),raw_relation_id=relation['id'],raw_restriction_kind=kind,
            scenario_sha256=digest(scenario),access_verified=False,release_eligible=False)
        result.update(status='compiled_declared_maneuver',topology_compiled=True,declared_arc_sequence=sequence,
            transition=arcs,active_pattern=pattern,selected_raw_value=kind,selected_key=selected_key,
            declared_way_chain=chain,join_node_ids=joins,
            input_sha256=canonical_sha(dict(relation=relation,ways=ways,nodes=nodes,relation_zone=relation_zone,
                feature_zones=zones,default_policy=default_policy)),
            member_projection_sha256={str(wid):canonical_sha(value) for wid,value in projected.items()})
    except (ValueError,TypeError) as error:
        result['reason'] = str(error)
    return result
