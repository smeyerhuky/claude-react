"""Cache only the six exact original routing inputs; cache hits still require SHA checks."""
import hashlib
import json
from fetch_research_source import MANIFEST, entry_for

SOURCES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf')


def cache_key(manifest):
    entries=[entry_for(manifest,n) for n in SOURCES]
    identity=[(r['filename'],r['bytes'],r['sha256']) for r in entries]
    digest=hashlib.sha256(json.dumps(identity,separators=(',',':')).encode()).hexdigest()
    return 'research-original-six-v1-'+digest


if __name__=='__main__':
    print(cache_key(json.loads(MANIFEST.read_text())))
