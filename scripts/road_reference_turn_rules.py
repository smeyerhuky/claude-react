"""Select bounded raw via-node car rules at a fixed instant; never compile a turn."""
import hashlib
import json
from road_reference_scenario import load, validate, digest, local_reference
from road_reference_conditionals import parse_expression, matches, UnsupportedCondition
from road_turn_aware_probe import KINDS, _positive_id

POLICY = 'reference-via-node-car-rule-selection-v1'
CAR_KEYS = ('restriction', 'restriction:motor_vehicle', 'restriction:motorcar')
NON_CAR = {'bicycle', 'foot', 'bus', 'psv', 'taxi', 'hgv', 'goods', 'emergency', 'motorcycle', 'moped', 'mofa'}
CAR_EXCEPTIONS = {'vehicle', 'motor_vehicle', 'motorcar'}


class UnsupportedRule(ValueError):
    pass


def need(condition, reason):
    if not condition:
        raise UnsupportedRule(reason)


def resolve(relation, *, zone=None, scenario=None):
    scenario = load() if scenario is None else scenario
    validate(scenario)
    result = dict(schema=POLICY, status='unsupported', scenario_sha256=digest(scenario),
        declared_zone=None, input_sha256=None, applies=None, selected_raw_value=None,
        selected_key=None, raw_value_traces=[],
        inactive_conditional_only_policy='no_rule_from_this_relation',
        topology_compiled=False, turn_legality_certified=False, geographic_timezone_assignment_verified=False,
        other_relations_accounted=False, route_cost_emitted=False, access_verified=False,
        anchors_adopted=False, release_eligible=False,
        scope='One structurally declared via-node relation only. Rule-value/applicability selection is not geometric maneuver compilation, general turn permission, lane/grade/access proof or a route cost.')
    try:
        need(isinstance(relation, dict) and {'id', 'tags', 'members'} <= set(relation)
             and set(relation) <= {'id', 'tags', 'members', 'version', 'timestamp'}
             and _positive_id(relation['id']), 'Bounded explicit raw relation identity required')
        if 'version' in relation:
            need(type(relation['version']) is int and 0 < relation['version'] < 2**31, 'Bounded source version required')
        if 'timestamp' in relation:
            need(isinstance(relation['timestamp'], str) and len(relation['timestamp']) <= 64, 'Bounded source timestamp required')
        tags = relation['tags']; members = relation['members']
        need(isinstance(tags, dict) and len(tags) <= 64 and all(isinstance(k, str) and isinstance(v, str)
             and 0 < len(k) <= 128 and len(v) <= 8192 for k, v in tags.items())
             and sum(len(k) + len(v) for k, v in tags.items()) <= 32768,
             'Bounded complete raw string-tag context required')
        need(tags.get('type') == 'restriction', 'Explicit restriction relation required')
        need(isinstance(members, list) and len(members) == 3, 'Exactly one from/via-node/to membership required')
        roles = {}
        for member in members:
            need(isinstance(member, dict) and set(member) == {'type', 'ref', 'role'}
                 and member['role'] in {'from', 'via', 'to'} and member['role'] not in roles
                 and _positive_id(member['ref'])
                 and member['type'] == ('n' if member['role'] == 'via' else 'w'),
                 'Unique positive from/to ways and via node required; no via-way or omitted members')
            roles[member['role']] = member
        need(set(roles) == {'from', 'via', 'to'}, 'Complete structural relation membership required')
        if zone is not None:
            local_reference(scenario, zone)
            result['declared_zone'] = zone
        result['input_sha256'] = hashlib.sha256(json.dumps(dict(relation=relation, zone=zone),
            sort_keys=True, separators=(',', ':'), allow_nan=False).encode()).hexdigest()
        for key in tags:
            need(key.split(':')[0] not in {'access', 'vehicle', 'motor_vehicle', 'motorcar', 'hov',
                 'oneway', 'maxheight', 'maxwidth', 'maxlength', 'maxweight', 'opening_hours'}
                 and not key.startswith('except:'),
                 'Extra access, vehicle, schedule or exception context requires separate evaluation')
            need(not any(key == k for k in ('day_on', 'day_off', 'hour_on', 'hour_off')),
                 'Legacy time fields require a separate contract')
            need(':lanes' not in key, 'Lane-specific restriction needs a separate maneuver contract')
            if 'conditional' in key:
                need(key.endswith(':conditional') and key[:-12] in CAR_KEYS,
                     'Conditional control outside supported car-restriction keys')
            elif key.startswith('restriction:'):
                need(key in CAR_KEYS or key[len('restriction:'):] in NON_CAR,
                     'Unknown mode-specific restriction namespace')
        need(any(key in tags or key + ':conditional' in tags for key in CAR_KEYS),
             'At least one explicit car-relevant raw rule required')
        values = {}
        for key in CAR_KEYS:
            if key not in tags and key + ':conditional' not in tags:
                continue
            base = tags.get(key)
            need(base is None or base in KINDS, 'Unsupported raw restriction kind')
            clauses = parse_expression(tags[key + ':conditional']) if key + ':conditional' in tags else []
            need(all(value in KINDS for value, _ in clauses), 'Unsupported conditional restriction kind')
            active = []
            if clauses:
                need(zone is not None, 'Explicit IANA zone required for this conditional relation')
                local = local_reference(scenario, zone)
                active = [i for i, (_, condition) in enumerate(clauses) if matches(condition, local)]
            value = clauses[active[-1]][0] if active else base
            values[key] = value
            result['raw_value_traces'].append(dict(key=key, selected_raw_value=value,
                matching_clause_indices=active, source='conditional' if active else
                ('base' if base is not None else 'no_active_clause_and_no_explicit_base')))
        # Validate exceptions after parsing every clause: an exemption must not
        # conceal malformed/unsupported syntax or silently erase raw evidence.
        exceptions = []
        if 'except' in tags:
            exceptions = [value.strip() for value in tags['except'].split(';')]
            need(0 < len(exceptions) <= 16 and len(set(exceptions)) == len(exceptions)
                 and all(value in NON_CAR | CAR_EXCEPTIONS for value in exceptions),
                 'Unknown purpose, permit or exception-mode semantics')
        selected_key = next((key for key in reversed(CAR_KEYS) if values.get(key) is not None), None)
        selected = values[selected_key] if selected_key is not None else None
        exempt = bool(set(exceptions) & CAR_EXCEPTIONS)
        basis = ('explicit_car_exception' if exempt else
                 'selected_raw_rule' if selected is not None else 'no_active_clause_and_no_applicable_static_rule')
        result.update(status='resolved_relation_applicability', applies=bool(selected is not None and not exempt),
            selected_raw_value=selected, selected_key=selected_key, basis=basis,
            explicit_exceptions=exceptions, declared_members=[dict(member) for member in members])
    except (UnsupportedRule, UnsupportedCondition, ValueError, TypeError) as error:
        result['reason'] = str(error)
    return result
