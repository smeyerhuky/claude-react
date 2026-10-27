import unittest

from colorado_extract_comparison import compare_queues


def queue(entries):
    return {"candidates": [
        {"cbsa": cbsa, "road_proximity_triage_status": status,
         "candidate_count_within_limit": count}
        for cbsa, status, count in entries
    ]}


class ComparisonTests(unittest.TestCase):
    def test_changes_are_diagnostic_not_approval(self):
        result = compare_queues(
            queue([("14500", "outside", 0), ("17820", "inside", 0)]),
            queue([("14500", "candidate", 1), ("17820", "inside", 0)]))
        self.assertEqual(result["changed_triage_count"], 1)
        self.assertFalse(result["release_eligible"])
        self.assertFalse(result["access_certified"])
        self.assertFalse(result["extract_coverage_certified"])

    def test_dropped_metro_fails_closed(self):
        with self.assertRaises(ValueError):
            compare_queues(queue([("14500", "outside", 0)]), queue([]))


if __name__ == "__main__":
    unittest.main()
