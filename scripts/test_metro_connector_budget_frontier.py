from fractions import Fraction
import unittest

from metro_competition_bounds import distance_lower_bound
from metro_connector_budget_frontier import connector_budget_frontier


class FrontierTests(unittest.TestCase):
    def fixture(self,**kwargs):
        values=dict(metric="length",graph_path_cost=100,connector_budgets=[0,1000],margin=1)
        values.update(kwargs)
        return connector_budget_frontier(["a","b"],{"a":{"center_lonlat":[0,1],"radius_m":0,"evidence_reference":"fixture"}},[0,0],**values)

    def test_strict_threshold_and_monotone_budget_retention(self):
        lower=distance_lower_bound([0,1],[0,0])
        threshold=lower-101
        result=self.fixture(connector_budgets=[threshold-1,threshold,threshold+1])
        self.assertEqual(result["sources"][0]["connector_budget_strict_upper_threshold_exact"],[str(threshold.numerator),str(threshold.denominator)])
        self.assertEqual([c["retained_or_unknown_ids"] for c in result["budget_cases"]],[["b"],["a","b"],["a","b"]])
        self.assertEqual(result["applied_source_exclusions"],[])
        self.assertFalse(result["release_eligible"])

    def test_full_route_algebra_in_both_metrics(self):
        # Exact rational arithmetic checks the inequality against explicit full
        # incumbent costs, including a connector pair rather than graph alone.
        for metric,speed in (("length",None),("travel_time",140)):
            result=self.fixture(metric=metric,speed_ceiling_kph=speed,graph_path_cost="1/3",connector_budgets=[0,1,10,10000],margin="1/7")
            row=result["sources"][0]
            lower=Fraction(*map(int,row["lower_bound_exact"]))
            for case in result["budget_cases"]:
                budget=Fraction(*map(int,case["total_connector_cost_upper_bound_assumption_exact"]))
                self.assertEqual("a" in case["conditional_bound_exceeds_full_incumbent_ids"],lower>Fraction(1,3)+budget+Fraction(1,7))

    def test_unknown_time_ceiling_never_has_threshold(self):
        result=self.fixture(metric="travel_time")
        self.assertTrue(all(r["connector_budget_strict_upper_threshold_exact"] is None for r in result["sources"]))
        self.assertTrue(all(c["retained_or_unknown_ids"]==["a","b"] for c in result["budget_cases"]))

    def test_invalid_inputs_fail(self):
        for change in ({"graph_path_cost":-1},{"connector_budgets":[]},{"connector_budgets":[1,1]},{"margin":True},{"speed_ceiling_kph":0},{"metric":"cost"}):
            with self.subTest(change=change),self.assertRaises(ValueError):self.fixture(**change)
        with self.assertRaises(ValueError):connector_budget_frontier(["a","a"],{},[0,0],metric="length",graph_path_cost=0,connector_budgets=[0])


if __name__=="__main__":unittest.main()
