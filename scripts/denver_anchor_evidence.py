"""Reproduce Denver reference-junction evidence, without approving a connector."""
import argparse
import hashlib
import json
import math
from pathlib import Path

DEFAULT_ROOT = Path(__file__).resolve().parents[1] / 'docs/research/denver-urban-anchor'
WAY_IDS = {475723486, 640085099}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def load_bundle(root):
    root = Path(root).resolve()
    manifest = json.loads((root / 'manifest.json').read_text())
    require(manifest['schema'] == 'denver-urban-anchor-evidence-v1', 'Unknown bundle schema')
    result = {}
    for name, record in manifest['files'].items():
        path = (root / name).resolve()
        require(path.is_relative_to(root), 'Evidence path escapes bundle')
        raw = path.read_bytes()
        require(len(raw) == record['size_bytes'] and
                hashlib.sha256(raw).hexdigest() == record['sha256'], 'Evidence bytes changed: ' + name)
        value = json.loads(raw)
        require(not value.get('error'), 'ArcGIS error response: ' + name)
        require(not value.get('exceededTransferLimit', False), 'Incomplete query: ' + name)
        result[name] = value
    require(result['osm-extract.json']['source_sha256'] == manifest['osm_source']['sha256'],
            'Extract source binding differs')
    return manifest, result


def haversine(a, b):
    lon1, lat1, lon2, lat2 = map(math.radians, (*a, *b))
    h = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371008.8 * 2 * math.asin(min(1, math.sqrt(h)))


def audit(data):
    for name in ('streets-item.json', 'signs-item.json', 'parking-item.json'):
        require(data[name]['orgId'] == 'zdB7qR0BtYrg0Xpl', 'Unexpected publisher organization')
    require(data['streets-item.json']['owner'] == 'The_City_and_County_of_Denver',
            'Unexpected street publisher')
    streets = data['streets.json']
    signs = data['signs.json']
    require(streets['spatialReference']['wkid'] == signs['spatialReference']['wkid'] == 4326,
            'Expected WGS84 query geometry')
    index = {f['attributes']['OBJECTID']: f for f in streets['features']}
    required = [(1002, '17TH ST'), (6783, 'WYNKOOP ST'), (23202, 'WYNKOOP ST')]
    for identity, name in required:
        a = index[identity]['attributes']
        require(a['FULLNAME'] == name and a['STATUS'] == 'CONSTRUCTED'
                and a['JURISID'] == a['MAINTNCE'] == 'DENVER', 'Street identity/status changed')
        require(a['ONEWAY'] == a['F_ZLEV'] == a['T_ZLEV'] == 0, 'Street direction/grade changed')
    fields = {f['name']: f for f in data['streets-layer.json']['fields']}
    for name, expected in [('ONEWAY', 'Two Way'), ('F_ZLEV', 'Surface'), ('T_ZLEV', 'Surface')]:
        values = {v['code']: v['name'] for v in fields[name]['domain']['codedValues']}
        require(values[0] == expected, 'Do not guess undocumented coded values')
    point = index[1002]['geometry']['paths'][0][-1]
    require(point == index[6783]['geometry']['paths'][0][0]
            == index[23202]['geometry']['paths'][0][-1], 'Municipal junction endpoints differ')
    require(index[1002]['attributes']['TNODE'] == index[6783]['attributes']['FNODE']
            == index[23202]['attributes']['TNODE'] == 4993, 'Municipal topology differs')
    ways = data['osm-extract.json']['ways']
    require({w['id'] for w in ways} == WAY_IDS, 'Unexpected OSM ways')
    common = set.intersection(*({n[0] for n in w['nodes']} for w in ways))
    require(common == {3033992180}, 'OSM shared junction differs')
    nodes = [n for w in ways for n in w['nodes'] if n[0] == 3033992180]
    require(nodes[0] == nodes[1], 'OSM coordinates conflict')
    osm_point = nodes[0][1:]
    gap = haversine(point, osm_point)
    require(gap < 3, 'Municipal/OSM junction mismatch; do not auto-snap')
    sign_index = {f['attributes']['OBJECTID']: f for f in signs['features']}
    selected = []
    for identity, phrase in [(116106, 'LOADING ONLY ALL TIMES'),
                             (205538, 'PASSENGER LOADING ONLY 7AM-5PM'),
                             (116092, 'RESERVED ADA PARKING')]:
        sign = sign_index[identity]
        require(phrase in sign['attributes']['MUTCD_CodeDescription'], 'Restriction record changed')
        selected.append({'objectid': identity, 'description': sign['attributes']['MUTCD_CodeDescription'],
                         'lonlat': [sign['geometry']['x'], sign['geometry']['y']],
                         'collection_epoch_ms': sign['attributes']['OrigCollectionDate']})
    unknown = sum(not f['attributes'].get('MUTCD_CodeDescription', '').strip() for f in signs['features'])
    return {'schema': 'denver-reference-junction-audit-v1', 'municipal_node': 4993,
            'municipal_reference_lonlat': point, 'osm_node': 3033992180,
            'osm_reference_lonlat': osm_point, 'reference_displacement_m': gap,
            'street_records_checked': [x[0] for x in required],
            'municipal_grade_code_meaning': 'Surface', 'municipal_direction_code_meaning': 'Two Way',
            'sign_records_in_query': len(signs['features']), 'sign_records_without_description': unknown,
            'selected_restrictions': selected,
            'parking_restriction_records_in_larger_query': len(data['parking-restrictions.json']['features']),
            'restrictions_touching_selected_osm_ways': data['osm-extract.json']['restrictions_touching_selected_ways'],
            'entry_path_selected': False, 'anchor_adopted': False,
            'access_verified': False, 'release_eligible': False,
            'warning': 'Reference junction only. Sign points do not define curb-zone endpoints or legal access; missing records are unknown, not unrestricted.'}


def reproduce_osm(path, manifest, expected):
    import osmium
    path = Path(path)
    require(path.stat().st_size == manifest['osm_source']['size_bytes'], 'Wrong OSM source size')
    with path.open('rb') as f:
        require(hashlib.file_digest(f, 'sha256').hexdigest() == manifest['osm_source']['sha256'],
                'Wrong OSM source hash')
    class Scan(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.ways, self.restrictions = [], []
        def way(self, w):
            if w.id in WAY_IDS:
                require(all(n.location.valid() for n in w.nodes), 'Missing source node location')
                self.ways.append({'id': w.id, 'version': w.version, 'timestamp': str(w.timestamp),
                                  'tags': dict(w.tags), 'nodes': [[n.ref, n.lon, n.lat] for n in w.nodes]})
        def relation(self, r):
            if r.tags.get('type') == 'restriction' and any(m.type == 'w' and m.ref in WAY_IDS for m in r.members):
                self.restrictions.append({'id': r.id, 'tags': dict(r.tags),
                                          'members': [[m.type, m.ref, m.role] for m in r.members]})
    scan = Scan()
    scan.apply_file(str(path), locations=True, idx='sparse_file_array')
    require(scan.ways == expected['ways'] and
            scan.restrictions == expected['restrictions_touching_selected_ways'], 'Raw-source reproduction differs')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    parser.add_argument('--osm', type=Path)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    manifest, data = load_bundle(args.root)
    report = audit(data)
    if args.osm:
        reproduce_osm(args.osm, manifest, data['osm-extract.json'])
        report['raw_osm_reproduced'] = True
    text = json.dumps(report, indent=2) + '\n'
    if args.output:
        args.output.write_text(text)
    print(text)
