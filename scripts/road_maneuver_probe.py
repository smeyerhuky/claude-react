"""Bounded research search over explicit directed-arc maneuver sequences.

Inputs are declared constraints, not independently approved OSM interpretations.
This does not compile raw relations, certify access or replace the old road model.
"""
from collections import defaultdict
from fractions import Fraction
import heapq
import itertools
from road_turn_aware_probe import _positive_id, _cost, BudgetExceeded

MAX_NODES = 50_000
MAX_ARCS = 100_000
MAX_MANEUVERS = 2_000
MAX_SEQUENCE_ARCS = 128
MAX_MANEUVER_ARCS = 100_000
MAX_COMPILE_CHECKS = 1_000_000
MAX_PREFIXES_PER_STATE = 4_096
MAX_TOTAL_PREFIX_ENTRIES = 1_000_000
MAX_STATES = 100_000
MAX_TRANSITIONS = 1_000_000
POLICY = 'bounded-explicit-arc-maneuver-history-v1'


def require(value, message):
    if not value: raise ValueError(message)


def bounded(values, maximum):
    result = list(itertools.islice(values, maximum+1))
    require(len(result) <= maximum, 'Declared maneuver input budget exceeded')
    return result


def compile_patterns(maneuvers, by_id, max_compile_checks=MAX_COMPILE_CHECKS):
    require(type(max_compile_checks) is int and 1 <= max_compile_checks <= MAX_COMPILE_CHECKS,
            'Bounded maneuver compiler budget required')
    patterns = []; identities = set(); sequences = set(); only_next = {}; total_arcs = 0; checks = 0
    def check_budget():
        nonlocal checks
        checks += 1
        if checks > max_compile_checks: raise BudgetExceeded('Maneuver compiler budget exhausted; no partial result')
    for row in bounded(maneuvers, MAX_MANEUVERS):
        mid = row.get('id'); kind = row.get('kind')
        raw_sequence = row.get('arc_sequence', ())
        require(not isinstance(raw_sequence, (str, bytes, dict)), 'Explicit directed arc sequence required')
        sequence = tuple(bounded(raw_sequence, MAX_SEQUENCE_ARCS))
        require(isinstance(mid, str) and mid.strip() and mid not in identities
                and kind in ('no', 'only') and 2 <= len(sequence) <= MAX_SEQUENCE_ARCS,
                'Unique maneuver identity, explicit no/only kind and bounded sequence required')
        total_arcs += len(sequence)
        require(total_arcs <= MAX_MANEUVER_ARCS, 'Total maneuver arc budget exceeded')
        require(all(isinstance(a, str) and a in by_id for a in sequence), 'Maneuver references unknown directed arc')
        require(all(by_id[a]['to'] == by_id[b]['from'] for a, b in zip(sequence, sequence[1:])),
                'Maneuver must be a contiguous directed arc sequence')
        require((kind, sequence) not in sequences, 'Duplicate declared maneuver sequence')
        identities.add(mid); sequences.add((kind, sequence))
        if kind == 'only':
            # Do not invent disjunctive semantics for two only declarations that
            # share an activated prefix and demand different next arcs.
            for length in range(1, len(sequence)):
                check_budget()
                prefix = sequence[:length]; following = sequence[length]
                require(prefix not in only_next or only_next[prefix] == following,
                        'Conflicting only-maneuver continuations require reviewed disjunction semantics')
                only_next[prefix] = following
        patterns.append(dict(id=mid, kind=kind, sequence=sequence))
    no_patterns = [p['sequence'] for p in patterns if p['kind'] == 'no']
    for p in patterns:
        if p['kind'] == 'only':
            for no in no_patterns:
                for i in range(len(p['sequence'])-len(no)+1):
                    check_budget()
                    require(p['sequence'][i:i+len(no)] != no, 'Only maneuver forces a prohibited subsequence')
    return patterns


def solve(nodes, arcs, maneuvers, source, target, metric='length', *,
          max_states=MAX_STATES, max_transitions=MAX_TRANSITIONS, allowed_reversals=(),
          max_compile_checks=MAX_COMPILE_CHECKS, max_prefixes_per_state=MAX_PREFIXES_PER_STATE,
          max_total_prefix_entries=MAX_TOTAL_PREFIX_ENTRIES):
    nodes = bounded(nodes, MAX_NODES); arcs = bounded(arcs, MAX_ARCS)
    require(nodes and all(_positive_id(n) for n in nodes) and len(set(nodes)) == len(nodes),
            'Unique positive declared nodes required')
    node_set = set(nodes)
    require(_positive_id(source) and _positive_id(target) and source in node_set and target in node_set
            and metric in ('length','travel_time') and type(max_states) is int
            and 1 <= max_states <= MAX_STATES and type(max_transitions) is int
            and 1 <= max_transitions <= MAX_TRANSITIONS
            and type(max_prefixes_per_state) is int and 1 <= max_prefixes_per_state <= MAX_PREFIXES_PER_STATE
            and type(max_total_prefix_entries) is int and 1 <= max_total_prefix_entries <= MAX_TOTAL_PREFIX_ENTRIES,
            'Bounded explicit query required')
    by_id = {}; costs = {}; adjacency = defaultdict(list)
    for arc in arcs:
        aid = arc['id']
        require(isinstance(aid, str) and aid and aid not in by_id and _positive_id(arc['way'])
                and _positive_id(arc['from']) and _positive_id(arc['to'])
                and arc['from'] in node_set and arc['to'] in node_set,
                'Unique arc identity and declared way/endpoints required')
        for name in ('length','travel_time'): _cost(arc[name])
        by_id[aid] = arc; costs[aid] = _cost(arc[metric]); adjacency[arc['from']].append(arc)
    patterns = compile_patterns(maneuvers, by_id, max_compile_checks)
    starts = defaultdict(list)
    for index, pattern in enumerate(patterns): starts[pattern['sequence'][0]].append(index)
    reversals = set()
    for pair in bounded(allowed_reversals, MAX_ARCS):
        require(isinstance(pair, (tuple,list)) and len(pair) == 2 and all(isinstance(a,str) and a in by_id for a in pair),
                'Declared reversal pair must bind existing arcs')
        a, b = map(by_id.__getitem__, pair); pair = tuple(pair)
        require(pair not in reversals and a['way'] == b['way'] and a['from'] == b['to'] and a['to'] == b['from'],
                'Unique immediate same-way reversal pair required')
        reversals.add(pair)

    def advance(active, aid):
        following = set()
        for index, consumed in active:
            pattern = patterns[index]; sequence = pattern['sequence']
            matches = sequence[consumed] == aid
            if pattern['kind'] == 'only' and not matches: return None
            if matches:
                if consumed+1 == len(sequence):
                    if pattern['kind'] == 'no': return None
                else: following.add((index, consumed+1))
        # Restart every matching prefix too: overlapping and repeated-prefix
        # patterns must survive completion/diversion of another activation.
        following.update((index, 1) for index in starts[aid])
        if len(following) > max_prefixes_per_state:
            raise BudgetExceeded('Active maneuver prefix budget exhausted; no partial result')
        return tuple(sorted(following))

    start = (source, None, ()); distances = {start: Fraction(0)}; previous = {}; settled = set()
    serial = itertools.count(); heap = [(Fraction(0), next(serial), start)]; examined = 0; final = None; prefix_entries = 0
    while heap:
        distance, _, state = heapq.heappop(heap)
        if state in settled or distance != distances[state]: continue
        settled.add(state); node, incoming_id, active = state
        if node == target: final = state; break
        incoming = by_id[incoming_id] if incoming_id is not None else None
        for arc in adjacency[node]:
            examined += 1
            if examined > max_transitions: raise BudgetExceeded('Maneuver transition budget exhausted; no partial result')
            if (incoming is not None and incoming['way'] == arc['way'] and incoming['from'] == arc['to']
                    and (incoming_id, arc['id']) not in reversals): continue
            following = advance(active, arc['id'])
            if following is None: continue
            next_state = (arc['to'], arc['id'], following); candidate = distance+costs[arc['id']]
            if next_state not in distances or candidate < distances[next_state]:
                if next_state not in distances and len(distances) >= max_states:
                    raise BudgetExceeded('Maneuver state budget exhausted; no partial result')
                if next_state not in distances:
                    if prefix_entries+len(following) > max_total_prefix_entries:
                        raise BudgetExceeded('Stored maneuver prefix budget exhausted; no partial result')
                    prefix_entries += len(following)
                distances[next_state] = candidate; previous[next_state] = (state, arc['id'])
                heapq.heappush(heap, (candidate, next(serial), next_state))
    path = []; state_trace = []
    if final is not None:
        current = final
        while current != start:
            state_trace.append(dict(node=current[0], incoming_arc=current[1],
                                    active_prefixes=[dict(maneuver_id=patterns[i]['id'], consumed_arcs=n) for i,n in current[2]]))
            current, aid = previous[current]; path.append(aid)
        path.reverse(); state_trace.reverse(); value = distances[final]
        require(sum((costs[a] for a in path), Fraction(0)) == value, 'Exact stored path replay differs')
    else: value = None
    return dict(schema=POLICY, source=source, target=target, metric=metric,
                orientation='explicit-forward-source-to-target', source_approach='unconstrained-declared-node-start',
                cost=None if value is None else float(value),
                exact_stored_path_cost=None if value is None else [str(value.numerator),str(value.denominator)],
                arc_path=path, state_trace=state_trace, settled_states=len(settled), discovered_states=len(distances),
                transitions_examined=examined, stored_prefix_entries=prefix_entries, converged=True, partial_results_returned=False,
                maneuver_count=len(patterns), reversal_policy='same-way-immediate-reversals-require-declared-pair',
                access_certified=False, geographic_coverage_certified=False, release_eligible=False,
                warning='Declared directed sequences only; not a raw OSM compiler or a state graph/turn/access certificate. An only sequence constrains continuation once its first arc is traversed; a route may end inside it. Temporal/mode semantics and connector orientation require separate review.')
