import copy
import unittest
import networkx as nx
from colorado_real_directed_competition import validate_boundary_regressions, boundary_route_witness


def sample():
    fixture = {"release_eligible": False, "access_certified": False,
               "routing_model": "static-passenger-car-v2",
               "source_cbsa_ids": ["1", "2"], "orientation": "metro-to-location", "probes": [
                   {"node": "3", "metric": "travel_time", "units": "seconds", "minimum_cost_decrease": 2,
                    "baseline_winner": "1", "expanded_winner": "2"}]}
    result = {"release_eligible": False, "access_certified": False, "sources": [{"cbsa": "1"}, {"cbsa": "2"}]}
    result.update(baseline_routing_model={"routing_model": "static-passenger-car-v2"},
                  expanded_routing_model={"routing_model": "static-passenger-car-v2"})
    for graph, winner, cost in (("baseline", "1", 10), ("expanded", "2", 5)):
        result[graph] = {"metro-to-location": {"travel_time": {"probes": [
            {"probe": "3", "status": "reachable", "winner": winner, "cost": cost}]}}}
    return fixture, result


class BoundaryRegressionTests(unittest.TestCase):
    def test_real_expectations_check_winner_and_improvement(self):
        fixture, result = sample()
        report = validate_boundary_regressions(result, fixture)
        self.assertEqual(report["cases"][0]["cost_decrease"], 5)
        self.assertFalse(report["release_eligible"])
        for field, value in (("winner", "1"), ("cost", 9), ("status", "unreachable")):
            bad = copy.deepcopy(result)
            bad["expanded"]["metro-to-location"]["travel_time"]["probes"][0][field] = value
            with self.assertRaises(ValueError):
                validate_boundary_regressions(bad, fixture)

    def test_missing_probes_sources_and_duplicate_cases_fail_closed(self):
        fixture, result = sample()
        for change in ("probe", "sources", "duplicate", "units"):
            f, r = copy.deepcopy(fixture), copy.deepcopy(result)
            if change == "probe": r["expanded"]["metro-to-location"]["travel_time"]["probes"] = []
            elif change == "sources": r["sources"] = [{"cbsa": "1"}]
            elif change == "duplicate": f["probes"].append(copy.deepcopy(f["probes"][0]))
            else: f["probes"][0]["units"] = "meters"
            with self.assertRaises(ValueError):
                validate_boundary_regressions(r, f)

    def test_added_way_witness_leaves_and_reenters_bbox(self):
        g = nx.MultiDiGraph()
        for n, x in ((1, .1), (2, 1.2), (3, .9)):
            g.add_node(n, x=x, y=.5)
        g.add_edge(1, 2, length=2, osm_way_id=10, geometry=((.1,.5),(1.2,.5)))
        g.add_edge(2, 3, length=1, osm_way_id=11, geometry=((1.2,.5),(.9,.5)))
        case = {"node": "3", "metric": "length", "expanded_winner": "1", "require_leave_and_reenter": True}
        sources = [{"cbsa": "1", "node": 1}]
        report = boundary_route_witness(g, sources, case, {11}, [0,0,1,1])
        self.assertTrue(report["leaves_and_reenters_declared_bbox"])
        self.assertEqual(report["added_osm_way_ids"], [10])
        self.assertEqual(report["route_cost"], 3)
        with self.assertRaises(ValueError):
            boundary_route_witness(g, sources, case, {10,11}, [0,0,1,1])
        with self.assertRaises(ValueError):
            boundary_route_witness(g, sources, case, {11}, [0,0,2,1])


if __name__ == "__main__":
    unittest.main()
