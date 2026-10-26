"""Synthetic unapproved OSM connector review queue contract tests."""
import json
import tempfile
import unittest
from pathlib import Path

import networkx as nx

from colorado_connector_evidence import apply_connector_evidence
from colorado_connector_review_queue import build_review_queue
from stream_osm_roads import meters


class HumanAuditQueueTests(unittest.TestCase):
    def setUp(self):
        self.graph = nx.MultiDiGraph()
        self.graph.add_node(1, x=-105.0, y=39.7)
        self.graph.add_node(2, x=-104.999, y=39.7)
        self.shape = ((-105.0, 39.7), (-104.999, 39.7))
        length = meters(*self.shape)
        props = dict(geometry=self.shape, length=length,
                     travel_time=9, osm_way_id=1234567,
                     highway="residential", access="",
                     motor_vehicle="", motorcar="", oneway="")
        self.graph.add_edge(1, 2, **props)
        self.graph.add_edge(2, 1, **{**props,
                                    "geometry": tuple(reversed(self.shape))})
        self.metros = [
            {"cbsa": "19740", "name": "Denver", "population": 3000000,
             "lon": -104.9995, "lat": 39.7},
            {"cbsa": "99999", "name": "Distant qualifying", "population": 180000,
             "lon": -106.0, "lat": 39.7},
            {"cbsa": "00001", "name": "Small excluded", "population": 50000,
             "lon": -105.0, "lat": 39.7},
        ]

    def make(self, **kwargs):
        return build_review_queue(self.graph, kwargs.pop("metros", self.metros),
                                  **kwargs)

    def test_human_review_candidates_never_make_release_approved(self):
        report = self.make()
        self.assertEqual(report["eligible_metros_including_missing_candidates"], 2)
        self.assertEqual(report["metros_with_geometric_candidates"], 1)
        self.assertEqual(report["metros_without_geometric_candidates"], 1)
        self.assertFalse(report["release_eligible"])
        self.assertFalse(report["approval_or_evidence"])
        self.assertNotIn("connectors", report)
        candidate = next(m for m in report["candidates"]
                         if m["cbsa"] == "19740")
        self.assertEqual(candidate["review_status"],
                         "candidate_requires_independent_audit")
        self.assertFalse(candidate["access_verified"])
        self.assertFalse(candidate["has_approved_connector"])
        self.assertEqual(candidate["candidate_count_within_limit"], 1,
                         "Reverse directed arcs are one physical centerline")
        edge = candidate["candidate_roads"][0]
        self.assertEqual(edge["osm_way_id"], 1234567)
        self.assertEqual(edge["osm_way_url"],
                         "https://www.openstreetmap.org/way/1234567")
        self.assertGreater(edge["distance_to_centerline_m"], -1)
        self.assertFalse(edge["physical_origin_to_centerline_access_verified"])
        self.assertFalse(edge["public_legal_motor_access_verified"])
        self.assertFalse(edge["grade_separation_independently_verified"])

    def test_missing_qualifying_metro_is_always_listed_not_assumed_irrelevant(self):
        result = self.make()
        absent = next(m for m in result["candidates"] if m["cbsa"] == "99999")
        self.assertEqual(absent["review_status"],
                         "no_candidate_within_geometric_limit")
        self.assertEqual(absent["candidate_roads"], [])
        self.assertFalse(absent["access_verified"])

    def test_queue_cannot_be_passed_as_connector_evidence(self):
        report = self.make()
        with tempfile.TemporaryDirectory() as temp:
            path = Path(temp) / "unsafe.json"
            path.write_text(json.dumps(report))
            with self.assertRaisesRegex(ValueError, "schema"):
                apply_connector_evidence([{"cbsa": "19740"}], path)

    def test_nearby_but_distinct_crossing_is_pending_for_human_review(self):
        self.graph.add_node(3, x=-104.9995, y=39.6995)
        self.graph.add_node(4, x=-104.9995, y=39.7005)
        crossing = ((-104.9995, 39.6995), (-104.9995, 39.7005))
        self.graph.add_edge(3, 4, length=meters(*crossing),
                            geometry=crossing, travel_time=9,
                            osm_way_id=7654321, highway="primary")
        result = self.make()
        denver = next(m for m in result["candidates"]
                      if m["cbsa"] == "19740")
        self.assertEqual(denver["candidate_count_within_limit"], 2)
        self.assertTrue(all(x["grade_separation_independently_verified"] is False
                            for x in denver["candidate_roads"]))

    def test_invalid_or_missing_geometry_fails_closed(self):
        self.graph.add_edge(1, 2, length=1, travel_time=2)
        with self.assertRaisesRegex(ValueError, "geometry missing"):
            self.make()

    def test_duplicate_cbsa_and_bad_origins_rejected(self):
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.make(metros=self.metros + [dict(self.metros[0])])
        wrong = [{**self.metros[0], "lon": float("nan")}]
        with self.assertRaisesRegex(ValueError, "Malformed"):
            self.make(metros=wrong)
        with self.assertRaisesRegex(ValueError, "Invalid audit"):
            self.make(threshold=0)
        with self.assertRaisesRegex(ValueError, "Invalid maximum"):
            self.make(max_gap_m=501)
        with self.assertRaisesRegex(ValueError, "No metros"):
            self.make(threshold=99999999)

    def test_candidates_cap_does_not_suppress_eligible_metro_count(self):
        result = self.make(per_metro=1, max_gap_m=100)
        self.assertEqual(len(result["candidates"]), 2)
        self.assertEqual(result["eligible_metros_including_missing_candidates"], 2)


if __name__ == "__main__":
    unittest.main()
