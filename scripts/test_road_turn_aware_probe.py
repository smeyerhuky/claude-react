import copy
import itertools
from fractions import Fraction
import unittest
import networkx as nx
from road_turn_aware_probe import solve, UnsupportedTurn, BudgetExceeded


def arc(aid, way, u, v, length=1, time=1):
    return dict(id=aid, way=way, **{'from': u, 'to': v}, length=length, travel_time=time)


def restriction(rid, kind, from_way, via, to_way, **tags):
    return dict(id=rid, tags=dict(type='restriction', restriction=kind, **tags), members=[
        dict(type='w', ref=from_way, role='from'), dict(type='n', ref=via, role='via'),
        dict(type='w', ref=to_way, role='to')])


def independent_truth(arcs, source, target, metric, forbidden):
    # Explicit fixture transition pairs; never call the production restriction
    # compiler to construct the independently solved tiny line graph.
    graph = nx.DiGraph(); graph.add_nodes_from(['start', 'finish'])
    if source == target: graph.add_edge('start', 'finish', weight=Fraction(0))
    for a in arcs:
        if a['from'] == source: graph.add_edge('start', a['id'], weight=Fraction(a[metric]))
        if a['to'] == target: graph.add_edge(a['id'], 'finish', weight=Fraction(0))
        for b in arcs:
            if a['to'] == b['from'] and (a['id'], b['id']) not in forbidden:
                graph.add_edge(a['id'], b['id'], weight=Fraction(b[metric]))
    try: return nx.shortest_path_length(graph, 'start', 'finish', weight='weight')
    except nx.NetworkXNoPath: return None


class TurnAwareProbeTests(unittest.TestCase):
    def fixture(self):
        return [arc('a', 10, 1, 2), arc('b', 20, 2, 3), arc('c', 30, 2, 4, 2, 10),
                arc('d', 40, 4, 3, 2, 10), arc('e', 50, 1, 5, 7, 2), arc('f', 60, 5, 3, 1, 2),
                arc('br', 20, 3, 2), arc('ar', 10, 2, 1)]

    def check_truth(self, arcs, rules, pairs):
        pairs = pairs | {('a', 'ar'), ('ar', 'a'), ('b', 'br'), ('br', 'b')}
        for metric in ('length', 'travel_time'):
            for source, target in ((1, 3), (3, 1), (1, 1), (1, 6)):
                with self.subTest(metric=metric, source=source, target=target):
                    expected = independent_truth(arcs, source, target, metric, pairs)
                    result = solve(range(1, 7), arcs, rules, source, target, metric)
                    if expected is None: self.assertIsNone(result['cost'])
                    else:
                        self.assertEqual(Fraction(*map(int, result['exact_stored_path_cost'])), expected)
                        by_id = {a['id']: a for a in arcs}; at = source; value = Fraction(0)
                        for aid in result['arc_path']:
                            a = by_id[aid]; self.assertEqual(a['from'], at); at = a['to']; value += Fraction(a[metric])
                        self.assertEqual(at, target); self.assertEqual(value, expected)
                        self.assertTrue(all(pair not in pairs for pair in zip(result['arc_path'], result['arc_path'][1:])))
                    self.assertFalse(result['access_certified']); self.assertFalse(result['release_eligible'])

    def test_asymmetric_ban_metric_dependent_detour_and_explicit_direction(self):
        arcs = self.fixture(); rules = [restriction(1, 'no_left_turn', 10, 2, 20)]
        self.check_truth(arcs, rules, {('a', 'b')})
        self.assertEqual(solve(range(1, 7), arcs, rules, 1, 3)['arc_path'], ['a', 'c', 'd'])
        self.assertEqual(solve(range(1, 7), arcs, rules, 1, 3, 'travel_time')['arc_path'], ['e', 'f'])

    def test_parallel_way_identity_cannot_be_collapsed_to_cheapest_incoming_arc(self):
        arcs = self.fixture() + [arc('parallel', 99, 1, 2, 2, .5)]
        rules = [restriction(1, 'no_left_turn', 10, 2, 20)]
        self.check_truth(arcs, rules, {('a', 'b')})
        self.assertEqual(solve(range(1, 7), arcs, rules, 1, 3)['arc_path'], ['parallel', 'b'])

    def test_only_turn_applies_to_the_specific_approach(self):
        arcs = self.fixture(); rules = [restriction(1, 'only_straight_on', 10, 2, 20)]
        self.check_truth(arcs, rules, {('a', 'c'), ('a', 'ar')})
        self.assertEqual(solve(range(1, 7), arcs, rules, 1, 3)['arc_path'], ['a', 'b'])

    def test_u_turn_state_and_starting_at_the_via_node(self):
        arcs = [arc('s', 30, 4, 1), arc('a', 10, 1, 2), arc('ar', 10, 2, 1), arc('finish', 20, 1, 3)]
        only = restriction(1, 'only_right_turn', 30, 1, 10)
        no_u = restriction(2, 'no_u_turn', 10, 2, 10)
        self.assertIsNone(solve(range(1, 5), arcs, [only], 4, 3)['cost'])
        self.assertEqual(solve(range(1, 5), arcs, [only], 4, 3, allowed_reversals=[('a', 'ar')])['arc_path'], ['s', 'a', 'ar', 'finish'])
        explicit_u = restriction(3, 'only_u_turn', 10, 2, 10)
        self.assertEqual(solve(range(1, 5), arcs, [only, explicit_u], 4, 3)['arc_path'], ['s', 'a', 'ar', 'finish'])
        self.assertIsNone(solve(range(1, 5), arcs, [only, no_u], 4, 3, allowed_reversals=[('a', 'ar')])['cost'])
        self.assertEqual(solve(range(1, 5), arcs, [no_u], 2, 1)['arc_path'], ['ar'])

    def test_conditional_via_way_ambiguous_and_conflicting_only_relations_fail_closed(self):
        base = restriction(1, 'no_left_turn', 10, 2, 20)
        for mutation in ('conditional', 'via_way', 'ambiguous', 'only_conflict', 'unknown', 'duplicate', 'purpose_exception', 'conditional_exception'):
            with self.subTest(mutation=mutation):
                rules = [copy.deepcopy(base)]; arcs = self.fixture()
                if mutation == 'conditional': rules[0]['tags']['restriction:conditional'] = 'no_left_turn @ (Mo-Fr)'
                elif mutation == 'via_way': rules[0]['members'][1]['type'] = 'w'
                elif mutation == 'ambiguous': arcs.append(arc('other_approach', 10, 6, 2))
                elif mutation == 'only_conflict': rules = [restriction(1, 'only_left_turn', 10, 2, 20), restriction(2, 'only_right_turn', 10, 2, 30)]
                elif mutation == 'unknown': rules[0]['tags']['restriction'] = 'unknown_turn'
                elif mutation == 'purpose_exception': rules[0]['tags']['except'] = 'destination'
                elif mutation == 'conditional_exception': rules[0]['tags']['except:conditional'] = 'motorcar @ (Mo-Fr)'
                else: rules.append(copy.deepcopy(rules[0]))
                with self.assertRaises(UnsupportedTurn): solve(range(1, 7), arcs, rules, 1, 3)

    def test_budget_exhaustion_has_no_partial_result_and_modes_cannot_approve_access(self):
        with self.assertRaises(BudgetExceeded): solve(range(1, 7), self.fixture(), [], 1, 3, max_states=1)
        with self.assertRaises(BudgetExceeded): solve(range(1, 7), self.fixture(), [], 1, 3, max_transitions=1)
        rule = restriction(1, 'no_left_turn', 10, 2, 20, **{'except': 'motorcar'})
        result = solve(range(1, 7), self.fixture(), [rule], 1, 3)
        self.assertEqual(result['arc_path'], ['a', 'b']); self.assertEqual(result['car_exempt_relation_ids'], [1])
        self.assertFalse(result['access_certified'])
        arcs = self.fixture(); arcs[-1]['travel_time'] = float('nan')
        with self.assertRaises(ValueError): solve(range(1, 7), arcs, [], 1, 3, 'length')

    def test_zero_arcs_and_exact_replay_do_not_fabricate_connectors(self):
        arcs = [arc('z1', 1, 1, 2, 0, 0), arc('z2', 2, 2, 1, 0, 0),
                arc('a', 3, 2, 3, .1, .1), arc('b', 4, 3, 4, .2, .2)]
        result = solve(range(1, 5), arcs, [], 1, 4)
        self.assertEqual(Fraction(*map(int, result['exact_stored_path_cost'])), Fraction(.1)+Fraction(.2))
        self.assertFalse(solve(range(1, 5), arcs, [], 1, 1)['access_certified'])

    def test_unbounded_input_iterators_cannot_exceed_declared_graph_limits(self):
        from road_turn_aware_probe import MAX_NODES
        values = itertools.count(1)
        with self.assertRaisesRegex(ValueError, 'input exceeds'):
            solve(values, [], [], 1, 2)
        self.assertEqual(next(values), MAX_NODES+2)

    def test_real_tucson_context_matches_independent_transition_graph(self):
        import json
        from tucson_turn_probe import REFERENCE, graph, project
        context = json.loads((REFERENCE/'osm-context.json').read_text())
        nodes, arcs = graph(context); report = project(context)
        reversals = {(a['id'], b['id']) for a in arcs for b in arcs
                     if a['way'] == b['way'] and a['from'] == b['to'] and a['to'] == b['from']}
        banned = ('236722007:0:1', '34617543:0:0')
        for c in report['comparisons']:
            self.assertEqual(tuple(c['prohibited_arc_pair']), banned)
            for key, forbidden in [('without_turn_rule', reversals), ('with_declared_turn_rule', reversals | {banned})]:
                expected = independent_truth(arcs, c['source'], c['target'], c['metric'], forbidden)
                self.assertEqual(expected, Fraction(*map(int, c[key]['exact_stored_path_cost'])))
        self.assertGreater(report['comparisons'][0]['with_declared_turn_rule']['cost'], report['comparisons'][0]['without_turn_rule']['cost'])

    def test_rehashed_meter_layer_cannot_masquerade_as_municipal_entry_evidence(self):
        import hashlib
        import json
        import shutil
        from pathlib import Path
        import tempfile
        from tucson_entry_evidence import REFERENCE, audit
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)/'context'; shutil.copytree(REFERENCE, root)
            path = root/'municipal-layer.json'; layer = json.loads(path.read_text()); layer['name'] = 'Meters'
            path.write_text(json.dumps(layer)); manifest_path = root/'manifest.json'; manifest = json.loads(manifest_path.read_text())
            manifest['files'][path.name].update(sha256=hashlib.sha256(path.read_bytes()).hexdigest(), bytes=path.stat().st_size)
            manifest_path.write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError, 'Meter/other layer'): audit(root)
