"""Retain selected OSM context and literal operator text without certifying access."""
import argparse,hashlib,json
from html.parser import HTMLParser
from pathlib import Path
import osmium
from shapely.geometry import Point,Polygon
from cheyenne_checkpoint import load_reference32
from colorado_adjacent_source_interfaces import source_metadata
from denver_anchor_evidence import haversine

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/las-vegas-origin-context'
QUARRY=1520965805
HIGHWAY=815168941
LEAD=7614401690
GATE=8114260504


class Text(HTMLParser):
    def __init__(self):super().__init__();self.skip=0;self.out=[]
    def handle_starttag(self,tag,attrs):
        if tag in ('script','style'):self.skip+=1
    def handle_endtag(self,tag):
        if tag in ('script','style'):self.skip-=1
    def handle_data(self,data):
        if not self.skip and data.strip():self.out.append(data.strip())


def operator_report():
    path=REFERENCE/'operator-hollywood.html';raw=path.read_bytes();p=Text();p.feed(raw.decode('utf-8'))
    provenance=json.loads((REFERENCE/'operator-hollywood-provenance.json').read_text())
    if len(raw)!=provenance['bytes'] or hashlib.sha256(raw).hexdigest()!=provenance['sha256']:raise ValueError('Retained operator bytes changed')
    address='7198 East Alto Ave\nLas Vegas, NV 89156';hours='6:00 AM - 2:45 PM'
    directions='From Lake Mead Boulevard and Hollywood Boulevard, continue East on Lake Mead Boulevard to Arnona Road, turn left. Follow Arnona Road to the North and this will lead you to the pit, the first one on the right.'
    description='Boulder Sand & Gravel is an aggregate materials supplier and producer. At the Hollywood pit, we mine and process Type II gravel base. We recycle concrete and asphalt with native material to make a custom blend of different Type II gravel bases. Material accepted for dumping are asphalt, concrete and dirt.'
    if not all(v in p.out for v in (address,hours,directions,description,'Monday - Friday')):raise ValueError('Exact published operator text changed')
    return dict(schema='las-vegas-operator-text-v1',input_html_sha256=provenance['sha256'],source_url=provenance['url'],retrieved_utc=provenance['retrieved_utc'],published_address=address,published_days='Monday - Friday',published_hours=hours,published_directions=directions,published_description=description,access_verified=False,release_eligible=False,precise_selected_connector_verified=False,warning='Literal operator text only. Customer directions and business hours do not establish access from the Census point, an exact entrance coordinate, grade, current signs or permitted turns for the selected connector.')


class Selected(osmium.SimpleHandler):
    def __init__(self):super().__init__();self.ways={};self.nodes={}
    def way(self,w):
        if w.id in (QUARRY,HIGHWAY):
            if len(w.nodes)>10000 or any(not n.location.valid() for n in w.nodes):raise ValueError('Selected geometry unavailable or over budget')
            self.ways[w.id]=dict(id=w.id,tags=dict(w.tags),nodes=[dict(id=n.ref,lon=n.lon,lat=n.lat) for n in w.nodes])
    def node(self,n):
        if n.id in (LEAD,GATE):
            if not n.location.valid():raise ValueError('Selected node lacks geometry')
            self.nodes[n.id]=dict(id=n.id,tags=dict(n.tags),lonlat=[n.location.lon,n.location.lat])


def model_report(osm):
    baseline=load_reference32();domains_path=ROOT/'docs/research/utah-parent-reference/domains.json';domain_raw=domains_path.read_bytes()
    if hashlib.sha256(domain_raw).hexdigest()!=baseline['domains_sha256']:raise ValueError('Exact native domains required')
    domain=next(d for d in json.loads(domain_raw)['domains'] if d['cbsa']=='29820');origin=domain['native_representative_lonlat']
    archive=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text());entry=next(e for e in archive['files'] if e['filename']=='nevada.osm.pbf');metadata=source_metadata(osm)
    if metadata!=dict(name='nevada.osm.pbf',sha256=entry['sha256'],size_bytes=entry['bytes'],replication_timestamp='2026-10-27T21:23:59Z'):raise ValueError('Exact dated Nevada input required')
    selected=Selected();selected.apply_file(str(osm),locations=True,idx='sparse_mem_array')
    if set(selected.ways)!={QUARRY,HIGHWAY} or set(selected.nodes)!={LEAD,GATE}:raise ValueError('Complete selected context geometry required')
    quarry=selected.ways[QUARRY];road=selected.ways[HIGHWAY];lead=selected.nodes[LEAD];gate=selected.nodes[GATE]
    if quarry['nodes'][0]['id']!=quarry['nodes'][-1]['id'] or LEAD not in {n['id'] for n in road['nodes']}:raise ValueError('Closed quarry and exact selected lead-way membership required')
    polygon=Polygon([(n['lon'],n['lat']) for n in quarry['nodes']])
    if not polygon.is_valid:raise ValueError('Selected quarry polygon invalid')
    csv_sha=hashlib.sha256((ROOT/'public/data/metros-census-2025.csv').read_bytes()).hexdigest()
    return dict(schema='las-vegas-selected-osm-origin-context-v1',cbsa='29820',source_population=domain['source_population'],native_origin_lonlat=origin,domains_sha256=baseline['domains_sha256'],metros_csv_sha256=csv_sha,osm_source=metadata,quarry_way=quarry,selected_highway_way=road,primitive_road_lead=lead,nearby_gate=gate,model_polygon_covers_native_origin=polygon.covers(Point(origin)),model_polygon_covers_primitive_lead=polygon.covers(Point(lead['lonlat'])),origin_to_primitive_lead_gap_m=haversine(origin,lead['lonlat']),origin_to_nearby_gate_gap_m=haversine(origin,gate['lonlat']),nearby_gate_identified_as_operator_entrance=False,area_selection_scope='Two explicitly selected ways and two nodes, discovered in broader model-context investigation; not a complete landuse, barrier or restriction inventory.',access_verified=False,release_eligible=False,independent_access_evidence=False,datum_alignment_verified=False,geographic_coverage_certified=False,urban_anchor_adopted=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--osm',type=Path);p.add_argument('--output',type=Path,required=True);p.add_argument('--operator-only',action='store_true');p.add_argument('--compare',type=Path);a=p.parse_args()
    if not a.operator_only and a.osm is None:p.error('--osm required for selected model context')
    result=operator_report() if a.operator_only else model_report(a.osm)
    if a.compare and result!=json.loads(a.compare.read_text()):raise ValueError('Retained selected context differs')
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(json.dumps(dict(schema=result['schema'],access_verified=False,release_eligible=False)))
