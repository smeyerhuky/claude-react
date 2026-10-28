import unittest
from kansas_two_partition_competition import compare_retained


class RetainedKansasCostTests(unittest.TestCase):
    def test_finite_route_loss_or_increase_fails(self):
        for previous,current in [(0.,None),(100.,None),(100.,100.1)]:
            with self.assertRaises(ValueError):compare_retained(previous,current)
        self.assertEqual(compare_retained(100.,100.001),'unchanged')

    def test_unreachable_is_distinct_from_improvement_and_zero(self):
        self.assertEqual(compare_retained(None,None),'still_unreachable')
        self.assertEqual(compare_retained(None,0.),'newly_finite')
        self.assertEqual(compare_retained(100.,90.),'improved')
        self.assertEqual(compare_retained(0.,0.),'unchanged')

    def test_invalid_cost_cannot_be_labeled_improvement(self):
        for value in (float('nan'),float('inf'),-1.,True):
            with self.assertRaises(ValueError):compare_retained(100.,value)


if __name__=='__main__':unittest.main()
