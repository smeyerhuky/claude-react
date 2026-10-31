import copy
from fractions import Fraction
import unittest
from metro_anchor_set_contract import aggregate, registry_digest, SCHEMA


class AnchorSetTests(unittest.TestCase):
    def setUp(self):
        # Explicitly synthetic: no real coordinates, anchors or evidence adopted.
        self.registry = dict(schema=SCHEMA, research_only=True, cbsa='99999', set_version='synthetic-v1',
            principal_city_source=dict(url='https://example.org/synthetic-cities', sha256='1'*64),
            principal_city_ids=['city-a', 'city-b'],
            anchors=[dict(id='a', principal_city_id='city-a'), dict(id='b', principal_city_id='city-b')])
        self.query = dict(graph_bundle_sha256='2'*64, scenario_sha256='a'*64, sample_id='synthetic-sample', metric='length', direction='from_anchor')

    def row(self, aid, graph=1, connector=1, status='finite', reason='declared graph disconnected'):
        return dict(schema=SCHEMA, cbsa=self.registry['cbsa'], registry_sha256=registry_digest(self.registry),
                    **self.query, anchor_id=aid, unit='meters', status=status,
                    graph_cost=graph, connector_cost=connector, reason=reason)

    def run_query(self, rows):
        return aggregate(self.registry, rows, **self.query)

    def test_full_connector_cost_changes_winner_and_exact_ties_survive(self):
        result = self.run_query([self.row('a', 1, 10), self.row('b', 5, 1)])
        self.assertEqual(result['cost'], 6); self.assertEqual(result['minimizing_anchor_ids'], ['b'])
        result = self.run_query([self.row('b', 1, 5), self.row('a', 5, 1)])
        self.assertEqual(result['minimizing_anchor_ids'], ['a', 'b'])
        self.assertFalse(result['release_eligible']); self.assertFalse(result['anchors_adopted'])

    def test_metric_direction_and_anchor_can_choose_different_minima(self):
        winners = []
        for metric, unit in [('length', 'meters'), ('travel_time', 'seconds')]:
            for direction in ('from_anchor', 'to_anchor'):
                self.query.update(metric=metric, direction=direction)
                rows = [self.row('a', 1, 10), self.row('b', 5, 1)] if direction == 'from_anchor' else [self.row('a', 1, 1), self.row('b', 5, 10)]
                if metric == 'travel_time':
                    rows[0]['graph_cost'], rows[1]['graph_cost'] = 100, 0
                for row in rows: row['unit'] = unit
                winners.append(self.run_query(rows)['minimizing_anchor_ids'])
        self.assertEqual(winners, [['b'], ['a'], ['b'], ['b']])

    def test_missing_or_unknown_cannot_turn_subset_into_complete_minimum(self):
        for rows in ([self.row('a')], [self.row('a'), self.row('b', None, None, 'unknown', 'entry unresolved')]):
            result = self.run_query(rows)
            self.assertEqual(result['status'], 'unknown'); self.assertIsNone(result['cost'])
            self.assertEqual(result['minimizing_anchor_ids'], [])
            self.assertEqual(result['finite_subset_upper_bound'], 2)
            self.assertIn('b', result['unknown_anchor_reasons'])
        result = self.run_query([])
        self.assertEqual(result['status'], 'unknown'); self.assertIsNone(result['finite_subset_upper_bound'])

    def test_modeled_unreachable_is_distinct_from_unknown_and_world_inaccessibility(self):
        no = lambda aid: self.row(aid, None, None, 'modeled_unreachable')
        result = self.run_query([no('a'), no('b')])
        self.assertEqual(result['status'], 'modeled_unreachable'); self.assertFalse(result['access_verified'])
        result = self.run_query([no('a'), self.row('b')])
        self.assertEqual(result['status'], 'finite'); self.assertEqual(result['minimizing_anchor_ids'], ['b'])
        self.assertEqual(self.run_query([no('a')])['status'], 'unknown')

    def test_no_implicit_zero_connector_negative_nonfinite_or_nonfinite_cost_payload(self):
        for field, value in [('connector_cost', None), ('connector_cost', -1), ('graph_cost', float('nan')),
                             ('graph_cost', float('inf')), ('graph_cost', True), ('graph_cost', '1')]:
            row = self.row('a'); row[field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError): self.run_query([row])
        with self.assertRaises(ValueError): self.run_query([self.row('a', 0, None, 'unknown')])
        result = self.run_query([self.row('a', .1, .2), self.row('b', 1, 1)])
        self.assertEqual(Fraction(*map(int, result['exact_stored_cost'])), Fraction(.1)+Fraction(.2))

    def test_mixed_identity_metric_direction_units_and_duplicate_anchor_rejected(self):
        for field, value in [('cbsa','88888'), ('registry_sha256','3'*64), ('graph_bundle_sha256','4'*64),
                             ('scenario_sha256','f'*64), ('sample_id','other'), ('metric','travel_time'), ('direction','to_anchor'),
                             ('unit','kilometers'), ('anchor_id','c'), ('schema','approval-ledger')]:
            row = self.row('a'); row[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError): self.run_query([row])
        with self.assertRaises(ValueError): self.run_query([self.row('a'), self.row('a')])

    def test_registry_requires_explicit_complete_principal_city_membership(self):
        for mutation in ('missing_city', 'duplicate_city', 'unknown_city', 'duplicate_anchor', 'no_source', 'production'):
            original = copy.deepcopy(self.registry)
            if mutation == 'missing_city': self.registry['anchors'].pop()
            elif mutation == 'duplicate_city': self.registry['principal_city_ids'].append('city-a')
            elif mutation == 'unknown_city': self.registry['anchors'][0]['principal_city_id'] = 'other'
            elif mutation == 'duplicate_anchor': self.registry['anchors'][1]['id'] = 'a'
            elif mutation == 'no_source': self.registry['principal_city_source']['sha256'] = ''
            else: self.registry['research_only'] = False
            with self.subTest(mutation=mutation), self.assertRaises(ValueError): self.run_query([])
            self.registry = original


if __name__ == '__main__': unittest.main()
