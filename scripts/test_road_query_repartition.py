import unittest
from road_longitude_partition import LongitudePartitionBuilder
from road_query_leaf_core import prune
from road_query_repartition import repartition
from road_boundary_label_oracle import BoundaryLabelOracle
def ways():
    p={1:(1,-108.,40.),2:(2,-107.2,40.5),3:(3,-106.8,41.6),4:(4,-105.8,42.),5:(5,-107.,42.4),6:(6,-106.,41.2),8:(8,-107.2,40.5)}
    return [(10,{'highway':'primary'},[p[i] for i in [1,2,3,4]]),(11,{'highway':'secondary'},[p[i] for i in [1,5,4]]),(12,{'highway':'residential','oneway':'yes'},[p[i] for i in [2,8,6,4]])]

from test_road_longitude_partition import arcs
import networkx as nx


class RepartitionTests(unittest.TestCase):
    def inputs(self):
        b=LongitudePartitionBuilder(-107.4)
        for w in ways():b.add(*w)
        return prune(b.finish()[0],[1,2,3,4,5,6,8])[0]

    def test_native_pairs_zero_weights_and_all_directed_paths_survive(self):
        old=self.inputs();new,audit=repartition(old,-106.5)
        self.assertEqual(audit['input_pair_entries'],audit['assigned_pair_entries'])
        self.assertEqual(audit['native_vertices_omitted'],0)
        self.assertFalse(audit['full_source_repartition_constructed'])
        oracle=BoundaryLabelOracle(*new);ids=[1,2,3,4,5,6,8]
        for metric in ['length','travel_time']:
            before={p:v for g in old for p,v in arcs(g,metric).items()};after={p:v for g in new for p,v in arcs(g,metric).items()}
            self.assertEqual(before,after);self.assertEqual(after[2,8],0.)
            truth=nx.DiGraph();truth.add_nodes_from(ids);truth.add_weighted_edges_from((a,b,v) for (a,b),v in before.items())
            for reverse in [False,True]:
                for row in oracle.solve(ids,ids,metric,reverse=reverse)['results']:
                    a,b=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                    try:cost=nx.shortest_path_length(truth,a,b,weight='weight')
                    except nx.NetworkXNoPath:cost=None
                    if cost is None:self.assertIsNone(row['cost'])
                    else:self.assertAlmostEqual(row['cost'],cost,places=6)

    def test_scope_and_original_budgets_stay_enforced(self):
        graphs,audit=repartition(self.inputs(),-106.5)
        self.assertEqual(graphs[0].report['query_protected_node_ids'],[1,2,3,4,5,6,8])
        with self.assertRaises(ValueError):repartition(self.inputs(),-106.5,max_nodes=1)
        with self.assertRaises(ValueError):repartition(self.inputs(),-106.5,max_arcs=1)
        with self.assertRaises(ValueError):repartition(self.inputs(),float('nan'))

    def test_parallel_native_pairs_use_metric_minimum_instead_of_sum(self):
        from test_road_query_leaf_core import graph
        p=[(1,-108.,39.),(2,-107.,39.),(3,-106.,39.)]
        a=graph([(10,{'highway':'primary','maxspeed':'60'},p[:2])])
        b=graph([(11,{'highway':'primary','maxspeed':'10'},p[:2]),(12,{'highway':'primary'},p[1:])])
        old,_=prune((a,b),[1,3]);new,audit=repartition(old,-107.)
        for metric in ['length','travel_time']:
            expected={}
            for g in old:
                for pair,cost in arcs(g,metric).items():expected[pair]=min(cost,expected.get(pair,float('inf')))
            actual={pair:cost for g in new for pair,cost in arcs(g,metric).items()}
            self.assertEqual(actual,expected)
        self.assertGreater(audit['assigned_pair_entries'],sum(audit['output_unique_pairs']))
