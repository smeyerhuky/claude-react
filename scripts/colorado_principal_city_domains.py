"""Source-backed research domains for potential city anchors; never access approval."""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path

from larimer_census_water_mask import (ROOT, OPERATION, source_reader, encoded,
                                       geometry_encoded, digest, require)
from metro_competition_bounds import RADIUS_M, distance_lower_bound, number, point
from metro_principal_city_inventory import project as principal_inventory, REFERENCE as PRINCIPAL

OUTPUT = ROOT/'docs/research/colorado-principal-city-domains'
SOURCE = dict(name='tl_2025_08_place.zip',
              url='https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_08_place.zip',
              size_bytes=2791333, sha256='e0072e2f1c049e53d598119014e6bc93f82a0a02082b3604d81b0a8c3e8b043c', records=482)
PLACE_FLAGS = {'PCICBSA': 'Y', 'FUNCSTAT': 'A', 'CLASSFP': 'C1'}
QUERY_POINT = [-105.08, 40.59]  # Arbitrary geographic context, not an adopted endpoint.


def expected_cities():
    inventory = principal_inventory()
    require(inventory == json.loads((PRINCIPAL/'report.json').read_bytes()), 'Official principal-city inventory changed')
    cities = next(state['principal_city_memberships'] for state in inventory['states'] if state['state'] == 'CO')
    require(len(cities) == len({city['principal_city_id'] for city in cities}) == 12
            and len({city['cbsa'] for city in cities}) == 7, 'Complete unique Colorado principal-city set required')
    return {city['principal_city_id']: {'cbsa': city['cbsa'], 'name': city['name']} for city in cities}


def exact(value):
    return [str(value.numerator), str(value.denominator)]


def fraction(value):
    require(isinstance(value, list) and len(value) == 2, 'Explicit rational pair required')
    return number(value[0])/number(value[1])


def enclosing_ball(bounds):
    require(isinstance(bounds, (list, tuple)) and len(bounds) == 4, 'Explicit geographic box required')
    west, south, east, north = map(number, bounds)
    point([west, south]); point([east, north])
    require(west <= east and east-west < 180 and south <= north, 'Unwrapped ordered domain required')
    center = [float((west+east)/2), float((south+north)/2)]
    lon, lat = point(center)
    # A meridian + parallel walk bounds spherical distance from above. cos <= 1,
    # pi < 22/7; use exact stored endpoints/center so rounding cannot shrink it.
    radius = RADIUS_M*Fraction(22, 7)*(max(abs(west-lon), abs(east-lon))
                                      + max(abs(south-lat), abs(north-lat)))/180
    return dict(center_lonlat=center, radius_m_exact=exact(radius), sphere_radius_m=RADIUS_M,
                method='rational-meridian-parallel-box-enclosure-v1')


def rectangle_distance_lower_bound(bounds, destination):
    require(isinstance(bounds, (list, tuple)) and len(bounds) == 4, 'Explicit geographic box required')
    west, south, east, north = map(number, bounds)
    point([west, south]); point([east, north]); lon, lat = point(destination)
    require(west <= east and east-west < 180 and south <= north, 'Unwrapped ordered domain required')
    latitude_gap = max(south-lat, lat-north, Fraction(0))
    def circular_gap(value):
        delta = abs(lon-value)
        return min(delta, 360-delta)
    longitude_gap = Fraction(0) if west <= lon <= east else min(circular_gap(west), circular_gap(east))
    # Both minima are optimistic for every possible point of the box. Their
    # maximum is a valid bound; adding them would double-count path distance.
    latitude = RADIUS_M*Fraction(314,100)*latitude_gap/180
    longitude = 2*RADIUS_M*(1-max(abs(lat),abs(south),abs(north))/90)*longitude_gap/180
    return max(latitude, longitude)


def derive(original):
    from pyproj import Transformer
    from shapely.geometry import shape, mapping
    from shapely.ops import transform
    cities = expected_cities(); features = []
    operation = Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1188')
    require(operation.accuracy == 4.0, 'Unexpected coordinate operation')
    with source_reader(Path(original), SOURCE) as reader:
        for record in reader.iterShapeRecords():
            attributes = record.record.as_dict(); identity = attributes['GEOID']
            if identity not in cities:
                continue
            expected = cities[identity]
            require(attributes['STATEFP'] == '08' and attributes['NAME'] == expected['name']
                    and all(attributes[key] == value for key, value in PLACE_FLAGS.items()), 'Place identity/name/status changed')
            geometry = transform(operation.transform, shape(record.shape.__geo_interface__))
            require(geometry.geom_type in ('Polygon', 'MultiPolygon') and geometry.is_valid
                    and not geometry.is_empty, 'Valid complete city polygon required; no repair')
            features.append(dict(type='Feature', properties=dict(principal_city_id=identity, **expected, **PLACE_FLAGS), geometry=mapping(geometry)))
    features.sort(key=lambda feature: feature['properties']['principal_city_id'])
    require(len(features) == len(cities) and {f['properties']['principal_city_id'] for f in features} == set(cities),
            'Every required principal city must occur exactly once')
    geometry = geometry_encoded(dict(type='FeatureCollection', features=features))
    manifest = dict(schema='colorado-principal-city-domain-inputs-v1', publisher='U.S. Census Bureau',
                    source=SOURCE, coordinate_operation=OPERATION, required_cities=cities,
                    retained_geometry_sha256=hashlib.sha256(geometry).hexdigest(),
                    principal_inventory_sha256=digest(PRINCIPAL/'report.json'),
                    original_water_mask_not_used=True, anchors_adopted=False, release_eligible=False)
    return {'cities.geojson': geometry, 'manifest.json': encoded(manifest)}


def load_features(root):
    manifest = json.loads((Path(root)/'manifest.json').read_bytes())
    expected = expected_cities()
    require(set(manifest) == {'schema', 'publisher', 'source', 'coordinate_operation', 'required_cities',
                              'retained_geometry_sha256', 'principal_inventory_sha256',
                              'original_water_mask_not_used', 'anchors_adopted', 'release_eligible'}
            and manifest['schema'] == 'colorado-principal-city-domain-inputs-v1'
            and manifest['publisher'] == 'U.S. Census Bureau' and manifest['source'] == SOURCE
            and manifest['coordinate_operation'] == OPERATION
            and manifest['coordinate_operation']['accuracy_is_error_bound'] is False
            and manifest['required_cities'] == expected
            and manifest['principal_inventory_sha256'] == digest(PRINCIPAL/'report.json')
            and manifest['original_water_mask_not_used'] is True
            and manifest['anchors_adopted'] is False and manifest['release_eligible'] is False,
            'Exact source and complete principal-city binding required')
    require(digest(Path(root)/'cities.geojson') == manifest['retained_geometry_sha256'], 'Retained city geometry changed')
    data = json.loads((Path(root)/'cities.geojson').read_bytes())
    require(set(data) == {'type', 'features'} and data['type'] == 'FeatureCollection'
            and len(data['features']) == 12, 'Complete bounded feature inventory required')
    from shapely.geometry import shape
    features = {}
    for feature in data['features']:
        require(isinstance(feature, dict) and set(feature) == {'type', 'properties', 'geometry'}
                and feature['type'] == 'Feature' and isinstance(feature['geometry'], dict)
                and set(feature['geometry']) == {'type', 'coordinates'}, 'Exact GeoJSON feature schema required')
        properties = feature['properties']; identity = properties['principal_city_id']
        require(identity in expected and identity not in features
                and properties == dict(principal_city_id=identity, **expected[identity], **PLACE_FLAGS), 'City membership changed or duplicated')
        geometry = shape(feature['geometry'])
        require(geometry.geom_type in ('Polygon', 'MultiPolygon') and geometry.is_valid
                and not geometry.is_empty, 'Invalid retained city geometry')
        enclosing_ball(geometry.bounds)  # Also checks geographic coordinate bounds.
        features[identity] = (properties, geometry)
    require(set(features) == set(expected), 'Missing required principal city')
    return features


def candidate_city_check(city_id, lonlat, root=OUTPUT):
    from shapely.geometry import Point
    features = load_features(root); point(lonlat)
    require(all(type(value) in (int, float) for value in lonlat), 'Stored numeric coordinates required for polygon membership')
    require(city_id in features, 'Candidate city outside retained principal inventory')
    properties, geometry = features[city_id]
    return dict(principal_city_id=city_id, cbsa=properties['cbsa'], point_lonlat=list(lonlat),
                covered_by_supplied_city_polygon=bool(geometry.covers(Point(lonlat))),
                legal_jurisdiction_certified=False, anchor_adopted=False,
                access_verified=False, release_eligible=False)


def audit(root=OUTPUT):
    root = Path(root); features = load_features(root)
    cities = []
    for identity, (properties, geometry) in sorted(features.items()):
        ball = enclosing_ball(geometry.bounds)
        lower = max(distance_lower_bound(ball['center_lonlat'], QUERY_POINT, fraction(ball['radius_m_exact'])),
                    rectangle_distance_lower_bound(geometry.bounds, QUERY_POINT))
        cities.append(dict(**properties, bounds_lonlat=list(geometry.bounds), enclosing_ball=ball,
                           conditional_distance_lower_bound_exact=exact(lower)))
    metros = []
    for cbsa in sorted({row['cbsa'] for row in cities}):
        rows = [row for row in cities if row['cbsa'] == cbsa]
        # Any required city's reviewed anchor could be the nearest. Never pick
        # only the title's first city, a centroid or the best-known candidate.
        lower = min(fraction(row['conditional_distance_lower_bound_exact']) for row in rows)
        metros.append(dict(cbsa=cbsa, required_principal_city_ids=[row['principal_city_id'] for row in rows],
                           conditional_distance_lower_bound_exact=exact(lower)))
    return dict(schema='colorado-principal-city-domains-research-v1', city_domains=cities, metro_domains=metros,
                geographic_context_point=QUERY_POINT, original_source_replayed=False,
                distance_bound_method='max-of-rational-box-and-enclosing-ball-bounds-v1',
                manifest_sha256=digest(root/'manifest.json'),
                implementation_sha256={name: digest(ROOT/'scripts'/name) for name in (
                    'colorado_principal_city_domains.py', 'larimer_census_water_mask.py',
                    'metro_principal_city_inventory.py', 'metro_competition_bounds.py')},
                adopted_anchor_registry=False, access_verified=False, release_eligible=False,
                complete_global_competition=False, applied_competitor_exclusions=[],
                travel_time_lower_bounds=None,
                warning='Conditional source-model domains only: requires a separately reviewed policy restricting anchors to these exact polygons and compatible full-route geometric cost domination. City footprints do not prove legal/physical vehicle access or current jurisdiction. No global speed ceiling, incumbent path, exterior closure or metro exclusion is established. Missing required anchors remain unknown under the unchanged anchor-set contract.')


def verify_original(original, root=OUTPUT):
    require(all((Path(root)/name).read_bytes() == content for name, content in derive(original).items()),
            'Exact original replay differs from retained city domains')
    return dict(original_source_replayed=True, cities=12, metros=7, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=OUTPUT)
    parser.add_argument('--original', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.write:
        require(args.original is not None, 'Writing requires exact original Census file')
        args.root.mkdir(parents=True, exist_ok=True)
        for name, content in derive(args.original).items(): (args.root/name).write_bytes(content)
        (args.root/'report.json').write_bytes(encoded(audit(args.root)))
    report = audit(args.root)
    require(report == json.loads((args.root/'report.json').read_bytes()), 'Frozen city-domain checkpoint changed')
    result = dict(cities=len(report['city_domains']), metros=len(report['metro_domains']),
                  applied_competitor_exclusions=[], original_source_replayed=False, release_eligible=False)
    if args.original: result.update(verify_original(args.original, args.root))
    print(json.dumps(result, indent=2))
