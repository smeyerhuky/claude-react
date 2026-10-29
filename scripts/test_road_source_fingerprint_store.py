import hashlib
import unittest
from road_source_fingerprint_store import DiskFingerprintStore


class DiskFingerprintTests(unittest.TestCase):
    def test_duplicate_match_conflict_and_record_cap(self):
        with DiskFingerprintStore(max_records=1) as store:
            digest=hashlib.sha256(b'original').digest()
            self.assertTrue(store.register(123,digest))
            self.assertFalse(store.register(123,digest))
            self.assertEqual(store.count,1)
            with self.assertRaises(ValueError):store.register(124,digest)
            with self.assertRaises(ValueError):store.register(123,digest)
        with DiskFingerprintStore() as store:
            store.register(123,digest)
            with self.assertRaises(ValueError):store.register(123,hashlib.sha256(b'changed').digest())

    def test_disk_cap_fails_without_resume(self):
        with DiskFingerprintStore(max_records=10000,max_disk_bytes=40960,cache_mib=1) as store:
            with self.assertRaises(ValueError):
                for way in range(1,10000):store.register(way,hashlib.sha256(str(way).encode()).digest())
            self.assertLessEqual(store.path.stat().st_size,40960)
            with self.assertRaises(ValueError):store.register(1,b'0'*32)

    def test_invalid_identity_and_limits_rejected(self):
        for kwargs in ({'max_records':10000001},{'max_disk_bytes':1000000001},{'cache_mib':65}):
            with self.assertRaises(ValueError):DiskFingerprintStore(**kwargs)
        with DiskFingerprintStore() as store:
            with self.assertRaises(ValueError):store.register(True,b'0'*32)


if __name__=='__main__':unittest.main()
