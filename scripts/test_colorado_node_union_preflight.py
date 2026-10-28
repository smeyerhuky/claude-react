import unittest

from colorado_node_union_preflight import BoundedNodeUnion, LimitReached
from road_primitive_sparse import PrimitiveSparseBuilder


class NodePreflightTests(unittest.TestCase):
    def test_supported_union_matches_materialized_primitive_graph(self):
        count = BoundedNodeUnion(100)
        graph = PrimitiveSparseBuilder()
        cases = [
            (1, {'highway': 'primary'}, [(1, 0., 0.), (2, .1, 0.)]),
            (2, {'highway': 'primary', 'oneway': 'yes'}, [(2, .1, 0.), (3, .2, 0.)]),
            (3, {'highway': 'primary', 'access': 'private'}, [(3, .2, 0.), (4, .3, 0.)]),
            (4, {'highway': 'footway'}, [(3, .2, 0.), (5, .4, 0.)]),
            (5, {'highway': 'primary', 'oneway': 'reversible'}, [(3, .2, 0.), (6, .5, 0.)]),
            (6, {'highway': 'residential'}, [(7, .6, 0.), (8, .6, 0.)]),
        ]
        for item in cases:
            count.add(*item)
            graph.add(*item)
        self.assertEqual(count.nodes, set(graph.finish().osm_ids))
        self.assertEqual(count.nodes, {1, 2, 3, 7, 8})

    def test_limit_is_a_stopped_lower_bound_not_a_truncated_complete_count(self):
        count = BoundedNodeUnion(3)
        count.add(1, {'highway': 'primary'}, [(1, 0., 0.), (2, .1, 0.)])
        with self.assertRaises(LimitReached):
            count.add(2, {'highway': 'primary'}, [(2, .1, 0.), (3, .2, 0.), (4, .3, 0.), (5, .4, 0.)])
        self.assertEqual(count.nodes, {1, 2, 3, 4})
        self.assertEqual(count.witness['osm_node_id'], 4)
        with self.assertRaises(ValueError):
            count.add(3, {'highway': 'footway'}, [(8, 0., 0.), (9, .1, 0.)])
        for limit in (True, 0, 15000001):
            with self.assertRaises(ValueError):
                BoundedNodeUnion(limit)


if __name__ == '__main__':
    unittest.main()
