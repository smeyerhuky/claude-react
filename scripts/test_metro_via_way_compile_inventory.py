import copy
import json
import unittest
from metro_via_way_compile_inventory import classify,classify_all,code_identities,verify_code_bindings,CODE_INPUTS
from via_way_compiler_checkpoint import REFERENCE


def context(state):
    raw=json.loads((REFERENCE/(state+'-context.json')).read_text())
    # Pure topology, with actual profile tags: no coordinates or cost placeholders.
    ways={w['id']:dict(id=w['id'],tags=w['tags'],nodes=[[p[0]] for p in w['nodes']]) for w in raw['ways']}
    return raw['restrictions'][0],ways


class ViaWaySupportInventoryTests(unittest.TestCase):
    def test_raw_positive_and_negative_need_no_fabricated_route_costs(self):
        relation,ways=context('colorado')
        self.assertEqual(classify(relation,ways),dict(status='compiled_declared_shape',pattern_arc_count=3))
        relation,ways=context('arizona')
        result=classify(relation,ways)
        self.assertEqual(result['status'],'rejected');self.assertIn('Conditional member-way',result['reason'])
        self.assertNotIn('cost',result)

    def test_every_candidate_including_missing_mixed_and_oversized_is_accounted(self):
        relation,ways=context('colorado');mixed=copy.deepcopy(relation);mixed['id']=999
        mixed['members'][1]['type']='n'
        missing=copy.deepcopy(relation);missing['id']=998;missing['members'][0]['ref']=123456789
        result=classify_all([relation,mixed,missing],ways)
        self.assertEqual(result['raw_via_way_relations'],3)
        self.assertEqual(result['compiled_declared_shape_count'],1)
        self.assertEqual(result['rejected_relation_count'],2)
        self.assertEqual(sum(result['first_rejection_reason_counts'].values()),2)
        self.assertEqual(classify(relation,ways,{800937106}),dict(status='rejected',reason='Raw member way exceeds declared node budget'))
        with self.assertRaises(ValueError):classify_all([relation,relation],ways)

    def test_altered_compiler_dependency_invalidates_frozen_count_binding(self):
        from pathlib import Path
        import tempfile
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            for name in CODE_INPUTS:
                path=root/name;path.parent.mkdir(parents=True,exist_ok=True);path.write_text('synthetic dependency')
            report=dict(schema='state-via-way-compiler-inventory-v2',compiler_code_sha256=code_identities(root))
            verify_code_bindings(report,root)
            (root/'scripts/road_via_way_compile.py').write_text('changed profile')
            with self.assertRaisesRegex(ValueError,'profile changed'):verify_code_bindings(report,root)

    def test_order_independent_counts_and_bounded_samples_preserve_full_totals(self):
        relation,ways=context('colorado')
        rows=[{**copy.deepcopy(relation),'id':n} for n in range(1,8)]
        forward=classify_all(rows,ways);reverse=classify_all(list(reversed(rows)),ways)
        self.assertEqual(forward,reverse)
        self.assertEqual(forward['compiled_declared_shape_count'],7)
        self.assertEqual(forward['total_compiled_pattern_arcs'],21)
        examples=forward['example_relation_results']['compiled_declared_shape']
        self.assertEqual([r['relation_id'] for r in examples],[1,2,3])


if __name__=='__main__':unittest.main()
