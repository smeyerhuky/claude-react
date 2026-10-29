import unittest
from road_query_leaf_core import prune
from road_query_cut_diagnostic import sweep
from test_road_query_leaf_core import graph

class QueryCutDiagnosticTests(unittest.TestCase):
    def test_counts_match_independent_edge_ownership(self):
        points=[(i,-110+i,39.) for i in range(1,8)]
        a=graph([(1,{'highway':'residential'},points[:4])])
        b=graph([(2,{'highway':'residential'},points[3:])])
        views,_=prune((a,b),[1,7])
        cuts=[-108.,-106.5,-105.]
        rows=sweep(views,cuts)['cuts']
        for row,cut in zip(rows,cuts):
            owners=[set(),set()]
            for g in views:
                coo=g.length.tocoo()
                for i,j in zip(coo.row,coo.col):
                    owner=0 if (g.longitude[i]+g.longitude[j])/2<cut else 1
                    owners[owner].update((int(g.osm_ids[i]),int(g.osm_ids[j])))
            self.assertEqual(row['query_shared_vertices'],len(owners[0]&owners[1]))
        with self.assertRaises(ValueError):sweep((a,b),cuts)
        with self.assertRaises(ValueError):sweep(views,[0,0])
