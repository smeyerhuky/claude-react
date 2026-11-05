"""Compose all supplied via-node/static-via-way controls over declared raw weights."""
from road_reference_declared_graph import compile_graph as weight_stage, MAX_RELATIONS
from road_reference_scenario import load, validate, digest
from road_reference_way_permissions import DEFAULTS
from reference_via_node_compile import compile_relation as node_rule, metadata, need, canonical_sha
from reference_via_way_compile import compile_relation as way_rule, MAX_VIA_WAYS
from road_maneuver_probe import solve, compile_patterns


def compile_graph(ways, nodes, relations, *, default_policy, scenario=None,
                  feature_zones=None, relation_zones=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    need(default_policy == DEFAULTS, 'Explicit supported road-default policy required')
    result = dict(schema='reference-declared-mixed-graph-v1',status='unsupported',graph=None,
        scenario_sha256=digest(scenario),input_sha256=None,declared_graph_compiled=False,
        complete_geographic_graph_constructed=False,all_incident_ways_accounted=False,
        other_relations_accounted=False,geographic_timezone_assignment_verified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='Only the supplied raw way/node/relation universe, compiling every supplied via-node or supported static via-way control. No incident/exterior completeness, other semantics, physical/grade/access truth or reviewed anchor costs.')
    try:
        need(isinstance(relations,list) and len(relations) <= MAX_RELATIONS, 'Bounded complete supplied relation list required')
        rzones = {} if relation_zones is None else relation_zones
        need(isinstance(rzones,dict), 'Explicit relation-zone dictionary required')
        # Reuse the unchanged v1 validator/weight construction only as a PRIVATE
        # road-weight stage. Its relation list is intentionally empty; it emits
        # no query result here. Every ORIGINAL supplied relation is compiled
        # below before any mixed bundle can be returned.
        weighted = weight_stage(ways,nodes,[],default_policy=default_policy,scenario=scenario,feature_zones=feature_zones)
        need(weighted['status'] == 'compiled_declared_graph', 'Unsupported supplied road-weight context: '+str(weighted.get('reason')))
        weight_sha = canonical_sha(weighted)
        graph = weighted['graph']; by_arc = {arc['id']:arc for arc in graph['arcs']}
        by_way = {way['id']:way for way in ways}; by_node = {node['id']:node for node in nodes}
        zones = {} if feature_zones is None else feature_zones
        compiled_relations = []; patterns = []; rids = set()
        for relation in relations:
            metadata(relation,{'id','tags','members'})
            rid = relation['id']; members = relation['members']
            need(rid not in rids, 'Duplicate supplied raw relation identity')
            rids.add(rid)
            need(isinstance(members,list) and 3 <= len(members) <= MAX_VIA_WAYS+2
                 and all(isinstance(m,dict) and set(m) == {'type','ref','role'} for m in members),
                 'Bounded complete raw relation membership required')
            via_types = [m['type'] for m in members if m['role'] == 'via']
            if via_types == ['n']:
                compiler = node_rule; expected = 'compiled_declared_transition'
            else:
                need(via_types and all(kind == 'w' for kind in via_types), 'Mixed or missing via-member types are unsupported')
                compiler = way_rule; expected = 'compiled_declared_maneuver'
            ids = {m['ref'] for m in members if m['type'] == 'w'}
            need(ids <= set(by_way), 'A supplied restriction member way is outside the declared universe')
            selected_ways = [way for wid,way in by_way.items() if wid in ids]
            nids = {point[0] for way in selected_ways for point in way['nodes']}
            keys = {*(f'way:{wid}' for wid in ids), *(f'node:{nid}' for nid in nids)}
            row = compiler(relation,selected_ways,[by_node[nid] for nid in sorted(nids)],
                default_policy=default_policy,scenario=scenario,relation_zone=rzones.get(str(rid)),
                feature_zones={key:zones[key] for key in zones if key in keys})
            need(row['status'] == expected, f'Unsupported supplied raw relation {rid}: {row.get("reason")}')
            need(row['scenario_sha256'] == weighted['scenario_sha256']
                 and set(row['declared_arc_sequence']) <= set(by_arc), 'Every compiled control must match this scenario and weighted arc universe')
            compiled_relations.append(row)
            if row['active_pattern'] is not None:
                patterns.append(row['active_pattern'])
        need(set(rzones) <= {str(rid) for rid in rids}, 'Only explicit zones for supplied raw relations allowed')
        compile_patterns(patterns,by_arc)  # Conflicts/budgets reject before publishing a bundle.
        graph.update(maneuvers=patterns,relation_compilations=compiled_relations,
            supplied_raw_relation_ids=[relation['id'] for relation in relations],
            maneuver_compiler='via-node-fixed-reference-and-static-via-way-v1')
        result.update(status='compiled_declared_mixed_graph',graph=graph,declared_graph_compiled=True,
            cost_policy_sha256=weighted['cost_policy_sha256'],way_weight_stage_sha256=weight_sha,
            input_sha256=canonical_sha(dict(ways=ways,nodes=nodes,relations=relations,
                feature_zones=zones,relation_zones=rzones,default_policy=default_policy)),
            graph_sha256=canonical_sha(graph))
    except (ValueError,TypeError) as error:
        result['reason'] = str(error)
    return result


def query(ways, nodes, relations, source, target, metric='length', **kwargs):
    compiled = compile_graph(ways,nodes,relations,**kwargs)
    result = dict(schema='reference-declared-mixed-query-v1',status='unsupported',compilation=compiled,
        result=None,route_cost_emitted=False,access_verified=False,connector_costs_included=False,
        anchors_adopted=False,geographic_coverage_certified=False,release_eligible=False)
    if compiled['graph'] is None:
        result['reason'] = compiled['reason']
        return result
    graph = compiled['graph']
    try:
        answer = solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source,target,metric)
        result.update(status='solved_declared_mixed_graph',result=answer,route_cost_emitted=answer['cost'] is not None)
    except (ValueError,TypeError) as error:
        result['reason'] = str(error)
    return result
