"""Synthetic contract tests; no physical connector is certified by these fixtures."""
import json
import tempfile
import unittest
from pathlib import Path

from colorado_connector_evidence import apply_connector_evidence
from colorado_metro_winners import allocate_thresholds
import networkx as nx


class EvidenceLoaderTests(unittest.TestCase):
    def setUp(self):
        self.metro = {"cbsa": "19740", "node": "123", "lon": -105.0,
                      "lat": 39.7, "population": 300000}
        self.record = {"cbsa": "19740", "node": "123",
                       "origin_lon": -105.0, "origin_lat": 39.7,
                       "connector_traversable": True, "legal_access": True,
                       "grade_separation_checked": True, "origin_connected": True}

    def load(self, records, **metadata):
        document = {"schema_version": 1, "source": "independent-review",
                    "reviewed_by": "separate-validator", "connectors": records}
        document.update(metadata)
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / "evidence.json"
            path.write_text(json.dumps(document))
            return apply_connector_evidence([self.metro], path)

    def test_matching_complete_record(self):
        result = self.load([self.record])[0]
        self.assertTrue(result["access_verified"])
        self.assertEqual(result["connector_evidence"]["node"], "123")

    def test_missing_and_partial_evidence_fail_closed(self):
        self.assertFalse(self.load([])[0]["access_verified"])
        self.assertFalse(self.load([{**self.record, "legal_access": False}])[0]["access_verified"])

    def test_wrong_node_and_coordinates_fail_closed(self):
        self.assertFalse(self.load([{**self.record, "node": "other"}])[0]["access_verified"])
        self.assertFalse(self.load([{**self.record, "origin_lon": -104.9}])[0]["access_verified"])

    def test_evidence_to_allocation_release_gate_end_to_end(self):
        graph = nx.MultiDiGraph()
        graph.add_edge("origin", "123", length=5, travel_time=9)
        metro = {**self.metro, "name": "Denver", "snap_m": 0}
        accepted = {**metro, **self.load([self.record])[0]}
        output = allocate_thresholds(graph, [accepted], [100000],
                                     require_verified_access=True)
        self.assertEqual(
            output["100000"]["distance"]["winners"]["origin"]["cbsa"],
            "19740")
        rejected = {**metro, **self.load([{**self.record,
                                           "legal_access": False}])[0]}
        with self.assertRaisesRegex(ValueError, "Unverified metro road access"):
            allocate_thresholds(graph, [rejected], [100000],
                                require_verified_access=True)

    def test_malformed_unused_records_are_rejected(self):\n        with self.assertRaisesRegex(ValueError, "assertions must be booleans"):\n            self.load([self.record, {**self.record, "cbsa": "other",\n                                     "legal_access": "true"}])\n        with self.assertRaisesRegex(ValueError, "node missing"):\n            self.load([{**self.record, "node": 123}])\n        with self.assertRaisesRegex(ValueError, "reviewer"):\n            self.load([self.record], reviewed_by=123)\n\n    def test_duplicate_and_unreviewed_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.load([self.record, self.record])
        with self.assertRaisesRegex(ValueError, "reviewer"):
            self.load([self.record], reviewed_by="")


if __name__ == "__main__":
    unittest.main()
