from fractions import Fraction
import unittest
from unittest.mock import patch
import networkx as nx
from road_boundary_label_batches import solve
from road_boundary_label_oracle import BoundaryLabelOracle
from road_query_leaf_core import prune
from test_road_boundary_label_oracle import build,expected_union


class SourceBatchTests(unittest.TestCase):
    def oracle(self):
        points={i:(i,-106+i*.001,39.) for i in range(1,36)}
        points[2]=(2,points[1][1],39.)
        ways=[[],[]]
        for i in range(1,35):ways[int(i>=18)].append((i,{'highway':'residential','oneway':'yes'},[points[i],points[i+1]]))
        graphs,_=prune(tuple(build(w) for w in ways),[*range(1,34),35])
        return BoundaryLabelOracle(*graphs)

    def test33_sources_match_independent_directed_costs_and_native_replays(self):
        oracle=self.oracle();sources=list(range(1,34));targets=[1,35]
        with self.assertRaises(ValueError):oracle.solve(sources,targets,'length')
        for metric in ('length','travel_time'):
            truth=expected_union(oracle.graphs,metric)
            for reverse in (False,True):
                report=solve(oracle,sources,targets,metric,reverse=reverse)
                self.assertEqual([len(b['batch_source_ids']) for b in report['batches']],[32,1])
                self.assertLessEqual(report['local_dijkstra_calls'],512)
                for row in report['results']:
                    u,v=(row['target'],row['source']) if reverse else (row['source'],row['target'])
                    try:cost=nx.shortest_path_length(truth,u,v,weight='weight')
                    except nx.NetworkXNoPath:cost=None
                    if cost is None:self.assertIsNone(row['cost']);continue
                    self.assertAlmostEqual(row['cost'],cost,places=6)
                    batch=report['batches'][row['batch_index']];legs={(r['shard'],r['from'],r['to']):r for r in batch['legs']}
                    total=sum((Fraction(*map(int,legs[key]['exact_stored_path_cost'])) for key in row['segments']),Fraction(0))
                    self.assertEqual(total,Fraction(*map(int,row['exact_stored_path_cost'])))
                self.assertTrue(report['converged']);self.assertFalse(report['access_certified'])

    def test_final_batch_cannot_reset_or_exceed_total_budget(self):
        oracle=self.oracle();native=oracle.solve;limits=[]
        def instrument(*args,**kwargs):
            limits.append(kwargs['max_oracles']);run=native(*args,**kwargs)
            if len(limits)==1:
                run['local_dijkstra_calls']=511;run['propagation_dijkstra_calls']=511-run['replay_dijkstra_calls']
            return run
        with patch.object(oracle,'solve',side_effect=instrument):
            with self.assertRaisesRegex(ValueError,'budget exhausted'):solve(oracle,list(range(1,34)),[35],'length')
        self.assertEqual(limits,[512,1])

    def test_invalid_last_endpoint_rejected_before_any_batch(self):
        oracle=self.oracle()
        with patch.object(oracle,'solve') as native:
            with self.assertRaises(ValueError):solve(oracle,[*range(1,33),999],[35],'length')
            native.assert_not_called()
        for kwargs in [dict(max_oracles=513),dict(reverse=1)]:
            with self.assertRaises(ValueError):solve(oracle,list(range(1,34)),[35],'length',**kwargs)
        with self.assertRaises(ValueError):solve(oracle,[1,1],[35],'length')
