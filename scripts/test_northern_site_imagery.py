import copy
from io import BytesIO
import json
from pathlib import Path
import unittest
from PIL import Image
import northern_site_imagery as imagery


class NorthernSiteImageryTests(unittest.TestCase):
    def setUp(self):
        self.manifest, self.cases = imagery.frozen()
        self.items = json.loads((imagery.OUTPUT/'items.json').read_bytes())

    def item(self, candidate):
        url = self.manifest['sites'][candidate['id']]['item_url']
        return copy.deepcopy(next(i for i in self.items.values() if imagery.item_url(i['id']) == url))

    def test_actual_acquisition_cannot_be_replaced_by_refresh_overview_or_filename_date(self):
        c = self.cases[0]; original = self.item(c)
        for mutation in ['acquisition', 'year', 'zone', 'resolution', 'collection', 'producer', 'missing']:
            item = copy.deepcopy(original)
            if mutation == 'acquisition': item['properties']['datetime'] = '2026-10-17T16:17:10Z'
            if mutation == 'year': item['properties']['naip:year'] = 2025
            if mutation == 'zone': item['properties']['proj:epsg'] = 4326
            if mutation == 'resolution': item['properties']['gsd'] = .6
            if mutation == 'collection': item['collection'] = 'overview'
            if mutation == 'producer': item['properties']['providers'] = []
            if mutation == 'missing': del item['properties']['datetime']
            with self.assertRaises((ValueError, KeyError), msg=mutation): imagery.validate_item(item, c)

    def test_containing_center_is_insufficient_when_tile_edge_cuts_the_crop(self):
        c = next(c for c in self.cases if c['id'] == 'greeley-tenth')
        item = self.item(c); bbox, _ = imagery.validate_item(item, c)
        center = (bbox[0]+bbox[2])/2
        p = item['properties']; p['proj:bbox'][0] = center-30.; p['proj:transform'][2] = center-30.
        p['proj:bbox'][2] = center-30.+p['proj:shape'][1]*.3
        self.assertLess(p['proj:bbox'][0], center)
        with self.assertRaisesRegex(ValueError, 'Whole crop'): imagery.validate_item(item, c)

    def test_rotated_or_inconsistent_native_scene_grid_is_rejected(self):
        for mutation in ['rotation', 'shape', 'bounds']:
            c = self.cases[0]; item = self.item(c)
            if mutation == 'rotation': item['properties']['proj:transform'][1] = .01
            if mutation == 'shape': item['properties']['proj:shape'][0] -= 1
            if mutation == 'bounds': item['properties']['proj:bbox'][2] += 1.
            with self.assertRaises(ValueError, msg=mutation): imagery.validate_item(item, c)

    def test_wrong_or_signed_asset_and_band_meanings_cannot_supply_the_pixels(self):
        for mutation in ['other-tile', 'signed', 'bands']:
            c = self.cases[0]; item = self.item(c); asset = item['assets']['image']
            if mutation == 'other-tile': asset['href'] = asset['href'].replace('_nw_', '_se_')
            if mutation == 'signed': asset['href'] += '?sig=not-a-real-token'
            if mutation == 'bands': asset['eo:bands'][0]['common_name'] = 'nir'
            with self.assertRaises(ValueError, msg=mutation): imagery.validate_item(item, c)

    def png(self, image):
        stream = BytesIO(); image.save(stream, format='PNG'); return stream.getvalue()

    def test_partial_masks_blank_wrong_size_and_non_images_are_rejected(self):
        image = Image.new('RGBA', (640,640), (70,80,90,255)); image.putpixel((10,10), (71,80,90,255))
        valid = imagery.pixels(self.png(image)); self.assertEqual(valid['valid_pixels'], 409600)
        masked = image.copy(); masked.putpixel((639,639), (1,2,3,0))
        for raw in [self.png(masked), self.png(Image.new('RGBA',(640,640),(70,80,90,255))),
                    self.png(image.resize((639,640))), self.png(image.convert('RGB')), b'{"error":500}']:
            with self.assertRaises(ValueError): imagery.pixels(raw)

    def test_decoded_pixels_bind_observations_without_requiring_png_compression_identity(self):
        image = Image.new('RGBA',(640,640),(10,20,30,255)); image.putpixel((320,320),(80,90,100,255))
        a = BytesIO(); b = BytesIO(); image.save(a,format='PNG',compress_level=0); image.save(b,format='PNG',compress_level=9)
        self.assertNotEqual(a.getvalue(),b.getvalue())
        self.assertEqual(imagery.pixels(a.getvalue()),imagery.pixels(b.getvalue()))
        image.putpixel((320,320),(81,90,100,255))
        self.assertNotEqual(imagery.pixels(a.getvalue()),imagery.pixels(self.png(image)))

    def test_review_cannot_move_to_another_node_scene_date_pixels_or_certified_claim(self):
        c = self.cases[0]; item = self.item(c); actual = self.manifest['sites'][c['id']]['pixels']
        original = json.loads((imagery.OUTPUT/'review.json').read_bytes())['sites'][c['id']]
        imagery.validate_review(original,c,item,actual)
        for mutation in ['candidate','item_id','acquisition_reported_utc','pixel_sha256',
                         'access_certified','grade_certified','current_conditions_verified']:
            review = copy.deepcopy(original)
            if mutation == 'candidate': review[mutation]['node'] += 1
            elif mutation.endswith('certified') or mutation.endswith('verified'): review[mutation] = True
            else: review[mutation] = 'another-evidence-identity'
            with self.assertRaises(ValueError, msg=mutation): imagery.validate_review(review,c,item,actual)

    def test_retained_audit_binds_all_five_existing_candidates_and_keeps_claims_historical(self):
        report = json.loads((imagery.OUTPUT/'report.json').read_bytes())
        self.assertEqual(report['implementation_sha256'],imagery.digest(imagery.__file__))
        for name in ['manifest','items','review']:
            self.assertEqual(report[name+'_sha256'],imagery.digest(imagery.OUTPUT/(name+'.json')))
        self.assertEqual([p['candidate'] for p in report['points']],self.cases)
        self.assertEqual(sum(p['pixels']['valid_pixels'] for p in report['points']),2048000)
        self.assertEqual(len({p['item_id'] for p in report['points']}),3)
        self.assertEqual(report['approved_connectors'],0)
        for flag in ['access_verified','anchors_adopted','geographic_coverage_certified','release_eligible']:
            self.assertIs(report[flag],False)
        for point in report['points']:
            self.assertEqual(point['acquisition_reported_utc'],'2023-09-25T16:00:00Z')
            self.assertEqual(point['coordinate_operation']['stated_datum_accuracy_m'],4.)
            self.assertIs(point['coordinate_operation']['stated_accuracy_is_error_bound'],False)
            self.assertEqual(point['review']['pixel_sha256'],point['pixels']['pixel_sha256'])
            for flag in ['grade_certified','access_verified','anchor_adopted','current_conditions_verified']:
                self.assertIs(point[flag],False)


if __name__ == '__main__': unittest.main()
