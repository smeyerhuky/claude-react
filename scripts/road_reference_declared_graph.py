"""Compose a bounded declared raw-way universe; never certify geographic coverage."""
from road_reference_scenario import load, validate, digest
from road_reference_way_permissions import DEFAULTS
from road_reference_segment_costs import project as weights, sha, policy
from reference_via_node_compile import compile_relation, metadata
from road_maneuver_probe import solve, compile_patterns

MAX_WAYS = 100
MAX_NODES = 2000
MAX_RELATIONS = 100
MAX_ARCS = 4000


def need(value, reason):
    if not value:
        raise ValueError(reason)


def compile_graph(ways, nodes, relations, *, default_policy, scenario=None,
                  feature_zones=None, relation_zones=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    need(default_policy == DEFAULTS, 'Explicit supported road-default policy required')
    result = dict(schema='reference-declared-graph-v1', status='unsupported', graph=None,
        scenario_sha256=digest(scenario), cost_policy_sha256=sha(policy()), input_sha256=None,
        declared_graph_compiled=False, complete_geographic_graph_constructed=False,
        all_incident_ways_accounted=False, other_relations_accounted=False,
        geographic_timezone_assignment_verified=False, access_verified=False,
        anchors_adopted=False, connector_costs_included=False, release_eligible=False,
        scope='Only the supplied declared raw-way/node/relation universe. Not all incident or exterior roads/restrictions, grade truth, anchor attachments or an approved geographic graph. Unknown supplied controls reject the whole bundle.')
    try:
        need(isinstance(ways, list) and 1 <= len(ways) <= MAX_WAYS, 'Bounded explicit complete raw-way list required')
        need(isinstance(nodes, list) and 1 <= len(nodes) <= MAX_NODES, 'Bounded complete raw-node list required')
        need(isinstance(relations, list) and len(relations) <= MAX_RELATIONS, 'Bounded explicit raw-relation list required')
        by_way = {}; wanted = set(); coordinates = {}
        for way in ways:
            metadata(way, {'id', 'nodes', 'tags'})
            need(way['id'] not in by_way, 'Duplicate raw way identity')
            need(isinstance(way['nodes'], list) and 2 <= len(way['nodes']) <= 1000, 'Bounded complete raw way vertices required')
            for row in way['nodes']:
                need(isinstance(row, list) and len(row) == 3 and type(row[0]) is int and row[0] > 0, 'Raw member vertex identity required')
                need(row[0] not in coordinates or coordinates[row[0]] == row[1:], 'Shared raw-node coordinates conflict across ways')
                coordinates[row[0]] = row[1:]; wanted.add(row[0])
            need(len(wanted) <= MAX_NODES, 'Declared graph node budget exceeded')
            by_way[way['id']] = way
        by_node = {}
        for node in nodes:
            metadata(node, {'id', 'lonlat', 'tags'})
            need(node['id'] in wanted and node['id'] not in by_node, 'Foreign or duplicate raw node record')
            by_node[node['id']] = node
        need(set(by_node) == wanted, 'Missing raw member-node context')
        zones = {} if feature_zones is None else feature_zones
        need(isinstance(zones, dict) and set(zones) <= {*(f'way:{wid}' for wid in by_way), *(f'node:{nid}' for nid in wanted)},
             'Only explicit zones for declared way/node features are allowed')
        rzones = {} if relation_zones is None else relation_zones
        need(isinstance(rzones, dict), 'Explicit relation-zone dictionary required')
        arcs = []; projections = {}; by_arc = {}
        for wid, way in by_way.items():
            ids = {row[0] for row in way['nodes']}
            keys = {f'way:{wid}', *(f'node:{nid}' for nid in ids)}
            projected = weights(way, [by_node[nid] for nid in sorted(ids)], default_policy=default_policy,
                scenario=scenario, feature_zones={key: zones[key] for key in zones if key in keys})
            need(projected['status'] == 'supported_segment_weights',
                 f'Unsupported supplied raw way {wid}: {projected.get("reason")}')
            projections[str(wid)] = sha(projected)
            for arc in projected['arcs']:
                need(arc['id'] not in by_arc and len(arcs) < MAX_ARCS, 'Duplicate arc or declared graph arc budget exceeded')
                arcs.append(arc); by_arc[arc['id']] = arc
        selections = []; patterns = []; rids = set()
        for relation in relations:
            need(isinstance(relation, dict) and type(relation.get('id')) is int and relation['id'] > 0
                 and relation['id'] not in rids, 'Unique positive raw relation identities required')
            rids.add(relation['id'])
            members = relation.get('members')
            need(isinstance(members, list) and len(members) == 3
                 and all(isinstance(m, dict) and type(m.get('ref')) is int for m in members),
                 'Complete bounded via-node membership required')
            ids = {m['ref'] for m in members if m.get('type') == 'w'}
            need(ids <= set(by_way), 'Restriction member way is outside the declared universe')
            selected_ways = [way for wid, way in by_way.items() if wid in ids]
            nids = {row[0] for way in selected_ways for row in way['nodes']}
            keys = {*(f'way:{wid}' for wid in ids), *(f'node:{nid}' for nid in nids)}
            compiled = compile_relation(relation, selected_ways, [by_node[nid] for nid in sorted(nids)],
                default_policy=default_policy, scenario=scenario, relation_zone=rzones.get(str(relation['id'])),
                feature_zones={key: zones[key] for key in zones if key in keys})
            need(compiled['status'] == 'compiled_declared_transition',
                 f'Unsupported supplied raw relation {relation["id"]}: {compiled.get("reason")}')
            need(set(compiled['declared_arc_sequence']) <= set(by_arc), 'Compiled relation must reference this weighted universe')
            selections.append(compiled)
            if compiled['active_pattern'] is not None:
                patterns.append(compiled['active_pattern'])
        need(set(rzones) <= {str(rid) for rid in rids}, 'Only explicit zones for declared relations are allowed')
        compile_patterns(patterns, by_arc)  # Reject contradictory constraints before emitting any bundle.
        graph = dict(nodes=sorted(wanted), arcs=arcs, maneuvers=patterns,
            relation_compilations=selections, way_projection_sha256=projections,
            scenario_sha256=digest(scenario), cost_policy_sha256=sha(policy()),
            default_policy=default_policy, same_way_reversals='disallowed',
            source_approach='unconstrained-declared-node-start', access_verified=False,
            connector_costs_included=False, anchors_adopted=False, release_eligible=False)
        result.update(status='compiled_declared_graph', graph=graph, declared_graph_compiled=True,
            input_sha256=sha(dict(ways=ways, nodes=nodes, relations=relations,
                feature_zones=zones, relation_zones=rzones, default_policy=default_policy)))
        result['graph_sha256'] = sha(graph)
    except (ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result


def query(ways, nodes, relations, source, target, metric='length', **kwargs):
    # Compile afresh from raw evidence. Never accept a caller-edited compiled
    # bundle, stale temporal pattern or invented approved-graph metadata.
    compiled = compile_graph(ways, nodes, relations, **kwargs)
    result = dict(schema='reference-declared-graph-query-v1', status='unsupported',
        compilation=compiled, result=None, route_cost_emitted=False,
        access_verified=False, connector_costs_included=False, anchors_adopted=False,
        geographic_coverage_certified=False, release_eligible=False)
    if compiled['graph'] is None:
        result['reason'] = compiled['reason']
        return result
    graph = compiled['graph']
    try:
        answer = solve(graph['nodes'], graph['arcs'], graph['maneuvers'], source, target, metric)
        result.update(status='solved_declared_graph', result=answer,
                      route_cost_emitted=answer['cost'] is not None)
    except (ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result
