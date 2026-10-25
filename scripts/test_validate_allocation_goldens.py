import unittest
import networkx as nx
from road_spike import assign
from validate_allocation_goldens import check_winners, sample_nodes


class IndependentGoldenTests(unittest.TestCase):
    def test_one_way_and_independent_metrics(self):
        graph = nx.DiGraph()
        for n, x in [(1, 0.0), (2, 0.01), (3, 0.02), (4, 0.03)]:
            graph.add_node(n, x=x, y=0.0)
        graph.add_edge(1, 2, length=2, travel_time=50)
        graph.add_edge(2, 3, length=2, travel_time=50)
        graph.add_edge(1, 4, length=10, travel_time=1)
        sources = [{"node": 3, "cbsa": "A"}, {"node": 4, "cbsa": "B"}]
        result = {"sources": [{**s, "node": str(s["node"])} for s in sources]}
        for metric, weight in (("distance", "length"), ("time", "travel_time")):
            result[metric] = {"winners": assign(graph, sources, weight, None)}
        records = check_winners(graph, result, [1, 2, 3, 4])
        self.assertEqual(len(records), 8)
        self.assertEqual(result["distance"]["winners"]["1"]["cbsa"], "A")
        self.assertEqual(result["time"]["winners"]["1"]["cbsa"], "B")
        self.assertGreater(len(sample_nodes(graph)), 0)

    def test_corrupt_winner_fails(self):
        graph = nx.DiGraph()
        graph.add_node(1, x=0.0, y=0.0)
        graph.add_node(2, x=0.01, y=0.0)
        graph.add_edge(1, 2, length=1, travel_time=1)
        result = {"sources": [{"node": "2", "cbsa": "A"}],
                  "distance": {"winners": {"1": {"cbsa": "A", "cost": 90}}},
                  "time": {"winners": {"1": {"cbsa": "A", "cost": 1}}}}
        with self.assertRaises(AssertionError):
            check_winners(graph, result, [1])


if __name__ == "__main__":
    unittest.main()
