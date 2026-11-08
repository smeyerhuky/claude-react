from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from metro_graph_bundle_contract import (SCHEMA, FALSE_FLAGS, BINDINGS, MAX_SOURCES, MAX_SOURCE_BYTES,
    MAX_MANIFEST_BYTES, canonical, sha256, validate, verify_expected, verify_source_bytes,
    verify_retained_inputs, bind_query, read_document)
from metro_graph_bundle_checkpoint import build, OUTPUT


def fixture():
    return dict(schema=SCHEMA, research_only=True,
                osm_sources=[dict(name=name + '.osm.pbf', sha256=sha256(data), size_bytes=len(data),
                                  replication_timestamp='2026-10-27T21:23:59Z')
                             for name, data in [('alpha', b'alpha'), ('beta', b'beta')]],
                bindings={key: sha256(key.encode()) for key in BINDINGS},
                historical_scenario=dict(scenario_id='synthetic-historical-test-v1',
                                         fixed_reference_scenario_applied=False,
                                         fixed_reference_scenario_sha256=None),
                retained_inputs={'docs/input.json': sha256(b'{}')},
                **{key: False for key in FALSE_FLAGS})


class GraphBundleTests(unittest.TestCase):
    def setUp(self):
        self.bundle = fixture()
        self.expected = sha256(canonical(self.bundle))
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for name, value in [('alpha', b'alpha'), ('beta', b'beta')]:
            (self.root / (name + '.osm.pbf')).write_bytes(value)
        (self.root / 'docs').mkdir()
        (self.root / 'docs/input.json').write_bytes(b'{}')

    def test_metadata_verification_does_not_claim_original_bytes_or_release(self):
        before = deepcopy(self.bundle)
        result = verify_expected(self.bundle, self.expected)
        self.assertEqual(result['osm_input_files'], 2)
        self.assertEqual(result['declared_osm_bytes'], 9)
        self.assertFalse(result['source_bytes_verified'])
        self.assertTrue(all(result[key] is False for key in FALSE_FLAGS))
        self.assertEqual(self.bundle, before)

    def test_omitted_renamed_rehashed_or_changed_source_cannot_match_selected_bundle(self):
        for change in ('omit', 'rename', 'rehash', 'timestamp', 'origin', 'graph-policy'):
            with self.subTest(change=change):
                value = deepcopy(self.bundle)
                if change == 'omit':
                    value['osm_sources'].pop()
                elif change == 'rename':
                    value['osm_sources'][1]['name'] = 'gamma.osm.pbf'
                elif change == 'rehash':
                    value['osm_sources'][1]['sha256'] = 'a' * 64
                elif change == 'timestamp':
                    value['osm_sources'][1]['replication_timestamp'] = '2026-11-08T00:00:00Z'
                else:
                    key = 'native_origin_records_sha256' if change == 'origin' else 'retained_graph_policy_sha256'
                    value['bindings'][key] = 'a' * 64
                with self.assertRaisesRegex(ValueError, 'selected expected identity'):
                    verify_expected(value, self.expected)

    def test_duplicate_names_or_content_cannot_double_count_inputs(self):
        for field in ('name', 'sha256'):
            with self.subTest(field=field):
                value = deepcopy(self.bundle)
                value['osm_sources'][1][field] = value['osm_sources'][0][field]
                with self.assertRaisesRegex(ValueError, 'unique source names'):
                    validate(value)

    def test_noncanonical_source_order_and_empty_input_set_are_rejected(self):
        self.bundle['osm_sources'].reverse()
        with self.assertRaisesRegex(ValueError, 'Sorted unique'):
            validate(self.bundle)
        self.bundle['osm_sources'] = []
        with self.assertRaisesRegex(ValueError, 'nonempty OSM'):
            validate(self.bundle)

    def test_source_names_cannot_be_urls_or_escape_paths(self):
        for name in ('../alpha.osm.pbf', '/alpha.osm.pbf', 'https://example.com/a.osm.pbf',
                     'alpha\\beta.osm.pbf', 'alpha\n.osm.pbf'):
            with self.subTest(name=name):
                value = deepcopy(self.bundle); value['osm_sources'][0]['name'] = name
                with self.assertRaisesRegex(ValueError, 'Safe basename'):
                    validate(value)

    def test_resource_limits_and_integer_sizes_fail_before_reading_sources(self):
        for size in (True, 0, -1, 1.0, MAX_SOURCE_BYTES + 1):
            with self.subTest(size=size):
                value = deepcopy(self.bundle); value['osm_sources'][0]['size_bytes'] = size
                with self.assertRaisesRegex(ValueError, 'bounded integer source size'):
                    validate(value)
        self.bundle['osm_sources'] *= MAX_SOURCES
        with self.assertRaisesRegex(ValueError, 'Bounded nonempty'):
            validate(self.bundle)

    def test_invalid_replication_dates_are_not_silently_normalized(self):
        for stamp in ('2026-02-30T00:00:00Z', '2026-10-27', '2026-10-27T21:23:59+00:00'):
            with self.subTest(stamp=stamp):
                value = deepcopy(self.bundle); value['osm_sources'][0]['replication_timestamp'] = stamp
                with self.assertRaises(ValueError):
                    validate(value)

    def test_aggregate_declared_byte_budget_is_checked_separately_from_each_file(self):
        self.bundle['osm_sources'] = [dict(name=f'source-{i:02d}.osm.pbf', sha256=sha256(str(i).encode()),
            size_bytes=MAX_SOURCE_BYTES, replication_timestamp='2026-10-27T21:23:59Z') for i in range(33)]
        with self.assertRaisesRegex(ValueError, 'Aggregate OSM byte budget'):
            validate(self.bundle)

    def test_approval_or_fixed_scenario_claim_cannot_be_added_even_with_new_hash(self):
        for key in FALSE_FLAGS:
            with self.subTest(key=key):
                value = deepcopy(self.bundle); value[key] = True
                with self.assertRaisesRegex(ValueError, 'cannot assert approval'):
                    verify_expected(value, sha256(canonical(value)))
        self.bundle['historical_scenario'].update(fixed_reference_scenario_applied=True,
                                                  fixed_reference_scenario_sha256='a' * 64)
        with self.assertRaisesRegex(ValueError, 'Historical costs cannot claim'):
            validate(self.bundle)

    def test_only_complete_matching_source_bytes_return_verification(self):
        result = verify_source_bytes(self.bundle, self.root, expected_bundle_sha256=self.expected)
        self.assertEqual(result['verified_osm_input_files'], 2)
        self.assertTrue(result['source_bytes_verified'])
        for flag in ('replication_header_replayed', 'graph_rebuilt', 'access_verified', 'anchors_adopted', 'release_eligible'):
            self.assertFalse(result[flag])

    def test_partial_source_directory_cannot_verify_a_subset(self):
        (self.root / 'beta.osm.pbf').unlink()
        with self.assertRaisesRegex(ValueError, 'Original source missing'):
            verify_source_bytes(self.bundle, self.root, expected_bundle_sha256=self.expected)

    def test_same_size_source_tampering_is_detected(self):
        (self.root / 'alpha.osm.pbf').write_bytes(b'ALPHA')
        with self.assertRaisesRegex(ValueError, 'fingerprint changed'):
            verify_source_bytes(self.bundle, self.root, expected_bundle_sha256=self.expected)

    def test_source_size_change_is_detected_before_hashing(self):
        (self.root / 'beta.osm.pbf').write_bytes(b'changed-size')
        with self.assertRaisesRegex(ValueError, 'byte count changed'):
            verify_source_bytes(self.bundle, self.root, expected_bundle_sha256=self.expected)

    def test_source_symlink_outside_selected_directory_is_rejected(self):
        inside = self.root / 'nested'; inside.mkdir()
        for source in self.bundle['osm_sources']:
            (inside / source['name']).symlink_to(self.root / source['name'])
        with self.assertRaisesRegex(ValueError, 'outside source directory'):
            verify_source_bytes(self.bundle, inside, expected_bundle_sha256=self.expected)

    def test_retained_input_tampering_or_escape_is_rejected(self):
        self.assertFalse(verify_retained_inputs(self.bundle, self.root)['source_bytes_verified'])
        (self.root / 'docs/input.json').write_bytes(b'altered')
        with self.assertRaisesRegex(ValueError, 'Retained input bytes changed'):
            verify_retained_inputs(self.bundle, self.root)
        self.bundle['retained_inputs'] = {'../outside.json': 'a' * 64}
        with self.assertRaisesRegex(ValueError, 'repository-local'):
            validate(self.bundle)

    def test_query_metric_and_direction_remain_separate_with_correct_units(self):
        for metric, unit in [('length', 'meters'), ('travel_time', 'seconds')]:
            for direction in ('metro-to-location', 'location-to-metro'):
                with self.subTest(metric=metric, direction=direction):
                    row = bind_query(self.bundle, expected_bundle_sha256=self.expected,
                        bindings=self.bundle['bindings'], scenario_id='synthetic-historical-test-v1',
                        metric=metric, direction=direction)
                    self.assertEqual((row['metric'], row['direction'], row['unit']), (metric, direction, unit))
                    self.assertFalse(row['release_eligible'])
                    self.assertFalse(row['connector_costs_included'])

    def test_query_cannot_mix_graph_origin_domain_endpoint_or_scenario(self):
        for key in BINDINGS:
            with self.subTest(key=key):
                bindings = deepcopy(self.bundle['bindings']); bindings[key] = 'a' * 64
                with self.assertRaisesRegex(ValueError, 'Query graph/origin/domain/endpoint'):
                    bind_query(self.bundle, expected_bundle_sha256=self.expected, bindings=bindings,
                        scenario_id='synthetic-historical-test-v1', metric='length', direction='metro-to-location')
        with self.assertRaisesRegex(ValueError, 'Query scenario differs'):
            bind_query(self.bundle, expected_bundle_sha256=self.expected, bindings=self.bundle['bindings'],
                scenario_id='new-fixed-departure', metric='length', direction='metro-to-location')

    def test_unknown_query_metrics_or_directions_are_not_assumed(self):
        for metric, direction in [('distance', 'metro-to-location'), ('length', 'reverse'), (None, None)]:
            with self.subTest(metric=metric, direction=direction):
                with self.assertRaisesRegex(ValueError, 'Explicit supported metric and direction'):
                    bind_query(self.bundle, expected_bundle_sha256=self.expected, bindings=self.bundle['bindings'],
                        scenario_id='synthetic-historical-test-v1', metric=metric, direction=direction)

    def test_unknown_fields_and_duplicate_json_keys_are_rejected(self):
        self.bundle['approved_by'] = 'self'
        with self.assertRaisesRegex(ValueError, 'Exact research-only'):
            validate(self.bundle)
        path = self.root / 'ambiguous.json'; path.write_text('{"release_eligible":true,"release_eligible":false}')
        with self.assertRaisesRegex(ValueError, 'Duplicate JSON key'):
            read_document(path)

    def test_manifest_read_budget_and_nonfinite_json_fail_closed(self):
        path = self.root / 'manifest.json'; path.write_bytes(b' ' * (MAX_MANIFEST_BYTES + 1))
        with self.assertRaisesRegex(ValueError, 'byte budget'):
            read_document(path)
        path.write_text('{"value":NaN}')
        with self.assertRaisesRegex(ValueError, 'Nonfinite JSON'):
            read_document(path)

    def test_frozen_eight_file_33_origin_checkpoint_reproduces_without_source_byte_claims(self):
        bundle, report = build()
        self.assertEqual(bundle, json.loads((OUTPUT / 'bundle.json').read_text()))
        self.assertEqual(report, json.loads((OUTPUT / 'report.json').read_text()))
        self.assertEqual((len(bundle['osm_sources']), report['native_metro_origins'], report['costs']), (8, 33, 2508))
        self.assertEqual((report['finite_costs'], report['modeled_nodata_costs']), (2356, 152))
        self.assertFalse(report['source_bytes_verified'])
        self.assertFalse(report['fixed_reference_scenario_applied'])
        self.assertFalse(report['release_eligible'])


if __name__ == '__main__':
    unittest.main()
