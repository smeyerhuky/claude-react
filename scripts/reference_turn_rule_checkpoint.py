"""Replay raw turn-rule selection against the frozen Fort Collins source context."""
import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
from pathlib import Path
from fort_collins_entry_context import project as parent_project, REFERENCE as PARENT
from road_reference_scenario import ROOT, load, digest, declared_zone
from road_reference_turn_rules import resolve

REFERENCE = ROOT / 'docs/research/reference-turn-rules'
REGRESSIONS = (
    ('2026-10-30T00:59:59Z', False), ('2026-10-30T01:00:00Z', True),
    ('2026-10-30T05:59:59Z', True), ('2026-10-30T06:00:00Z', False),
    ('2026-11-01T05:59:59Z', True), ('2026-11-01T06:00:00Z', False),
)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def source_relation():
    if json.loads((PARENT / 'report.json').read_text()) != parent_project():
        raise ValueError('Exact frozen source/context parent required')
    raw = json.loads((PARENT / 'raw-osm-context.json').read_text())
    if len(raw['restrictions']) != 1 or raw['restrictions'][0]['id'] != 20193102:
        raise ValueError('Exact complete retained conditional-only restriction required')
    return raw['restrictions'][0]


def project():
    relation = source_relation(); scenario = load()
    reference = resolve(relation, zone='America/Denver', scenario=scenario)
    if (reference['status'] != 'resolved_relation_applicability' or reference['applies'] is not False
            or reference['selected_raw_value'] is not None):
        raise ValueError('Review changed fixed-reference relation selection')
    regressions = []
    for instant, expected in REGRESSIONS:
        test_scenario = load(); test_scenario['reference_instant_utc'] = instant
        result = resolve(relation, zone='America/Denver', scenario=test_scenario)
        if result['status'] != 'resolved_relation_applicability' or result['applies'] is not expected:
            raise ValueError('Actual retained relation clock boundary changed')
        regressions.append(dict(test_instant_utc=instant, selection=result))
    return dict(schema='reference-turn-rule-checkpoint-v1', relation_id=20193102,
        source_context_sha256=sha(PARENT / 'raw-osm-context.json'),
        source_parent_report_sha256=sha(PARENT / 'report.json'), scenario_sha256=digest(scenario),
        implementation_sha256={name: sha(ROOT / 'scripts' / name) for name in
            ('road_reference_turn_rules.py', 'reference_turn_rule_checkpoint.py',
             'road_reference_conditionals.py', 'road_reference_scenario.py', 'road_turn_aware_probe.py',
             'check_reference_turn_rule_oracle.cjs')},
        reference_selection=reference, boundary_regressions=regressions,
        independent_clock_oracle_required=dict(library='opening_hours', version='3.15.0', weekly_minutes=10080),
        topology_compiled=False, route_cost_emitted=False, access_verified=False,
        anchors_adopted=False, release_eligible=False,
        warning='One raw via-node relation applicability selection, not general turn permission or geometric routing. Boundary-regression scenarios are tests, not adopted map scenarios. An inactive relation does not establish absence of other restrictions. Original costs and Fort Collins access findings remain unchanged.')


def oracle_fixture():
    relation = source_relation()
    start = datetime(2026, 10, 26, tzinfo=declared_zone('America/Denver'))
    bits = []
    for index in range(10080):
        local = start + timedelta(minutes=index)
        scenario = load()
        scenario['reference_instant_utc'] = local.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')
        result = resolve(relation, zone='America/Denver', scenario=scenario)
        if (result['status'] != 'resolved_relation_applicability'
                or result['selected_raw_value'] != ('no_u_turn' if result['applies'] else None)):
            raise ValueError('No partial weekly applicability fixture')
        bits.append('1' if result['applies'] else '0')
    return dict(schema='turn-rule-weekly-oracle-v1', source_relation_id=20193102,
        source_context_sha256=sha(PARENT / 'raw-osm-context.json'),
        raw_expression=relation['tags']['restriction:conditional'], declared_zone='America/Denver',
        local_wall_clock_start='2026-10-26T00:00:00Z', minute_count=10080, expected_bits=''.join(bits),
        scope='Synthetic wall-clock week from actual raw relation; no elapsed-time routing or adopted alternative map reference times.',
        topology_compiled=False, access_verified=False, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--oracle-fixture', type=Path)
    args = parser.parse_args()
    if args.oracle_fixture:
        result = oracle_fixture()
        args.oracle_fixture.write_text(json.dumps(result, sort_keys=True) + '\n')
        print(dict(weekly_minutes=result['minute_count'], route_cost_emitted=False))
    else:
        result = project(); path = REFERENCE / 'report.json'
        if args.write:
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
        elif json.loads(path.read_text()) != result:
            raise ValueError('Frozen raw turn-rule checkpoint differs')
        print(dict(relation_id=20193102, reference_rule_applies=result['reference_selection']['applies'],
                   boundary_tests=len(REGRESSIONS), topology_compiled=False, access_verified=False))
