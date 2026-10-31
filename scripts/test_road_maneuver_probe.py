"""Synthetic declared-maneuver contracts; no OSM or physical access is certified."""
import itertools
import unittest
from fractions import Fraction
import networkx as nx
from road_maneuver_probe import solve, MAX_NODES
from road_turn_aware_probe import BudgetExceeded


def arc(aid, way, u, v, length=1, time=1):
    return dict(id=aid, way=way, **{'from':u,'to':v}, length=length, travel_time=time)


def maneuver(mid, kind, *sequence):
    return dict(id=mid, kind=kind, arc_sequence=list(sequence))


def independent_history_truth(arcs, patterns, source, target, metric, allowed_reversals=()):
    # Deliberately store full bounded suffix histories instead of compiling or
    # advancing the production active-prefix state. Enumerate all reachable
    # history states, then let NetworkX solve their weighted graph independently.
    limit = max([len(p['arc_sequence'])-1 for p in patterns]+[1])
    by_id = {a['id']:a for a in arcs}; start = (source, ()); pending = [start]; seen = {start}
    graph = nx.DiGraph(); graph.add_nodes_from([start,'finish'])
    while pending:
        state = pending.pop(); node, history = state
        if node == target: graph.add_edge(state,'finish',weight=Fraction(0))
        for edge in arcs:
            if edge['from'] != node: continue
            aid = edge['id']; incoming = by_id[history[-1]] if history else None
            if (incoming and incoming['way'] == edge['way'] and incoming['from'] == edge['to']
                    and (history[-1],aid) not in allowed_reversals): continue
            legal = True
            for p in patterns:
                sequence = tuple(p['arc_sequence'])
                if p['kind'] == 'no' and (history+(aid,))[-len(sequence):] == sequence: legal = False
                if p['kind'] == 'only':
                    for length in range(1,len(sequence)):
                        if history[-length:] == sequence[:length] and aid != sequence[length]: legal = False
            if not legal: continue
            nxt = (edge['to'],(history+(aid,))[-limit:])
            graph.add_edge(state,nxt,weight=Fraction(edge[metric]))
            if nxt not in seen:
                seen.add(nxt); pending.append(nxt)
                if len(seen)>20_000: raise AssertionError('Independent tiny oracle exceeded budget')
    try: return nx.shortest_path_length(graph,start,'finish',weight='weight')
    except nx.NetworkXNoPath: return None


class ManeuverHistoryTests(unittest.TestCase):
    def fixture(self):
        return [arc('a',10,1,2),arc('b',20,2,3),arc('c',20,3,4),arc('d',30,4,5),
                arc('x',40,2,6,3,10),arc('y',50,6,5,3,10),arc('z',60,3,6,5,10),
                arc('fast1',70,1,7,8,1),arc('fast2',80,7,5,8,1),arc('middle',90,8,3),
                arc('dr',30,5,4),arc('cr',20,4,3),arc('br',20,3,2),arc('ar',10,2,1)]

    def check_oracle(self, arcs, rules, pairs=()):
        for metric in ('length','travel_time'):
            for source,target in ((1,5),(5,1),(8,5),(1,3),(1,1),(1,9)):
                with self.subTest(metric=metric, source=source,target=target):
                    truth = independent_history_truth(arcs,rules,source,target,metric,pairs)
                    result = solve(range(1,10),arcs,rules,source,target,metric,allowed_reversals=pairs)
                    self.assertEqual(truth,None if result['cost'] is None else Fraction(*map(int,result['exact_stored_path_cost'])))
                    self.assertFalse(result['access_certified']); self.assertFalse(result['release_eligible'])
                    if truth is not None:
                        by_id = {a['id']:a for a in arcs}; at=source; value=Fraction(0)
                        for aid in result['arc_path']:
                            self.assertEqual(by_id[aid]['from'],at);at=by_id[aid]['to'];value+=Fraction(by_id[aid][metric])
                        self.assertEqual(at,target);self.assertEqual(value,truth)

    def test_multi_arc_via_history_asymmetric_metric_specific_detours(self):
        arcs=self.fixture(); rules=[maneuver('ban','no','a','b','c','d')]
        self.check_oracle(arcs,rules)
        self.assertEqual(solve(range(1,10),arcs,rules,1,5)['arc_path'],['a','x','y'])
        self.assertEqual(solve(range(1,10),arcs,rules,1,5,'travel_time')['arc_path'],['fast1','fast2'])
        self.assertEqual(solve(range(1,10),arcs,rules,5,1)['arc_path'],['dr','cr','br','ar'])

    def test_entering_via_way_midway_does_not_inherit_another_approach(self):
        arcs=self.fixture(); rules=[maneuver('ban','no','a','b','c','d')]
        self.assertEqual(solve(range(1,10),arcs,rules,8,5)['arc_path'],['middle','c','d'])
        self.assertEqual(solve(range(1,10),arcs,rules,3,5)['arc_path'],['c','d'])

    def test_only_sequence_forces_each_continuation_but_allows_route_end_inside(self):
        arcs=self.fixture(); rules=[maneuver('only','only','a','b','c','d')]
        self.check_oracle(arcs,rules)
        self.assertEqual(solve(range(1,10),arcs,rules,1,5)['arc_path'],['a','b','c','d'])
        self.assertEqual(solve(range(1,10),arcs,rules,1,3)['arc_path'],['a','b'])
        self.assertEqual(solve(range(1,10),arcs,rules,8,5)['arc_path'],['middle','c','d'])

    def test_parallel_arrivals_and_overlapping_prefixes_preserve_history(self):
        arcs=self.fixture()+[arc('parallel',100,1,2,2,2)]
        rules=[maneuver('ban','no','a','b','c','d')]
        self.check_oracle(arcs,rules)
        self.assertEqual(solve(range(1,10),arcs,rules,1,5)['arc_path'],['parallel','b','c','d'])
        cycle=[arc('a',1,1,2),arc('b',2,2,1),arc('c',3,2,3)]
        repeated=[maneuver('repeat','no','a','b','a','c'),maneuver('direct','no','a','c')]
        expected=independent_history_truth(cycle,repeated,1,3,'length')
        self.assertIsNone(expected);self.assertIsNone(solve([1,2,3],cycle,repeated,1,3)['cost'])
        trace=solve([1,2],cycle[:2],[maneuver('repeat','no','a','b','a','b')],1,2)['state_trace']
        self.assertEqual(trace[0]['active_prefixes'],[dict(maneuver_id='repeat',consumed_arcs=1)])
        forced=[arc('s',4,4,1),*cycle[:2],arc('c',3,2,3),arc('e',5,2,5),arc('f',6,5,3)]
        overlapping=[maneuver('long-no','no','a','b','a','c'),
                     maneuver('force-prefix','only','s','a','b','a','b','a')]
        result=solve(range(1,6),forced,overlapping,4,3)
        self.assertEqual(result['arc_path'],['s','a','b','a','b','a','e','f'])
        self.assertEqual(Fraction(*map(int,result['exact_stored_path_cost'])),
                         independent_history_truth(forced,overlapping,4,3,'length'))
        self.assertIn(dict(maneuver_id='long-no',consumed_arcs=3),result['state_trace'][5]['active_prefixes'])


    def test_reversals_require_declaration_and_no_pattern_still_overrides(self):
        arcs=[arc('start',1,4,1),arc('a',10,1,2),arc('ar',10,2,1),arc('finish',20,1,3)]
        only=[maneuver('first','only','start','a')]
        self.assertIsNone(solve(range(1,5),arcs,only,4,3)['cost'])
        self.assertEqual(solve(range(1,5),arcs,only,4,3,allowed_reversals=[('a','ar')])['arc_path'],['start','a','ar','finish'])
        self.assertIsNone(solve(range(1,5),arcs,only+[maneuver('no-u','no','a','ar')],4,3,allowed_reversals=[('a','ar')])['cost'])

    def test_invalid_or_conflicting_patterns_and_budgets_fail_without_partial_result(self):
        arcs=self.fixture()
        cases=[[dict(id='string',kind='no',arc_sequence='ab')],[maneuver('bad','no','a','d')],[maneuver('bad','no','missing','d')],
               [maneuver('a','only','a','b'),maneuver('b','only','a','x')],
               [maneuver('a','only','a','b','c'),maneuver('b','no','b','c')],
               [maneuver('same','no','a','b'),maneuver('same','no','b','c')],
               [maneuver('a','no','a','b'),maneuver('b','no','a','b')]]
        for rules in cases:
            with self.subTest(rules=rules),self.assertRaises(ValueError):solve(range(1,10),arcs,rules,1,5)
        with self.assertRaises(BudgetExceeded):solve(range(1,10),arcs,[],1,5,max_states=1)
        with self.assertRaises(BudgetExceeded):solve(range(1,10),arcs,[],1,5,max_transitions=1)
        values=itertools.count(1)
        with self.assertRaises(ValueError):solve(values,[],[],1,2)
        self.assertEqual(next(values),MAX_NODES+2)
        arcs[-1]['travel_time']=float('nan')
        with self.assertRaises(ValueError):solve(range(1,10),arcs,[],1,5,'length')

    def test_compile_active_and_total_prefix_budgets_reject_without_partial_results(self):
        arcs=self.fixture(); rules=[maneuver('long','only','a','b','c','d')]
        with self.assertRaisesRegex(BudgetExceeded,'compiler'):
            solve(range(1,10),arcs,rules,1,5,max_compile_checks=1)
        rules=[maneuver('one','no','a','b','c','d'),maneuver('two','no','a','x','y')]
        with self.assertRaisesRegex(BudgetExceeded,'Active'):
            solve(range(1,10),arcs,rules,1,5,max_prefixes_per_state=1)
        with self.assertRaisesRegex(BudgetExceeded,'Stored'):
            solve(range(1,10),arcs,rules,1,5,max_total_prefix_entries=1)

    def test_zero_cost_cycles_and_exact_stored_rational_replay(self):
        arcs=[arc('z1',1,1,2,0,0),arc('z2',2,2,1,0,0),arc('a',3,2,3,.1,.1),arc('b',4,3,4,.2,.2)]
        result=solve(range(1,5),arcs,[],1,4)
        self.assertEqual(Fraction(*map(int,result['exact_stored_path_cost'])),Fraction(.1)+Fraction(.2))
        self.assertEqual(solve(range(1,5),arcs,[],1,1)['cost'],0)
        self.assertFalse(result['partial_results_returned'])


if __name__=='__main__':unittest.main()
