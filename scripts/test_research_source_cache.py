import copy
import json
import unittest
from fetch_research_source import MANIFEST
from research_source_cache import cache_key


class SourceCacheTests(unittest.TestCase):
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
