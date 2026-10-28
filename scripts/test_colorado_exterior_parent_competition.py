import unittest

import networkx as nx

from colorado_exterior_parent_competition import SourceScan, audit_extension, compare_exterior
from road_primitive_sparse import PrimitiveSparseBuilder


def fixture():
    builder = PrimitiveSparseBuilder()
    tags = {"highway": "primary", "oneway": "yes"}
    builder.add(10, tags, [(1, 0., 0.), (4, .3, .5), (2, .3, 0.)])
    builder.add(11, tags, [(3, 0., .2), (2, .3, 0.)])
    prefix = builder.snapshot()
    builder.add(20, {**tags, "oneway": "no"}, [(1, 0., 0.), (6, .15, 0.), (2, .3, 0.)])
    parent = builder.finish()
    ids = ["10000", "20000", "30000", "40000"]
    coords = {"10000": [0., 0.], "20000": [0., .2], "30000": [.15, 0.], "40000": [10., 10.]}
    flags = {key: False for key in ("release_eligible", "access_certified", "complete_global_competition", "road_coverage_certified")}
    domains = {**flags, "source_qualifying_cbsa_ids": ids,
               "domains": [{"cbsa": k, "native_representative_lonlat": v} for k, v in coords.items()]}
    sources = [{"cbsa": k, "node": node, "node_lonlat": coords[k], "native_origin_lonlat": coords[k],
                "access_verified": False, "connector_costs_included": False, "lead_policy": "preserved-fixture"}
               for k, node in (("10000", 1), ("20000", 3))]
    probes = {str(n): [float(prefix.longitude[prefix.node_index[n]]), float(prefix.latitude[prefix.node_index[n]])] for n in (1, 2, 3)}
    cases = []
    for orientation in ("metro-to-location", "location-to-metro"):
        for metric in ("length", "travel_time"):
            graph = nx.from_scipy_sparse_array(getattr(prefix, metric), create_using=nx.DiGraph)
            if orientation == "location-to-metro":
                graph = graph.reverse(copy=False)
            costs = {s["cbsa"]: nx.single_source_dijkstra_path_length(graph, prefix.node_index[s["node"]]) for s in sources}
            for probe in probes:
                cases.append({"probe": probe, "metric": metric, "orientation": orientation,
                    "source_costs": [{"cbsa": s["cbsa"], "graph_only_cost": costs[s["cbsa"]].get(prefix.node_index[int(probe)])} for s in sources]})
    baseline = {**flags, "sources": sources, "source_qualifying_cbsa_ids": ids,
                "primitive_parent_graph": prefix.report, "probe_coordinates_lonlat": probes, "comparisons": cases}
    return prefix, parent, domains, baseline


class ExteriorTests(unittest.TestCase):
    def test_new_exterior_routes_and_sources_match_independent_solver(self):
        prefix, parent, domains, baseline = fixture()
        result = compare_exterior(prefix, parent, domains, baseline, ["30000"])
        self.assertEqual(result["original_prefix_costs_reproduced"], 24)
        self.assertEqual(result["source_costs_computed"], 36)
        self.assertGreater(result["improved_original_source_cost_cases"], 0)
        self.assertGreater(result["changed_subset_winner_cases"], 0)
        cut = result["weighted_prefix_interface"]
        self.assertEqual(cut["prefix_directed_pairs_preserved"], 3)
        self.assertEqual((cut["inbound_directed_pairs"], cut["outbound_directed_pairs"]), (2, 2))
        self.assertEqual({x["node"] for x in cut["weighted_interface_nodes"]}, {1, 2})
        source_indices = {s["cbsa"]: parent.node_index[s["node"]] for s in result["sources"]}
        for case in result["comparisons"]:
            graph = nx.from_scipy_sparse_array(getattr(parent, case["metric"]), create_using=nx.DiGraph)
            if case["orientation"] == "location-to-metro":
                graph = graph.reverse(copy=False)
            for option in case["source_costs"]:
                cost = nx.single_source_dijkstra_path_length(graph, source_indices[option["cbsa"]]).get(parent.node_index[int(case["probe"])])
                if cost is None:
                    self.assertIsNone(option["graph_only_cost"])
                else:
                    self.assertAlmostEqual(cost, option["graph_only_cost"])
        witness = next(w for w in result["changed_route_witnesses"] if w["orientation"] == "location-to-metro" and w["probe"] == "2" and w["cbsa"] == "10000")
        self.assertEqual(witness["raw_osm_node_path"], [2, 6, 1])
        self.assertEqual(witness["outside_prefix_vertices"], 1)
        self.assertEqual(result["unrepresented_source_qualifying_cbsa_ids"], ["40000"])
        self.assertEqual(result["applied_source_exclusions"], [])
        self.assertFalse(result["release_eligible"])

    def test_prefix_snapshot_stays_frozen_after_append_and_overlap(self):
        builder = PrimitiveSparseBuilder()
        points = [(1, 0., 0.), (2, .1, 0.)]
        tags = {"highway": "primary"}
        builder.add(1, tags, points)
        prefix = builder.snapshot()
        builder.add(1, tags, points)
        builder.add(2, tags, [(2, .1, 0.), (3, .2, 0.)])
        parent = builder.finish()
        self.assertEqual(list(prefix.osm_ids), [1, 2])
        self.assertNotIn(3, prefix.node_index)
        self.assertEqual(prefix.report["exact_duplicate_highway_ways"], 0)
        self.assertEqual(parent.report["exact_duplicate_highway_ways"], 1)
        self.assertEqual(prefix.length.shape, (2, 2))
        self.assertEqual(audit_extension(prefix, parent)["prefix_directed_pairs_preserved"], 2)
        with self.assertRaises(ValueError):
            builder.snapshot()

    def test_lost_or_increased_arcs_and_changed_nodes_fail(self):
        for mutation in (lambda p: p.length.data.__setitem__(0, p.length.data[0]+1),
                         lambda p: p.longitude.__setitem__(0, 1)):
            prefix, parent, *_ = fixture()
            mutation(parent)
            with self.assertRaises(ValueError):
                audit_extension(prefix, parent)
        prefix, parent, *_ = fixture()
        parent.length.data[0] = 0
        parent.length.eliminate_zeros()
        with self.assertRaises(ValueError):
            audit_extension(prefix, parent)

    def test_missing_costs_scenarios_sources_and_certification_fail(self):
        for mutate in (lambda d, b: b["comparisons"].pop(),
                       lambda d, b: b["comparisons"][0]["source_costs"][0].update(graph_only_cost=1),
                       lambda d, b: b["sources"][0].update(native_origin_lonlat=[1, 0]),
                       lambda d, b: d.update(access_certified=True),
                       lambda d, b: d["domains"][2].update(native_representative_lonlat=[10., 10.])):
            prefix, parent, domains, baseline = fixture()
            mutate(domains, baseline)
            with self.assertRaises(ValueError):
                compare_exterior(prefix, parent, domains, baseline, ["30000"])

    def test_per_source_duplicate_highways_fail(self):
        scan = SourceScan(PrimitiveSparseBuilder())
        points = [(1, 0., 0.), (2, .1, 0.)]
        scan.add(1, {"highway": "primary"}, points)
        with self.assertRaisesRegex(ValueError, "within one source"):
            scan.add(1, {"highway": "primary"}, points)


if __name__ == "__main__":
    unittest.main()
