"""Bounded forward arc-state research oracle for explicit via-node car turns.

This does not validate road access, build a national graph, or change the retained
node-state routing model. Unsupported relation semantics reject the whole query.
"""
from collections import defaultdict
from fractions import Fraction
import heapq
import itertools
import math

MAX_NODES = 50_000
MAX_ARCS = 100_000
MAX_STATES = 200_000
MAX_TRANSITIONS = 1_000_000
KINDS = {'no_left_turn', 'no_right_turn', 'no_straight_on', 'no_u_turn',
         'only_left_turn', 'only_right_turn', 'only_straight_on', 'only_u_turn'}
POLICY = 'bounded-forward-via-node-car-turn-probe-v1'
EXCEPTIONS = {'', 'motorcar', 'motor_vehicle', 'vehicle', 'bicycle', 'bus', 'psv', 'taxi',
              'hgv', 'goods', 'emergency', 'motorcycle', 'moped', 'mofa', 'agricultural', 'forestry'}


class UnsupportedTurn(ValueError):
    pass


class BudgetExceeded(ValueError):
    pass


def _positive_id(value):
    return type(value) is int and 0 < value <= 2**63-1


def _cost(value):
    if type(value) not in (int, float, Fraction) or isinstance(value, bool):
        raise ValueError('Finite nonnegative stored arc cost required')
    if type(value) is float and not math.isfinite(value):
        raise ValueError('Finite nonnegative stored arc cost required')
    value = Fraction(value)
    if not 0 <= value <= 10**15:
        raise ValueError('Finite bounded nonnegative arc cost required')
    return value


def _compile(arcs, relations):
    incoming = defaultdict(list); outgoing = defaultdict(list)
    for arc in arcs:
        incoming[arc['way'], arc['to']].append(arc)
        outgoing[arc['way'], arc['from']].append(arc)
    no = defaultdict(set); only = {}; seen = set(); car_exempt = []; explicit_u = set()
    for relation in relations:
        rid = relation['id']
        if not _positive_id(rid) or rid in seen:
            raise UnsupportedTurn('Unique positive restriction relation IDs required')
        seen.add(rid); tags = relation['tags']
        if tags.get('type') != 'restriction':
            raise UnsupportedTurn('Only explicit restriction relations accepted')
        exceptions = {s.strip() for s in tags.get('except', '').split(';')}
        if not exceptions <= EXCEPTIONS or tags.get('except:conditional'):
            raise UnsupportedTurn('Unreviewed vehicle-purpose or conditional exception')
        if exceptions & {'motorcar', 'motor_vehicle', 'vehicle'}:
            car_exempt.append(rid); continue
        kind = tags.get('restriction:motorcar', tags.get('restriction:motor_vehicle', tags.get('restriction')))
        if kind is None:
            raise UnsupportedTurn('Car applicability must be explicit; prefilter unrelated modes separately')
        if any(tags.get(k) for k in ('restriction:conditional', 'restriction:motorcar:conditional',
                                     'restriction:motor_vehicle:conditional', 'day_on', 'day_off', 'hour_on', 'hour_off')):
            raise UnsupportedTurn('Conditional turns require a separately reviewed time model')
        if kind not in KINDS or ',' in tags.get('except', ''):
            raise UnsupportedTurn('Unsupported turn or exception semantics')
        members = relation['members']
        roles = defaultdict(list)
        for member in members: roles[member['role']].append(member)
        if len(members) != 3 or set(roles) != {'from', 'via', 'to'} or any(len(v) != 1 for v in roles.values()):
            raise UnsupportedTurn('Single from/via/to relation required')
        f, v, t = (roles[k][0] for k in ('from', 'via', 'to'))
        if (f['type'], v['type'], t['type']) != ('w', 'n', 'w') or not all(_positive_id(m['ref']) for m in (f, v, t)):
            raise UnsupportedTurn('Via-way and nonstandard turn relations are unsupported')
        key = (f['ref'], v['ref'])
        approaches = incoming[key]; departures = outgoing[t['ref'], v['ref']]
        # Do not guess which direction is meant on an unsplit two-way from/to
        # way. Unique directed arc identities are necessary for this version.
        if len(approaches) != 1 or len(departures) != 1:
            raise UnsupportedTurn('Missing or ambiguous directed restriction approach/departure')
        departure = departures[0]['id']
        if kind == 'only_u_turn': explicit_u.add((approaches[0]['id'], departure))
        if kind.startswith('only_'):
            if key in only and only[key] != departure:
                raise UnsupportedTurn('Multiple only-turn disjunction requires reviewed semantics')
            only[key] = departure
        else:
            no[key].add(departure)
    if any(departure in no[key] for key, departure in only.items()):
        raise UnsupportedTurn('Contradictory only/no turn relations')
    return no, only, sorted(car_exempt), explicit_u


def solve(nodes, arcs, relations, source, target, metric='length', *,
          max_states=MAX_STATES, max_transitions=MAX_TRANSITIONS, allowed_reversals=()):
    def bounded(values, maximum):
        result = list(itertools.islice(values, maximum+1))
        if len(result) > maximum:
            raise ValueError('Declared graph input exceeds bounded probe limits')
        return result
    nodes = bounded(nodes, MAX_NODES); arcs = bounded(arcs, MAX_ARCS); relations = bounded(relations, MAX_ARCS)
    if (not 1 <= len(nodes) <= MAX_NODES or len(set(nodes)) != len(nodes)
            or not all(_positive_id(n) for n in nodes) or len(arcs) > MAX_ARCS
            or len(relations) > MAX_ARCS or metric not in ('length', 'travel_time')
            or type(max_states) is not int or not 1 <= max_states <= MAX_STATES
            or type(max_transitions) is not int or not 1 <= max_transitions <= MAX_TRANSITIONS):
        raise ValueError('Bounded valid declared graph/query required')
    node_set = set(nodes)
    if not _positive_id(source) or not _positive_id(target) or source not in node_set or target not in node_set:
        raise ValueError('Source and target must be declared graph endpoints')
    by_id = {}; adjacency = defaultdict(list); costs = {}
    for arc in arcs:
        aid = arc['id']
        if (not isinstance(aid, str) or not aid or aid in by_id or not _positive_id(arc['way'])
                or not _positive_id(arc['from']) or not _positive_id(arc['to'])
                or arc['from'] not in node_set or arc['to'] not in node_set):
            raise ValueError('Unique arc identities and declared way/endpoints required')
        # Validate both metrics even when querying just one.
        for name in ('length', 'travel_time'): _cost(arc[name])
        by_id[aid] = arc; costs[aid] = _cost(arc[metric]); adjacency[arc['from']].append(arc)
    forbidden, only, exempt, explicit_u = _compile(arcs, relations)
    reversals = set()
    for pair in bounded(allowed_reversals, MAX_ARCS):
        if not isinstance(pair, (list, tuple)) or len(pair) != 2 or not all(isinstance(a, str) and a in by_id for a in pair):
            raise ValueError('Declared reversal must bind two existing arc IDs')
        a, b = map(by_id.__getitem__, pair); pair = tuple(pair)
        if pair in reversals or a['way'] != b['way'] or a['from'] != b['to'] or a['to'] != b['from']:
            raise ValueError('Unique same-way reversal arc pair required')
        reversals.add(pair)
    reversals |= explicit_u
    start = (source, None); distances = {start: Fraction(0)}; previous = {}; counter = itertools.count()
    heap = [(Fraction(0), next(counter), start)]; settled = set(); examined = 0; final = None
    while heap:
        distance, _, state = heapq.heappop(heap)
        if state in settled or distance != distances[state]: continue
        settled.add(state); node, incoming_id = state
        if node == target: final = state; break
        incoming = by_id[incoming_id] if incoming_id is not None else None
        for arc in adjacency[node]:
            examined += 1
            if examined > max_transitions:
                raise BudgetExceeded('Transition budget exhausted; no partial result returned')
            if incoming is not None:
                if (incoming['way'] == arc['way'] and incoming['from'] == arc['to']
                        and (incoming_id, arc['id']) not in reversals): continue
                key = (incoming['way'], node)
                if arc['id'] in forbidden[key] or (key in only and only[key] != arc['id']): continue
            next_state = (arc['to'], arc['id']); candidate = distance + costs[arc['id']]
            if next_state not in distances or candidate < distances[next_state]:
                if next_state not in distances and len(distances) >= max_states:
                    raise BudgetExceeded('Arc-state budget exhausted; no partial result returned')
                distances[next_state] = candidate; previous[next_state] = (state, arc['id'])
                heapq.heappush(heap, (candidate, next(counter), next_state))
    path = []
    if final is not None:
        current = final
        while current != start:
            current, aid = previous[current]; path.append(aid)
        path.reverse(); value = distances[final]
        if sum((costs[aid] for aid in path), Fraction(0)) != value:
            raise AssertionError('Exact directed arc replay differs')
    else: value = None
    return dict(solver_policy=POLICY, source=source, target=target, metric=metric,
                orientation='explicit-forward-source-to-target', source_approach='unconstrained-declared-node-start', cost=None if value is None else float(value),
                exact_stored_path_cost=None if value is None else [str(value.numerator), str(value.denominator)],
                arc_path=path, settled_states=len(settled), discovered_states=len(distances),
                transitions_examined=examined, car_exempt_relation_ids=exempt,
                reversal_policy='same-way-immediate-reversals-require-declared-pair-or-only-u-rule',
                declared_reversal_pairs=[list(p) for p in sorted(reversals)],
                converged=True, partial_results_returned=False, access_certified=False,
                geographic_coverage_certified=False, release_eligible=False,
                warning='Exact path in the declared local graph only. No source, anchor, real-world turn/access, exterior closure or geographic coverage certification.')
