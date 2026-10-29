import copy
import unittest

import networkx as nx

from road_partition_oracle import TwoPartitionOracle
from road_primitive_sparse import PrimitiveSparseBuilder
from road_query_leaf_core import prune


def graph(ways):
    builder=PrimitiveSparseBuilder()
    for way,tags,points in ways:builder.add(way,tags,points)
    return builder.finish()


class QueryLeafCoreTests(unittest.TestCase):
    def setUp(self):
        self.p={i:(i,-105+i*.001,39.) for i in range(1,13)}
        self.p[3]=(3,self.p[2][1],39.)  # genuine zero-weight edge on retained route
        self.a=graph([(1,{'highway':'residential'},[self.p[i] for i in (1,2,3)]),
                      (2,{'highway':'service'},[self.p[i] for i in (2,6,7)])])
        self.b=graph([(3,{'highway':'residential','oneway':'yes'},[self.p[i] for i in (3,4,5)]),
                      (4,{'highway':'service'},[self.p[i] for i in (6,7,8,9)]),
                      (5,{'highway':'residential'},[self.p[i] for i in (10,11,12,10)])])

    def test_query_costs_match_full_union_with_zero_arcs_and_shared_branch(self):
        for protected in ([1,5],[1,5,8]):
            views,audit=prune((self.a,self.b),protected)
            self.assertGreater(audit['removed_unqueried_component_nodes'],0)
            self.assertGreater(audit['removed_nonquery_leaf_nodes'],0)
            if 8 not in protected:self.assertLess(audit['surviving_shared_vertices'],audit['original_shared_vertices'])
            else:self.assertLessEqual(audit['surviving_shared_vertices'],audit['original_shared_vertices'])
            for metric in ('length','travel_time'):
                expected=nx.DiGraph()
                for g in (self.a,self.b):
                    m=getattr(g,metric)
                    for u in range(len(g.osm_ids)):
                        for k in range(m.indptr[u],m.indptr[u+1]):
                            a,b=int(g.osm_ids[u]),int(g.osm_ids[m.indices[k]])
                            expected.add_edge(a,b,weight=min(float(m.data[k]),expected.get_edge_data(a,b,{'weight':float('inf')})['weight']))
                oracle=TwoPartitionOracle(*views)
                for reverse in (False,True):
                    result=oracle.solve(list(protected),list(protected),metric,reverse=reverse)
                    for row in result['results']:
                        start,end=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                        try:value=nx.shortest_path_length(expected,start,end,weight='weight')
                        except nx.NetworkXNoPath:value=None
                        if value is None:self.assertIsNone(row['cost'])
                        else:self.assertAlmostEqual(row['cost'],value,places=6)
            self.assertFalse(audit['arbitrary_new_endpoints_supported'])

    def test_seeded_directed_overlaps_preserve_all_protected_costs(self):
        import random
        rng=random.Random(137)
        for trial in range(16):
            ways=[[],[]]
            for edge,(u,v) in enumerate([(i,i+1) for i in range(1,12)]+[(rng.randrange(1,13),rng.randrange(1,13)) for _ in range(14)]):
                tags={'highway':'residential','oneway':rng.choice(['yes','no','-1'])}
                record=(edge+1,tags,[self.p[u],self.p[v]])
                owner=edge%2
                ways[owner].append(record)
                if edge%5==0:ways[1-owner].append(record)
            full=tuple(graph(w) for w in ways)
            protected=[1,5,12]
            views,_=prune(full,protected)
            oracle=TwoPartitionOracle(*views)
            for metric in ('length','travel_time'):
                expected=nx.DiGraph();expected.add_nodes_from(protected)
                for g in full:
                    m=getattr(g,metric).tocoo()
                    for i,j,cost in zip(m.row,m.col,m.data):
                        u,v=int(g.osm_ids[i]),int(g.osm_ids[j])
                        expected.add_edge(u,v,weight=min(float(cost),expected.get_edge_data(u,v,{'weight':float('inf')})['weight']))
                for reverse in (False,True):
                    for row in oracle.solve(protected,protected,metric,reverse=reverse)['results']:
                        u,v=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                        try:cost=nx.shortest_path_length(expected,u,v,weight='weight')
                        except nx.NetworkXNoPath:cost=None
                        if cost is None:self.assertIsNone(row['cost'])
                        else:self.assertAlmostEqual(row['cost'],cost,places=6)

    def test_new_endpoint_or_mixed_views_fail_closed(self):
        views,audit=prune((self.a,self.b),[1,5])
        oracle=TwoPartitionOracle(*views)
        with self.assertRaises(ValueError):oracle.solve([1],[9],'length')
        with self.assertRaises(ValueError):TwoPartitionOracle(views[0],self.b)
        with self.assertRaises(ValueError):prune(views,[1,5])
        tampered=copy.deepcopy(views[0]);tampered.report['query_protected_node_ids']=[1,9]
        with self.assertRaises(ValueError):TwoPartitionOracle(tampered,views[1])

    def test_empty_unqueried_shard_is_a_scoped_view_not_missing_data(self):
        first=graph([(10,{'highway':'residential'},[self.p[i] for i in (1,2,3)])])
        other=graph([(11,{'highway':'residential'},[self.p[i] for i in (10,11,12)])])
        views,audit=prune((first,other),[1,3])
        self.assertEqual(len(views[1].osm_ids),0)
        result=TwoPartitionOracle(*views).solve([1],[3],'length')
        self.assertIsNotNone(result['results'][0]['cost'])

    def test_missing_or_duplicate_protected_endpoint_rejected(self):
        for protected in ([1,99],[1,1],[],[1,True],[1,[5]]):
            with self.assertRaises(ValueError):prune((self.a,self.b),protected)


if __name__=='__main__':unittest.main()
