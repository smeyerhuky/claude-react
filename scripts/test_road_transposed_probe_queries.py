from fractions import Fraction
import unittest
from unittest.mock import patch
import networkx as nx
from road_transposed_probe_queries import solve
import test_road_boundary_label_batches as fixtures
from test_road_boundary_label_oracle import expected_union


class TransposedProbeTests(unittest.TestCase):
    def oracle(self):return fixtures.SourceBatchTests().oracle()

    def test33_asymmetric_source_probe_costs_match_independent_graph(self):
        oracle=self.oracle();sources=list(range(1,34));probe=35
        for metric in ('length','travel_time'):
            truth=expected_union(oracle.graphs,metric)
            for direction in ('metro-to-location','location-to-metro'):
                report=solve(oracle,sources,probe,metric,direction)
                self.assertEqual([len(r['native_target_ids']) for r in report['native_runs']],[32,1])
                self.assertLessEqual(report['local_dijkstra_calls'],512)
                for row in report['results']:
                    u,v=(row['source'],probe) if direction=='metro-to-location' else (probe,row['source'])
                    try:cost=nx.shortest_path_length(truth,u,v,weight='weight')
                    except nx.NetworkXNoPath:cost=None
                    if cost is None:self.assertIsNone(row['cost']);continue
                    self.assertAlmostEqual(row['cost'],cost,places=6)
                    run=report['native_runs'][row['native_batch_index']];legs={(l['shard'],l['from'],l['to']):l for l in run['legs']}
                    current=probe;total=Fraction(0)
                    for key in row['segments']:
                        leg=legs[key];self.assertEqual(current,leg['from']);current=leg['to'];total+=Fraction(*map(int,leg['exact_stored_path_cost']))
                    self.assertEqual(current,row['source']);self.assertEqual(total,Fraction(*map(int,row['exact_stored_path_cost'])))
                self.assertFalse(report['access_certified'])

    def test_self_cost_is_zero_without_inventing_a_connector(self):
        oracle=self.oracle()
        for direction in ('metro-to-location','location-to-metro'):
            row=next(r for r in solve(oracle,[1,35],35,'length',direction)['results'] if r['source']==35)
            self.assertEqual(row['cost'],0.);self.assertEqual(row['segments'],[])

    def test_target_groups_share_budget_and_reject_missing_nodes_before_work(self):
        oracle=self.oracle();native=oracle.solve;limits=[]
        def instrument(*args,**kwargs):
            limits.append(kwargs['max_oracles']);r=native(*args,**kwargs)
            if len(limits)==1:r['local_dijkstra_calls']=511;r['propagation_dijkstra_calls']=511-r['replay_dijkstra_calls']
            return r
        with patch.object(oracle,'solve',side_effect=instrument):
            with self.assertRaisesRegex(ValueError,'budget exhausted'):solve(oracle,list(range(1,34)),35,'length','metro-to-location')
        self.assertEqual(limits,[512,1])
        with patch.object(oracle,'solve') as query:
            with self.assertRaises(ValueError):solve(oracle,[1,999],35,'length','metro-to-location')
            query.assert_not_called()
