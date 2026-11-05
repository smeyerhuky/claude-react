"""Replay bounded raw-source graph composition without adopting anchors or access."""
import argparse
import hashlib
import json
from road_reference_scenario import ROOT, load, digest
from road_reference_way_permissions import DEFAULTS
from road_reference_declared_graph import compile_graph, query
from road_reference_segment_costs import sha
from reference_segment_cost_checkpoint import project as parent_project, REFERENCE as PARENT, RAW

REFERENCE = ROOT / 'docs/research/reference-declared-graph'


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project():
    parent_path = PARENT / 'report.json'
    if parent_project() != json.loads(parent_path.read_text()):
        raise ValueError('Exact frozen segment-weight parent required')
    raw = json.loads(RAW.read_text()); relations = raw['restrictions']
    ids = {m['ref'] for r in relations for m in r['members'] if m['type'] == 'w'}
    ways = [way for way in raw['ways'] if way['id'] in ids]
    nids = {row[0] for way in ways for row in way['nodes']}
    nodes = [node for node in raw['nodes'] if node['id'] in nids]
    kwargs = dict(default_policy=DEFAULTS, relation_zones={'20193102':'America/Denver'})
    compiled = compile_graph(ways, nodes, relations, **kwargs)
    if compiled['status'] != 'compiled_declared_graph':
        raise ValueError('Exact two-member declared graph must compile')
    by_arc = {arc['id']:arc for arc in compiled['graph']['arcs']}
    incoming = by_arc['raw:696728766:5:forward']; outgoing = by_arc['raw:1475543490:0:forward']
    source, target = incoming['from'], outgoing['to']; answers = {}
    active = load(); active['reference_instant_utc'] = '2026-10-30T01:00:00Z'
    for scenario_name, scenario in [('adopted_reference',load()), ('active_window_regression',active)]:
        for metric in ('length','travel_time'):
            for direction, start, end in [('forward',source,target), ('reverse',target,source)]:
                answer = query(ways, nodes, relations, start, end, metric, scenario=scenario, **kwargs)
                if answer['status'] != 'solved_declared_graph':
                    raise ValueError('Declared graph query must converge')
                expected_finite = scenario_name == 'adopted_reference' and direction == 'forward'
                if (answer['result']['cost'] is not None) != expected_finite:
                    raise ValueError('Review changed declared graph cost/unknown scope')
                if expected_finite and answer['result']['arc_path'] != [incoming['id'],outgoing['id']]:
                    raise ValueError('Exact declared two-arc path changed')
                answers[f'{scenario_name}:{metric}:{direction}'] = dict(
                    scenario_sha256=answer['compilation']['scenario_sha256'],
                    graph_sha256=answer['compilation']['graph_sha256'], result=answer['result'],
                    route_cost_emitted=answer['route_cost_emitted'], geographic_coverage_certified=False,
                    access_verified=False, anchors_adopted=False, connector_costs_included=False)
    bollard = next(w for w in raw['ways'] if w['id'] == 815164359)
    nids |= {row[0] for row in bollard['nodes']}
    expanded_nodes = [node for node in raw['nodes'] if node['id'] in nids]
    blocked = compile_graph(ways+[bollard], expanded_nodes, relations, **kwargs)
    if blocked['graph'] is not None or blocked['status'] != 'unsupported':
        raise ValueError('Unknown supplied bollard context must reject the whole bundle')
    return dict(schema='reference-declared-graph-checkpoint-v1', raw_context_sha256=file_sha(RAW),
        segment_cost_report_sha256=file_sha(parent_path), scenario_sha256=digest(load()),
        declared_input_sha256=compiled['input_sha256'], declared_graph_sha256=compiled['graph_sha256'],
        graph_nodes=len(compiled['graph']['nodes']), weighted_arcs=len(compiled['graph']['arcs']),
        original_member_way_ids=sorted(ids), raw_relation_ids=[r['id'] for r in relations],
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('road_reference_declared_graph.py','reference_declared_graph_checkpoint.py',
             'road_reference_segment_costs.py','reference_via_node_compile.py',
             'road_reference_turn_rules.py','road_reference_segment_permissions.py',
             'road_reference_way_permissions.py','road_reference_conditionals.py',
             'road_reference_scenario.py','road_maneuver_probe.py','road_turn_aware_probe.py')},
        declared_node_source=source, declared_node_target=target, query_replays=answers,
        unresolved_bollard_bundle=blocked, complete_geographic_graph_constructed=False,
        all_incident_ways_accounted=False, other_relations_accounted=False, access_verified=False,
        anchors_adopted=False, connector_costs_included=False, release_eligible=False,
        warning='Only a declared two-way universe and raw-node starts/ends. Its finite/unreachable costs are not globally optimal travel costs, real-world turn/access proof, metro anchor costs, geographic regions or replacement historical costs. An inactive relation does not establish turn permission. The alternative active instant is a regression test, not an adopted scenario.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true'); args = parser.parse_args()
    result = project(); path = REFERENCE/'report.json'
    if args.write:
        path.parent.mkdir(parents=True,exist_ok=True)
        path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Frozen declared-graph checkpoint differs')
    print(dict(graph_nodes=result['graph_nodes'],weighted_arcs=result['weighted_arcs'],
        query_replays=len(result['query_replays']),unresolved_bollard_rejects_entire_bundle=True,
        geographic_coverage_certified=False,access_verified=False))
