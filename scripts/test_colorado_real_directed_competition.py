import unittest
from unittest.mock import patch
import networkx as nx
from colorado_real_directed_competition import audit_graph


class RealAuditContracts(unittest.TestCase):
    def graph(self):
        g = nx.MultiDiGraph()
        for a, b, length, time in [("a", "p", 2, 8), ("b", "p", 5, 1),
                                    ("p", "a", 9, 9), ("p", "b", 1, 2)]:
            g.add_edge(a, b, length=length, travel_time=time)
        g.add_node("island")
        return g

    def test_metric_and_orientation_distinguish_winners(self):
        result = audit_graph(self.graph(), [{"cbsa": "1", "node": "a"}, {"cbsa": "2", "node": "b"}],
                             ["p", "island"], budgets=(3, 3))
        self.assertEqual(result["metro-to-location"]["length"]["probes"][0]["winner"], "1")
        self.assertEqual(result["metro-to-location"]["travel_time"]["probes"][0]["winner"], "2")
        self.assertEqual(result["location-to-metro"]["length"]["probes"][0]["winner"], "2")
        self.assertEqual(result["location-to-metro"]["length"]["probes"][1]["status"], "unreachable")

    def test_oracle_detects_corrupted_production_labels(self):
        with patch("colorado_real_directed_competition.assign", return_value={"p": {"cbsa": "wrong", "cost": 0}}):
            with self.assertRaisesRegex(ValueError, "disagreement"):
                audit_graph(self.graph(), [{"cbsa": "1", "node": "a"}, {"cbsa": "2", "node": "b"}], ["p"])

    def test_missing_source_is_never_silently_omitted(self):
        with self.assertRaisesRegex(ValueError, "outside graph"):
            audit_graph(self.graph(), [{"cbsa": "1", "node": "missing"}, {"cbsa": "2", "node": "b"}], ["p"])


if __name__ == "__main__":
    unittest.main()
