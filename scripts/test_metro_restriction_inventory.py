import hashlib
from pathlib import Path
import tempfile
import unittest
from metro_restriction_inventory import summarize, verify_source, MAX_RELATIONS


def row(rid, kind='no_left_turn', **tags):
    return dict(id=rid, tags=dict(type='restriction', restriction=kind, **tags), members=[
        dict(type='w', ref=10, role='from'), dict(type='n', ref=20, role='via'), dict(type='w', ref=30, role='to')])


class RestrictionInventoryTests(unittest.TestCase):
    def test_overlapping_diagnostics_preserve_modes_and_nonstandard_generic_syntax(self):
        a = row(1, **{'restriction:conditional':'no_left_turn @ (Mo-Fr)', 'except':'motorcar'})
        a['members'][1]['type'] = 'w'
        b = row(2, 'no_left_turn @ (Mo-Su 14:00-18:00)')
        c = row(3); del c['tags']['restriction']; c['tags']['restriction:hgv'] = 'no_left_turn'
        result = summarize([a, b, c])
        self.assertEqual(result['raw_restriction_relation_count'], 3)
        self.assertEqual(result['generic_kind_counts'], {'<missing>':1, 'no_left_turn':1, 'no_left_turn @ (Mo-Su 14:00-18:00)':1})
        self.assertEqual(result['overlapping_flag_counts'], dict(via_way=1, conditional_key=1, exception_key=1,
                              missing_generic_kind=1, generic_kind_outside_via_node_probe=1))
        self.assertIn('motorcar', result['example_relations']['exception_key'][0]['tags']['except'])

    def test_order_independent_fingerprint_and_bounded_examples_do_not_truncate_counts(self):
        rows = [row(i, 'no_entry') for i in range(1, 8)]
        forward = summarize(rows); backward = summarize(list(reversed(rows)))
        self.assertEqual(forward, backward)
        self.assertEqual(forward['raw_restriction_relation_count'], 7)
        self.assertEqual(forward['overlapping_flag_counts']['generic_kind_outside_via_node_probe'], 7)
        self.assertEqual([r['id'] for r in forward['example_relations']['generic_kind_outside_via_node_probe']], [1,2,3])
        rows[-1]['tags']['except'] = 'bus'
        self.assertNotEqual(forward['all_selected_relation_projection_sha256'], summarize(rows)['all_selected_relation_projection_sha256'])

    def test_budget_duplicates_and_altered_original_are_errors(self):
        with self.assertRaises(ValueError): summarize([row(1), row(1)])
        with self.assertRaisesRegex(ValueError, 'budget'): summarize([row(1)]*(MAX_RELATIONS+1))
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder)/'synthetic.pbf'; path.write_bytes(b'synthetic')
            identity = dict(size_bytes=9, sha256=hashlib.sha256(b'synthetic').hexdigest())
            verify_source(path, identity)
            path.write_bytes(b'changed!!')
            with self.assertRaisesRegex(ValueError, 'hash'): verify_source(path, identity)


if __name__ == '__main__': unittest.main()
