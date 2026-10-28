import unittest

import networkx as nx

from colorado_expanded_parent_competition import expand_competition, nearest_primitive_lead
from colorado_sparse_parent_oracle import compare_parent
from test_colorado_sparse_parent_oracle import fixture


def reports():
    parent, regional = fixture()
    coords = {"10000": [0., 0.], "20000": [.3, .1], "30000": [.35, .1]}
    for source in regional["sources"]:
        point = coords[source["cbsa"]]
        source.update(lon=point[0], lat=point[1], node_lonlat=point,
                      access_verified=False, connector_costs_included=False)
    reference = compare_parent(parent, regional)
    regional["source_provenance"] = reference["source_provenance"] = []
    domains = {key: False for key in ("release_eligible", "access_certified",
               "complete_global_competition", "road_coverage_certified")}
    domains.update(source_qualifying_cbsa_ids=["10000", "20000", "30000", "40000"],
                   domains=[{"cbsa": k, "native_representative_lonlat": v}
                            for k, v in {**coords, "40000": [10., 10.]}.items()])
    for report in (regional, reference):
        report["source_qualifying_cbsa_ids"] = domains["source_qualifying_cbsa_ids"]
    return parent, domains, regional, reference


class ExpandedParentTests(unittest.TestCase):
    def test_added_source_changes_winner_and_all_costs_match_independent_solver(self):
        parent, domains, regional, reference = reports()
        result = expand_competition(parent, domains, regional, reference, ["10000", "20000", "30000"])
        self.assertGreater(result["changed_subset_winner_cases"], 0)
        sources = {s["cbsa"]: parent.node_index[s["node"]] for s in result["sources"]}
        for case in result["comparisons"]:
            matrix = getattr(parent, case["metric"])
            graph = nx.from_scipy_sparse_array(matrix, create_using=nx.DiGraph)
            if case["orientation"] == "location-to-metro":
                graph = graph.reverse(copy=False)
            for option in case["source_costs"]:
                costs = nx.single_source_dijkstra_path_length(graph, sources[option["cbsa"]])
                cost = costs.get(parent.node_index[int(case["probe"])])
                if cost is None:
                    self.assertIsNone(option["graph_only_cost"])
                    self.assertIsNone(option["exact_stored_path_cost"])
                else:
                    self.assertAlmostEqual(cost, option["graph_only_cost"])
                    self.assertIsNotNone(option["exact_stored_path_cost"])
        self.assertEqual(result["baseline_source_costs_checked"], 24)
        self.assertEqual(result["source_costs_computed"], 36)
        self.assertEqual(result["unrepresented_source_qualifying_cbsa_ids"], ["40000"])
        self.assertEqual(result["applied_source_exclusions"], [])
        self.assertFalse(result["release_eligible"])
        self.assertTrue(all(not s["access_verified"] and not s["connector_costs_included"] for s in result["sources"]))
        self.assertTrue(any(o["graph_only_cost"] is None for c in result["comparisons"] for o in c["source_costs"]))

    def test_old_origins_and_leads_are_preserved_even_when_not_nearest(self):
        parent, domains, regional, reference = reports()
        # Source 10000's research origin is near a different primitive vertex.
        # Its existing node must not silently be resnapped.
        domains["domains"][0]["native_representative_lonlat"] = [.3, 0.]
        regional["sources"][0].update(lon=.3, lat=0.)
        result = expand_competition(parent, domains, regional, reference, ["10000", "20000", "30000"])
        self.assertEqual(result["sources"][0]["node"], 1)
        self.assertEqual(result["sources"][2]["node"], 4)
        self.assertNotEqual(result["sources"][0]["lead_policy"], result["sources"][2]["lead_policy"])

    def test_missing_changed_duplicate_or_certified_inputs_fail(self):
        mutations = [lambda d, r, p: d["domains"].pop(),
                     lambda d, r, p: r["sources"][0].update(lon=1),
                     lambda d, r, p: r["sources"][0].update(node_lonlat=[1, 0]),
                     lambda d, r, p: p["comparisons"].pop(),
                     lambda d, r, p: p["comparisons"][0]["source_costs"][0].update(primitive_parent_cost=1),
                     lambda d, r, p: d.update(access_certified=True),
                     lambda d, r, p: d["domains"][2].update(native_representative_lonlat=[10., 10.]),
                     lambda d, r, p: p.update(source_provenance=["changed"])]
        for mutation in mutations:
            parent, d, r, p = reports()
            mutation(d, r, p)
            with self.assertRaises(ValueError):
                expand_competition(parent, d, r, p, ["10000", "20000", "30000"])
        for ids in (["10000", "30000"], ["10000", "20000", "30000", "30000"]):
            with self.assertRaises(ValueError):
                expand_competition(*reports(), ids)

    def test_nearest_vertex_ties_and_investigation_radius(self):
        parent, *_ = reports()
        i = parent.node_index[4]
        j = parent.node_index[5]
        parent.longitude[j], parent.latitude[j] = parent.longitude[i], parent.latitude[i]
        self.assertEqual(nearest_primitive_lead(parent, [.35, .1])["node"], 4)
        with self.assertRaisesRegex(ValueError, "no source omission"):
            nearest_primitive_lead(parent, [10., 10.])
        for point in ([float('nan'), 0], [181, 0]):
            with self.assertRaises(ValueError):
                nearest_primitive_lead(parent, point)


if __name__ == "__main__":
    unittest.main()
