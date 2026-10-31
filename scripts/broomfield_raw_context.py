"""Extract bounded raw Broomfield context from the exact original Colorado input."""
import argparse
import hashlib,json,osmium
from pathlib import Path
parser=argparse.ArgumentParser(description=__doc__)
parser.add_argument('--osm',type=Path,required=True)
parser.add_argument('--output',type=Path,required=True)
args=parser.parse_args()
SOURCE=args.osm
EXPECTED='ef1f9e0832de42ccae2b5614d9d1a00ec41d1b6506e4ca9ef12e1eb895e5d4b7'
BOUNDS=[-105.072,39.918,-105.065,39.923]
def verify():
 if SOURCE.stat().st_size != 386197077:raise ValueError('Exact original Colorado size required')
 with SOURCE.open('rb') as f:
  if hashlib.file_digest(f,'sha256').hexdigest()!=EXPECTED:raise ValueError('Exact original Colorado hash required')
verify()
def inside(x,y):return BOUNDS[0]<=x<=BOUNDS[2] and BOUNDS[1]<=y<=BOUNDS[3]
class Scan(osmium.SimpleHandler):
 def __init__(self):super().__init__();self.ways=[];self.nodes=[];self.refs=0
 def node(self,n):
  if n.location.valid() and inside(n.location.lon,n.location.lat) and any(n.tags.get(k) for k in ('barrier','access','motor_vehicle','entrance','highway','amenity','traffic_sign')):
   if len(self.nodes)>=10000:raise ValueError('Tagged node context budget exceeded')
   self.nodes.append(dict(id=n.id,version=n.version,timestamp=str(n.timestamp),lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags)))
 def way(self,w):
  if not w.tags.get('highway'):return
  if not any(n.location.valid() and inside(n.location.lon,n.location.lat) for n in w.nodes):return
  if any(not n.location.valid() for n in w.nodes):raise ValueError('Missing raw way location')
  self.refs+=len(w.nodes)
  if len(self.ways)>=2000 or self.refs>200000:raise ValueError('Raw local way budget exceeded')
  self.ways.append(dict(id=w.id,version=w.version,timestamp=str(w.timestamp),tags=dict(w.tags),nodes=[[n.ref,n.location.lon,n.location.lat] for n in w.nodes]))
s=Scan();s.apply_file(str(SOURCE),locations=True,idx='flex_mem');ids={w['id'] for w in s.ways}
class Relations(osmium.SimpleHandler):
 def __init__(self):super().__init__();self.rows=[]
 def relation(self,r):
  if r.tags.get('type')!='restriction' or not any(m.type=='w' and m.ref in ids for m in r.members):return
  if len(self.rows)>=1000:raise ValueError('Restriction context budget exceeded')
  self.rows.append(dict(id=r.id,version=r.version,timestamp=str(r.timestamp),tags=dict(r.tags),members=[dict(type=m.type,ref=m.ref,role=m.role) for m in r.members]))
r=Relations();r.apply_file(str(SOURCE));verify()
out=dict(schema='broomfield-unadopted-raw-context-v1',source_sha256=EXPECTED,source_bytes=SOURCE.stat().st_size,
 bounds_lonlat=BOUNDS,ways=sorted(s.ways,key=lambda w:w['id']),tagged_nodes=sorted(s.nodes,key=lambda n:n['id']),restrictions=sorted(r.rows,key=lambda r:r['id']),
 selection='All raw highway ways with a vertex in the agency-query envelope, full selected geometries. May omit a crossing way without a local vertex; no geographic/exterior closure.',
 anchor_adopted=False,connector_costs_included=False,access_verified=False,datum_alignment_verified=False,release_eligible=False,
 warning='Raw context only; no selected road endpoint, entry path, legal/physical/grade/turn certification or current closure evaluation. No Census origin or old graph changed. OSM contributors ODbL.')
target=args.output
target.write_text(json.dumps(out,sort_keys=True,indent=2)+'\n')
print(dict(ways=len(s.ways),tagged_nodes=len(s.nodes),restrictions=len(r.rows)),flush=True)
