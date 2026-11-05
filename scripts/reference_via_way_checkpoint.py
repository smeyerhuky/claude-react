"""Bind two actual static via-way chains to complete original raw member-node context."""
import argparse
import hashlib
import json
from fort_collins_via_way_context import ROOT, RAW, CASES
from reference_seed_incidence_checkpoint import project as seed_project, REFERENCE as SEED_REFERENCE
from reference_via_way_compile import compile_relation
from road_reference_way_permissions import DEFAULTS
from road_reference_scenario import load, digest

REFERENCE = ROOT/'docs/research/reference-via-way-compilation'
CONTEXT = REFERENCE/'source-context.json'
EXPECTED = {
    9680890: ['raw:186582632:4:forward','raw:134584349:0:forward','raw:290286621:0:forward'],
    9680891: ['raw:290286621:0:forward','raw:6172542:0:forward','raw:134584350:0:forward']}


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def need(value,reason):
    if not value:
        raise ValueError(reason)


def project(context=None):
    parent_path = SEED_REFERENCE/'report.json'
    need(seed_project() == json.loads(parent_path.read_text()), 'Exact frozen source-incidence parent required')
    context = json.loads(CONTEXT.read_text()) if context is None else context
    need(context['schema'] == 'fort-collins-via-way-member-context-v1'
         and context['source'] == json.loads(RAW.read_text())['source'], 'Exact original source identity required')
    need(all(context[key] is False for key in ('access_verified','anchors_adopted','connector_costs_included','release_eligible')),
         'Raw source context must not assert access/adoption/approval')
    ways = context['ways']; nodes = context['nodes']; relations = context['restrictions']
    wanted = {wid for chain in CASES.values() for wid in chain}
    need(len(ways) == len(wanted) == 5 and {way['id'] for way in ways} == wanted,
         'Exact five complete raw member ways required')
    nids = {row[0] for way in ways for row in way['nodes']}
    need(len(nodes) == len(nids) == 15 and {node['id'] for node in nodes} == nids, 'Every one of the fifteen member-node records required')
    need(len(relations) == 2 and {r['id'] for r in relations} == set(CASES), 'Exact two named raw restrictions required')
    results = {}
    for relation in relations:
        rid = relation['id']; ids = set(CASES[rid]); selected = [w for w in ways if w['id'] in ids]
        selected_ids = {row[0] for way in selected for row in way['nodes']}
        expected_members = [dict(type='w',ref=wid,role=role) for wid,role in zip(CASES[rid],('from','via','to'))]
        need(relation['members'] == expected_members, 'Exact raw ordered membership required')
        result = compile_relation(relation,selected,[node for node in nodes if node['id'] in selected_ids],default_policy=DEFAULTS)
        need(result['status'] == 'compiled_declared_maneuver' and result['declared_arc_sequence'] == EXPECTED[rid]
             and result['selected_raw_value'] == 'no_u_turn' and result['active_pattern']['kind'] == 'no',
             'Review changed actual static declaration or directed raw segment chain')
        results[str(rid)] = result
    return dict(schema='reference-static-via-way-checkpoint-v1',source_context_sha256=file_sha(CONTEXT),
        seed_incidence_report_sha256=file_sha(parent_path),scenario_sha256=digest(load()),
        complete_member_ways=5,complete_member_nodes=15,compilations=results,
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('fort_collins_via_way_context.py','reference_via_way_compile.py','reference_via_way_checkpoint.py',
             'reference_via_node_compile.py','road_reference_segment_permissions.py',
             'road_reference_way_permissions.py','road_reference_conditionals.py',
             'road_reference_scenario.py','road_turn_aware_probe.py')},
        complete_geographic_graph_constructed=False,independent_maneuver_geometry_verified=False,
        route_cost_emitted=False,access_verified=False,anchors_adopted=False,
        connector_costs_included=False,release_eligible=False,
        warning='Two static raw-source via-way declarations only. Full member-node permissions use the fixed scenario, but physical maneuver labels, signs, grade/access, all incident roads/other controls, anchor attachments and exterior closure remain unverified. No weights, route costs, connectors, anchors or public road layer are emitted. Historical checkpoints are unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:
        path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Frozen static via-way checkpoint differs')
    print(dict(raw_relations=sorted(result['compilations']),complete_member_ways=5,complete_member_nodes=15,
        declared_pattern_arcs=[len(row['declared_arc_sequence']) for row in result['compilations'].values()],
        route_cost_emitted=False,access_verified=False))
