"""Replay a bounded Census land/water mask example; never certify road access."""
import argparse
import hashlib
import io
import json
from pathlib import Path
import zipfile

from colorado_geographic_mask import build_explicit_land_water_mask, _load_polygon_file

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/research/larimer-census-water-mask'
BOUNDS = [-105.20, 40.50, -105.00, 40.65]
WIDTH, HEIGHT = 100, 75
SOURCES = {
    'county': dict(name='cb_2025_us_county_500k.zip',
                   url='https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip',
                   size_bytes=11758981, sha256='aa976c00b181939755d0da757f4c7c2dc0103c3b3b4530fb2a91c2bb62fc777c', records=3235),
    'water': dict(name='tl_2025_08069_areawater.zip',
                  url='https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_08069_areawater.zip',
                  size_bytes=1049989, sha256='6cb0e04c3fa2282e74f1fcc9c6bd6f279e98f0780fe0c0ed1e22052d8014703b', records=2300),
}
SELECTION = 'all-source-water-polygons-intersecting-closed-window; complete geometry retained; no clipping or simplification'
OPERATION = dict(source_crs='EPSG:4269', output_crs='EPSG:4326',
                 operation='EPSG:1188', name='NAD83 to WGS 84 (1)', stated_accuracy_m=4.0,
                 accuracy_is_error_bound=False)
PROBES = {'western_reservoir_110436273317': [-105.16, 40.56],
          'city_park_lake': [-105.104, 40.5828], 'campus_context': [-105.084, 40.574]}


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def encoded(value):
    return (json.dumps(value, sort_keys=True, indent=2, allow_nan=False)+'\n').encode()


def source_reader(path, source):
    import shapefile
    from pyproj import CRS
    require(path.name == source['name'] and path.stat().st_size == source['size_bytes']
            and digest(path) == source['sha256'], 'Exact independently pinned Census original required')
    stem = path.stem
    with zipfile.ZipFile(path) as archive:
        names = archive.namelist()
        require(len(names) == len(set(names)) == 7
                and set(names) == {stem+suffix for suffix in ('.shp', '.shx', '.dbf', '.prj', '.cpg', '.shp.iso.xml', '.shp.ea.iso.xml')},
                'Unexpected Census archive members')
        require(sum(info.file_size for info in archive.infolist()) < 150*1024**2
                and archive.testzip() is None, 'Census archive budget or CRC failure')
        require(CRS.from_wkt(archive.read(stem+'.prj').decode()).to_epsg() == 4269,
                'Exact native NAD83 CRS required')
        reader = shapefile.Reader(shp=io.BytesIO(archive.read(stem+'.shp')),
                                  shx=io.BytesIO(archive.read(stem+'.shx')),
                                  dbf=io.BytesIO(archive.read(stem+'.dbf')))
    require(len(reader) == source['records'], 'Complete source record inventory required')
    return reader


def derive(original_dir):
    from pyproj import Transformer
    from shapely.geometry import box, shape, mapping
    from shapely.ops import transform
    original_dir = Path(original_dir)
    # Check both full originals before parsing either source.
    for source in SOURCES.values():
        path = original_dir/source['name']
        require(path.is_file() and path.stat().st_size == source['size_bytes']
                and digest(path) == source['sha256'], 'Complete exact Census originals required')
    operation = Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1188')
    require(operation.accuracy == 4.0, 'Unexpected coordinate operation')
    window = box(*BOUNDS)
    land_features, water_features = [], []
    with source_reader(original_dir/SOURCES['county']['name'], SOURCES['county']) as reader:
        for record in reader.iterShapeRecords():
            attributes = record.record.as_dict()
            if attributes['GEOID'] != '08069':
                continue
            require(attributes['NAME'] == 'Larimer' and attributes['STUSPS'] == 'CO', 'County identity changed')
            geometry = transform(operation.transform, shape(record.shape.__geo_interface__))
            require(geometry.is_valid and geometry.covers(window), 'Selected county must cover the whole investigation window')
            land_features.append(dict(type='Feature', properties={'GEOID': '08069', 'NAME': 'Larimer'}, geometry=mapping(geometry)))
    require(len(land_features) == 1, 'Unique Larimer county required')
    with source_reader(original_dir/SOURCES['water']['name'], SOURCES['water']) as reader:
        for record in reader.iterShapeRecords():
            geometry = transform(operation.transform, shape(record.shape.__geo_interface__))
            require(geometry.is_valid and not geometry.is_empty, 'Invalid original water geometry; no automatic repair')
            if geometry.intersects(window):
                attributes = record.record.as_dict()
                water_features.append(dict(type='Feature',
                    properties={key: attributes[key] for key in ('HYDROID', 'FULLNAME', 'MTFCC', 'ALAND', 'AWATER')},
                    geometry=mapping(geometry)))
    water_features.sort(key=lambda feature: feature['properties']['HYDROID'])
    ids = [feature['properties']['HYDROID'] for feature in water_features]
    require(len(ids) == len(set(ids)) == 279, 'Complete unique intersecting water-feature selection required')
    land = dict(type='FeatureCollection', features=land_features)
    water = dict(type='FeatureCollection', features=water_features)
    manifest = dict(schema='larimer-census-mask-inputs-v1', publisher='U.S. Census Bureau',
                    vintage=2025, sources=SOURCES, coordinate_operation=OPERATION,
                    bounds_lonlat=BOUNDS, selected_county_geoid='08069',
                    selection=SELECTION,
                    source_water_records=2300, selected_water_records=279,
                    derived_sha256={'land.geojson': hashlib.sha256(encoded(land)).hexdigest(),
                                    'water.geojson': hashlib.sha256(encoded(water)).hexdigest()},
                    input_completeness_certified=False, release_eligible=False)
    return {'land.geojson': encoded(land), 'water.geojson': encoded(water), 'manifest.json': encoded(manifest)}


def audit(root=OUTPUT):
    from shapely.geometry import Point
    root = Path(root)
    manifest = json.loads((root/'manifest.json').read_bytes())
    require(set(manifest) == {'schema', 'publisher', 'vintage', 'sources', 'coordinate_operation',
                              'bounds_lonlat', 'selected_county_geoid', 'selection',
                              'source_water_records', 'selected_water_records', 'derived_sha256',
                              'input_completeness_certified', 'release_eligible'}
            and manifest['publisher'] == 'U.S. Census Bureau' and manifest['vintage'] == 2025
            and manifest['selection'] == SELECTION
            and manifest['coordinate_operation']['accuracy_is_error_bound'] is False
            and manifest['schema'] == 'larimer-census-mask-inputs-v1'
            and manifest['sources'] == SOURCES and manifest['coordinate_operation'] == OPERATION
            and manifest['bounds_lonlat'] == BOUNDS and manifest['selected_county_geoid'] == '08069'
            and manifest['source_water_records'] == 2300 and manifest['selected_water_records'] == 279
            and manifest['input_completeness_certified'] is False and manifest['release_eligible'] is False,
            'Retained input provenance changed')
    require(set(manifest['derived_sha256']) == {'land.geojson', 'water.geojson'}
            and all(digest(root/name) == expected for name, expected in manifest['derived_sha256'].items()),
            'Retained geometry bytes changed')
    mask = build_explicit_land_water_mask(root/'land.geojson', root/'water.geojson', BOUNDS, WIDTH, HEIGHT)
    require(mask['polygon_features'] == {'land': 1, 'water': 279}, 'Selected feature inventory changed')
    water, _, _ = _load_polygon_file(root/'water.geojson', 'Water')
    checks = {}
    for name, point in PROBES.items():
        column = int((point[0]-BOUNDS[0])/(BOUNDS[2]-BOUNDS[0])*WIDTH)
        row = int((BOUNDS[3]-point[1])/(BOUNDS[3]-BOUNDS[1])*HEIGHT)
        covered = water.covers(Point(point))
        checks[name] = dict(lonlat=point, in_supplied_water=bool(covered),
                            mask_cell_candidate_nonwater=mask['land_mask'][row][column])
    require(checks['western_reservoir_110436273317']['in_supplied_water']
            and checks['city_park_lake']['in_supplied_water']
            and not checks['western_reservoir_110436273317']['mask_cell_candidate_nonwater']
            and not checks['city_park_lake']['mask_cell_candidate_nonwater'], 'Known supplied-water regressions failed')
    return dict(schema='larimer-census-mask-checkpoint-v1', mask=mask, probes=checks,
                manifest_sha256=digest(root/'manifest.json'),
                implementation_sha256={name: digest(ROOT/'scripts'/name)
                    for name in ('larimer_census_water_mask.py', 'colorado_geographic_mask.py')},
                original_source_replayed=False, roads_or_connectors_evaluated=False,
                independent_ground_truth_validated=False, access_verified=False, release_eligible=False,
                warning='County footprint and supplied Census water only. Not current shoreline completeness, legal road access, graph/competitor coverage or release approval. Probe coordinates are regressions against this source, not independent surveyed golden points. EPSG operation accuracy is not a worst-case error bound.')


def verify_originals(original_dir, root=OUTPUT):
    derived = derive(original_dir)
    require(all((Path(root)/name).read_bytes() == content for name, content in derived.items()),
            'Original-source replay differs from retained derived geometry or manifest')
    return dict(original_source_replayed=True, complete_source_water_records=2300,
                retained_water_features=279, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=OUTPUT)
    parser.add_argument('--original-dir', type=Path)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.write:
        require(args.original_dir is not None, 'Writing derived records requires exact original sources')
        args.root.mkdir(parents=True, exist_ok=True)
        for name, content in derive(args.original_dir).items():
            (args.root/name).write_bytes(content)
        (args.root/'report.json').write_bytes(encoded(audit(args.root)))
    report = audit(args.root)
    require(json.loads((args.root/'report.json').read_bytes()) == report, 'Frozen mask checkpoint changed')
    summary = dict(pixel_counts=report['mask']['pixel_counts'], probes=report['probes'],
                   original_source_replayed=False, release_eligible=False)
    if args.original_dir:
        summary.update(verify_originals(args.original_dir, args.root))
    print(json.dumps(summary, indent=2))
