"""Bind declared directed-turn compilation to the frozen raw source and time policy."""
import argparse
import hashlib
import json
from road_reference_scenario import ROOT, load, digest
from reference_turn_rule_checkpoint import project as rule_project, source_relation, REGRESSIONS
from reference_via_node_compile import compile_relation
from road_reference_way_permissions import DEFAULTS

REFERENCE = ROOT / 'docs/research/reference-via-node-compilation'
RULE_REFERENCE = ROOT / 'docs/research/reference-turn-rules/report.json'
RAW = ROOT / 'docs/research/fort-collins-entry-context/raw-osm-context.json'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project():
    if json.loads(RULE_REFERENCE.read_text()) != rule_project():
        raise ValueError('Exact frozen raw-rule/source checkpoint required')
    relation = source_relation(); context = json.loads(RAW.read_text())
    ids = {m['ref'] for m in relation['members'] if m['type'] == 'w'}
    ways = [w for w in context['ways'] if w['id'] in ids]
    wanted = {row[0] for way in ways for row in way['nodes']}
    nodes = [node for node in context['nodes'] if node['id'] in wanted]
    expected = ['raw:696728766:5:forward', 'raw:1475543490:0:forward']
    def compile_at(instant):
        scenario = load(); scenario['reference_instant_utc'] = instant
        result = compile_relation(relation, ways, nodes, default_policy=DEFAULTS,
                                  scenario=scenario, relation_zone='America/Denver')
        if result['status'] != 'compiled_declared_transition' or result['declared_arc_sequence'] != expected:
            raise ValueError('Review changed exact member-segment transition')
        return result
    reference = compile_at(load()['reference_instant_utc'])
    if reference['active_pattern'] is not None:
        raise ValueError('Reference instant must retain the inactive declaration, not an active prohibition')
    boundaries = []
    for instant, active in REGRESSIONS:
        result = compile_at(instant)
        if (result['active_pattern'] is not None) is not active:
            raise ValueError('Declared transition clock applicability changed')
        if active and (result['active_pattern']['kind'] != 'no' or result['active_pattern']['arc_sequence'] != expected):
            raise ValueError('Active source prohibition must preserve the exact declared segment sequence')
        boundaries.append(dict(test_instant_utc=instant, compilation=result))
    return dict(schema='reference-via-node-compilation-checkpoint-v1', raw_relation_id=20193102,
        raw_context_sha256=sha(RAW), source_rule_report_sha256=sha(RULE_REFERENCE),
        scenario_sha256=digest(load()), member_way_ids=sorted(ids), complete_member_nodes=len(nodes),
        implementation_sha256={name: sha(ROOT / 'scripts' / name) for name in
            ('reference_via_node_compile.py', 'reference_via_node_checkpoint.py', 'road_reference_turn_rules.py',
             'road_reference_segment_permissions.py', 'road_reference_way_permissions.py',
             'road_reference_conditionals.py', 'road_reference_scenario.py', 'road_turn_aware_probe.py')},
        reference_compilation=reference, boundary_regressions=boundaries,
        real_route_cost_emitted=False, complete_geographic_graph_constructed=False,
        access_verified=False, anchors_adopted=False, release_eligible=False,
        warning='Declared raw-source segment matching and time selection only. Synthetic enforcement tests do not supply real edge weights, independent turn/grade/access evidence, all incident roads, anchor attachments, exterior closure or an approved geographic road layer. Old costs and source access findings remain unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true'); args = parser.parse_args()
    result = project(); path = REFERENCE / 'report.json'
    if args.write:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Frozen directed-turn compilation checkpoint differs')
    print(dict(raw_relation_id=20193102, exact_directed_segments=result['reference_compilation']['declared_arc_sequence'],
        reference_pattern_active=False, boundary_regressions=len(result['boundary_regressions']),
        real_route_cost_emitted=False, access_verified=False))
