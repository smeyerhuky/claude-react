import copy
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import unittest

from larimer_census_water_mask import OUTPUT, audit, encoded, source_reader, SOURCES


class LarimerCensusMaskTests(unittest.TestCase):
    def test_retained_source_mask_replays_without_access_claims(self):
        report = audit()
        self.assertEqual(report, json.loads((OUTPUT/'report.json').read_bytes()))
        self.assertEqual(report['mask']['pixel_counts'],
                         {'land_nonwater': 6211, 'water_excluded': 1289, 'outside_supplied_land': 0})
        self.assertEqual(sum(report['mask']['pixel_counts'].values()), 7500)
        self.assertFalse(report['roads_or_connectors_evaluated'])
        self.assertFalse(report['release_eligible'])
        self.assertFalse(report['original_source_replayed'])
        self.assertFalse(report['mask']['input_completeness_certified'])
        self.assertFalse(report['probes']['city_park_lake']['mask_cell_candidate_nonwater'])

    def test_missing_or_modified_water_cannot_become_land(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)/'mask'; shutil.copytree(OUTPUT, root)
            path = root/'water.geojson'; data = json.loads(path.read_bytes())
            data['features'].pop(); path.write_bytes(encoded(data))
            with self.assertRaisesRegex(ValueError, 'geometry bytes'):
                audit(root)
            manifest = json.loads((root/'manifest.json').read_bytes())
            manifest['derived_sha256']['water.geojson'] = hashlib.sha256(path.read_bytes()).hexdigest()
            (root/'manifest.json').write_bytes(encoded(manifest))
            with self.assertRaisesRegex(ValueError, 'feature inventory'):
                audit(root)
            path.unlink()
            with self.assertRaises(FileNotFoundError):
                audit(root)

    def test_source_vintage_crs_or_claim_changes_are_rejected(self):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)/'mask'; shutil.copytree(OUTPUT, root)
            original = json.loads((root/'manifest.json').read_bytes())
            for mutate in (lambda d: d.update(vintage=2024), lambda d: d.update(selection='vertex-only'),
                           lambda d: d.update(approved=True), lambda d: d['sources']['water'].update(sha256='0'*64),
                           lambda d: d['coordinate_operation'].update(source_crs='EPSG:4326'),
                           lambda d: d.update(selected_water_records=278),
                           lambda d: d.update(release_eligible=True),
                           lambda d: d.update(input_completeness_certified=True)):
                data = copy.deepcopy(original); mutate(data)
                (root/'manifest.json').write_bytes(encoded(data))
                with self.assertRaisesRegex(ValueError, 'provenance'):
                    audit(root)

    def test_water_contact_cells_cannot_be_reduced_to_center_tests(self):
        from shapely.geometry import Point
        from colorado_geographic_mask import _load_polygon_file
        from larimer_census_water_mask import BOUNDS, WIDTH, HEIGHT
        report = audit(); water, _, _ = _load_polygon_file(OUTPUT/'water.geojson', 'Water')
        # This is an independent scalar predicate on cell centers. It is not a
        # second water source or a proof that unmapped water is absent.
        shoreline_cells = 0
        for row, values in enumerate(report['mask']['land_mask']):
            for column, nonwater in enumerate(values):
                center = Point(BOUNDS[0]+(column+0.5)*(BOUNDS[2]-BOUNDS[0])/WIDTH,
                               BOUNDS[3]-(row+0.5)*(BOUNDS[3]-BOUNDS[1])/HEIGHT)
                if not nonwater and not water.intersects(center):
                    shoreline_cells += 1
        self.assertGreater(shoreline_cells, 100)

    def test_original_archive_identity_is_checked_before_parsing(self):
        with tempfile.TemporaryDirectory() as temporary:
            path = Path(temporary)/SOURCES['water']['name']; path.write_bytes(b'not a shapefile zip')
            with self.assertRaisesRegex(ValueError, 'pinned Census original'):
                source_reader(path, SOURCES['water'])
