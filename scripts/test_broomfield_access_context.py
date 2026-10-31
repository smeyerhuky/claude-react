"""Evidence mutation checks must fail even after an audit manifest is rehashed."""
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from broomfield_access_context import DIRECTORY, audit


class EvidenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        for path in DIRECTORY.glob('*.json'):
            shutil.copyfile(path, self.root / path.name)

    def change(self, name, mutate):
        path = self.root / name
        value = json.loads(path.read_text())
        mutate(value)
        path.write_text(json.dumps(value))
        manifest = json.loads((self.root / 'manifest.json').read_text())
        manifest['files'][name]['sha256'] = hashlib.sha256(path.read_bytes()).hexdigest()
        (self.root / 'manifest.json').write_text(json.dumps(manifest))

    def test_retained_audit(self):
        report = audit(self.root)
        self.assertEqual(report['agency_parking_lot_features'], 110)
        self.assertEqual(set(report['findings'].values()), {'unknown'})
        self.assertFalse(report['reference_junction']['adopted'])

    def test_no_self_approval(self):
        path = self.root / 'manifest.json'
        data = json.loads(path.read_text())
        data['access_verified'] = True
        path.write_text(json.dumps(data))
        with self.assertRaisesRegex(ValueError, 'cannot adopt or approve'):
            audit(self.root)

    def test_truncated_query(self):
        self.change('broomfield-streets-context.json', lambda d: d.update(exceededTransferLimit=True))
        with self.assertRaisesRegex(ValueError, 'Truncated'):
            audit(self.root)

    def test_footprint_cannot_become_entry(self):
        def mutate(d):
            next(f for f in d['features'] if f['attributes']['GIS_ID'] == 22443)['attributes']['POSITIONED_METHOD'] = 'Vehicle Entrance'
        self.change('broomfield-addresses-context.json', mutate)
        with self.assertRaisesRegex(ValueError, 'building-footprint'):
            audit(self.root)

    def test_null_direction_cannot_become_two_way(self):
        def mutate(d):
            next(f for f in d['features'] if f['attributes']['FULL_STREETNAME'] == 'Descombes Dr')['attributes']['ONE_WAY'] = 'no'
        self.change('broomfield-streets-context.json', mutate)
        with self.assertRaisesRegex(ValueError, 'direction evidence'):
            audit(self.root)

    def test_raw_name_cannot_grant_permission(self):
        def mutate(d):
            next(n for n in d['tagged_nodes'] if n['id'] == 3417588506)['tags']['motor_vehicle'] = 'yes'
        self.change('raw-osm-context.json', mutate)
        with self.assertRaisesRegex(ValueError, 'Office name'):
            audit(self.root)

    def test_explicit_gate_denial_must_remain(self):
        def mutate(d):
            next(w for w in d['ways'] if w['id'] == 45845852)['tags'].pop('access')
        self.change('raw-osm-context.json', mutate)
        with self.assertRaisesRegex(ValueError, 'Sallyport'):
            audit(self.root)

    def test_fourth_junction_arm_cannot_disappear(self):
        def mutate(d):
            way = next(w for w in d['ways'] if w['id'] == 332347408)
            way['nodes'] = [n for n in way['nodes'] if n[0] != 3428618002]
        self.change('raw-osm-context.json', mutate)
        with self.assertRaisesRegex(ValueError, 'junction incidence'):
            audit(self.root)


if __name__ == '__main__':
    unittest.main()
