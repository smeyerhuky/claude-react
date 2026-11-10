"""Reproduce dated northern site imagery context, without certifying access."""
import argparse
from datetime import datetime, timezone
import hashlib
from io import BytesIO
import json
import math
from pathlib import Path
import re
import urllib.parse
import urllib.request

from PIL import Image
from northern_endpoint_evidence import OUTPUT as AGENCY, encoded, projector
from northern_local_detour_checkpoint import OUTPUT as WITNESS
from reference_via_node_compile import need, canonical_sha

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / 'docs/research/northern-site-imagery'
BASE = 'https://planetarycomputer.microsoft.com/api/'
SIZE = 640
HALF_M = 96.


def digest(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def crop(candidate):
    point, operation = projector(26913)
    x, y = point(candidate['lonlat'])
    return [x-HALF_M, y-HALF_M, x+HALF_M, y+HALF_M], operation


def item_url(item_id):
    need(isinstance(item_id, str) and re.fullmatch(r'co_m_\d{7}_[ns][ew]_13_030_20230925_20240104', item_id),
         'Pinned Colorado 2023 primary scene identity required')
    return BASE + 'stac/v1/collections/naip/items/' + item_id


def image_url(item_id, bbox):
    item_url(item_id)
    params = [('collection', 'naip'), ('item', item_id), ('coord_crs', 'EPSG:26913'),
              ('dst_crs', 'EPSG:26913'), ('assets', 'image'), ('asset_bidx', 'image|1,2,3'),
              ('resampling', 'nearest'), ('reproject', 'nearest'), ('return_mask', 'true')]
    return BASE + 'data/v1/item/bbox/' + ','.join(map(str, bbox)) + '/640x640.png?' + urllib.parse.urlencode(params)


def validate_item(item, candidate):
    item_url(item['id'])
    need(item.get('type') == 'Feature' and item.get('collection') == 'naip', 'Primary NAIP STAC item required')
    p = item['properties']
    # Do not substitute publication/update timestamps, overview dates or file suffixes.
    acquired = datetime.fromisoformat(p['datetime'].replace('Z', '+00:00'))
    need(acquired.tzinfo is not None and acquired.astimezone(timezone.utc).date().isoformat() == '2023-09-25'
         and p['naip:year'] == 2023 and p['naip:state'] == 'co' and p['gsd'] == .3,
         'Actual reported primary acquisition date and resolution required')
    need(p['proj:epsg'] == 26913 and p['proj:transform'][0] == .3 and p['proj:transform'][4] == -.3
         and p['proj:transform'][1] == 0 and p['proj:transform'][3] == 0,
         'Explicit north-up 30 cm native UTM scene required')
    bounds = p['proj:bbox']; transform = p['proj:transform']; rows, cols = p['proj:shape']
    need(len(bounds) == 4 and all(type(v) in (int, float) and math.isfinite(v) for v in bounds)
         and rows > 0 and cols > 0 and len(transform) == 9,
         'Complete finite native scene grid required')
    expected = [transform[2], transform[5] - rows*.3, transform[2] + cols*.3, transform[5]]
    need(all(abs(a-b) < 1e-6 for a, b in zip(bounds, expected)), 'Scene grid and extent disagree')
    bbox, operation = crop(candidate)
    need(bounds[0] <= bbox[0] < bbox[2] <= bounds[2] and bounds[1] <= bbox[1] < bbox[3] <= bounds[3],
         'Whole crop must be covered; containing only the center point is insufficient')
    href = item['assets']['image']['href']
    need(href.startswith('https://naipeuwest.blob.core.windows.net/naip/v002/co/2023/co_030cm_2023/')
         and href.endswith('/' + item['id'][3:] + '.tif') and not urllib.parse.urlsplit(href).query,
         'Unsigned Colorado primary raster identity required')
    need([b['common_name'] for b in item['assets']['image']['eo:bands']] == ['red', 'green', 'blue', 'nir'],
         'Explicit source band meanings required')
    need(any(v['name'] == 'USDA Farm Service Agency' and 'producer' in v['roles'] for v in p['providers']),
         'Source producer identity required')
    return bbox, operation


def pixels(raw):
    need(0 < len(raw) <= 3_000_000 and raw.startswith(b'\x89PNG\r\n\x1a\n'), 'Bounded actual PNG crop required')
    with Image.open(BytesIO(raw)) as source:
        need(source.format == 'PNG' and source.size == (SIZE, SIZE) and source.mode == 'RGBA',
             'Exact RGB plus validity mask image required')
        image = source.copy()
    need(image.getchannel('A').getextrema() == (255, 255), 'Any missing/masked crop pixel rejects the scene')
    rgb = image.convert('RGB')
    need(any(lo != hi for lo, hi in rgb.getextrema()), 'Blank imagery is not site evidence')
    return dict(width=SIZE, height=SIZE, mode='RGBA', pixel_sha256=hashlib.sha256(image.tobytes()).hexdigest(),
                valid_pixels=SIZE*SIZE)


def frozen():
    manifest = json.loads((OUTPUT/'manifest.json').read_bytes())
    need(manifest['schema'] == 'northern-site-imagery-manifest-v1' and
         manifest['original_pixels_published'] is False and manifest['release_eligible'] is False and
         manifest['items_sha256'] == digest(OUTPUT/'items.json'), 'Bounded research-only imagery manifest required')
    items = json.loads((OUTPUT/'items.json').read_bytes())
    native = json.loads((AGENCY/'native.json').read_bytes())
    witnesses = json.loads(WITNESS.read_bytes())
    need(manifest['native_sha256'] == digest(AGENCY/'native.json') and
         manifest['agency_report_sha256'] == digest(AGENCY/'report.json') and
         manifest['witness_report_sha256'] == digest(WITNESS), 'Exact agency/native/witness bindings required')
    cases = [r['candidate'] for r in native['candidates']]
    need(cases == witnesses['candidates'] and len(cases) == 5 and
         set(manifest['sites']) == {c['id'] for c in cases}, 'Exact complete five endpoint inventory required')
    for c in cases:
        record = manifest['sites'][c['id']]
        selected = next((i for i in items.values() if item_url(i['id']) == record['item_url']), None)
        need(selected is not None and canonical_sha(selected) == record['item_semantic_sha256'], 'Retained primary metadata mismatch')
        validate_item(selected, c)
    need(len(items) == 3, 'Exact three primary source scenes required')
    return manifest, cases


def validate_review(review, candidate, item, actual):
    need(review['pixel_sha256'] == actual['pixel_sha256'] and review['item_id'] == item['id'] and
         review['candidate'] == candidate and review['acquisition_reported_utc'] == item['properties']['datetime'],
         'Visual observations must bind to exact native candidate, scene, date and decoded pixels')
    need(review['access_certified'] is False and review['grade_certified'] is False and
         review['current_conditions_verified'] is False, 'Historical overhead review cannot certify access or grade')


def audit(directory):
    manifest, cases = frozen()
    reviews = json.loads((OUTPUT/'review.json').read_bytes())
    need(set(reviews['sites']) == {c['id'] for c in cases}, 'Complete bounded image review required')
    points = []
    for c in cases:
        key = c['id']; record = manifest['sites'][key]
        raw = (Path(directory)/(key+'-2023-item.json')).read_bytes()
        need(len(raw) <= 200_000, 'Bounded complete individual item required')
        item = json.loads(raw)
        need(canonical_sha(item) == record['item_semantic_sha256'], 'Source item changed: '+key)
        bbox, operation = validate_item(item, c)
        need(record['item_url'] == item_url(item['id']) and record['image_url'] == image_url(item['id'], bbox),
             'Exact item, native coordinate crop and selected raster request required')
        image = (Path(directory)/(key+'-2023.png')).read_bytes(); actual = pixels(image)
        need(actual == record['pixels'], 'Decoded site pixels differ: '+key)
        review = reviews['sites'][key]
        validate_review(review, c, item, actual)
        points.append(dict(candidate=c, item_id=item['id'], acquisition_reported_utc=item['properties']['datetime'],
            source_resolution_m=item['properties']['gsd'], bbox_native_m=bbox, crs='EPSG:26913',
            crop_grid_width_m=192., requested_resolution_m=.3, center_pixel_boundary=[320.,320.],
            coordinate_operation=operation, pixels=actual, review=review,
            current_conditions_verified=False, grade_certified=False, access_verified=False, anchor_adopted=False))
    return dict(schema='northern-dated-site-imagery-v1', implementation_sha256=digest(__file__),
        manifest_sha256=digest(OUTPUT/'manifest.json'), items_sha256=digest(OUTPUT/'items.json'), review_sha256=digest(OUTPUT/'review.json'),
        points=points, approved_connectors=0, anchors_adopted=False, access_verified=False,
        geographic_coverage_certified=False, release_eligible=False,
        scope='Historical overhead context only. Reported scene acquisition is distinct from catalogue refresh, capture and model dates. '
              'Native datum operation has stated accuracy, not a worst-case error bound. Image center is a registration, not a surveyed '
              'road attachment. Visible pavement/vehicles cannot establish present legal access, turns, clearance, grade or absence of barriers. '
              'These observations do not adopt anchors, authorize connectors, change routing costs or establish geographic coverage.')


def download(directory):
    manifest, _ = frozen(); directory = Path(directory); directory.mkdir(parents=True, exist_ok=True); receipts = {}
    for key, record in manifest['sites'].items():
        receipts[key] = {}
        for kind, suffix, limit in [('item', '-2023-item.json', 200_000), ('image', '-2023.png', 3_000_000)]:
            url = record[kind+'_url']; parsed = urllib.parse.urlsplit(url)
            need(parsed.scheme == 'https' and parsed.hostname == 'planetarycomputer.microsoft.com'
                 and not parsed.username and not parsed.password and parsed.path.startswith('/api/'), 'Public unsigned source required')
            with urllib.request.urlopen(url, timeout=60) as response:
                need(response.status == 200 and response.geturl() == url, 'Exact unredirected HTTP200 source required')
                data = response.read(limit+1)
            need(0 < len(data) <= limit, 'Bounded complete source response required')
            # Validate before retaining: no HTML/error bodies masquerading as evidence.
            if kind == 'item': need(canonical_sha(json.loads(data)) == record['item_semantic_sha256'], 'Source item changed: '+key)
            else: need(pixels(data) == record['pixels'], 'Source pixels changed: '+key)
            (directory/(key+suffix)).write_bytes(data)
            sha = hashlib.sha256(data).hexdigest()
            receipts[key][kind] = dict(sha256=sha, size_bytes=len(data), status=200,
                captured_raw_bytes_equal=sha == record[kind+'_sha256'] and len(data) == record[kind+'_size_bytes'],
                captured_at_utc=datetime.now(timezone.utc).isoformat())
    (directory/'fresh-source-receipts.json').write_bytes(encoded(dict(schema='northern-site-imagery-receipts-v1',
        manifest_sha256=digest(OUTPUT/'manifest.json'), sites=receipts)))


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--original-dir', type=Path, required=True)
    parser.add_argument('--download', action='store_true')
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.download: download(args.original_dir)
    actual = audit(args.original_dir)
    if args.write: (OUTPUT/'report.json').write_bytes(encoded(actual))
    else: need(actual == json.loads((OUTPUT/'report.json').read_bytes()), 'Retained imagery audit differs')
    print(json.dumps(dict(points=len(actual['points']), valid_pixels=sum(p['pixels']['valid_pixels'] for p in actual['points']),
                         access_verified=False, release_eligible=False)))
