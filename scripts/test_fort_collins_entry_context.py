import copy
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest
from fort_collins_entry_context import project, REFERENCE


class FortCollinsContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(); self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'context'
        shutil.copytree(REFERENCE, self.root)

    def source(self, name, mutate, rehash=True):
        path = self.root / name
        value = json.loads(path.read_text()); mutate(value)
        path.write_text(json.dumps(value))
        if rehash:
            manifest_path = self.root / 'manifest.json'
            manifest = json.loads(manifest_path.read_text())
            manifest['files'][name].update(sha256=hashlib.sha256(path.read_bytes()).hexdigest(), size_bytes=path.stat().st_size)
            manifest_path.write_text(json.dumps(manifest))

    def test_replay_retains_node_and_conditional_counterexamples_without_approval(self):
        result = project(self.root)
        self.assertEqual(result['raw_context_counts'], dict(ways=40, nodes=187, nearby_tagged_nodes=23, restrictions=1))
        self.assertEqual(result['node_control_counterexample']['reference_way_projection']['status'], 'unsupported')
        self.assertTrue(result['node_control_counterexample']['legacy_way_predicate_accepts'])
        self.assertFalse(result['node_control_counterexample']['real_world_closure_claimed'])
        self.assertFalse(result['conditional_maneuver_evaluated'])
        self.assertEqual(len(result['required_principal_cities']), 2)
        self.assertFalse(result['required_anchor_set_accounted'])
        self.assertTrue(all(f['status'] == 'unknown' for f in result['findings'].values()))
        self.assertFalse(result['access_verified']); self.assertFalse(result['release_eligible'])

    def test_unreviewed_byte_change_rejected(self):
        self.source('office-notice.json', lambda s: s.update(observations=['Altered']), rehash=False)
        with self.assertRaisesRegex(ValueError, 'Evidence bytes changed'):
            project(self.root)

    def test_null_city_direction_cannot_become_two_way(self):
        self.source('streets-context.json', lambda s: next(f for f in s['features'] if f['attributes']['OBJECTID'] == 1179)['attributes'].update(ONEWAY='N'))
        with self.assertRaisesRegex(ValueError, 'old null municipal'):
            project(self.root)

    def test_old_revision_cannot_be_replaced_with_capture_date(self):
        self.source('streets-context.json', lambda s: next(f for f in s['features'] if f['attributes']['OBJECTID'] == 1179)['attributes'].update(REVDATE=1793448000000))
        with self.assertRaisesRegex(ValueError, 'old null municipal'):
            project(self.root)

    def test_bollard_tag_cannot_be_removed_by_rehashing(self):
        self.source('raw-osm-context.json', lambda s: next(n for n in s['nodes'] if n['id'] == 7614361913).update(tags={}))
        with self.assertRaisesRegex(ValueError, 'removable bollard'):
            project(self.root)

    def test_every_selected_raw_node_required_even_if_untagged(self):
        self.source('raw-osm-context.json', lambda s: s['nodes'].pop())
        with self.assertRaisesRegex(ValueError, 'raw-way/node/restriction inventory'):
            project(self.root)

    def test_conditional_relation_cannot_be_discarded_or_made_static(self):
        self.source('raw-osm-context.json', lambda s: s['restrictions'][0].update(tags={'type': 'restriction', 'restriction': 'no_u_turn'}))
        with self.assertRaisesRegex(ValueError, 'exact conditional maneuver'):
            project(self.root)

    def test_gateless_or_free_first_hour_does_not_remove_required_session(self):
        self.source('where-to-park.json', lambda s: s['published_conditions'].update(parking_session_required=False))
        with self.assertRaisesRegex(ValueError, 'conditional public-use terms'):
            project(self.root)

    def test_event_venue_address_cannot_become_garage_entry(self):
        self.source('taste-directions.json', lambda s: s['published_conditions'].update(event_reference_address_is_garage_entry=True))
        with self.assertRaisesRegex(ValueError, 'Event venue address'):
            project(self.root)

    def test_office_address_difference_not_silently_corrected(self):
        self.source('office-notice.json', lambda s: s['published_conditions'].update(corrected_address_selected=True))
        with self.assertRaisesRegex(ValueError, 'office-address disagreement'):
            project(self.root)

    def test_undated_photo_cannot_verify_current_grade(self):
        self.source('photo-observation.json', lambda s: s.update(geometry_or_grade_verified=True))
        with self.assertRaisesRegex(ValueError, 'Undated published image'):
            project(self.root)

    def test_wrong_publisher_or_truncated_response_rejected(self):
        original = json.loads((self.root / 'streets-item.json').read_text())
        self.source('streets-item.json', lambda s: s.update(owner='unrelated_student'))
        with self.assertRaisesRegex(ValueError, 'municipal publisher'):
            project(self.root)
        self.source('streets-item.json', lambda s: (s.clear(), s.update(copy.deepcopy(original))))
        self.source('streets-context.json', lambda s: s.update(exceededTransferLimit=True))
        with self.assertRaisesRegex(ValueError, 'Complete source response'):
            project(self.root)

    def test_finite_city_geometry_required(self):
        self.source('streets-context.json', lambda s: s['features'][0]['geometry']['paths'][0][0].__setitem__(0, float('nan')))
        with self.assertRaisesRegex(ValueError, 'finite complete WGS84'):
            project(self.root)

    def test_candidate_cannot_self_approve_or_replace_loveland(self):
        path = self.root / 'manifest.json'; value = json.loads(path.read_text())
        value['anchor_adopted'] = True; path.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, 'cannot adopt'):
            project(self.root)
        value['anchor_adopted'] = False; value['principal_city_id'] = '0846465'; path.write_text(json.dumps(value))
        with self.assertRaisesRegex(ValueError, 'Fort Collins city'):
            project(self.root)


if __name__ == '__main__':
    unittest.main()
