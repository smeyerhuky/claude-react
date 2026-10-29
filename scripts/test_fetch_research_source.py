import hashlib
import json
from pathlib import Path
import subprocess
import tempfile
import unittest
from unittest.mock import patch
from fetch_research_source import archive_asset, entry_for, recover


class RecoveryTests(unittest.TestCase):
    def setUp(self):
        self.raw=b'exact research bytes'
        self.entry={'filename':'source.pbf','bytes':len(self.raw),'sha256':hashlib.sha256(self.raw).hexdigest(),'source_url':'https://download.geofabrik.de/source.pbf'}
        self.manifest={'schema':'research-original-source-archive-v1','draft_release_id':426327474,'draft_release_tag':'research-sources-20261027-co-nm-az-v1','files':[self.entry]}

    def test_local_match_is_reused_but_corruption_is_not_replaced(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'source.pbf';p.write_bytes(self.raw)
            with patch('fetch_research_source.archive_asset',side_effect=AssertionError('No network needed')):
                self.assertEqual(recover(self.manifest,'source.pbf',p),'verified_local')
            p.write_bytes(b'wrong')
            with self.assertRaises(ValueError):recover(self.manifest,'source.pbf',p)
            self.assertEqual(p.read_bytes(),b'wrong')

    def test_canonical_fallback_still_requires_exact_bytes(self):
        for good in [True,False]:
            with tempfile.TemporaryDirectory() as d:
                p=Path(d)/'source.pbf'
                with patch('fetch_research_source.archive_asset',return_value=None),patch('fetch_research_source.canonical_download',side_effect=lambda e,t:Path(t).write_bytes(self.raw if good else b'corrupt')):
                    if good:self.assertEqual(recover(self.manifest,'source.pbf',p),'canonical')
                    else:
                        with self.assertRaises(ValueError):recover(self.manifest,'source.pbf',p)
                        self.assertFalse(p.exists())

    def test_foreign_published_or_conflicting_archive_is_not_accepted(self):
        r={'id':426327474,'tag_name':self.manifest['draft_release_tag'],'draft':False,'published_at':'2026-10-29','assets':[]}
        with patch('fetch_research_source.subprocess.check_output',return_value=json.dumps(r).encode()):
            with self.assertRaises(ValueError):archive_asset(self.manifest,self.entry)

    def test_unsafe_entry_is_rejected_before_network(self):
        for key,value in [('bytes',2000000000),('source_url','https://example.com/private'),('sha256','0')]:
            original=self.entry[key];self.entry[key]=value
            with self.assertRaises(ValueError):entry_for(self.manifest,'source.pbf')
            self.entry[key]=original
