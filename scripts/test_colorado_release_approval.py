"""Synthetic release policy tests; fixtures do not certify real-world road access."""
import json
import sys
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

from colorado_release_approval import (
    PINNED_LEDGER, file_sha256, verify_release_approval,
)
from colorado_metro_winners import main


class ReleaseApprovalTests(unittest.TestCase):
    def setUp(self):
        tmp = tempfile.TemporaryDirectory()
        self.addCleanup(tmp.cleanup)
        self.folder = Path(tmp.name)
        self.osm = self.folder / "colorado.pbf"
        self.metros = self.folder / "metros.csv"
        self.evidence = self.folder / "connectors.json"
        self.ledger = self.folder / "approved.json"
        self.osm.write_bytes(b"synthetic-road-graph")
        self.metros.write_text("cbsa,name,population,longitude,latitude\n"
                               "19740,Denver,300000,-105,39.7\n")
        self.document = {"schema_version": 1,
                         "source": "fictional-connector-field-inspection",
                         "reviewed_by": "synthetic-reviewer",
                         "connectors": [
                             {"cbsa": "19740", "node": "123",
                              "origin_lon": -105.0, "origin_lat": 39.7,
                              "connector_traversable": True,
                              "legal_access": True,
                              "grade_separation_checked": True,
                              "origin_connected": True}]}
        self.evidence.write_text(json.dumps(self.document))
        self.ledger.write_text(json.dumps({"schema_version": 1,
                                           "approved_evidence": []}))

    def approve(self):
        entry = {"evidence_sha256": file_sha256(self.evidence),
                 "osm_sha256": file_sha256(self.osm),
                 "metros_sha256": file_sha256(self.metros),
                 "reviewed_by": "synthetic-reviewer",
                 "approved_by": "synthetic-second-reviewer",
                 "audit_reference": "synthetic-review-log/1"}
        self.ledger.write_text(json.dumps(
            {"schema_version": 1, "approved_evidence": [entry]}))
        return entry

    def verify(self):
        return verify_release_approval(
            self.evidence, self.osm, self.metros, self.ledger)

    def test_no_approval_or_self_asserted_json_fails_closed(self):
        with self.assertRaisesRegex(ValueError, "no matching independent approval"):
            self.verify()
        # The repository-pinned ledger initially has ZERO approved connectors.
        self.assertEqual(json.loads(PINNED_LEDGER.read_text())["approved_evidence"], [])
        with self.assertRaisesRegex(ValueError, "no matching independent approval"):
            verify_release_approval(self.evidence, self.osm, self.metros)

    def test_exact_pinned_synthetic_fixture_matches_with_explicit_warning(self):
        self.approve()
        result = self.verify()
        self.assertEqual(result["reviewed_by"], "synthetic-reviewer")
        self.assertEqual(result["approved_by"], "synthetic-second-reviewer")
        self.assertFalse(result["physical_or_legal_access_independently_proven_by_code"])
        self.assertEqual(result["osm_sha256"], file_sha256(self.osm))

    def test_changed_evidence_road_or_metro_files_are_rejected(self):
        self.approve()
        self.assertTrue(self.verify()["approval_status"])
        self.osm.write_bytes(self.osm.read_bytes() + b"changed")
        with self.assertRaisesRegex(ValueError, "no matching independent approval"):
            self.verify()
        self.osm.write_bytes(b"synthetic-road-graph")
        self.metros.write_text(self.metros.read_text() + "\n")
        with self.assertRaisesRegex(ValueError, "no matching independent approval"):
            self.verify()
        self.metros.write_text(self.metros.read_text().rstrip() + "\n")
        self.document["connectors"][0]["legal_access"] = False
        self.evidence.write_text(json.dumps(self.document))
        with self.assertRaisesRegex(ValueError, "no matching independent approval"):
            self.verify()

    def test_approval_reviewer_must_match_signed_off_evidence(self):
        self.approve()
        ledger = json.loads(self.ledger.read_text())
        ledger["approved_evidence"][0]["reviewed_by"] = "another-reviewer"
        self.ledger.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(ValueError, "reviewer does not match"):
            self.verify()

    def test_duplicate_or_fake_approval_entries_fail_closed(self):
        self.approve()
        ledger = json.loads(self.ledger.read_text())
        ledger["approved_evidence"].append(ledger["approved_evidence"][0].copy())
        self.ledger.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            self.verify()
        self.approve()
        ledger = json.loads(self.ledger.read_text())
        ledger["approved_evidence"][0]["approved_by"] = "synthetic-reviewer"
        self.ledger.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(ValueError, "must differ"):
            self.verify()
        self.approve()
        ledger = json.loads(self.ledger.read_text())
        ledger["approved_evidence"][0]["osm_sha256"] = "not-a-hash"
        self.ledger.write_text(json.dumps(ledger))
        with self.assertRaisesRegex(ValueError, "SHA-256"):
            self.verify()

    def test_release_cli_checks_repository_approval_before_loading_roads(self):
        argv = ["colorado_metro_winners.py", "--osm", str(self.osm),
                "--metros", str(self.metros),
                "--connector-evidence", str(self.evidence),
                "--require-verified-access"]
        with patch.object(sys, "argv", argv), patch(
                "colorado_metro_winners.load_pbf",
                side_effect=AssertionError("graph should not load")):
            with self.assertRaisesRegex(ValueError, "no matching independent approval"):
                main()

    def test_release_cli_requires_connector_evidence_before_loading_roads(self):
        argv = ["colorado_metro_winners.py", "--osm", str(self.osm),
                "--metros", str(self.metros), "--require-verified-access"]
        with patch.object(sys, "argv", argv), patch(
                "colorado_metro_winners.load_pbf",
                side_effect=AssertionError("graph should not load")):
            with self.assertRaises(SystemExit) as exc:
                main()
            self.assertEqual(exc.exception.code, 2)


if __name__ == "__main__":
    unittest.main()
