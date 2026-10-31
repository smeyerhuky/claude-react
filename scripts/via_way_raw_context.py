"""Reproduce exact raw member-way context for one positive and one rejected case."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT/'docs/research/census-33-source-checkpoint/baseline.json'
CASES = {'colorado': dict(relation=2516794,ways={800937106,186839303,800937105}),
         'arizona': dict(relation=2451750,ways={123445153,1340007750,437327478,437327483})}


def extract(state, source):
    spec = CASES[state]
    identity = next(s for s in json.loads(BASELINE.read_text())['source_provenance'] if s['name'] == state+'.osm.pbf')
    def verify():
        if source.stat().st_size != identity['size_bytes']: raise ValueError('Exact original source size required')
        with source.open('rb') as handle: digest = hashlib.file_digest(handle,'sha256').hexdigest()
        if digest != identity['sha256']: raise ValueError('Exact original source hash required')
    verify()
    class Reader(osmium.SimpleHandler):
        def __init__(self): super().__init__(); self.ways=[]; self.restrictions=[]
        def way(self,way):
            if way.id not in spec['ways']: return
            if not 2 <= len(way.nodes) <= 1000 or any(not n.location.valid() for n in way.nodes):
                raise ValueError('Missing/budget-exceeding raw member geometry')
            self.ways.append(dict(id=way.id,version=way.version,timestamp=str(way.timestamp),tags=dict(way.tags),
                                  nodes=[[n.ref,n.location.lon,n.location.lat] for n in way.nodes]))
        def relation(self,relation):
            if relation.id != spec['relation']: return
            if len(relation.members)>18: raise ValueError('Raw relation member budget exceeded')
            self.restrictions.append(dict(id=relation.id,version=relation.version,timestamp=str(relation.timestamp),
                tags=dict(relation.tags),members=[dict(type=m.type,ref=m.ref,role=m.role) for m in relation.members]))
    reader=Reader();reader.apply_file(str(source),locations=True,idx='flex_mem');verify()
    if (len(reader.ways)!=len(spec['ways']) or {w['id'] for w in reader.ways}!=spec['ways']
            or len(reader.restrictions)!=1 or {m['ref'] for m in reader.restrictions[0]['members']}!=spec['ways']):
        raise ValueError('Exact complete raw relation/member-way context required')
    return dict(schema='declared-via-way-raw-context-v1',source=identity,
                ways=sorted(reader.ways,key=lambda w:w['id']),restrictions=reader.restrictions,
                scope='Only the exact member ways of the named restriction; no neighborhood, geographic optimum or exterior closure',
                access_verified=False,anchor_adopted=False,release_eligible=False,
                attribution='OSM data copyright OpenStreetMap contributors, ODbL')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--state',choices=sorted(CASES),required=True)
    p.add_argument('--osm',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    result=extract(a.state,a.osm);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(state=a.state,ways=len(result['ways']),restrictions=len(result['restrictions']),release_eligible=False))
