import copy
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from cheyenne_checkpoint import REFERENCE,check_frozen,load_reference32,project


class CheyenneCheckpointTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.report=json.loads((REFERENCE/'source-report.json').read_text())

    def test_frozen_costs_match_every_retained_native_replay(self):
        result=check_frozen()
        self.assertEqual(result,project(self.report))
        self.assertEqual((result['finite_queries'],result['unreachable_queries']),(2160,144))
        self.assertEqual((len(result['sources']),len(result['cases'])),(32,72))

    def test_incomplete_costs_or_claimed_approval_are_rejected(self):
        for mutation in ('missing_cost','approved_source','approved_coverage'):
            with self.subTest(mutation=mutation):
                r=copy.deepcopy(self.report)
                if mutation=='missing_cost':r['comparisons'][0]['source_costs'].pop()
                elif mutation=='approved_source':r['sources'][0]['access_verified']=True
                else:r['complete_global_competition']=True
                with self.assertRaises(ValueError):project(r)

    def test_retained_cost_increase_cannot_be_hidden_by_exact_cost_field(self):
        r=copy.deepcopy(self.report)
        row=next(x for c in r['comparisons'] for x in c['source_costs'] if x['cbsa']=='19740' and x['graph_only_cost'] is not None)
        row['graph_only_cost']+=1000000;value=Fraction(row['graph_only_cost'])
        row['exact_stored_path_cost']=[str(value.numerator),str(value.denominator)]
        with self.assertRaisesRegex(ValueError,'Retained route lost or increased'):project(r)

    def test_broken_native_joins_and_raised_resource_limits_are_rejected(self):
        for mutation in ('broken_leg','boundary_limit','call_limit','source_bytes'):
            with self.subTest(mutation=mutation):
                r=copy.deepcopy(self.report)
                if mutation=='broken_leg':
                    row=next(x for c in r['comparisons'] for x in c['source_costs'] if x['segments'])
                    row['segments'][0][1]=999999999
                elif mutation=='boundary_limit':r['interface_audit']['boundary_vertex_limit']=193
                elif mutation=='call_limit':r['local_oracle_runs'][0]['local_dijkstra_calls']=513
                else:r['source_provenance'][0]['sha256']='0'*64
                with self.assertRaises(ValueError):project(r)

    def test_rehashed_snapshot_cannot_disagree_with_independent_replay(self):
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            for name in ('manifest.json','baseline.json','source-report.json'):(root/name).write_bytes((REFERENCE/name).read_bytes())
            baseline=load_reference32(root);baseline['finite_queries']-=1;baseline['unreachable_queries']+=1
            raw=(json.dumps(baseline,sort_keys=True)+'\n').encode();(root/'baseline.json').write_bytes(raw)
            manifest=json.loads((root/'manifest.json').read_text());manifest['baseline_sha256']=hashlib.sha256(raw).hexdigest();(root/'manifest.json').write_text(json.dumps(manifest))
            with self.assertRaisesRegex(ValueError,'costs differ'):check_frozen(root)
