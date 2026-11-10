"""Audit nearby CDOT structures and access classes, never certify attachments."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
import urllib.parse
import urllib.request

from northern_endpoint_evidence import OUTPUT as AGENCY, encoded, projector, closest
from northern_site_imagery import OUTPUT as IMAGERY
from northern_local_detour_checkpoint import OUTPUT as WITNESS
from reference_via_node_compile import need, canonical_sha

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT/'docs/research/northern-structure-context'
BASE = 'https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer/'
LAYERS = {0:'Bridges and Major Culverts', 31:'Structures (all types)', 9:'Highways: Access Categories'}
STRUCTURE_FIELDS = ['OBJECTID','STRUCTURE_KEY','STRUCTURE_NUM','ROUTE','REFPT','ENDREFPT',
                    'STRUCTURE_TYPE','STRUCTURE_CLASS','STRUCTURE_STATUS','FACILITY','FEATINT','ON_UNDER','STRLENGTH','YEARBUILT']
ACCESS_FIELDS = ['OBJECTID','ROUTE','REFPT','ENDREFPT','ACCCAT','ACCESS_']


def digest(path): return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def source_value(raw):
    value = json.loads(raw)
    if 'objectIds' in value:
        ids = value['objectIds']
        need(ids is None or isinstance(ids,list) and all(type(v) is int and v > 0 for v in ids)
             and len(set(ids)) == len(ids), 'Unique positive inventory or explicit ArcGIS null-empty result required')
        if ids is not None: value = dict(value, objectIds=sorted(ids))
    return value


def source_sha(raw): return canonical_sha(source_value(raw))


def query_url(candidate, layer, ids=False):
    need(layer in LAYERS, 'Explicit CDOT layer required')
    params = dict(f='json',where='1=1',geometry=json.dumps(dict(x=candidate['lonlat'][0],y=candidate['lonlat'][1],
        spatialReference=dict(wkid=4326)),separators=(',',':')),geometryType='esriGeometryPoint',inSR=4326,
        spatialRel='esriSpatialRelIntersects',distance=500,units='esriSRUnit_Meter',outSR=26913,
        outFields=','.join(ACCESS_FIELDS if layer == 9 else STRUCTURE_FIELDS),returnGeometry='true',resultRecordCount=1000)
    if ids:
        params.pop('outFields');params.pop('returnGeometry');params['returnIdsOnly']='true'
    return BASE+str(layer)+'/query?'+urllib.parse.urlencode(params)


def complete_features(body, inventory, layer):
    expected_type = 'esriGeometryPolyline' if layer == 9 else 'esriGeometryPoint'
    need(not body.get('error') and not inventory.get('error') and not body.get('exceededTransferLimit',False)
         and not inventory.get('exceededTransferLimit',False), 'Complete successful nontruncated source queries required')
    sr = body.get('spatialReference',{})
    need(body.get('geometryType') == expected_type and sr.get('latestWkid',sr.get('wkid')) == 26913,
         'Correct native source geometry and CRS required')
    need(body.get('objectIdFieldName') == inventory.get('objectIdFieldName') == 'OBJECTID'
         and 'objectIds' in inventory, 'Separate explicit ID inventory required even for empty results')
    rows = body.get('features');ids = inventory['objectIds']
    need(isinstance(rows,list) and len(rows) <= 1000 and (ids is None or isinstance(ids,list)), 'Bounded complete source inventory required')
    actual = [f['attributes']['OBJECTID'] for f in rows];expected = [] if ids is None else ids
    need(all(type(v) is int and v > 0 for v in actual+expected) and len(set(actual)) == len(actual)
         and len(set(expected)) == len(expected) and set(actual) == set(expected), 'Feature IDs differ from separate inventory')
    fields = ACCESS_FIELDS if layer == 9 else STRUCTURE_FIELDS
    need(all(set(fields) <= set(f['attributes']) for f in rows), 'Requested source fields missing; null values must stay explicit')
    return rows


def point_rows(rows, point):
    result = []
    for f in rows:
        g = f['geometry'];xy = [g.get('x'),g.get('y')]
        need(all(type(v) in (int,float) and math.isfinite(v) for v in xy), 'Finite explicit native structure point required')
        result.append(dict(attributes={k:f['attributes'][k] for k in STRUCTURE_FIELDS}, source_point_native_m=xy,
            source_geometry_sha256=canonical_sha(g), nominal_point_distance_m=math.hypot(point[0]-xy[0],point[1]-xy[1])))
    return sorted(result,key=lambda r:(r['nominal_point_distance_m'],r['attributes']['OBJECTID']))


def bridge_keys(rows):
    keys = [r['attributes']['STRUCTURE_KEY'] for r in rows if r['attributes']['STRUCTURE_CLASS'] == 'Bridge']
    need(all(isinstance(v,str) and 0 < len(v) <= 128 and v.strip() == v for v in keys) and len(set(keys)) == len(keys),
         'Unique explicit source structure keys required; layer object IDs are not cross-layer identities')
    return set(keys)


def compare_bridges(a, b):
    ka, kb = bridge_keys(a), bridge_keys(b)
    return dict(shared_structure_keys=sorted(ka & kb), layer0_only_structure_keys=sorted(ka-kb),
        layer31_only_structure_keys=sorted(kb-ka), same_inventory=ka == kb,
        independent_corroboration=False, absence_is_grade_proof=False)


def inputs():
    native = json.loads((AGENCY/'native.json').read_bytes());witness = json.loads(WITNESS.read_bytes())
    agency = json.loads((AGENCY/'report.json').read_bytes());imagery = json.loads((IMAGERY/'report.json').read_bytes())
    cases = [e['candidate'] for e in native['candidates']]
    need(native['report_sha256'] == digest(WITNESS) and agency['native_sha256'] == digest(AGENCY/'native.json')
         and cases == witness['candidates'] == [p['candidate'] for p in imagery['points']] and len(cases) == 5,
         'Exact native, agency, witness and dated image site identities required')
    manifest = json.loads((OUTPUT/'manifest.json').read_bytes())
    need(manifest['schema'] == 'northern-cdot-structure-source-manifest-v1' and manifest['original_responses_published'] is False
         and manifest['release_eligible'] is False and manifest['native_sha256'] == digest(AGENCY/'native.json')
         and manifest['agency_report_sha256'] == digest(AGENCY/'report.json')
         and manifest['imagery_report_sha256'] == digest(IMAGERY/'report.json'), 'Exact research-only source manifest required')
    expected = {f'cdot-{layer}-metadata':BASE+str(layer)+'?f=pjson' for layer in LAYERS}
    for c in cases:
        for layer in LAYERS:
            for ids in [False, True]:
                key = c['id']+'-structure-context-'+str(layer)+('-ids' if ids else '')
                expected[key] = query_url(c,layer,ids)
    need(set(manifest['sources']) == set(expected) and len(expected) == 33
         and all(manifest['sources'][k]['url'] == url for k,url in expected.items()), 'All 33 exact primary source requests required')
    return native, manifest


def audit(directory):
    native, manifest = inputs();originals = {}
    for key,record in manifest['sources'].items():
        raw = (Path(directory)/(key+'.json')).read_bytes()
        need(0 < len(raw) <= 1_000_000 and source_sha(raw) == record['semantic_sha256'], 'Protected CDOT source content changed: '+key)
        originals[key] = json.loads(raw)
    for layer,name in LAYERS.items():
        meta = originals[f'cdot-{layer}-metadata']
        need(meta['id'] == layer and meta['name'] == name, 'Exact source layer identity required')
    points = []
    for entry in native['candidates']:
        c = entry['candidate'];key = c['id'];project,operation = projector(26913);point = project(c['lonlat']);inventories = {};selected = {}
        for layer in LAYERS:
            body = originals[key+'-structure-context-'+str(layer)]
            ids = originals[key+'-structure-context-'+str(layer)+'-ids'];rows = complete_features(body,ids,layer)
            inventories[str(layer)] = dict(feature_count=len(rows),object_ids=sorted(f['attributes']['OBJECTID'] for f in rows))
            if layer != 9:
                ranked = point_rows(rows,point);selected[layer] = ranked
                inventories[str(layer)]['class_counts'] = {value:sum(r['attributes']['STRUCTURE_CLASS']==value for r in ranked)
                    for value in sorted({r['attributes']['STRUCTURE_CLASS'] for r in ranked})}
                inventories[str(layer)]['bridges'] = [r for r in ranked if r['attributes']['STRUCTURE_CLASS'] == 'Bridge']
                inventories[str(layer)]['nearest_four_signals'] = [r for r in ranked if r['attributes']['STRUCTURE_CLASS'] == 'Signal'][:4]
            else:
                ranked = []
                for f in rows:
                    match = closest(point,f['geometry']['paths'])
                    ranked.append(dict(attributes={k:f['attributes'][k] for k in ACCESS_FIELDS},
                        nominal_line_registration_m=match['distance_native'],source_geometry_sha256=canonical_sha(f['geometry'])))
                ranked.sort(key=lambda r:(r['nominal_line_registration_m'],r['attributes']['OBJECTID']))
                inventories[str(layer)]['records'] = ranked
                inventories[str(layer)]['recorded_osm_route_matches'] = [r for r in ranked if r['attributes']['ROUTE'] == entry['raw_way']['tags']['CDOT_route']]
        points.append(dict(candidate=c,osm_way_tags=entry['raw_way']['tags'],coordinate_operation=operation,
            requested_query_radius_m=500,query_is_complete_world_inventory=False,inventories=inventories,
            bridge_inventory_comparison=compare_bridges(selected[0],selected[31]),
            nearby_direction_labels_assign_lane=False,access_categories_grant_vehicle_permission=False,
            grade_certified=False,access_verified=False,anchor_adopted=False))
    return dict(schema='northern-cdot-structure-context-v1',implementation_sha256=digest(__file__),
        manifest_sha256=digest(OUTPUT/'manifest.json'),points=points,approved_connectors=0,anchors_adopted=False,
        access_verified=False,geographic_coverage_certified=False,release_eligible=False,
        scope='Nearby state structure points, literal signal labels and highway access classifications only. '
              'Separate source queries have complete returned ID inventories, not a complete world survey. '
              'A structure point is not a bridge footprint; a signal point/label is not an assigned lane or a turn rule. '
              'Different CDOT layers share a publisher and are not independent corroboration. '
              'Do not infer no bridge from zero returned bridge points, or legal car entry from an arterial classification. '
              'Native coordinate registration has stated datum accuracy, not a certified error bound or connector cost. '
              'No grade, current legal/physical access, anchor adoption, route optimality or geographic coverage is certified.')


def download(directory):
    _,manifest = inputs();directory = Path(directory);directory.mkdir(parents=True,exist_ok=True);receipts = {}
    for key,record in manifest['sources'].items():
        with urllib.request.urlopen(record['url'],timeout=45) as response:
            need(response.status == 200 and response.geturl() == record['url'], 'Exact primary HTTP200 source required')
            raw = response.read(1_000_001)
        need(0 < len(raw) <= 1_000_000, 'Bounded full source response required')
        if source_sha(raw) != record['semantic_sha256']:
            value = source_value(raw);top = {k:canonical_sha(v) for k,v in value.items()}
            changed = sorted(k for k in top.keys()|record['top_level_sha256'].keys() if top.get(k)!=record['top_level_sha256'].get(k))
            raise ValueError(f'CDOT source changed: {key}; changed fields={changed}. Inspect before refreshing any snapshot.')
        (directory/(key+'.json')).write_bytes(raw);sha = hashlib.sha256(raw).hexdigest()
        receipts[key] = dict(sha256=sha,size_bytes=len(raw),semantic_sha256=source_sha(raw),status=200,
            captured_at_utc=datetime.now(timezone.utc).isoformat(),captured_raw_bytes_equal=sha == record['sha256'] and len(raw) == record['size_bytes'])
    (directory/'fresh-source-receipts.json').write_bytes(encoded(dict(schema='northern-structure-source-receipts-v1',
        manifest_sha256=digest(OUTPUT/'manifest.json'),sources=receipts)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original-dir',type=Path,required=True);parser.add_argument('--download',action='store_true');parser.add_argument('--write',action='store_true')
    args = parser.parse_args()
    if args.download: download(args.original_dir)
    actual = audit(args.original_dir)
    if args.write: (OUTPUT/'report.json').write_bytes(encoded(actual))
    else: need(actual == json.loads((OUTPUT/'report.json').read_bytes()), 'Retained structure context differs')
    print(json.dumps(dict(points=len(actual['points']),sources=33,access_verified=False,release_eligible=False)))
