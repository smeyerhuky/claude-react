import unittest
import random

import networkx as nx

from road_partition_oracle import TwoPartitionOracle, InterfacePortBudgetExceeded
from road_primitive_sparse import PrimitiveSparseBuilder


def fixture(extra_shared_arc=False, duplicate_middle=True):
    p, q = PrimitiveSparseBuilder(), PrimitiveSparseBuilder()
    tags = {'highway': 'primary', 'oneway': 'yes'}
    shared = [(2, .1, 0.), (8, .15, 0.), (3, .2, 0.)]
    p.add(10, tags, [(1, 0., 0.), (9, .05, .5), (2, .1, 0.)])
    p.add(11, {**tags, 'maxspeed': '5'}, shared)
    p.add(12, tags, [(3, .2, 0.), (10, .25, .5), (4, .3, 0.)])
    p.add(13, tags, [(4, .3, 0.), (6, .4, 0.)])
    p.add(30, tags, [(30, .8, 0.), (31, .8, 0.)])
    p.add(35, tags, [(35, .9, 0.), (36, 1., 0.)])
    if duplicate_middle:
        q.add(11, {**tags, 'maxspeed': '5'}, shared)
    q.add(20, tags, [(1, 0., 0.), (5, .05, 0.), (2, .1, 0.)])
    q.add(21, tags, [(3, .2, 0.), (7, .25, 0.), (4, .3, 0.)])
    q.add(30, tags, [(30, .8, 0.), (31, .8, 0.)])
    if extra_shared_arc:
        q.add(22, {**tags, 'maxspeed': '130'}, [(2, .1, 0.), (8, .15, 0.)])
    return p.finish(), q.finish()


def flattened(graphs, metric, reverse):
    g = nx.DiGraph()
    for shard in graphs:
        g.add_nodes_from(map(int, shard.osm_ids))
        a = getattr(shard, metric).tocoo(copy=False)
        for i, j, cost in zip(a.row, a.col, a.data):
            u, v = int(shard.osm_ids[i]), int(shard.osm_ids[j])
            if reverse:
                u, v = v, u
            if not g.has_edge(u, v) or cost < g[u][v]['weight']:
                g.add_edge(u, v, weight=float(cost))
    return g


class PartitionTests(unittest.TestCase):
    def test_twenty_six_source_queries_match_independent_reference(self):
        graphs = []
        for shard, nodes in enumerate((list(range(1, 23)), list(range(20, 41)))):
            b = PrimitiveSparseBuilder()
            for i, (u, v) in enumerate(zip(nodes, nodes[1:])):
                b.add(shard*100+i+1, {'highway': 'primary', 'oneway': 'yes',
                                    'maxspeed': '30' if shard == 0 else '130'},
                      [(u, u*.01, 0.), (v, v*.01, 0.)])
            graphs.append(b.finish())
        oracle = TwoPartitionOracle(*graphs)
        for metric in ('length', 'travel_time'):
            for reverse in (False, True):
                graph = flattened(graphs, metric, reverse)
                r = oracle.solve(list(range(1, 27)), [3, 20, 38], metric, reverse=reverse)
                self.assertEqual(len(r['results']), 78)
                for row in r['results']:
                    expected = nx.single_source_dijkstra_path_length(graph, row['source']).get(row['target'])
                    if expected is None:
                        self.assertIsNone(row['cost'])
                    else:
                        self.assertAlmostEqual(row['cost'], expected, delta=.002)
                    if row['source'] > 22 or row['target'] > 22:
                        self.assertEqual(row['prefix_cost_status'], 'not_computed_endpoint_outside_prefix')

    def test_varied_overlaps_match_independent_union_without_merging_road_matrices(self):
        for seed in range(8):
            rng = random.Random(seed)
            graphs = []
            for shard, nodes in enumerate((list(range(1, 9)), list(range(5, 13)))):
                b = PrimitiveSparseBuilder()
                pairs = list(zip(nodes, nodes[1:])) + [tuple(rng.sample(nodes, 2)) for _ in range(16)]
                for i, (u, v) in enumerate(pairs):
                    points = [(n, (.06 if n == 7 else n*.01), 0.) for n in (u, v)]
                    b.add(shard*100+i+1, {'highway': 'primary', 'oneway': rng.choice(['yes', 'no']),
                                        'maxspeed': str(rng.choice([5, 30, 130]))}, points)
                graphs.append(b.finish())
            oracle = TwoPartitionOracle(*graphs)
            for metric in ('length', 'travel_time'):
                for reverse in (False, True):
                    g = flattened(graphs, metric, reverse)
                    r = oracle.solve([1, 6, 12], [2, 7, 10], metric, reverse=reverse)
                    for row in r['results']:
                        expected = nx.single_source_dijkstra_path_length(g, row['source']).get(row['target'])
                        if expected is None:
                            self.assertIsNone(row['cost'])
                        else:
                            self.assertAlmostEqual(row['cost'], expected, delta=.002)

    def test_all_directions_metrics_match_independent_flattened_union_and_replay(self):
        for extra in (False, True):
            p, q = fixture(extra)
            oracle = TwoPartitionOracle(p, q)
            for metric in ('length', 'travel_time'):
                for reverse in (False, True):
                    with self.subTest(extra=extra, metric=metric, reverse=reverse):
                        g = flattened((p, q), metric, reverse)
                        report = oracle.solve([1, 6, 8, 30], [1, 6, 8, 31, 35], metric,
                                              reverse=reverse, keep_paths=True)
                        legs = {(s['shard'], s['from'], s['to']): s for s in report['legs']}
                        for row in report['results']:
                            expected = nx.single_source_dijkstra_path_length(g, row['source']).get(row['target'])
                            if expected is None:
                                self.assertIsNone(row['cost'])
                                continue
                            self.assertAlmostEqual(row['cost'], expected, delta=.002)
                            nodes = [row['source']]
                            for key in row['segments']:
                                path = legs[key]['solver_node_path']
                                self.assertEqual(nodes[-1], path[0]); nodes.extend(path[1:])
                            self.assertEqual(nodes[-1], row['target'])
                            cost = sum(g[u][v]['weight'] for u, v in zip(nodes, nodes[1:]))
                            # A shard path may use a parallel edge dominated by the
                            # other shard; selected global optimum must still agree.
                            self.assertAlmostEqual(cost, expected, delta=.002)
                        self.assertFalse(report['release_eligible'])
                        self.assertFalse(oracle.audit['flattened_road_union_constructed'])

    def test_route_can_leave_and_reenter_twice_and_shared_query_interior_is_retained(self):
        p, q = fixture(duplicate_middle=False)
        oracle = TwoPartitionOracle(p, q)
        self.assertNotIn(8, oracle.ports)  # Shared duplicate road interior, not a cut port.
        r = oracle.solve([1], [6], 'length', keep_paths=True)
        row = r['results'][0]
        self.assertEqual([k[0] for k in row['segments']], [1, 0, 1, 0])
        self.assertLess(row['cost'], nx.shortest_path_length(flattened((p,), 'length', False), 1, 6, weight='weight'))
        shared_oracle = TwoPartitionOracle(*fixture())
        self.assertNotIn(8, shared_oracle.ports)
        self.assertEqual(shared_oracle.solve([8], [8], 'length')['results'][0]['cost'], 0.)
        self.assertEqual(oracle.solve([30], [31], 'length')['results'][0]['cost'], 0.)

    def test_cheaper_shared_shared_time_arc_is_exposed_even_without_new_vertices(self):
        p, q = fixture(True)
        oracle = TwoPartitionOracle(p, q)
        self.assertIn(8, oracle.ports)
        self.assertGreater(oracle.audit['nondominated_shared_directed_pairs'], 0)
        for metric, owner in (('length', 0), ('travel_time', 1)):
            result = oracle.solve([2], [8], metric)
            self.assertEqual(result['results'][0]['segments'][0][0], owner)

    def test_corrupted_graphs_and_over_budget_queries_fail_closed(self):
        for mutate in (lambda q: q.longitude.__setitem__(0, 10),
                       lambda q: q.travel_time.data.__setitem__(0, -1),
                       lambda q: q.report.__setitem__('access_certified', True),
                       lambda q: q.node_index.__setitem__(2, 999)):
            p, q = fixture()
            mutate(q)
            with self.assertRaises(ValueError):
                TwoPartitionOracle(p, q)
        p, q = fixture()
        with self.assertRaises(InterfacePortBudgetExceeded) as caught:
            TwoPartitionOracle(p, q, max_ports=1)
        self.assertEqual(caught.exception.limit,1)
        self.assertGreater(caught.exception.count,1)
        self.assertIn(str(caught.exception.count),str(caught.exception))
        oracle = TwoPartitionOracle(p, q)
        for sources, targets, budget in (([999], [1], 512), ([1, 1], [6], 512), ([1], [6], 1)):
            with self.assertRaises(ValueError):
                oracle.solve(sources, targets, 'length', max_oracles=budget)


if __name__ == '__main__':
    unittest.main()
