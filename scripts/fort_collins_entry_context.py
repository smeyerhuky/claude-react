"""Audit candidate-specific Fort Collins context; never approve entry or emit costs."""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import math
from pathlib import Path
from types import SimpleNamespace
from urllib.parse import urlsplit, parse_qs
from road_reference_way_permissions import evaluate, DEFAULTS
from stream_osm_roads import drivable

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'docs/research/fort-collins-entry-context'
FILES = {'office-notice.json', 'photo-observation.json', 'publisher.json', 'raw-osm-context.json',
         'streets-context.json', 'streets-item.json', 'streets-layer.json', 'streets-service.json',
         'taste-directions.json', 'where-to-park.json'}
CODE = ('fort_collins_entry_context.py', 'fort_collins_raw_context.py', 'road_reference_way_permissions.py',
        'road_reference_conditionals.py', 'road_reference_scenario.py', 'stream_osm_roads.py')
FLAGS = ('access_verified', 'anchor_adopted', 'release_eligible')


def need(condition, message):
    if not condition:
        raise ValueError(message)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project(folder=REFERENCE):
    folder = Path(folder)
    manifest = json.loads((folder / 'manifest.json').read_text())
    need(manifest['schema'] == 'fort-collins-entry-context-manifest-v1'
         and manifest['cbsa'] == '22660' and manifest['principal_city_id'] == '0827425',
         'Exact Fort Collins city and CBSA identity required')
    need(all(manifest.get(k) is False for k in (*FLAGS, 'connector_costs_included', 'geographic_coverage_certified')),
         'Context cannot adopt anchors, include connector costs or certify access/coverage')
    principal_path = ROOT / 'docs/research/principal-city-inventory/report.json'
    need(manifest['principal_inventory'] == dict(path=str(principal_path.relative_to(ROOT)), sha256=sha(principal_path)),
         'Exact official principal-city inventory required')
    parking_map = ROOT / 'docs/research/colorado-anchor-source-batch/fort-collins-map.pdf'
    need(manifest['municipal_parking_map'] == dict(path=str(parking_map.relative_to(ROOT)), sha256=sha(parking_map)),
         'Exact retained municipal parking-map bytes required')
    principal = json.loads(principal_path.read_text())
    expected_cities = sorted((c['principal_city_id'], c['name']) for s in principal['states']
                             for c in s['principal_city_memberships'] if c['cbsa'] == '22660')
    need(expected_cities == [('0827425', 'Fort Collins'), ('0846465', 'Loveland')],
         'Retain the complete two-principal-city identity set; this candidate cannot replace Loveland')
    need(set(manifest['files']) == FILES, 'Exact bounded evidence allowlist required')
    data = {}
    for name, record in manifest['files'].items():
        path = folder / name
        raw = path.read_bytes()
        need(len(raw) == record['size_bytes'] and sha(path) == record['sha256'], 'Evidence bytes changed: ' + name)
        value = json.loads(raw)
        need(isinstance(value, dict) and not value.get('error') and not value.get('exceededTransferLimit'),
             'Complete source response required: ' + name)
        data[name] = value
    for name in ('where-to-park', 'taste-directions', 'office-notice'):
        source = data[name + '.json']; capture = source['capture']
        host = 'tasteoffortcollins.com' if name == 'taste-directions' else 'www.fortcollins.gov'
        need(source['schema'] == 'fort-collins-publication-observation-v1'
             and capture['status'] == 200 and urlsplit(capture['url']).hostname == host
             and urlsplit(capture['final_url']).hostname == host
             and len(source['selected_quote'].split()) <= 25
             and source['observations'] and all(source.get(k) is False for k in FLAGS),
             'Explicit inspected publication identity, short excerpt and unadopted status required')
    terms = data['where-to-park.json']['published_conditions']
    need(terms == dict(hours_24_published=True, gateless_published=True, parking_session_required=True,
         posted_signs_still_apply=True, terms_are_connector_approval=False,
         parking_office_address='144 N. Mason St., Suite 5', office_address_is_vehicle_entrance=False),
         'Retain conditional public-use terms; gateless/free-hour descriptions cannot certify entry')
    event = data['taste-directions.json']['published_conditions']
    need(event == dict(named_entrance_street='N Mason St', exact_entrance_lonlat=None,
         event_reference_address_is_garage_entry=False, event_date_in_selected_page=None, only_entrance_proven=False),
         'Event venue address or a named street cannot become an exclusive surveyed garage entrance')
    office = data['office-notice.json']['published_conditions']
    need(office == dict(printed_office_address='114 N. Mason St., Ste 5.', corrected_address_selected=False,
                       office_or_court_door_is_vehicle_entrance=False),
         'Retain office-address disagreement without correction or car-entry inference')
    photo = data['photo-observation.json']
    need(photo['published_caption'] == 'Civic Center Parking Structure'
         and all(photo.get(k) is False for k in ('image_capture_date_known', 'geometry_or_grade_verified',
             'clearance_or_direction_decoded', 'access_verified', 'release_eligible')),
         'Undated published image cannot certify current grade, clearance, direction or access')
    publisher = data['publisher.json']['identity']
    item = data['streets-item.json']; service = data['streets-service.json']; layer = data['streets-layer.json']
    need(publisher == dict(id='dLpFH5mwVvxSN4OE', name='City of Fort Collins', urlKey='fcgov', customBaseUrl='maps.arcgis.com')
         and item['id'] == service['serviceItemId'] == 'f6380ef587ac4e54aaf988b15d8d1746'
         and item['orgId'] == publisher['id'] and item['owner'] == 'ftc_geoevent'
         and item['title'] == 'Street_Centerlines' and item['accessInformation'] == 'City of Fort Collins GIS'
         and item['url'] == 'https://services1.arcgis.com/dLpFH5mwVvxSN4OE/arcgis/rest/services/Street_Centerlines/FeatureServer'
         and 'accuracy, timeliness, or completeness' in item['licenseInfo'],
         'Exact municipal publisher/service identity and source limitations required')
    need(layer['name'] == 'Street Centerlines' and layer['geometryType'] == 'esriGeometryPolyline'
         and next(f for f in layer['fields'] if f['name'] == 'ONEWAY')['domain'] is None,
         'Street layer/code context changed; do not guess undocumented directions')
    streets = data['streets-context.json']
    need(streets['spatialReference']['wkid'] == 4326 and len(streets['features']) == 12,
         'Complete retained WGS84 envelope response required')
    query = parse_qs(urlsplit(manifest['files']['streets-context.json']['capture']['url']).query)
    need(query['geometry'] == ['-105.0795,40.5874,-105.0776,40.5892']
         and query['inSR'] == query['outSR'] == ['4326'] and query['resultRecordCount'] == ['1000'],
         'Exact declared street query envelope, CRS and bounded request required')
    ids = [f['attributes']['OBJECTID'] for f in streets['features']]
    need(len(set(ids)) == 12 and set(ids) == {1120, 1149, 1153, 1157, 1161, 1165, 1175, 1179, 5209, 7303, 7733, 9542},
         'Exact city street identities required')
    for feature in streets['features']:
        paths = feature['geometry']['paths']
        need(paths and all(len(path) >= 2 and all(len(row) == 2
             and all(type(v) in (int, float) and math.isfinite(v) for v in row)
             and -180 <= row[0] <= 180 and -90 <= row[1] <= 90 for row in path) for path in paths),
             'Explicit finite complete WGS84 street geometry required')
    mason = sorted((f['attributes'] for f in streets['features'] if f['attributes']['STRNAME'] == 'N MASON ST'),
                   key=lambda x: x['OBJECTID'])
    need([r['OBJECTID'] for r in mason] == [1175, 1179, 7303]
         and all(r['ONEWAY'] is None and r['REVDATE'] == 1383091200000 for r in mason),
         'Retain old null municipal direction fields; null never means two-way/current')
    raw = data['raw-osm-context.json']
    baseline = json.loads((ROOT / 'docs/research/census-33-source-checkpoint/baseline.json').read_text())
    identity = next(s for s in baseline['source_provenance'] if s['name'] == 'colorado.osm.pbf')
    need(raw['schema'] == 'fort-collins-unadopted-raw-context-v1' and raw['source'] == identity
         and raw['bounds_lonlat'] == [-105.0795, 40.5874, -105.0776, 40.5892]
         and all(raw.get(k) is False for k in (*FLAGS, 'connector_costs_included', 'datum_alignment_verified')),
         'Exact original unadopted raw source and investigation scope required')
    ways = {w['id']: w for w in raw['ways']}; nodes = {n['id']: n for n in raw['nodes']}
    need(len(ways) == len(raw['ways']) == 40 and len(nodes) == len(raw['nodes']) == 187
         and len(raw['nearby_tagged_nodes']) == 23 and len(raw['restrictions']) == 1,
         'Complete bounded raw-way/node/restriction inventory required')
    wanted = {row[0] for way in ways.values() for row in way['nodes']}
    need(wanted == set(nodes), 'One complete raw node record for every selected vertex required')
    for way in ways.values():
        for nid, lon, lat in way['nodes']:
            need(nodes[nid]['lonlat'] == [lon, lat], 'Selected raw way/node geometry disagreement')
    garage = ways[54882910]
    need(garage['tags']['building'] == 'parking' and garage['tags']['name'] == 'Civic Center Parking Garage'
         and garage['tags']['addr:housenumber'] == '120' and raw['garage_footprint_way'] == 54882910,
         'Retain OSM footprint/address identity without treating it as an adopted origin')
    connections = []
    for wid, first, last in ((696728762, 6543050320, 6543050321), (696728763, 6543050322, 6543050323)):
        way = ways[wid]
        need(way['tags']['highway'] == 'service' and way['nodes'][0][0] == first and way['nodes'][-1][0] == last
             and nodes[last]['tags']['amenity'] == 'parking_entrance' and last in {r[0] for r in garage['nodes']},
             'Mapped street-to-footprint connection changed')
        connections.append(dict(way_id=wid, road_node=first, mapped_entrance_node=last,
                                independently_matched_to_physical_entry=False))
    relation = raw['restrictions'][0]
    need(relation['id'] == 20193102 and relation['tags'] == dict(type='restriction',
         **{'restriction:conditional': 'no_u_turn @ (Th-Sa 19:00-00:00)'})
         and relation['members'] == [dict(type='w', ref=696728766, role='from'),
             dict(type='n', ref=6543050322, role='via'), dict(type='w', ref=1475543490, role='to')],
         'Retain exact conditional maneuver; never discard it as missing static restriction')
    bollard = nodes[7614361913]
    need(bollard['tags'] == dict(barrier='bollard', bollard='removable')
         and any(row[0] == bollard['id'] for row in ways[815164359]['nodes']),
         'Mapped removable bollard on service way must not disappear')
    profile = evaluate(ways[815164359], [nodes[nid] for nid in sorted({r[0] for r in ways[815164359]['nodes']})],
                       default_policy=DEFAULTS)
    need(drivable(SimpleNamespace(tags=ways[815164359]['tags'])) and profile['status'] == 'unsupported'
         and profile['direction_permissions'] is None and 'barrier' in profile['reason'],
         'Mapped node-control counterexample must remain unsupported without cost emission')
    findings = dict(physical_connection='The publications/photo do not independently match the full precise path to the raw entrance nodes.',
        legal_motor_access='Public hourly/gateless terms are useful, but current posted vehicle/path restrictions and the complete applicable entry conditions remain unresolved.',
        same_grade='City centerlines and an undated exterior photograph do not establish same-grade connectivity along the entire entry/exit.',
        direction_and_turns='Old null city fields are not current directions; raw one-way streets and conditional maneuver require separate evaluation and independent review.',
        connector_cost='No exact physical path/anchor is adopted; raw connection geometry and address displacement cannot be called reviewed connector cost.')
    return dict(schema='fort-collins-entry-context-report-v1', cbsa='22660', principal_city_id='0827425',
        required_principal_cities=[dict(principal_city_id=k, name=v) for k, v in expected_cities],
        required_anchor_set_accounted=False, retained_city_street_features=12,
        municipal_mason_rows=[dict(objectid=r['OBJECTID'], raw_oneway=r['ONEWAY'],
            raw_revision_date_utc=datetime.fromtimestamp(r['REVDATE'] / 1000, timezone.utc).date().isoformat()) for r in mason],
        municipal_null_oneway_interpreted_as_two_way=False, mapped_footprint_way=54882910,
        mapped_street_to_footprint_connections=connections, connector_costs_included=False,
        raw_context_counts={k: len(raw[k]) for k in ('ways', 'nodes', 'nearby_tagged_nodes', 'restrictions')},
        raw_conditional_maneuver=relation, conditional_maneuver_evaluated=False,
        node_control_counterexample=dict(way_id=815164359, node_id=7614361913,
            raw_control=bollard['tags'], legacy_way_predicate_accepts=True, reference_way_projection=profile,
            previously_sampled_route_crossing_claimed=False, real_world_closure_claimed=False),
        source_manifest_sha256=sha(folder / 'manifest.json'),
        implementation_sha256={name: sha(ROOT / 'scripts' / name) for name in CODE},
        findings={key: dict(status='unknown', reason=reason) for key, reason in findings.items()},
        access_verified=False, anchor_adopted=False, geographic_coverage_certified=False, release_eligible=False,
        warning='Candidate-specific evidence and raw-tag regressions, not independently approved access or real-world closure. The old costs/public map are unchanged; zero connectors approved; no Loveland anchor or complete metro anchor set adopted.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    result = project()
    path = REFERENCE / 'report.json'
    if args.write:
        path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    else:
        need(json.loads(path.read_text()) == result, 'Frozen Fort Collins context report differs')
    print(json.dumps(dict(raw_context_counts=result['raw_context_counts'], municipal_oneway_unknown=True,
        conditional_maneuver_evaluated=False, mapped_bollard_kept_unsupported=True,
        access_verified=False, release_eligible=False)))
