import copy
import unittest

from colorado_competition_bound_audit import audit_bounds


def fixture():
    audit = {"qualifying_cbsa_ids": ["a", "b", "missing"], "omitted_qualifying_cbsa_ids": ["missing"],
             "release_eligible": False, "complete_global_competition": False,
             "sources": [{"cbsa": "a", "node": "1"}, {"cbsa": "b", "node": "2"}],
             "probe_coordinates_lonlat": {"1": [0, 0], "2": [0, .001]}, "fixed_probe_node_ids": ["1", "2"]}
    for graph in ("baseline", "expanded"):
        audit[graph+"_routing_model"] = {"routing_model": "static-passenger-car-v2"}
        audit[graph] = {}
        for direction in ("location-to-metro", "metro-to-location"):
            audit[graph][direction] = {}
            for metric, cost in (("length", 200), ("travel_time", 10)):
                audit[graph][direction][metric] = {"probes": [
                    {"probe": node, "status": "reachable", "cost": 0,
                     "source_costs": [{"cbsa": own, "cost": 0}, {"cbsa": other, "cost": cost}]}
                    for node, own, other in (("1", "a", "b"), ("2", "b", "a"))]}
    return audit


class BoundsAuditTests(unittest.TestCase):
    def test_both_metrics_directions_retaining_missing_origin(self):
        result = audit_bounds(fixture(), ["missing", "b", "a"])
        self.assertEqual(result["independent_source_route_costs_checked"], 32)
        self.assertEqual(result["unknown_origin_domain_ids"], ["missing"])
        self.assertEqual(result["applied_source_exclusions"], [])
        self.assertFalse(result["complete_global_competition"])
        self.assertTrue(any(r["conditional_exclusion"] for p in result["probes"] for r in p["known_graph_vertex_origin_bounds"]))

    def test_detects_cost_below_geographic_bound(self):
        audit = fixture()
        audit["baseline"]["metro-to-location"]["length"]["probes"][0]["source_costs"][1]["cost"] = 1
        with self.assertRaisesRegex(ValueError, "exceeds independent"):
            audit_bounds(audit, audit["qualifying_cbsa_ids"])

    def test_model_inventory_and_probe_fail_closed(self):
        base = fixture()
        for mutation in (
            lambda a: a.update(release_eligible=True),
            lambda a: a.update(omitted_qualifying_cbsa_ids=[]),
            lambda a: a["sources"].append(a["sources"][0]),
            lambda a: a["expanded_routing_model"].update(routing_model="future"),
            lambda a: a["expanded"]["location-to-metro"]["travel_time"]["probes"].pop(),
            lambda a: a["expanded"]["location-to-metro"]["travel_time"]["probes"][0].update(cost=1),
        ):
            audit = copy.deepcopy(base)
            mutation(audit)
            with self.assertRaises(ValueError):
                audit_bounds(audit, base["qualifying_cbsa_ids"])


if __name__ == "__main__":
    unittest.main()
