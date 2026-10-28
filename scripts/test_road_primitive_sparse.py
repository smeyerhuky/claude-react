import math
import random
import unittest

import networkx as nx
from scipy.sparse.csgraph import dijkstra

from road_primitive_sparse import PrimitiveSparseBuilder
from test_metro_competition_bounds import spherical_distance


class PrimitiveSparseTests(unittest.TestCase):
    def test_parallel_arcs_take_minimum_per_metric_and_keep_64bit_ids(self):
        a,b=2**40,2**40+1
        points=[(a,0.,0.),(b,.001,0.)]
        builder=PrimitiveSparseBuilder()
        for way,speed in [(10,"30"),(20,"120")]:
            builder.add(way,{"highway":"primary","oneway":"yes","maxspeed":speed},points)
        builder.add(10,{"highway":"primary","oneway":"yes","maxspeed":"30"},points)
        g=builder.finish()
        self.assertEqual(g.report["directed_primitive_arcs"],2)
        self.assertEqual(g.report["unique_directed_pairs"],1)
        self.assertEqual(g.report["exact_duplicate_highway_ways"],1)
        self.assertEqual(list(map(int,g.osm_ids)),[a,b])
        length=spherical_distance((0.,0.),(.001,0.))
        self.assertAlmostEqual(dijkstra(g.length,directed=True,indices=0)[1],length)
        self.assertAlmostEqual(dijkstra(g.travel_time,directed=True,indices=0)[1],length/(120/3.6))
        self.assertTrue(math.isinf(dijkstra(g.length,directed=True,indices=1)[0]))

    def test_zero_arc_connects_distinct_coincident_nodes_and_reverse_only_is_respected(self):
        builder=PrimitiveSparseBuilder()
        builder.add(1,{"highway":"primary","oneway":"-1"},[(1,0.,0.),(2,0.,0.),(3,.001,0.)])
        g=builder.finish()
        self.assertEqual(g.report["zero_length_primitive_arcs_retained"],1)
        self.assertEqual(g.length.nnz,2)
        self.assertAlmostEqual(dijkstra(g.length,directed=True,indices=g.node_index[3])[g.node_index[1]],spherical_distance((0.,0.),(.001,0.)))
        self.assertTrue(math.isinf(dijkstra(g.length,directed=True,indices=g.node_index[1])[g.node_index[3]]))

    def test_independent_bellman_ford_on_directed_raw_primitives(self):
        rng=random.Random(138)
        for _ in range(10):
            points={n:(rng.uniform(-2,2),rng.uniform(-2,2)) for n in range(1,8)}
            builder=PrimitiveSparseBuilder()
            truth=nx.MultiDiGraph()
            way=1
            for u in points:
                for v in points:
                    if u==v or rng.random()<.6:continue
                    forward=rng.choice([True,False])
                    builder.add(way,{"highway":"primary","oneway":"yes" if forward else "-1","maxspeed":"60"},[(u,*points[u]),(v,*points[v])])
                    a,b=(u,v) if forward else (v,u)
                    length=spherical_distance(points[u],points[v])
                    truth.add_edge(a,b,length=length,travel_time=length/(60/3.6))
                    way+=1
            g=builder.finish()
            for metric in ("length","travel_time"):
                matrix=getattr(g,metric)
                for source in truth:
                    expected=nx.single_source_bellman_ford_path_length(truth,source,weight=metric)
                    actual=dijkstra(matrix,directed=True,indices=g.node_index[source])
                    for target in truth:
                        value=actual[g.node_index[target]]
                        if target in expected:self.assertAlmostEqual(value,expected[target],delta=max(.002,expected[target]*1e-9))
                        else:self.assertTrue(math.isinf(value))

    def test_conflicting_sources_poison_the_builder(self):
        builder=PrimitiveSparseBuilder()
        tags={"highway":"primary"}
        builder.add(1,tags,[(1,0.,0.),(2,1.,0.)])
        with self.assertRaisesRegex(ValueError,"disagrees"):
            builder.add(1,{**tags,"oneway":"yes"},[(1,0.,0.),(2,1.,0.)])
        with self.assertRaisesRegex(ValueError,"failed"):
            builder.finish()
        builder=PrimitiveSparseBuilder()
        builder.add(1,tags,[(1,0.,0.),(2,1.,0.)])
        with self.assertRaisesRegex(ValueError,"coordinates"):
            builder.add(2,tags,[(2,1.1,0.),(3,2.,0.)])

    def test_resource_caps_and_unsupported_or_private_ways_fail_closed(self):
        points=[(1,0.,0.),(2,1.,0.),(3,2.,0.)]
        for kwargs in ({"max_nodes":2},{"max_arcs":1}):
            builder=PrimitiveSparseBuilder(**kwargs)
            with self.assertRaisesRegex(ValueError,"resource limit"):
                builder.add(1,{"highway":"primary"},points)
            with self.assertRaises(ValueError):builder.finish()
        builder=PrimitiveSparseBuilder()
        builder.add(1,{"highway":"primary","oneway":"reversible"},points)
        builder.add(2,{"highway":"primary","access":"private"},points)
        with self.assertRaisesRegex(ValueError,"empty"):builder.finish()


if __name__=="__main__":unittest.main()
