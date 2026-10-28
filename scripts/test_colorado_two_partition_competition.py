from pathlib import Path
import shutil
import tempfile
import unittest
from unittest.mock import patch

import colorado_two_partition_competition as module
from colorado_raw_boundary_interfaces import fingerprint
from road_primitive_sparse import PrimitiveSparseBuilder


class PartitionSourceTests(unittest.TestCase):
    def test_passed_reference_and_tampered_checkpoint(self):
        manifest, domains, baseline = module.load_reference()
        self.assertEqual(len(baseline['sources']), 18)
        self.assertEqual(len(domains['source_qualifying_cbsa_ids']), 367)
        self.assertEqual(len(manifest['source_provenance']), 5)
        with tempfile.TemporaryDirectory() as d:
            root = Path(d)
            for name in ('manifest.json', 'baseline.json'):
                shutil.copyfile(module.REFERENCE.parent/name, root/name)
            with (root/'baseline.json').open('a') as f:
                f.write(' ')
            with patch.object(module, 'REFERENCE', root/'manifest.json'):
                with self.assertRaises(ValueError):
                    module.load_reference()

    def test_cross_shard_private_tag_disagreement_and_per_file_duplicates_fail(self):
        points = [(1, 0., 0.), (2, .1, 0.)]
        tags = {'highway': 'primary'}
        other = {1: fingerprint(1, tags, points)}
        scan = module.OverlapScan(PrimitiveSparseBuilder(), other)
        with self.assertRaises(ValueError):
            scan.add(1, {**tags, 'access': 'private'}, points)
        scan = module.OverlapScan(PrimitiveSparseBuilder(), other)
        scan.add(1, tags, points)
        self.assertEqual(scan.shared, {1})
        with self.assertRaises(ValueError):
            scan.add(1, tags, points)


if __name__ == '__main__':
    unittest.main()
