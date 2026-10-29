"""Disk-backed original-way identity audit with explicit memory/disk/count caps."""
from pathlib import Path
import sqlite3
import tempfile


class DiskFingerprintStore:
    def __init__(self, *, max_records=10000000, max_disk_bytes=1000000000, cache_mib=64):
        if type(max_records) is not int or not 1<=max_records<=10000000:
            raise ValueError('Bounded aggregate raw-record budget required')
        if type(max_disk_bytes) is not int or not 16384<=max_disk_bytes<=1000000000:
            raise ValueError('Bounded fingerprint disk budget required')
        if type(cache_mib) is not int or not 1<=cache_mib<=64:
            raise ValueError('Bounded fingerprint page-cache budget required')
        self.directory=tempfile.TemporaryDirectory(prefix='road-fingerprint-audit-')
        self.path=Path(self.directory.name)/'ways.sqlite'
        self.db=sqlite3.connect(self.path)
        self.db.execute('PRAGMA page_size=4096')
        # Scratch-only database: a failed/interrupted audit is discarded, never resumed.
        self.db.execute('PRAGMA journal_mode=OFF')
        self.db.execute('PRAGMA synchronous=OFF')
        self.db.execute('PRAGMA temp_store=FILE')
        self.db.execute('PRAGMA cache_size=-'+str(cache_mib*1024))
        self.db.execute('PRAGMA max_page_count='+str(max_disk_bytes//4096))
        self.db.execute('CREATE TABLE ways (id INTEGER PRIMARY KEY, digest BLOB NOT NULL)')
        self.db.commit()
        self.max_records=max_records;self.count=0;self.failed=self.closed=False

    def register(self, way, digest):
        if self.failed or self.closed:raise ValueError('Cannot resume failed/closed fingerprint audit')
        try:
            if type(way) is not int or not 0<way<=2**63-1 or type(digest) is not bytes or len(digest)!=32:
                raise ValueError('Original signed-64-bit way ID and SHA256 bytes required')
            if self.count>=self.max_records:
                row=self.db.execute('SELECT digest FROM ways WHERE id=?',(way,)).fetchone()
                if row is None:raise ValueError('Aggregate raw fingerprint record budget exceeded')
            else:
                cursor=self.db.execute('INSERT OR IGNORE INTO ways VALUES (?,?)',(way,digest))
                if cursor.rowcount:
                    self.count+=1
                    if self.count%10000==0:self.db.commit()
                    return True
                row=self.db.execute('SELECT digest FROM ways WHERE id=?',(way,)).fetchone()
            if row[0]!=digest:raise ValueError('Raw original way fingerprint disagreement')
            return False
        except sqlite3.Error as exc:
            self.failed=True
            raise ValueError('Fingerprint disk audit failed within its configured budget') from exc
        except Exception:
            self.failed=True
            raise

    def close(self):
        if not self.closed:
            try:
                if self.failed:self.db.rollback()
                else:self.db.commit()
                self.final_size_bytes=self.path.stat().st_size
            finally:
                self.db.close();self.directory.cleanup();self.closed=True

    def __enter__(self):return self
    def __exit__(self,*args):self.close()
