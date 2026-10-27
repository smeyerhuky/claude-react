import unittest
from colorado_competition_blockers import blocker_inventory


class BlockerInventoryTests(unittest.TestCase):
    def test_missing_sources_never_certified(self):
        data = {"qualifying_cbsa_count": 2, "metros": [
            {"cbsa": "14500", "baseline_triage": "outside", "expanded_triage": "inside",
             "expanded_candidate_count": 0},
            {"cbsa": "19740", "baseline_triage": "candidate", "expanded_triage": "candidate",
             "expanded_candidate_count": 2},
        ]}
        report = blocker_inventory(data)
        self.assertEqual(report["missing_geometric_candidate_cbsa_ids"], ["14500"])
        self.assertEqual(report["changed_triage_count"], 1)
        self.assertFalse(report["directed_global_competition_testable"])
        self.assertFalse(report["release_eligible"])

    def test_duplicate_or_missing_qualifier_rejected(self):
        with self.assertRaises(ValueError):
            blocker_inventory({"qualifying_cbsa_count": 2, "metros": [
                {"cbsa": "14500", "expanded_candidate_count": 0}]})
        with self.assertRaises(ValueError):
            blocker_inventory({"qualifying_cbsa_count": 2, "metros": [
                {"cbsa": "14500", "expanded_candidate_count": 0},
                {"cbsa": "14500", "expanded_candidate_count": 0}]})


if __name__ == "__main__":
    unittest.main()
