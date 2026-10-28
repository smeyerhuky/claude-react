import unittest

from colorado_connector_budget_frontier import audit_frontiers
from colorado_sparse_parent_oracle import compare_parent
from test_colorado_sparse_parent_oracle import fixture


class CensusFrontierTests(unittest.TestCase):
    def setup_reports(self):
        graph,regional=fixture(two_way=True)
        parent=compare_parent(graph,regional)
        regional["source_provenance"]=parent["source_provenance"]=[]
        flags={f:False for f in ("release_eligible","access_certified","road_coverage_certified","complete_global_competition")}
        domains={**flags,"source_qualifying_cbsa_ids":["10000","20000","30000"],"domains":[]}
        for cbsa,coords in (("10000",[0.,0.]),("20000",[.3,.1]),("30000",[10.,10.])):
            domains["domains"].append({"cbsa":cbsa,"native_representative_lonlat":coords})
            for s in regional["sources"]:
                if s["cbsa"]==cbsa:s.update(lon=coords[0],lat=coords[1])
        return domains,regional,parent

    def test_complete_inventory_retained_and_unknown_connector_budgets_explicit(self):
        result=audit_frontiers(*self.setup_reports())
        self.assertEqual(result["source_thresholds_computed"],36)
        self.assertEqual(result["unrepresented_source_qualifying_cbsa_ids"],["30000"])
        self.assertEqual(result["applied_source_exclusions"],[])
        for row in result["frontiers"]:
            self.assertEqual(len(row["sources"]),3)
            previous=set()
            for case in row["budget_cases"]:
                current=set(case["retained_or_unknown_ids"])
                self.assertTrue(previous<=current)
                self.assertEqual(current|set(case["conditional_bound_exceeds_full_incumbent_ids"]),set(result["source_qualifying_cbsa_ids"]))
                previous=current

    def test_missing_or_altered_inventory_origins_paths_and_cases_fail(self):
        for mutation in (lambda d,r,p:d["domains"].pop(),lambda d,r,p:r["sources"][0].update(lon=1),
                         lambda d,r,p:p["comparisons"].pop(),lambda d,r,p:p["comparisons"][0]["source_costs"][0].update(exact_stored_arc_path_cost=None),
                         lambda d,r,p:p.update(source_provenance=["changed"]),lambda d,r,p:d.update(access_certified=True)):
            reports=self.setup_reports()
            mutation(*reports)
            with self.assertRaises(ValueError):audit_frontiers(*reports)


if __name__=="__main__":unittest.main()
