import unittest
from road_access_policy import eligible_access_candidates


class AccessPolicyTests(unittest.TestCase):
    def setUp(self):
        self.point = {"edge": (1, 2, 0), "snapped": (0.005, 0.0),
                      "gap_m": 12.0, "access_verified": False,
                      "access_risks": ["off_road_connector_unverified",
                                       "grade_barrier_or_crossing_unverified"]}
        self.evidence = {"connector_traversable": True, "legal_access": True,
                         "grade_separation_checked": True, "origin_connected": True}

    def test_missing_evidence_fails_closed(self):
        self.assertEqual(eligible_access_candidates([self.point]), [])

    def test_partial_evidence_fails_closed(self):
        partial = {**self.evidence, "grade_separation_checked": False}
        self.assertEqual(eligible_access_candidates([self.point],
                         {((1, 2, 0), (0.005, 0.0)): partial}), [])

    def test_evidence_must_match_exact_snap_location(self):
        self.assertEqual(eligible_access_candidates([self.point],
                         {((1, 2, 0), (0.006, 0.0)): self.evidence}), [])

    def test_complete_independent_evidence_can_approve(self):
        result = eligible_access_candidates([self.point],
                         {((1, 2, 0), (0.005, 0.0)): self.evidence})
        self.assertEqual(len(result), 1)
        self.assertTrue(result[0]["access_verified"])
        self.assertTrue(result[0]["connector_evidence"]["legal_access"])

    def test_controlled_access_stays_rejected(self):
        candidate = {**self.point, "access_risks": ["controlled_access"]}
        self.assertEqual(eligible_access_candidates([candidate],
                         {((1, 2, 0), (0.005, 0.0)): self.evidence}), [])


if __name__ == "__main__":
    unittest.main()
