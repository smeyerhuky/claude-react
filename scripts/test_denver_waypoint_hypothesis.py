import contextlib
import copy
import hashlib
import io
import json
import unittest

import networkx as nx

from denver_waypoint_hypothesis import solve
from road_primitive_sparse import PrimitiveSparseBuilder


class WaypointScenarioTests(unittest.TestCase):
    def setUp(self):
        builder = PrimitiveSparseBuilder()
        builder.add(1, {'highway':'residential', 'oneway':'yes'},
                    [(i, i*.01, 39.) for i in range(1, 6)])
        self.graph = builder.finish()
        self.scenarios = [{'scenario_id':name, 'node':node, 'node_lonlat':[node*.01,39.]}
                          for name,node in [('old',1),('hypothesis',3)]]
        self.probes = [{'cbsa':str(i), 'node':i, 'node_lonlat':[i*.01,39.]} for i in range(1,6)]

    def test_forward_reverse_costs_unreachable_and_actual_path_hashes(self):
        with contextlib.redirect_stdout(io.StringIO()):
            cases = solve(self.graph, self.scenarios, self.probes)
        self.assertEqual(len(cases),40)
        for row in cases:
            matrix = getattr(self.graph,row['metric'])
            graph = nx.DiGraph()
            graph.add_nodes_from(range(1,6))
            for u in range(5):
                for k in range(matrix.indptr[u],matrix.indptr[u+1]):
                    graph.add_edge(int(self.graph.osm_ids[u]),int(self.graph.osm_ids[matrix.indices[k]]),weight=float(matrix.data[k]))
            start = 1 if row['scenario_id']=='old' else 3
            target = row['probe_node']
            if row['orientation']=='location-to-metro':start,target=target,start
            try:
                expected_path=nx.shortest_path(graph,start,target,weight='weight')
                expected=nx.path_weight(graph,expected_path,weight='weight')
            except nx.NetworkXNoPath:
                self.assertIsNone(row['graph_only_cost']);self.assertIsNone(row['actual_directed_path_sha256']);continue
            self.assertAlmostEqual(row['graph_only_cost'],expected,places=6)
            digest=hashlib.sha256(json.dumps(expected_path,separators=(',',':')).encode()).hexdigest()
            self.assertEqual(row['actual_directed_path_sha256'],digest)
        self.assertEqual(sum(c['graph_only_cost'] is not None for c in cases),24)

    def test_missing_or_moved_endpoint_and_duplicate_probe_fail(self):
        for mutation in ('missing','moved','duplicate'):
            probes=copy.deepcopy(self.probes)
            if mutation=='missing':probes[0]['node']=99
            elif mutation=='moved':probes[0]['node_lonlat'][0]+=.001
            else:probes[1]=copy.deepcopy(probes[0])
            with self.assertRaises(ValueError):solve(self.graph,self.scenarios,probes)


if __name__ == '__main__':unittest.main()
