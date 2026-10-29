import copy
from fractions import Fraction
import random
import unittest

import networkx as nx

from road_boundary_label_oracle import BoundaryLabelOracle
from road_partition_oracle import InterfacePortBudgetExceeded, TwoPartitionOracle
from road_primitive_sparse import PrimitiveSparseBuilder
from road_query_leaf_core import prune


def build(ways):
    b=PrimitiveSparseBuilder()
    for record in ways:b.add(*record)
    return b.finish()


def expected_union(graphs,metric):
    result=nx.DiGraph()
    for g in graphs:
        result.add_nodes_from(map(int,g.osm_ids));matrix=getattr(g,metric).tocoo()
        for i,j,cost in zip(matrix.row,matrix.col,matrix.data):
            u,v=int(g.osm_ids[i]),int(g.osm_ids[j])
            result.add_edge(u,v,weight=min(float(cost),result.get_edge_data(u,v,{'weight':float('inf')})['weight']))
    return result


def check_queries(test,graphs,sources,targets):
    oracle=BoundaryLabelOracle(*graphs)
    for metric in ('length','travel_time'):
        expected=expected_union(graphs,metric)
        for reverse in (False,True):
            report=oracle.solve(sources,targets,metric,reverse=reverse,keep_paths=True)
            legs={(r['shard'],r['from'],r['to']):r for r in report['legs']}
            for row in report['results']:
                u,v=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                try:cost=nx.shortest_path_length(expected,u,v,weight='weight')
                except nx.NetworkXNoPath:cost=None
                if cost is None:test.assertIsNone(row['cost']);continue
                test.assertAlmostEqual(row['cost'],cost,places=6)
                exact=Fraction(*map(int,row['exact_stored_path_cost']))
                test.assertAlmostEqual(float(exact),cost,places=6)
                current=row['source']
                for key in row['segments']:
                    leg=legs[key];test.assertEqual(current,leg['from']);path=leg['solver_node_path']
                    test.assertEqual(path[0],current);test.assertEqual(path[-1],leg['to'])
                    graph=graphs[leg['shard']];matrix=getattr(graph,metric)
                    if reverse:matrix=matrix.T.tocsr()
                    for a,b in zip(path,path[1:]):
                        i,j=graph.node_index[a],graph.node_index[b]
                        test.assertIn(j,matrix.indices[matrix.indptr[i]:matrix.indptr[i+1]])
                    current=leg['to']
                test.assertEqual(current,row['target'])
            test.assertTrue(report['converged']);test.assertFalse(report['dense_overlay_constructed'])
            test.assertLessEqual(report['local_dijkstra_calls'],512)
            test.assertEqual(report['local_dijkstra_calls'],report['propagation_dijkstra_calls']+report['replay_dijkstra_calls'])
            test.assertFalse(report['release_eligible']);test.assertFalse(report['access_certified'])


class BoundaryLabelTests(unittest.TestCase):
    def chain(self):
        points={i:(i,-105+i*.001,39.) for i in range(1,8)}
        points[3]=(3,points[2][1],39.)  # genuine stored zero-length directed edge
        ways=[[],[]]
        for i in range(1,7):ways[(i-1)%2].append((i,{'highway':'residential','oneway':'yes'},[points[i],points[i+1]]))
        return tuple(build(w) for w in ways)

    def test_alternating_shards_zero_arcs_reverse_and_unreachable(self):
        graphs=self.chain();check_queries(self,graphs,[1,4,7],[1,3,7])
        report=BoundaryLabelOracle(*graphs).solve([1],[7],'length')
        self.assertGreater(report['fixed_point_sweeps'][0]['complete_sweeps'],2)

    def test_seeded_directed_parallel_and_overlapping_graphs_match_independent_union(self):
        rng=random.Random(137)
        points={i:(i,-105+i*.001,39.+(i%3)*.001) for i in range(1,13)}
        points[3]=(3,points[2][1],points[2][2])
        for trial in range(20):
            ways=[[],[]]
            edges=[(i,i+1) for i in range(1,12)]+[(rng.randrange(1,13),rng.randrange(1,13)) for _ in range(16)]
            for way,(u,v) in enumerate(edges,1):
                tags={'highway':rng.choice(['primary','residential','service']),'oneway':rng.choice(['yes','no','-1'])}
                record=(way,tags,[points[u],points[v]]);owner=way%2;ways[owner].append(record)
                if way%5==0:ways[1-owner].append(record)
            # Different parallel-way speed models, independently minimized per metric.
            ways[0].append((100,{'highway':'primary'},[points[2],points[7]]))
            ways[1].append((101,{'highway':'residential'},[points[2],points[7]]))
            check_queries(self,tuple(build(w) for w in ways),[1,6,12],[2,7,12])

    def test_more_than_128_boundaries_without_changing_the_dense_oracle(self):
        ports=[(i,-105+i*.001,39.) for i in range(1,131)]
        start=(5000,-105.,39.);end=(7000,-104.869,39.)
        first=build([(1,{'highway':'residential'},[start,*ports])])
        other=[]
        for i in range(129):other += [ports[i],(1000+i,ports[i][1]+.0005,39.0001)]
        other += [ports[-1],end]
        second=build([(2,{'highway':'residential'},other)])
        with self.assertRaises(InterfacePortBudgetExceeded):TwoPartitionOracle(first,second)
        oracle=BoundaryLabelOracle(first,second)
        self.assertEqual(oracle.audit['boundary_vertex_count'],130)
        check_queries(self,(first,second),[5000],[7000])
        with self.assertRaises(InterfacePortBudgetExceeded):TwoPartitionOracle(first,second)

    def test_budget_exhaustion_never_returns_partial_unreachable_results(self):
        oracle=BoundaryLabelOracle(*self.chain())
        with self.assertRaisesRegex(ValueError,'before convergence/replay'):oracle.solve([1],[7],'length',max_oracles=2)
        with self.assertRaises(ValueError):BoundaryLabelOracle(*self.chain(),max_boundary_vertices=1)
        for limit in (True,0,193):
            with self.assertRaises(ValueError):BoundaryLabelOracle(*self.chain(),max_boundary_vertices=limit)

    def test_protected_views_reject_new_endpoints_or_mixed_scopes(self):
        full=self.chain();views,_=prune(full,[1,7])
        check_queries(self,views,[1],[7])
        with self.assertRaises(ValueError):BoundaryLabelOracle(*views).solve([1],[3],'length')
        with self.assertRaises(ValueError):BoundaryLabelOracle(views[0],full[1])

    def test_coincident_distinct_native_nodes_do_not_create_a_connector(self):
        first=build([(1,{'highway':'residential'},[(1,-105.,39.),(2,-104.9,39.)])])
        second=build([(2,{'highway':'residential'},[(3,-104.9,39.),(4,-104.8,39.)])])
        check_queries(self,(first,second),[1,4],[2,3])
        self.assertIsNone(BoundaryLabelOracle(first,second).solve([1],[4],'length')['results'][0]['cost'])

    def test_empty_unqueried_shard_remains_supported(self):
        first=build([(1,{'highway':'residential'},[(1,-105.,39.),(2,-104.9,39.)])])
        second=build([(2,{'highway':'residential'},[(3,-102.,39.),(4,-101.9,39.)])])
        views,_=prune((first,second),[1,2]);self.assertEqual(len(views[1].osm_ids),0)
        check_queries(self,views,[1],[2])

    def test_auxiliary_working_graph_respects_declared_shard_caps(self):
        builder=PrimitiveSparseBuilder(max_nodes=2,max_arcs=2)
        builder.add(1,{'highway':'residential'},[(1,-105.,39.),(2,-104.9,39.)])
        tight=builder.finish()
        other=build([(2,{'highway':'residential'},[(3,-104.,39.),(4,-103.9,39.)])])
        with self.assertRaisesRegex(ValueError,'Working shard'):
            BoundaryLabelOracle(tight,other).solve([1],[2],'length')

    def test_invalid_inputs_and_shared_geometry_fail_closed(self):
        first,second=self.chain();bad=copy.deepcopy(second)
        shared=next(n for n in bad.node_index if n in first.node_index);bad.longitude[bad.node_index[shared]]+=.001
        with self.assertRaises(ValueError):BoundaryLabelOracle(first,bad)
        oracle=BoundaryLabelOracle(first,second)
        for sources,targets,kwargs in [([1,1],[7],{}),([999],[7],{}),([True],[7],{}),([1],[7],{'reverse':1}),([1],[7],{'max_oracles':513})]:
            with self.assertRaises(ValueError):oracle.solve(sources,targets,'length',**kwargs)


if __name__=='__main__':unittest.main()
