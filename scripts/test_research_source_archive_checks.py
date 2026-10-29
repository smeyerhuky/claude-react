import copy
import unittest
from research_source_archive_checks import existing_original, require_draft


class ArchiveChecksTests(unittest.TestCase):
    def test_published_or_different_release_is_rejected(self):
        good={'id':1,'tag_name':'research','draft':True,'published_at':None}
        self.assertIs(require_draft(good,1,'research'),good)
        for key,value in [('draft',False),('published_at','2026-10-29'),('id',2),('tag_name','production')]:
            bad=dict(good);bad[key]=value
            with self.assertRaises(ValueError):require_draft(bad,1,'research')

    def test_missing_original_requires_download(self):
        self.assertIsNone(existing_original([],{'filename':'source.pbf'}))

    def test_exact_original_can_be_reused(self):
        e={'filename':'source.pbf','bytes':10,'sha256':'a'*64}
        a={'name':'source.pbf','state':'uploaded','size':10,'digest':'sha256:'+'a'*64,'id':2}
        self.assertEqual(existing_original([a],e)['id'],2)
        for key,value in [('size',11),('state','new'),('digest','sha256:'+'b'*64)]:
            changed=dict(a);changed[key]=value
            with self.assertRaises(ValueError):existing_original([changed],e)
        with self.assertRaises(ValueError):existing_original([a,a],e)
