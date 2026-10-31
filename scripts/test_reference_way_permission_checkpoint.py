import copy
import json
from pathlib import Path
import tempfile
import unittest
from reference_way_permission_checkpoint import project, REFERENCE


class PermissionCheckpointTests(unittest.TestCase):
    def changed(self, state, mutate):
        with tempfile.TemporaryDirectory() as directory:
            for name in ('colorado', 'arizona'):
                value = json.loads((REFERENCE / (name + '-context.json')).read_text())
                if name == state:
                    mutate(value)
                (Path(directory) / (name + '-context.json')).write_text(json.dumps(value))
            with self.assertRaises(ValueError):
                project(directory)

    def test_original_replay_and_existing_compiler_stays_strict(self):
        report = project()
        self.assertEqual((report['supported_way_projections'], report['unsupported_way_projections']), (3, 4))
        self.assertFalse(report['access_verified'])
        from via_way_compiler_checkpoint import project as original_project
        self.assertTrue(original_project()['negative']['rejected'])

    def test_missing_or_duplicate_or_foreign_vertex_cannot_pass(self):
        self.changed('colorado', lambda c: c['nodes'].pop())
        self.changed('colorado', lambda c: c['nodes'].__setitem__(1, copy.deepcopy(c['nodes'][0])))
        self.changed('arizona', lambda c: c['nodes'][0].__setitem__('id', 999999))

    def test_node_controls_cannot_hide_inside_old_way_only_context(self):
        self.changed('colorado', lambda c: c['nodes'][0]['tags'].__setitem__('access', 'no'))
        self.changed('colorado', lambda c: c['nodes'][0]['tags'].__setitem__('barrier', 'gate'))
        self.changed('colorado', lambda c: c['nodes'][0]['lonlat'].__setitem__(0, -104))

    def test_changed_original_source_or_member_or_approval_rejected(self):
        self.changed('colorado', lambda c: c['source'].__setitem__('sha256', '0' * 64))
        self.changed('arizona', lambda c: c['ways'][0]['tags'].__setitem__('motorcar', 'yes'))
        self.changed('colorado', lambda c: c.__setitem__('access_verified', True))


if __name__ == '__main__':
    unittest.main()
