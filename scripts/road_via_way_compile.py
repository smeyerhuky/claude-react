"""Compile a strict endpoint-connected raw via-way chain into declared arc history.

This checks declared identities/topology only. It does not certify car access,
current restrictions, grade, coordinate alignment or a state routing graph.
"""
from collections import defaultdict
from road_turn_aware_probe import _positive_id, KINDS
from stream_osm_roads import SPEED_KPH, direction_flags

MAX_VIA_WAYS = 16
MAX_WAY_NODES = 1_000
MAX_PATTERN_ARCS = 128


class UnsupportedViaWay(ValueError):
    pass


def require(value, message):
    if not value: raise UnsupportedViaWay(message)


def compile_relation(relation, ways, arcs):
    tags = relation['tags']; rid = relation['id']
    require(_positive_id(rid) and tags.get('type') == 'restriction', 'Explicit positive raw restriction identity required')
    require(not any('conditional' in key for key in tags)
            and not any(tags.get(k) for k in ('except','day_on','day_off','hour_on','hour_off')),
            'Conditional or exception semantics require separate review')
    require(not any(k.startswith('restriction:') and k not in ('restriction:motorcar','restriction:motor_vehicle') for k in tags),
            'Unreviewed mode-specific restriction semantics')
    kind = tags.get('restriction:motorcar', tags.get('restriction:motor_vehicle',tags.get('restriction')))
    require(kind in KINDS, 'Unsupported declared car restriction kind')
    members = relation['members']
    require(isinstance(members,list) and 3 <= len(members) <= MAX_VIA_WAYS+2,
            'Bounded raw via-way member list required')
    roles = defaultdict(list)
    for member in members:
        require(member['type'] == 'w' and _positive_id(member['ref']), 'Only explicit way members supported')
        roles[member['role']].append(member['ref'])
    require(set(roles) == {'from','via','to'} and len(roles['from']) == len(roles['to']) == 1
            and 1 <= len(roles['via']) <= MAX_VIA_WAYS, 'One from/to and ordered via ways required')
    identities = roles['from']+roles['via']+roles['to']
    require(len(set(identities)) == len(identities), 'Repeated member ways need separately reviewed semantics')
    require(isinstance(ways,list) and len(ways) <= MAX_VIA_WAYS+2, 'Bounded exact member-way collection required')
    require(not any('conditional' in key for way in ways for key in way.get('tags', {})),
            'Conditional member-way controls require a separately reviewed temporal profile')
    by_way = {}; way_directions = {}
    for way in ways:
        require(way['id'] not in by_way, 'Duplicate raw way identity')
        way_tags = way.get('tags', {})
        require(way_tags.get('hov') in (None, 'no'),
                'Member-way HOV occupancy needs a separately reviewed vehicle profile')
        require(way_tags.get('highway') in SPEED_KPH, 'Member way outside declared static car-road classes')
        require(not any(way_tags.get(k) not in (None,'yes','designated','permissive')
                        for k in ('access','vehicle','motor_vehicle','motorcar')),
                'Member-way access-purpose restriction is not established by arc presence')
        require(not any(k in way_tags for k in ('turn:lanes','change:lanes','hov:lanes')),
                'Lane-specific maneuver/occupancy rules need separate review')
        directions = direction_flags(way_tags)
        require(directions is not None, 'Unsupported raw member-way direction')
        way_directions[way['id']] = directions
        points = way['nodes']
        require(isinstance(points,list) and 2 <= len(points) <= MAX_WAY_NODES, 'Bounded nonempty raw way geometry required')
        ids = [point[0] for point in points]
        require(all(_positive_id(n) for n in ids) and len(set(ids)) == len(ids), 'Repeated/invalid way nodes require separate treatment')
        by_way[way['id']] = ids
    require(set(by_way) == set(identities), 'Exact complete relation member ways required')
    joins = []
    for a,b in zip(identities,identities[1:]):
        shared = set(by_way[a]) & set(by_way[b])
        require(len(shared) == 1, 'Missing/ambiguous raw member junction')
        node = shared.pop()
        require(node in (by_way[a][0],by_way[a][-1]) and node in (by_way[b][0],by_way[b][-1]),
                'Interior member junction needs a separately reviewed split')
        joins.append(node)
    directed_pairs = []
    first = by_way[identities[0]]; entry = joins[0]
    predecessor = first[1] if first[0] == entry else first[-2]
    directed_pairs.append((identities[0],predecessor,entry))
    for index,way_id in enumerate(roles['via']):
        ids = by_way[way_id]; entry,exit = joins[index],joins[index+1]
        require(entry != exit and {entry,exit} == {ids[0],ids[-1]}, 'Via way must be traversed completely endpoint to endpoint')
        ordered = ids if ids[0] == entry else list(reversed(ids))
        directed_pairs.extend((way_id,a,b) for a,b in zip(ordered,ordered[1:]))
    last = by_way[identities[-1]]; exit = joins[-1]
    successor = last[1] if last[0] == exit else last[-2]
    directed_pairs.append((identities[-1],exit,successor))
    require(len(directed_pairs) <= MAX_PATTERN_ARCS, 'Compiled maneuver arc budget exceeded')
    require(isinstance(arcs,list) and len(arcs) <= 100_000, 'Bounded declared arc collection required')
    lookup = defaultdict(list); seen = set()
    for arc in arcs:
        aid = arc['id']
        require(isinstance(aid,str) and aid and aid not in seen, 'Unique declared directed arc IDs required')
        seen.add(aid); lookup[arc['way'],arc['from'],arc['to']].append(aid)
    sequence = []
    for identity in directed_pairs:
        wid,u,v = identity; raw_nodes = by_way[wid]
        forward = raw_nodes.index(u) < raw_nodes.index(v)
        require(way_directions[wid][0 if forward else 1], 'Declared arc contradicts raw member-way direction')
        require(len(lookup[identity]) == 1, 'Missing/ambiguous directed member segment; never guess direction or drop a via arc')
        sequence.append(lookup[identity][0])
    return dict(id=f'raw-relation-{rid}',kind='only' if kind.startswith('only_') else 'no',arc_sequence=sequence,
                raw_relation_id=rid,raw_restriction_kind=kind,ordered_member_way_ids=identities,
                raw_junction_node_ids=joins,scope='Strict complete endpoint-connected via-way chain only',
                access_verified=False,turn_legality_certified=False,release_eligible=False)
