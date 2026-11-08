"""Cache exact original routing inputs by explicit scope; always recheck hashes."""
import hashlib
import json
from fetch_research_source import MANIFEST, entry_for

SOURCES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf')
SOURCE_SETS={'six':SOURCES,'eight':SOURCES+('wyoming.osm.pbf','nevada.osm.pbf')}
CACHE_BYTE_LIMITS={'six':1500000000,'eight':1700000000}


def cache_key(manifest, *, scope='six'):
    if type(scope) is not str or scope not in SOURCE_SETS:raise ValueError('Explicit supported source-cache scope required')
    entries=[entry_for(manifest,n) for n in SOURCE_SETS[scope]]
    if sum(r['bytes'] for r in entries)>CACHE_BYTE_LIMITS[scope]:raise ValueError('Original-source cache exceeds its byte budget')
    identity=[(r['filename'],r['bytes'],r['sha256']) for r in entries]
    digest=hashlib.sha256(json.dumps(identity,separators=(',',':')).encode()).hexdigest()
    return 'research-original-'+scope+'-v1-'+digest


if __name__=='__main__':
    print(cache_key(json.loads(MANIFEST.read_text())))
