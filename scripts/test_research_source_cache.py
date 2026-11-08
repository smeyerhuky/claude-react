import copy
import json
import unittest
from fetch_research_source import MANIFEST
from research_source_cache import cache_key


class SourceCacheTests(unittest.TestCase):
    def test_default_six_input_key_remains_compatible(self):
        m=json.loads(MANIFEST.read_text())
        expected='research-original-six-v1-79de77c45341b57589a70e3b73d7d99a7c7d2e1875a9edd721bbddc0917c48c4'
        self.assertEqual(cache_key(m),expected)
        self.assertEqual(cache_key(m,scope='six'),expected)

    def test_eight_input_key_binds_wyoming_and_nevada_without_changing_six(self):
        for name in ('wyoming.osm.pbf','nevada.osm.pbf'):
            with self.subTest(source=name):
                m=json.loads(MANIFEST.read_text());six=cache_key(m);eight=cache_key(m,scope='eight')
                self.assertTrue(eight.startswith('research-original-eight-v1-'))
                next(r for r in m['files'] if r['filename']==name)['sha256']='a'*64
                self.assertEqual(cache_key(m),six)
                self.assertNotEqual(cache_key(m,scope='eight'),eight)

    def test_eight_scope_requires_complete_unique_original_entries(self):
        for mode in ('missing','duplicate'):
            with self.subTest(mode=mode):
                m=json.loads(MANIFEST.read_text());row=next(r for r in m['files'] if r['filename']=='wyoming.osm.pbf')
                if mode=='missing':m['files'].remove(row)
                else:m['files'].append(copy.deepcopy(row))
                with self.assertRaises(ValueError):cache_key(m,scope='eight')

    def test_eight_scope_has_its_own_aggregate_byte_budget(self):
        m=json.loads(MANIFEST.read_text())
        next(r for r in m['files'] if r['filename']=='wyoming.osm.pbf')['bytes']=1000000000
        with self.assertRaisesRegex(ValueError,'byte budget'):cache_key(m,scope='eight')

    def test_unknown_or_untyped_scope_is_not_inferred(self):
        m=json.loads(MANIFEST.read_text())
        for scope in ('all','seven',None,True,[]):
            with self.subTest(scope=scope):
                with self.assertRaisesRegex(ValueError,'supported source-cache scope'):cache_key(m,scope=scope)

    def test_unrelated_archive_addition_does_not_invalidate_original_inputs(self):
        m=json.loads(MANIFEST.read_text());old=cache_key(m);m['manifest_revision']+=1
        m['files'].append({'filename':'other.pbf','bytes':1,'sha256':'b'*64,'source_url':'https://download.geofabrik.de/other.pbf'})
        self.assertEqual(cache_key(m),old)
        m['files'][0]['sha256']='a'*64
        self.assertNotEqual(cache_key(m),old)

    def test_duplicate_named_source_fails(self):
        m=json.loads(MANIFEST.read_text());m['files'].append(copy.deepcopy(m['files'][0]))
        with self.assertRaises(ValueError):cache_key(m)

    def test_aggregate_cache_budget_is_bounded(self):
        m=json.loads(MANIFEST.read_text());m['files'][0]['bytes']=1900000000
        with self.assertRaises(ValueError):cache_key(m)
