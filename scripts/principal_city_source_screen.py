"""Shared principal-city source-work checks; never approve driving access."""
from collections import Counter
from datetime import date
import hashlib
import json
from pathlib import Path
import re
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
INVENTORY = Path('docs/research/principal-city-inventory/report.json')
# Explicit publisher assignments prevent same-CBSA sources being substituted for another city.

KINDS = {'municipal_facility_location', 'municipal_parking_guidance', 'municipal_planning',
         'operator_facility_location', 'operator_parking_guidance', 'county_parking_guidance',
         'county_administrative_context', 'federal_juror_parking_guidance'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def check_batch(state_code, folder, publishers, retained=None, root=ROOT):
    retained = retained or {}
    folder = Path(folder)
    root = Path(root).resolve()
    manifest = json.loads((root / folder / 'manifest.json').read_text())
    raw = (root / INVENTORY).read_bytes()
    require(manifest['schema'] == 'principal-city-source-batch-v1' and manifest['state'] == state_code
            and hashlib.sha256(raw).hexdigest() == manifest['principal_inventory_sha256'],
            'Exact official inventory and state required')
    state = next(s for s in json.loads(raw)['states'] if s['state'] == state_code)
    cities = {c['principal_city_id']: c for c in state['principal_city_memberships']}
    require(set(publishers).isdisjoint(retained) and set(publishers) | set(retained) == set(cities),
            'Complete disjoint publisher assignments required')
    rows = manifest['records']
    ids = [r['principal_city_id'] for r in rows]
    require(len(ids) == len(set(ids)) == len(cities) and set(ids) == set(cities),
            'Complete unique principal-city accounting required; CBSA is not a city key')
    require(all(manifest.get(k) is False for k in
                ('access_verified', 'anchors_adopted', 'geographic_coverage_certified', 'release_eligible')),
            'Source work cannot approve anchors or coverage')
    counts = Counter()
    for row in rows:
        cid = row['principal_city_id']
        city = cities[cid]
        require(row['city_name'] == city['name'] and row['cbsa'] == city['cbsa'], 'Wrong city or CBSA')
        relative = Path(row['source_path'])
        path = (root / relative).resolve()
        require(path.is_relative_to(root) and path.is_file(), 'Retained source must be in repository')
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == row['source_sha256'], 'Retained source changed')
        source = json.loads(raw)
        require(source['access_verified'] is False and source['anchor_adopted'] is False
                and source['release_eligible'] is False, 'Source cannot self-certify access')
        if cid in retained:
            spec = retained[cid]
            require(relative == Path(spec['path']) and source['schema'] == spec['schema']
                    and urlsplit(source['url']).hostname == spec['host']
                    and all(source.get(flag) is False for flag in spec['false_flags']),
                    'Exact retained prior context required')
            counts['prior_retained_context'] += 1
            continue
        slug, host = publishers[cid]
        require(relative == folder / (slug + '.json'), 'Source belongs to another principal city')
        require(source['schema'] == 'principal-city-publication-observation-v2'
                and source['principal_city_id'] == cid and source['cbsa'] == city['cbsa']
                and source['city_name'] == city['name'] and source['entry_review_status'] == 'needs_evidence'
                and source['source_kind'] in KINDS and source['limitations'] and source['retention'],
                'Explicit identity-bound observation required')
        date.fromisoformat(source['capture_date_utc'])
        def public_url(url):
            parsed = urlsplit(url)
            return parsed.scheme == 'https' and parsed.hostname == host and not parsed.username and not parsed.password
        require(public_url(source['url']), 'Exact primary publisher required')
        attempt = source['direct_http_attempt']
        require(attempt['url'] == source['url'] and public_url(attempt['final_url'])
                and attempt['capture_date_utc'] == source['capture_date_utc']
                and type(attempt['http_status']) is int and 100 <= attempt['http_status'] <= 599
                and type(attempt['response_bytes']) is int and attempt['response_bytes'] > 0
                and re.fullmatch('[a-f0-9]{64}', attempt['response_sha256']),
                'Explicit direct HTTP attempt identity required')
        quote = source['selected_quote']
        observations = source['observations']
        require(isinstance(quote, str) and len(quote.split()) <= 25
                and isinstance(observations, list), 'Short quote and structured observations required')
        method = source['retrieval_method']
        require(method in ('direct_http', 'web_rendered', 'unavailable'), 'Unknown retrieval method')
        if method == 'unavailable':
            require(source['publication_status'] == 'selected_publication_unavailable'
                    and source['source_http_status'] is None and attempt['http_status'] >= 400
                    and not quote and not observations, 'Failed retrieval cannot become inspected evidence')
        else:
            require(source['publication_status'] == 'retained_publication_observation' and quote
                    and observations and all(isinstance(s, str) and s for s in observations),
                    'Inspected publication observations required')
            if method == 'direct_http':
                require(source['source_http_status'] == attempt['http_status'] == 200,
                        'Direct observation requires successful raw HTTP capture')
            else:
                require(source['source_http_status'] is None and attempt['http_status'] >= 400,
                        'Rendered content cannot invent a successful original HTTP capture')
        counts[method] += 1
    return dict(state=state_code, principal_city_memberships=len(rows),
                metros=len({c['cbsa'] for c in cities.values()}), source_work_counts=dict(sorted(counts.items())),
                publication_contexts_inspected=sum(v for k, v in counts.items() if k != 'unavailable'),
                anchors_adopted=0, connectors_approved=0, access_verified=False, release_eligible=False,
                warning='Complete source-work accounting only; publication context is not an entry review or approved anchor set.')

