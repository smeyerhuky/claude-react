from fractions import Fraction
import random
import unittest

import networkx as nx

from colorado_road_subdivision_preservation import baseline_snapshot, verify_expansion
from road_boundary_relaxation import conditional_cut_bounds, promote_raw_ports
from stream_osm_roads import meters


def port(node=2, point=(.001, 0)):
    return {"osm_node_id": node, "lonlat": list(point), "can_exit_retained_way_set": True, "can_enter_retained_way_set": True}


def osm_graph(zero=False, reverse=True):
    graph = nx.MultiDiGraph()
    points = ((0., 0.), (0. if zero else .001, 0.), (.002, 0.))
    graph.add_node(1, x=0., y=0.)
    graph.add_node(3, x=.002, y=0.)
    length = sum(meters(a, b) for a, b in zip(points, points[1:]))
    attrs = {"geometry": points, "osm_node_ids": (1, 2, 3), "osm_way_id": 10,
             "speed_kph": 36, "length": length, "travel_time": length/10, "highway": "primary", "oneway": "no" if reverse else "yes"}
    graph.add_edge(1, 3, **attrs)
    if reverse:
        graph.add_edge(3, 1, **{**attrs, "geometry": tuple(reversed(points)), "osm_node_ids": (3, 2, 1)})
    return graph


class PortPromotionTests(unittest.TestCase):
    def test_preserves_primitive_paths_and_directed_costs(self):
        for reverse in (False, True):
            graph = osm_graph(reverse=reverse)
            snapshot = baseline_snapshot(graph)
            before = nx.single_source_dijkstra_path_length(graph, 1, weight="length")
            result = promote_raw_ports(graph, [port()])
            self.assertEqual(result["new_junction_nodes"], 1)
            self.assertTrue(verify_expansion(snapshot, graph)["modeled_baseline_paths_preserved_modulo_subdivision"])
            self.assertAlmostEqual(nx.shortest_path_length(graph, 1, 3, weight="length"), before[3])
            self.assertEqual(nx.has_path(graph, 3, 1), reverse)

    def test_zero_length_split_keeps_connectivity(self):
        graph = osm_graph(zero=True, reverse=False)
        snapshot = baseline_snapshot(graph)
        result = promote_raw_ports(graph, [port(point=(0., 0.))])
        self.assertEqual(result["zero_length_subarcs_retained"], 1)
        self.assertEqual(graph[1][2][0]["length"], 0)
        self.assertTrue(nx.has_path(graph, 1, 3))
        verify_expansion(snapshot, graph)

    def test_missing_mismatched_and_hidden_ports_do_not_mutate_graph(self):
        for ports in ([port(4)], [port(point=(.003, 0))], [port(), port()]):
            graph = osm_graph()
            with self.assertRaises(ValueError):
                promote_raw_ports(graph, ports)
            self.assertEqual(set(graph), {1, 3})
            self.assertEqual(graph.number_of_edges(), 2)
        graph = osm_graph()
        graph.add_node(2, x=.001, y=0)
        with self.assertRaisesRegex(ValueError, "existing graph junction"):
            promote_raw_ports(graph, [port()])


class ConditionalCutTests(unittest.TestCase):
    def test_missing_internal_shortcut_prevents_false_winner_proof(self):
        graph = nx.DiGraph()
        graph.add_edge("a", "p", length=5)
        graph.add_edge("b", "p", length=100)
        result = conditional_cut_bounds(graph, [{"cbsa": "a", "node": "a"}, {"cbsa": "b", "node": "b"}],
                                        ["p"], ["b"], ["p"], metric="length", orientation="metro-to-location")
        self.assertIsNone(result["probes"][0]["conditional_subset_winner"])
        self.assertEqual(result["probes"][0]["possible_subset_winners"], ["a", "b"])
        self.assertFalse(result["complete_global_competition"])

    def test_reverse_only_excursion_does_not_create_reverse_route(self):
        graph = nx.DiGraph()
        graph.add_edge("a", "p", length=10)
        graph.add_edge("b", "p", length=20)
        graph.add_edge("p", "a", length=40)
        graph.add_edge("p", "b", length=30)
        sources = [{"cbsa": "a", "node": "a"}, {"cbsa": "b", "node": "b"}]
        inward = conditional_cut_bounds(graph, sources, ["p"], ["b"], ["p"], metric="length", orientation="location-to-metro")
        self.assertEqual(inward["probes"][0]["conditional_subset_winner"], "b")
        outward = conditional_cut_bounds(graph, sources, ["p"], ["b"], ["p"], metric="length", orientation="metro-to-location")
        self.assertIsNone(outward["probes"][0]["conditional_subset_winner"])

    def test_random_parent_bounds_against_exact_fraction_bellman_ford(self):
        rng = random.Random(138)
        sources = [{"cbsa": "a", "node": 0}, {"cbsa": "b", "node": 1}]
        def exact(value):
            return None if value is None else Fraction(int(value["exact"][0]), int(value["exact"][1]))
        for _ in range(20):
            parent, known = nx.DiGraph(), nx.DiGraph()
            parent.add_nodes_from(range(7)); known.add_nodes_from(range(5))
            for u in parent:
                for v in parent:
                    if u != v and rng.random() < .3:
                        costs = {"length": rng.randrange(1, 200)/10, "travel_time": rng.randrange(1, 200)/10}
                        parent.add_edge(u, v, **costs)
                        if u < 5 and v < 5 and rng.random() < .7:
                            known.add_edge(u, v, **costs)
            missing = [(u, v) for u, v in parent.edges if not known.has_edge(u, v)]
            exits = {u for u, _ in missing if u in known}
            entries = {v for _, v in missing if v in known}
            for direction in ("metro-to-location", "location-to-metro"):
                full = parent if direction == "metro-to-location" else parent.reverse(copy=False)
                for metric in ("length", "travel_time"):
                    result = conditional_cut_bounds(known, sources, [2, 3, 4], exits, entries, metric=metric, orientation=direction)
                    oracle = {s["cbsa"]: nx.single_source_bellman_ford_path_length(full, s["node"], weight=lambda u, v, d: Fraction(d[metric])) for s in sources}
                    for probe in result["probes"]:
                        node = int(probe["probe"])
                        for row in probe["source_bounds"]:
                            lower, upper = exact(row["parent_relative_lower_bound"]), exact(row["known_path_upper_bound"])
                            actual = oracle[row["cbsa"]].get(node)
                            if lower is None:
                                self.assertIsNone(actual)
                            if actual is not None and lower is not None:
                                self.assertLessEqual(lower, actual)
                            if upper is not None:
                                self.assertIsNotNone(actual)
                                self.assertLessEqual(actual, upper)
                        winner = probe["conditional_subset_winner"]
                        if winner is not None:
                            actual = oracle[winner][node]
                            self.assertTrue(all(cbsa == winner or node not in labels or labels[node] > actual for cbsa, labels in oracle.items()))

    def test_rounding_near_ties_and_invalid_weights_fail_closed(self):
        graph = nx.DiGraph()
        graph.add_edge("a", "x", length=.1); graph.add_edge("x", "p", length=.2)
        graph.add_edge("b", "p", length=.3)
        sources = [{"cbsa": "a", "node": "a"}, {"cbsa": "b", "node": "b"}]
        kwargs = dict(sources=sources, probes=["p"], exits=[], entries=[], metric="length", orientation="metro-to-location")
        self.assertIsNone(conditional_cut_bounds(graph, **kwargs)["probes"][0]["conditional_subset_winner"])
        for bad in (-1, float("nan"), float("inf"), True):
            graph["a"]["x"]["length"] = bad
            with self.assertRaises(ValueError):
                conditional_cut_bounds(graph, **kwargs)
