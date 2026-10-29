import copy
from fractions import Fraction
import json
from pathlib import Path
import unittest

from six_state_checkpoint import REFERENCE, check, load_reference, project


def report_fixture():
    baseline=load_reference();report=json.loads((REFERENCE/'report-audit.json').read_text())
    for key in ['source_provenance','domains_sha256','metric_units','sources','source_qualifying_cbsa_ids','unrepresented_source_qualifying_cbsa_ids','probe_coordinates_lonlat']:
        report[key]=copy.deepcopy(baseline[key])
    for flag in ['access_certified','complete_global_competition','datum_alignment_verified','parent_exterior_coverage_certified','release_eligible','road_coverage_certified']:report[flag]=False
    report['comparisons']=[]
    for key,records in baseline['cases'].items():
        metric,orientation,probe=key.split('|')
        report['comparisons'].append(dict(metric=metric,orientation=orientation,probe=probe,source_costs=[dict(cbsa=cbsa,**values) for cbsa,values in records.items()]))
    return report


class SixStateCheckpointTests(unittest.TestCase):
    def test_complete_separate_reference_and_telemetry_independence(self):
        report=report_fixture();self.assertEqual(check(report)['costs_preserved'],2232)
        report['elapsed_seconds']=999999;report['peak_process_rss_kib']=1
        self.assertEqual(check(report)['finite_queries'],2088)
        self.assertEqual(load_reference()['unreachable_queries'],144)

    def test_altered_old_origin_cannot_hide_behind_a_copied_reference(self):
        report=report_fixture();source=next(s for s in report['sources'] if 'retained_reference_record' in s)
        source['native_origin_lonlat'][0]+=.001
        with self.assertRaisesRegex(ValueError,'Old origin'):project(report)

    def test_missing_or_duplicate_cases_fail(self):
        for duplicate in (False,True):
            report=report_fixture()
            if duplicate:report['comparisons'][-1]=copy.deepcopy(report['comparisons'][0])
            else:report['comparisons'].pop()
            with self.assertRaises(ValueError):project(report)

    def test_valid_fraction_cannot_mask_lost_retained_route(self):
        report=report_fixture();record=next(v for c in report['comparisons'] for v in c['source_costs'] if v['cbsa']=='19740' and v['graph_only_cost'] is not None)
        cost=record['graph_only_cost']+1000000;exact=Fraction.from_float(cost)
        record.update(graph_only_cost=cost,exact_stored_path_cost=[str(exact.numerator),str(exact.denominator)])
        with self.assertRaisesRegex(ValueError,'Retained finite route'):project(report)

    def test_access_approval_or_stale_source_epoch_fail(self):
        for approval in (False,True):
            report=report_fixture()
            if approval:report['sources'][0]['access_verified']=True
            else:report['source_provenance'][0]['replication_timestamp']='2026-10-28T21:23:59Z'
            with self.assertRaises(ValueError):project(report)

    def test_partial_convergence_or_unaccounted_replay_calls_fail(self):
        for field,value in [('converged',False),('local_dijkstra_calls',513),('replay_dijkstra_calls',0)]:
            report=report_fixture();report['local_oracle_runs'][0][field]=value
            with self.assertRaises(ValueError):project(report)

    def test_new_boundary_inventory_or_full_union_claim_fail(self):
        for field,value in [('boundary_vertex_count',177),('flattened_road_union_constructed',True)]:
            report=report_fixture();report['interface_audit'][field]=value
            with self.assertRaises(ValueError):project(report)

if __name__=='__main__':unittest.main()
