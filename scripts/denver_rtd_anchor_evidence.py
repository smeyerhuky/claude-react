"""Replay RTD anchor screening; no coordinate adoption or access approval."""
import argparse
import hashlib
import json
from pathlib import Path
from denver_anchor_evidence import haversine, require

ROOT = Path(__file__).resolve().parents[1]
DEFAULT = ROOT / 'docs/research/denver-rtd-anchor'


def audit(root=DEFAULT):
    root = Path(root).resolve()
    manifest = json.loads((root / 'manifest.json').read_text())
    require(manifest['schema'] == 'denver-rtd-anchor-evidence-v1', 'Unknown schema')
    metro = (ROOT / manifest['metro_source']['path']).read_bytes()
    require(hashlib.sha256(metro).hexdigest() == manifest['metro_source']['sha256'], 'Metro source changed')
    data = {}
    for name, record in manifest['files'].items():
        path = (root / name).resolve()
        require(path.is_relative_to(root), 'Evidence path escapes bundle')
        raw = path.read_bytes()
        require(len(raw) == record['size_bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'],
                'Evidence changed: ' + name)
        value = json.loads(raw)
        require(not value.get('error') and not value.get('exceededTransferLimit'), 'Incomplete source')
        data[name] = value
    item = data['rtd-map-item.json']
    require(item['owner'] == 'rtdgis' and item['title'] == 'RTD Facilities Map', 'Publisher changed')
    require('generalized location' in item['description'] and 'planning purposes only' in item['description'],
            'Do not omit coordinate limitations')
    endpoint = manifest['files']['rtd-layer.json']['url'].split('?')[0]
    require(any(l.get('url') == endpoint for l in data['rtd-map-data.json']['operationalLayers']),
            'Layer is not linked from operator map')
    osage = data['rtd-osage.json']['features']
    require(len(osage) == 1 and osage[0]['attributes']['AUTOS'] == 0, 'Osage screening changed')
    response = data['rtd-denver-parking.json']
    require(response['spatialReference']['wkid'] == 4326, 'Expected WGS84')
    blake = [f for f in response['features'] if f['attributes']['NAME'] == '38th / Blake Station']
    require(len(blake) == 1 and blake[0]['attributes']['AUTOS'] == 200, 'Parking identity changed')
    require(blake[0]['attributes']['DIAGRAM'] is None, 'Re-evaluate available entrance evidence')
    extract = data['osm-extract.json']
    require(extract['source_sha256'] == manifest['osm_source']['sha256'], 'OSM source mismatch')
    ways = {w['id']: w for w in extract['ways']}
    driveway = ways[436487553]
    require(driveway['tags']['oneway'] == 'no' and driveway['tags']['service'] == 'driveway',
            'Modeled driveway changed')
    junction = driveway['nodes'][-1]
    require(junction[0] == 176077058 and all(junction in ways[i]['nodes'] for i in [16982882, 16984728]),
            'Modeled junction changed')
    length = sum(haversine(a[1:], b[1:]) for a, b in zip(driveway['nodes'], driveway['nodes'][1:]))
    point = blake[0]['geometry']
    return {'schema': 'denver-rtd-anchor-screen-v1', 'cbsa': '19740',
            'osage_parking_candidate_rejected': True, 'osage_operator_auto_spaces': 0,
            'blake_operator_auto_spaces': 200,
            'blake_generalized_facility_lonlat': [point['x'], point['y']],
            'modeled_driveway_way': driveway['id'], 'modeled_road_junction_node': junction[0],
            'modeled_road_junction_lonlat': junction[1:], 'modeled_driveway_length_m': length,
            'facility_point_to_modeled_junction_displacement_m': haversine([point['x'], point['y']], junction[1:]),
            'displacement_is_connector_length': False, 'driveway_is_approved_anchor': False,
            'connector_cost_seconds': None, 'entry_path_independently_verified': False,
            'access_verified': False, 'release_eligible': False,
            'decision': 'needs_evidence',
            'warning': 'Generalized operator facility point and OSM driveway do not prove exact entrance, rights, grade, turns or connector cost.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT)
    args = parser.parse_args()
    print(json.dumps(audit(args.root), indent=2))
