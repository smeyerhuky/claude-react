"""Check retained municipal/raw-source context without certifying an urban entry."""
import hashlib
import json
from pathlib import Path
from metro_scenario_checkpoint import require

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/tucson-urban-entry-context'


def audit(root=REFERENCE):
    root = Path(root).resolve(); manifest = json.loads((root/'manifest.json').read_text())
    require(manifest['schema'] == 'tucson-urban-entry-context-manifest-v1'
            and all(manifest.get(k) is False for k in ('access_verified','anchor_adopted','release_eligible')),
            'Unadopted municipal entry context required')
    data = {}
    for name, record in manifest['files'].items():
        path = (root/name).resolve(); require(path.is_relative_to(root) and path.is_file(), 'Retained context path required')
        raw = path.read_bytes()
        require(len(raw) == record['bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'], 'Retained context bytes changed: '+name)
        value = json.loads(raw)
        require(not value.get('error') and not value.get('exceededTransferLimit'), 'Incomplete municipal/context response')
        data[name] = value
    layer = data['municipal-layer.json']; lots = data['municipal-lots.json']; item = data['operator-map-item.json']
    require(item['owner'] == 'tucsonapps_cotgis' and item['title'] == 'Park Tucson' and item['access'] == 'public', 'Review changed operator publication identity')
    require(layer['name'] == 'AllLotsGaragesEntrances' and layer['geometryType'] == 'esriGeometryPoint', 'Meter/other layer cannot masquerade as vehicle entry context')
    require('Feb. 2017' in layer['description'], 'Retain historical source-description limitation')
    url = manifest['files']['municipal-layer.json']['url'].split('?')[0]
    require(any(l.get('url') == url for l in data['operator-webmap.json']['operationalLayers']), 'Layer must be linked from retained operator map')
    require(lots['spatialReference']['wkid'] == 4326, 'Explicit requested GIS coordinate reference required')
    ids = [r['attributes']['FID'] for r in lots['features']]
    require(len(ids) == len(set(ids)) == 40, 'Exact complete retained facility inventory required')
    first = next(r for r in lots['features'] if r['attributes']['FID'] == 1)
    require(first['attributes']['NAME'] == 'Pennington Street Garage'
            and first['attributes']['ENTRANCE'] == 'From Scott Av.' and first['attributes']['PUBLIC_SPA'] == 711,
            'Review changed named facility/use context')
    construction = next(r for r in lots['features'] if r['attributes']['FID'] == 32)['attributes']
    require(construction['Status'] == 'Active' and 'under construction' in construction['ADDRESS'], 'Do not erase contradictory status context')
    context = data['osm-context.json']
    require(context['source_sha256'] == manifest['osm_source']['sha256'] and context['source_bytes'] == manifest['osm_source']['bytes'], 'Exact original OSM identity required')
    require(context['municipal_point_lonlat'] == [first['geometry']['x'], first['geometry']['y']]
            and context['access_verified'] is False and context['anchor_adopted'] is False and context['release_eligible'] is False,
            'Map point is context only, never an adopted origin')
    return dict(municipal_facilities=40, selected_facility_id=1, raw_highway_ways=len(context['ways']),
                raw_restrictions=len(context['restrictions']), source_description_year=2017,
                contradictory_construction_feature_id=32, entry_path_verified=False, anchor_adopted=False,
                access_verified=False, release_eligible=False)


if __name__ == '__main__': print(json.dumps(audit(), indent=2))
