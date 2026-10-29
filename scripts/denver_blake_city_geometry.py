"""Compare a proposed OSM driveway with historical city polygons, without access certification."""
import hashlib
import json
from pathlib import Path
from shapely.geometry import LineString, Polygon
from shapely.ops import transform
from pyproj import Transformer
from denver_anchor_evidence import require

ROOT = Path(__file__).resolve().parents[1]
BUNDLE = ROOT / 'docs/research/denver-rtd-anchor/city-geometry'


def audit(root=BUNDLE):
    root = Path(root).resolve()
    manifest = json.loads((root / 'manifest.json').read_text())
    require(manifest['schema'] == 'denver-blake-city-geometry-v1', 'Unknown schema')
    data = {}
    for record in manifest['files']:
        path = (root / (record['name'] + '.json')).resolve()
        require(path.is_relative_to(root), 'Path escapes bundle')
        raw = path.read_bytes()
        require(len(raw) == record['size_bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'], 'Changed source')
        value = json.loads(raw)
        require(not value.get('error') and not value.get('exceededTransferLimit'), 'Incomplete response')
        data[record['name']] = value
    for name in ['driveways', 'lots']:
        item = data[name + '-item']
        require(item['owner'] == 'The_City_and_County_of_Denver', 'Unexpected publisher')
        require('2022 aerial imagery' in item['description'] and 'compiled in 2D' in item['description'], 'Source limitation changed')
        if data[name]['features']:
            require(data[name]['spatialReference']['wkid'] == 4326, 'Expected WGS84 query')
    require('entrance into the lot is included' in data['lots-item']['description'], 'Capture semantics changed')
    raw = (ROOT / 'docs/research/denver-rtd-anchor/osm-extract.json').read_bytes()
    source_manifest = json.loads((ROOT / 'docs/research/denver-rtd-anchor/manifest.json').read_text())
    require(hashlib.sha256(raw).hexdigest() == source_manifest['files']['osm-extract.json']['sha256'], 'OSM extract changed')
    way = next(w for w in json.loads(raw)['ways'] if w['id'] == 436487553)
    project = Transformer.from_crs(4326, 32613, always_xy=True).transform
    line = transform(project, LineString([n[1:] for n in way['nodes']]))
    intersections = []
    for feature in data['lots']['features']:
        rings = feature['geometry']['rings']
        polygon = Polygon(rings[0], rings[1:])
        require(polygon.is_valid, 'Invalid polygon; do not repair silently')
        geometry = transform(project, polygon)
        overlap = line.intersection(geometry).length
        if overlap:
            intersections.append({'city_objectid': feature['attributes']['OBJECTID'],
                                  'type': feature['attributes']['TYPE'],
                                  'overlap_m': round(overlap, 3),
                                  'outside_polygon_m': round(line.difference(geometry).length, 3),
                                  'covers_road_junction': geometry.covers(line.boundary.geoms[-1])})
    return {'schema': 'denver-blake-city-geometry-audit-v1',
            'osm_extract_sha256': hashlib.sha256(raw).hexdigest(),
            'osm_way': way['id'], 'measurement_crs': 'EPSG:32613',
            'planar_driveway_length_m': round(line.length, 3),
            'city_driveway_polygons_in_query': len(data['driveways']['features']),
            'city_parking_polygons_in_query': len(data['lots']['features']),
            'parking_intersections': intersections,
            'imagery_year': 2022, 'observed_current_conditions': False,
            'physical_connection_verified': False, 'legal_access_verified': False,
            'same_grade_verified': False, 'turns_verified': False,
            'access_verified': False, 'release_eligible': False,
            'warning': 'Historical 2D footprint corroboration only. Empty driveway query is not absence of access; lot polygons do not establish ownership, permission, elevation or current conditions.'}


if __name__ == '__main__':
    print(json.dumps(audit(), indent=2))
