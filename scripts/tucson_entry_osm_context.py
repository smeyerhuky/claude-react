"""Reproduce bounded raw context for an unadopted Tucson municipal entry lead."""
import hashlib,json,math
from pathlib import Path
import osmium
import argparse
p=argparse.ArgumentParser(description='Extract exact local Tucson OSM context; never approve access')
p.add_argument('--osm',type=Path,required=True);p.add_argument('--municipal-lots',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
SOURCE=args.osm
assert hashlib.file_digest(SOURCE.open('rb'),'sha256').hexdigest()=='77dc176e64538b08fb837f5c3515bea3956c2d9a037089aa6a958b405aba76a9'
assert hashlib.sha256(args.municipal_lots.read_bytes()).hexdigest()=='b681c5d4921d0ca39a6c11cd3bb0388c02a9ac1d38e7bf9edccf37e4e5009b5f','Exact retained municipal GIS response required'
d=json.loads(args.municipal_lots.read_text());assert not d.get('error') and not d.get('exceededTransferLimit') and d['spatialReference']['wkid']==4326
f=next(f for f in d['features'] if f['attributes']['FID']==1);g=f['geometry'];x,y=g['x'],g['y'];assert all(math.isfinite(v) for v in (x,y)) and -180<=x<=180 and -90<=y<=90;bounds=[x-.0015,y-.0015,x+.0015,y+.0015]
def inside(x,y):return bounds[0]<=x<=bounds[2] and bounds[1]<=y<=bounds[3]
class Scan(osmium.SimpleHandler):
 def __init__(self):super().__init__();self.ways=[];self.tagged_nodes=[]
 def node(self,n):
  if n.location.valid() and inside(n.location.lon,n.location.lat) and any(n.tags.get(k) for k in ('barrier','access','motor_vehicle','entrance','highway','amenity')):
   self.tagged_nodes.append(dict(id=n.id,version=n.version,timestamp=str(n.timestamp),lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags)))
  if len(self.tagged_nodes)>10000:raise ValueError('Tagged node context budget exceeded')
 def way(self,w):
  if not w.tags.get('highway'):return
  if not any(n.location.valid() and inside(n.location.lon,n.location.lat) for n in w.nodes):return
  if any(not n.location.valid() for n in w.nodes):raise ValueError('Missing location')
  self.ways.append(dict(id=w.id,version=w.version,timestamp=str(w.timestamp),tags=dict(w.tags),nodes=[[n.ref,n.location.lon,n.location.lat] for n in w.nodes]))
  if len(self.ways)>2000 or sum(len(w['nodes']) for w in self.ways)>200000:raise ValueError('Context limit exceeded')
s=Scan();s.apply_file(str(SOURCE),locations=True,idx='flex_mem')
ids={w['id'] for w in s.ways}
class Relations(osmium.SimpleHandler):
 def __init__(self):super().__init__();self.relations=[]
 def relation(self,r):
  if r.tags.get('type')=='restriction' and any(m.type=='w' and m.ref in ids for m in r.members):
   self.relations.append(dict(id=r.id,version=r.version,timestamp=str(r.timestamp),tags=dict(r.tags),members=[dict(type=m.type,ref=m.ref,role=m.role) for m in r.members]))
   if len(self.relations)>1000:raise ValueError('Restriction context limit exceeded')
r=Relations();r.apply_file(str(SOURCE))
assert len(r.relations)<=1000,'Restriction context limit exceeded'
assert hashlib.file_digest(SOURCE.open('rb'),'sha256').hexdigest()=='77dc176e64538b08fb837f5c3515bea3956c2d9a037089aa6a958b405aba76a9','OSM bytes changed during extraction'
out=dict(schema='tucson-urban-entry-raw-osm-context-v1',source_sha256='77dc176e64538b08fb837f5c3515bea3956c2d9a037089aa6a958b405aba76a9',source_bytes=SOURCE.stat().st_size,municipal_feature_id=1,municipal_feature_name=f['attributes']['NAME'],municipal_point_lonlat=[x,y],bounds_lonlat=bounds,selection='All raw highway ways with at least one vertex in the declared neighborhood; full selected way node coordinates retained. Restrictions referencing any selected way retained in a second original-source pass.',ways=sorted(s.ways,key=lambda w:w['id']),tagged_nodes=sorted(s.tagged_nodes,key=lambda n:n['id']),restrictions=sorted(r.relations,key=lambda r:r['id']),arbitrary_endpoint_coverage=False,access_verified=False,release_eligible=False,anchor_adopted=False,warning='Municipal map point and raw OSM context only. No chosen vehicle entry, datum alignment, grade, public motor rights, legal turn, connector length/cost or complete neighborhood road coverage is established. Census-origin regression unchanged. OSM data copyright OpenStreetMap contributors, ODbL.')
args.output.parent.mkdir(parents=True,exist_ok=True)
args.output.write_text(json.dumps(out,indent=2,sort_keys=True)+'\n');print(dict(ways=len(s.ways),tagged_nodes=len(s.tagged_nodes),restrictions=len(r.relations)))
