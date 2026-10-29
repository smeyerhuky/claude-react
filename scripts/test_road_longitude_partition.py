import math
import unittest

import networkx as nx

from road_longitude_partition import LongitudePartitionBuilder
from road_partition_oracle import TwoPartitionOracle
from road_primitive_sparse import PrimitiveSparseBuilder


def arcs(graph,metric):
    a=getattr(graph,metric);result={}
    for u in range(len(graph.osm_ids)):
        for k in range(a.indptr[u],a.indptr[u+1]):
            result[int(graph.osm_ids[u]),int(graph.osm_ids[a.indices[k]])]=float(a.data[k])
    return result


class LongitudePartitionTests(unittest.TestCase):
    def setUp(self):
        p={1:(1,-2.,39.),2:(2,-1.,39.),3:(3,1.,39.),4:(4,2.,39.),5:(5,-1.5,39.1),6:(6,1.5,39.1),7:(7,-1.,39.)}
        self.ways=[(10,{'highway':'primary'},[p[i] for i in (1,2,3,4)]),
                   (11,{'highway':'secondary'},[p[i] for i in (1,5,6,4)]),
                   (12,{'highway':'residential','oneway':'yes'},[p[i] for i in (2,7,3)]),
                   (13,{'highway':'tertiary'},[p[i] for i in (4,6,5,1)])]
        self.ways.append(self.ways[0])

    def test_union_arc_weights_zero_arcs_and_no_cross_run_chords(self):
        full=PrimitiveSparseBuilder();split=LongitudePartitionBuilder(0.)
        for way,tags,points in self.ways:full.add(way,tags,points);split.add(way,tags,points)
        flat=full.finish();graphs,audit=split.finish()
        self.assertEqual(audit['duplicate_original_highways_verified'],1)
        self.assertEqual(audit['new_boundary_nodes_created'],0)
        self.assertEqual(sum(g.report['directed_primitive_arcs'] for g in graphs),flat.report['directed_primitive_arcs'])
        for metric in ('length','travel_time'):
            union={}
            for graph in graphs:
                for pair,cost in arcs(graph,metric).items():union[pair]=min(cost,union.get(pair,math.inf))
            self.assertEqual(union,arcs(flat,metric))
            self.assertEqual(union[2,7],0.)
        oracle=TwoPartitionOracle(*graphs)
        ids=list(map(int,flat.osm_ids))
        for metric in ('length','travel_time'):
            expected=nx.DiGraph();expected.add_nodes_from(ids)
            expected.add_weighted_edges_from((u,v,cost) for (u,v),cost in arcs(flat,metric).items())
            for reverse in (False,True):
                result=oracle.solve(ids,ids,metric,reverse=reverse)
                for row in result['results']:
                    start,end=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                    try:cost=nx.shortest_path_length(expected,start,end,weight='weight')
                    except nx.NetworkXNoPath:cost=None
                    if cost is None:self.assertIsNone(row['cost'])
                    else:self.assertAlmostEqual(row['cost'],cost,places=6)

    def test_private_raw_way_conflict_is_not_ignored(self):
        builder=LongitudePartitionBuilder(0.)
        way,_,points=self.ways[0]
        builder.add(way,{'highway':'service','access':'private'},points)
        with self.assertRaises(ValueError):builder.add(way,{'highway':'service'},points)
        with self.assertRaises(ValueError):builder.finish()

    def test_node_arc_and_raw_inventory_caps_fail_without_resume(self):
        for kwargs in ({'max_nodes':1},{'max_arcs':1},{'max_raw_ways':1}):
            builder=LongitudePartitionBuilder(0.,**kwargs)
            with self.assertRaises(ValueError):
                for way,tags,points in self.ways:builder.add(way,tags,points)
            with self.assertRaises(ValueError):builder.add(*self.ways[0])

    def test_invalid_cut_rejected(self):
        for cut in (True,float('nan'),float('inf'),-180,180):
            with self.assertRaises(ValueError):LongitudePartitionBuilder(cut)


if __name__=='__main__':unittest.main()
