import copy
import unittest

import networkx as nx

from colorado_exterior_parent_competition import compare_exterior
from colorado_utah_bounded_competitors import combine_batches, load_reference
from test_colorado_exterior_parent_competition import fixture


def batches_fixture():
    prefix, graph, domains, reference = fixture()
    domains['source_qualifying_cbsa_ids'].append('50000')
    domains['domains'][-1]['native_representative_lonlat'] = [.3, 0.]
    domains['domains'].append({'cbsa': '50000', 'native_representative_lonlat': [0., .2]})
    baseline = compare_exterior(prefix, graph, domains, reference, ['30000'])
    additions = ['40000', '50000']
    batches = [compare_exterior(graph, graph, domains, baseline, [c]) for c in additions]
    return graph, domains, baseline, batches, additions


class BoundedUtahTests(unittest.TestCase):
    def test_union_matches_joint_run_and_independent_networkx_including_unreachable_and_ties(self):
        graph, domains, baseline, batches, additions = batches_fixture()
        combined = combine_batches(baseline, batches, additions)
        joint = compare_exterior(graph, graph, domains, baseline, additions)
        self.assertEqual(combined['sources'], joint['sources'])
        self.assertEqual(combined['changed_subset_winner_cases'], joint['changed_subset_winner_cases'])
        self.assertGreater(combined['changed_subset_winner_cases'], 0)
        self.assertEqual(combined['source_costs_computed'], 60)
        self.assertEqual(combined['baseline_cost_reproduction_checks'], 72)
        self.assertEqual(combined['source_cost_evaluations_including_repeated_baseline'], 96)
        self.assertEqual(combined['batch_source_counts'], [4, 4])
        nulls, ties = 0, 0
        for actual, expected in zip(combined['comparisons'], joint['comparisons']):
            self.assertEqual(actual['exterior_subset_winner_ids'], expected['exterior_subset_winner_ids'])
            ties += len(actual['exterior_subset_winner_ids']) > 1
            g = nx.from_scipy_sparse_array(getattr(graph, actual['metric']), create_using=nx.DiGraph)
            if actual['orientation'] == 'location-to-metro':
                g = g.reverse(copy=False)
            for source, option in zip(combined['sources'], actual['source_costs']):
                distances = nx.single_source_dijkstra_path_length(g, graph.node_index[source['node']])
                cost = distances.get(graph.node_index[int(actual['probe'])])
                self.assertEqual(option['graph_only_cost'], cost)
                nulls += cost is None
                if source['cbsa'] in additions:
                    self.assertEqual(option['prefix_cost_status'], 'not_computed_for_previously_unrepresented_source')
        self.assertGreater(nulls, 0)
        self.assertGreater(ties, 0)
        self.assertFalse(combined['release_eligible'])
        self.assertEqual(combined['applied_source_exclusions'], [])

    def test_changed_graph_lead_cost_inventory_accounting_and_certification_fail_closed(self):
        _, _, baseline, original, additions = batches_fixture()
        mutations = [
            lambda b: b[1]['primitive_parent_graph'].__setitem__('nodes', 999),
            lambda b: b[1]['sources'][0].__setitem__('node', 999),
            lambda b: b[1]['comparisons'][0]['source_costs'][0].__setitem__('graph_only_cost', 123),
            lambda b: b[1]['comparisons'].pop(),
            lambda b: b[1]['comparisons'][0]['source_costs'].pop(),
            lambda b: b[1].__setitem__('primitive_paths_replayed', 0),
            lambda b: b[1].__setitem__('access_certified', True),
            lambda b: b[1]['applied_source_exclusions'].append('99999'),
            lambda b: b[1]['weighted_prefix_interface'].__setitem__('inbound_directed_pairs', 1),
        ]
        for mutate in mutations:
            with self.subTest(mutate=mutate):
                batches = copy.deepcopy(original)
                mutate(batches)
                with self.assertRaises(ValueError):
                    combine_batches(baseline, batches, additions)
        with self.assertRaises(ValueError):
            combine_batches(baseline, original, ['40000', '40000'])
        with self.assertRaises(ValueError):
            combine_batches(baseline, original[:1], additions)

    def test_reference_binds_passed_four_state_inputs_and_complete_baseline(self):
        manifest, domains, baseline = load_reference()
        self.assertEqual(len(domains['source_qualifying_cbsa_ids']), 367)
        self.assertEqual(len(baseline['sources']), 15)
        self.assertEqual(len(manifest['source_provenance']), 4)
        self.assertEqual(manifest['upstream_ci']['run'], 40716527174)


if __name__ == '__main__':
    unittest.main()
