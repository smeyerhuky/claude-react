"""Inspect independent agency road correspondence; never certify an access join."""
import argparse
from datetime import datetime,timezone
import hashlib
import json
import math
from pathlib import Path
import re
import urllib.parse
import urllib.request

from pyproj import Transformer
from pyproj.transformer import TransformerGroup
from pyproj.enums import TransformDirection
import northern_urban_path_checkpoint as parent
from northern_local_detour_checkpoint import OUTPUT as WITNESS
from reference_via_node_compile import need,canonical_sha

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs/research/northern-endpoint-evidence'
US_FOOT=1200/3937
HOSTS={'dtdapps.codot.gov','gis.greeleygov.com','mapserv.cityofloveland.org','services1.arcgis.com','www.arcgis.com'}
CITY_LAYERS={'fort-college':'fort-city-layer','loveland-lincoln':'loveland-road-layer','loveland-cleveland':'loveland-road-layer',
             'greeley-ninth':'greeley-streets-layer','greeley-tenth':'greeley-streets-layer'}
NAME_KEYS={'fort-college':'STRNAME','loveland-lincoln':'FULLNAME','loveland-cleveland':'FULLNAME','greeley-ninth':'STNAME','greeley-tenth':'STNAME'}
FACT_KEYS=['PRIVATE','PRIVSTRT','BUILT','STATUS','LIFECYCLE','ONEWAYDIR','ONEWAY','OWNEDBY','MAINTAINEDBY','MAINTAINS','LASTUPDATE','REVDATE','UPDATE_DATE']


def encoded(value):return (json.dumps(value,sort_keys=True,indent=2,allow_nan=False)+'\n').encode()


def source_value(content):
    value=json.loads(content)
    if isinstance(value,dict) and value.get('id')=='f6380ef587ac4e54aaf988b15d8d1746' and value.get('type')=='Feature Service':
        # ArcGIS usage counters change independently of publisher/source data.
        # Exempt only these two fields of this exact public publisher item.
        value={k:v for k,v in value.items() if k not in {'numViews','lastViewed'}}
    if isinstance(value,dict) and 'objectIds' in value:
        ids=value['objectIds']
        need(isinstance(ids,list) and all(type(v) is int and v>0 for v in ids)
             and len(set(ids))==len(ids),'Unique positive complete agency ID inventory required')
        value=dict(value,objectIds=sorted(ids))
    return value


def source_digest(content):return canonical_sha(source_value(content))


def normalized_name(value):
    aliases={'NORTH':'N','SOUTH':'S','EAST':'E','WEST':'W','AVENUE':'AVE','STREET':'ST'}
    return ' '.join(aliases.get(t,t) for t in re.findall(r'[A-Z0-9]+',value.upper()))


def closest(point,paths):
    best=None
    need(isinstance(paths,list) and 0<len(paths)<=100,'Bounded complete polyline paths required')
    for pi,path in enumerate(paths):
        need(2<=len(path)<=5000,'Bounded complete native polyline geometry required')
        for si,(a,b) in enumerate(zip(path,path[1:])):
            a,b=a[:2],b[:2]
            need(all(type(v) in (int,float) and math.isfinite(v) for v in [*a,*b]),'Finite native geometry required')
            dx,dy=b[0]-a[0],b[1]-a[1];den=dx*dx+dy*dy
            if not den:continue
            t=max(0.,min(1.,((point[0]-a[0])*dx+(point[1]-a[1])*dy)/den));q=[a[0]+t*dx,a[1]+t*dy]
            row=(math.hypot(point[0]-q[0],point[1]-q[1]),pi,si,q,a,b)
            if best is None or row[:3]<best[:3]:best=row
    need(best is not None,'No nonzero complete source segment')
    return dict(distance_native=best[0],path_index=best[1],segment_index=best[2],projected_native=best[3],segment_native=[best[4],best[5]])


def features(body,ids):
    need(not body.get('error') and body.get('exceededTransferLimit',False) is False
         and not ids.get('error') and body.get('geometryType')=='esriGeometryPolyline','Complete nontruncated agency line query required')
    field=body.get('objectIdFieldName') or ids.get('objectIdFieldName');rows=body.get('features')
    need(field and isinstance(rows,list) and 0<len(rows)<=500 and isinstance(ids.get('objectIds'),list),'Explicit bounded feature/ID inventories required')
    values=[r['attributes'][field] for r in rows]
    need(all(type(v) is int and v>0 for v in values) and len(set(values))==len(values)
         and len(set(ids['objectIds']))==len(ids['objectIds']) and set(values)==set(ids['objectIds']),
         'Agency feature IDs differ from separate complete ID inventory')
    return field,rows


def decode(field,value,layer):
    metadata=next((f for f in layer['fields'] if f['name']==field),None)
    domain=metadata.get('domain') if metadata else None
    if not domain or domain.get('type')!='codedValue':return dict(raw=value,decoded=None,code_definition_available=False)
    labels={r['code']:r['name'] for r in domain['codedValues']}
    return dict(raw=value,decoded=labels.get(value),code_definition_available=value in labels)


def projector(wkid):
    if wkid in (26913,2231):
        operation=Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1188')
        projection=Transformer.from_crs(4269,wkid,always_xy=True)
        def apply(p):
            q=operation.transform(*p,direction=TransformDirection.INVERSE)
            return list(projection.transform(*q))
        return apply,dict(source='EPSG:4326',target=f'EPSG:{wkid}',datum_operation='inverse EPSG:1188',
            projection_definition=projection.definition,stated_datum_accuracy_m=4.,stated_accuracy_is_error_bound=False)
    need(wkid==2876,'Explicit supported native agency CRS required')
    transforms=TransformerGroup(4326,2876,always_xy=True).transformers
    chosen=next((t for t in transforms if t.description.startswith('Inverse of NAD83(HARN) to WGS 84 (3)')),None)
    need(chosen is not None and chosen.accuracy==1.,'Explicit Colorado HARN operation required; no silent datum fallback')
    explicit=Transformer.from_pipeline(chosen.definition)
    return lambda p:list(explicit.transform(*p)),dict(source='EPSG:4326',target='EPSG:2876',
        datum_operation='inverse NAD83(HARN) to WGS 84 (3)',projection_definition=chosen.definition,
        stated_datum_accuracy_m=1.,stated_accuracy_is_error_bound=False)


def rank(point,body,ids):
    field,rows=features(body,ids);sr=body['spatialReference'];wkid=sr.get('latestWkid',sr['wkid']);transform,operation=projector(wkid)
    point_native=transform(point);factor=1. if wkid==26913 else US_FOOT
    result=[]
    for row in rows:
        match=closest(point_native,row['geometry']['paths'])
        result.append(dict(object_id=row['attributes'][field],attributes=row['attributes'],geometry_sha256=canonical_sha(row['geometry']),
                           distance_m=match.pop('distance_native')*factor,**match))
    return sorted(result,key=lambda r:(r['distance_m'],r['object_id'])),operation,transform


def named_matches(rows,key,name):
    expected=normalized_name(name)
    matches=[r for r in rows if normalized_name(r['attributes'].get(key) or '')==expected]
    need(matches,'No independently named road in captured query; do not substitute nearest geometry')
    return matches


def extract_native(source):
    import osmium
    frozen=json.loads(WITNESS.read_bytes());candidates={c['way']:c for c in frozen['candidates']};node_ids={c['node'] for c in candidates.values()}
    parent.verify_original(source)
    class Capture(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.ways={};self.nodes={}
        def node(self,n):
            if n.id in node_ids:
                need(n.id not in self.nodes and n.location.valid(),'Complete unique native candidate required')
                self.nodes[n.id]=dict(id=n.id,lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags))
        def way(self,w):
            if w.id in candidates:
                need(w.id not in self.ways and len(w.nodes)<=1000 and all(n.location.valid() for n in w.nodes),'Complete unique candidate way required')
                c=candidates[w.id];positions=[i for i,n in enumerate(w.nodes) if n.ref==c['node']]
                need(len(positions)==1 and 0<positions[0]<len(w.nodes)-1,'Unique interior native candidate required')
                i=positions[0];rows=[[n.ref,n.location.lon,n.location.lat] for n in w.nodes]
                self.ways[w.id]=dict(id=w.id,raw_node_index=i,local_geometry=rows[i-1:i+2],
                    tags={k:v for k,v in dict(w.tags).items() if k in {'name','ref','oneway','CDOT_route','highway','layer','bridge','tunnel','access','vehicle','motor_vehicle','motorcar'}})
    capture=Capture();capture.apply_file(str(source),locations=True,idx='flex_mem')
    need(set(capture.ways)==set(candidates) and set(capture.nodes)==node_ids,'Missing native candidate sources')
    parent.verify_original(source)
    return dict(schema='northern-native-endpoint-source-projection-v1',source_identity=frozen['source_identity'],report_sha256=parent.digest(WITNESS),
        candidates=[dict(candidate=c,raw_way=capture.ways[c['way']],raw_node=capture.nodes[c['node']]) for c in frozen['candidates']])


def read_originals(directory,manifest):
    need(manifest['schema']=='northern-independent-agency-source-manifest-v1'
         and manifest['original_responses_published'] is False and manifest['release_eligible'] is False
         and len(manifest['sources'])==37,'Exact bounded independent source manifest required')
    result={}
    for key,record in manifest['sources'].items():
        path=Path(directory)/(key+'.json');need(0<path.stat().st_size<=3_000_000,'Bounded complete agency response required')
        raw=path.read_bytes();need(source_digest(raw)==record['semantic_sha256'],'Agency source content changed: '+key)
        result[key]=json.loads(raw)
    return result


def publisher(org,item):
    need(org['id']=='dLpFH5mwVvxSN4OE' and org['name']=='City of Fort Collins' and org['urlKey']=='fcgov'
         and item['orgId']==org['id'] and item['owner']=='ftc_geoevent'
         and item['id']=='f6380ef587ac4e54aaf988b15d8d1746'
         and item['url'].startswith('https://services1.arcgis.com/'+org['id']+'/'),'Correct municipal publisher identity required')


def audit(directory):
    manifest=json.loads((OUTPUT/'manifest.json').read_bytes());originals=read_originals(directory,manifest)
    publisher(originals['fort-official-org'],originals['fort-official-item'])
    native=json.loads((OUTPUT/'native.json').read_bytes());frozen=json.loads(WITNESS.read_bytes())
    need(native['report_sha256']==parent.digest(WITNESS) and native['source_identity']==frozen['source_identity']
         and [r['candidate'] for r in native['candidates']]==frozen['candidates'],'Exact native endpoint hypotheses required')
    points=[]
    for entry in native['candidates']:
        c=entry['candidate'];name=entry['raw_way']['tags']['name'];key=c['id']
        need(entry['raw_node']['lonlat']==c['lonlat'] and entry['raw_way']['local_geometry'][1]==[c['node'],*c['lonlat']],
             'Native source position differs from frozen endpoint')
        city,city_op,project=rank(c['lonlat'],originals[key+'-city'],originals[key+'-city-ids'])
        qualified=named_matches(city,NAME_KEYS[key],name);selected=qualified[0];attrs=selected['attributes'];layer=originals[CITY_LAYERS[key]]
        raw_direction=entry['raw_way']['tags'].get('oneway');field='ONEWAYDIR' if key.startswith('loveland') else 'ONEWAY'
        direction=decode(field,attrs.get(field),layer);alignment=None
        if direction['decoded']=='From-To' and raw_direction in ('yes','-1'):
            a,b=[project(p[1:]) for p in [entry['raw_way']['local_geometry'][0],entry['raw_way']['local_geometry'][2]]]
            if raw_direction=='-1':a,b=b,a
            x,y=selected['segment_native'];u=[b[0]-a[0],b[1]-a[1]];v=[y[0]-x[0],y[1]-x[1]]
            alignment=sum(a*b for a,b in zip(u,v))/(math.hypot(*u)*math.hypot(*v))
        cdot=[]
        for lid in [7,12]:
            rows,operation,_=rank(c['lonlat'],originals[f'{key}-{lid}'],originals[f'{key}-{lid}-ids']);r=rows[0]
            cdot.append(dict(layer=lid,object_id=r['object_id'],route=r['attributes'].get('ROUTE'),alias=r['attributes'].get('ALIAS'),
                route_matches_recorded_osm_route=bool(entry['raw_way']['tags'].get('CDOT_route')) and r['attributes'].get('ROUTE')==entry['raw_way']['tags']['CDOT_route'],
                operation=r['attributes'].get('OPERATION'),update_year=r['attributes'].get('UPDATEYR'),registration_distance_m=r['distance_m'],coordinate_operation=operation,
                returned_feature_ids=[x['object_id'] for x in rows]))
        dates={}
        for field in ['LASTUPDATE','REVDATE','UPDATE_DATE']:
            value=attrs.get(field)
            if type(value) in (int,float) and 0<value<4_102_444_800_000:
                dates[field]=datetime.fromtimestamp(value/1000,timezone.utc).isoformat()
        points.append(dict(candidate=c,osm_way_tags=entry['raw_way']['tags'],municipal_name=attrs[NAME_KEYS[key]],
            municipal_object_id=selected['object_id'],municipal_matching_ids=[r['object_id'] for r in qualified],
            municipal_duplicate_geometry_ids=[r['object_id'] for r in qualified if r['geometry_sha256']==selected['geometry_sha256']],
            municipal_registration_distance_m=selected['distance_m'],unqualified_nearest_object_id=city[0]['object_id'],
            unqualified_nearest_name=city[0]['attributes'].get(NAME_KEYS[key]),unqualified_nearest_distance_m=city[0]['distance_m'],
            unqualified_nearest_matches_named_road=normalized_name(city[0]['attributes'].get(NAME_KEYS[key]) or '')==normalized_name(name),
            municipal_facts={k:attrs[k] for k in FACT_KEYS if k in attrs},municipal_record_dates_utc=dates,municipal_direction=direction,
            municipality_from_to_vs_osm_permitted_direction_cosine=alignment,coordinate_operation=city_op,
            municipality_source_geometry_sha256=selected['geometry_sha256'],municipality_selected_segment_native=selected['segment_native'],
            cdot_context=cdot,registration_is_connector_cost=False,access_verified=False,anchor_adopted=False))
    return dict(schema='northern-independent-endpoint-context-v1',report_sha256=parent.digest(WITNESS),manifest_sha256=parent.digest(OUTPUT/'manifest.json'),
        native_sha256=parent.digest(OUTPUT/'native.json'),implementation_sha256=parent.digest(__file__),points=points,
        independent_sources_inspected=True,approved_connectors=0,anchors_adopted=False,access_verified=False,geographic_coverage_certified=False,release_eligible=False,
        scope='Agency road-name, source-status and directional context only. Registration distances are approximate diagnostics, not off-road joins, connector costs, survey error bounds or access certification. Uncoded/null direction values remain undefined; corridor-wide two-way operation does not determine individual carriageway bearing. Duplicate source geometry is not independent corroboration.')


def fetch_originals(directory):
    manifest=json.loads((OUTPUT/'manifest.json').read_bytes());Path(directory).mkdir(parents=True,exist_ok=True)
    receipts={}
    for key,record in manifest['sources'].items():
        u=urllib.parse.urlsplit(record['url']);need(u.scheme=='https' and u.hostname in HOSTS and not u.username and not u.password,'Allowlisted public agency source URL required')
        with urllib.request.urlopen(record['url'],timeout=45) as response:
            data=response.read(3_000_001);need(response.status==200 and len(data)<=3_000_000,'Complete bounded HTTP200 agency source required')
        if source_digest(data)!=record['semantic_sha256']:
            value=source_value(data);observed={k:canonical_sha(v) for k,v in value.items()}
            changed=sorted(k for k in observed.keys()|record['top_level_sha256'].keys() if observed.get(k)!=record['top_level_sha256'].get(k))
            error=value.get('error');code=error.get('code') if isinstance(error,dict) else None
            raise ValueError(f'Agency source content changed: {key}; changed fields={changed}; response error code={code}. Inspect source before refreshing snapshot.')
        (Path(directory)/(key+'.json')).write_bytes(data)
        raw_sha=hashlib.sha256(data).hexdigest()
        receipts[key]=dict(sha256=raw_sha,size_bytes=len(data),semantic_sha256=source_digest(data),
            captured_raw_bytes_equal=raw_sha==record['sha256'] and len(data)==record['size_bytes'],
            captured_at_utc=datetime.now(timezone.utc).isoformat(),status=200)
    (Path(directory)/'fresh-source-receipts.json').write_bytes(encoded(dict(schema='northern-agency-fresh-source-receipts-v1',
        source_manifest_sha256=parent.digest(OUTPUT/'manifest.json'),sources=receipts,
        normalization='Canonical JSON keys; sorted top-level objectIds; omit only numViews/lastViewed of pinned Fort Collins publisher item. No changed road attributes, IDs, coordinates, code definitions or publisher identity.')))


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path);parser.add_argument('--original-dir',type=Path);parser.add_argument('--download',action='store_true');parser.add_argument('--write',action='store_true');args=parser.parse_args()
    if args.osm:
        value=encoded(extract_native(args.osm))
        if args.write:OUTPUT.mkdir(parents=True,exist_ok=True);(OUTPUT/'native.json').write_bytes(value)
        else:need(value==(OUTPUT/'native.json').read_bytes(),'Fresh original native projection differs')
    if args.original_dir:
        if args.download:fetch_originals(args.original_dir)
        actual=audit(args.original_dir)
        if args.write:(OUTPUT/'report.json').write_bytes(encoded(actual))
        else:need(actual==json.loads((OUTPUT/'report.json').read_bytes()),'Exact agency replay differs')
        print(json.dumps(dict(points=len(actual['points']),sources=len(json.loads((OUTPUT/'manifest.json').read_bytes())['sources']),access_verified=False,release_eligible=False)))
    need(args.osm or args.original_dir,'Native original or agency original directory required')
