"""Freeze principal-city source-work accounting without creating reviewed anchors."""
import argparse
from collections import Counter
import hashlib
import importlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path('docs/research/principal-city-source-work/report.json')
PRINCIPAL = Path('docs/research/principal-city-inventory/report.json')
CHECKERS = {'CO': 'colorado', 'AZ': 'arizona', 'UT': 'utah', 'OK': 'oklahoma', 'KS': 'kansas',
            'WY': 'wyoming', 'NV': 'nevada'}
NM = {'10740': ('3502000', 'albuquerque'), '22140': ('3525800', 'farmington'),
      '29740': ('3539380', 'las-cruces'), '42140': ('3570500', 'santa-fe')}
STATUSES = ('context_retained', 'selected_publication_unavailable', 'not_recorded_here')


def require(condition, message):
    if not condition:
        raise ValueError(message)


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project(principal, records):
    require(principal['access_verified'] is False and principal['anchors_adopted'] is False
            and principal['release_eligible'] is False, 'Principal inventory is not an adopted registry')
    expected = {(c['principal_city_id'], c['cbsa']): (s['state'], c['name'])
                for s in principal['states'] for c in s['principal_city_memberships']}
    require(len(principal['states']) == len({s['state'] for s in principal['states']}) == 52
            and len(expected) == sum(len(s['principal_city_memberships']) for s in principal['states']) == 698
            and len({key[1] for key in expected}) == 367, 'Complete official inventory required')
    indexed = {}
    for row in records:
        key = (row['principal_city_id'], row['cbsa'])
        require(key in expected and key not in indexed, 'Foreign or duplicate city source assignment')
        require((row['state'], row['city_name']) == expected[key], 'City/state/CBSA identity changed')
        require(all(row.get(flag, False) is False for flag in ('anchor_adopted', 'access_verified', 'release_eligible')),
                'Source-work input cannot assert adoption or approval')
        require(row['status'] in STATUSES[:2] and row['source_path'] and row['source_sha256'],
                'Inspectable source record or explicit retrieval gap required')
        indexed[key] = row
    cities = []
    for state in principal['states']:
        for city in state['principal_city_memberships']:
            row = dict(principal_city_id=city['principal_city_id'], cbsa=city['cbsa'],
                       state=state['state'], city_name=city['name'], status='not_recorded_here',
                       source_kind=None, retrieval_method=None, source_path=None, source_sha256=None,
                       url=None, recorded_at_utc=None, observations=[], limitations=[])
            row.update(indexed.get((city['principal_city_id'], city['cbsa']), {}))
            row.update(access_review_status='unresolved', anchor_adopted=False,
                       access_verified=False, release_eligible=False)
            cities.append(row)
    cities.sort(key=lambda r: (r['state'], r['city_name'], r['cbsa'], r['principal_city_id']))
    counts = Counter(r['status'] for r in cities)
    states = []
    for state in principal['states']:
        members = [r for r in cities if r['state'] == state['state']]
        states.append(dict(state=state['state'], memberships=len(members),
                           counts={key: sum(r['status'] == key for r in members) for key in STATUSES},
                           approved_anchors=0, release_eligible=False))
    return dict(schema='principal-city-source-work-v1', membership_count=len(cities), metro_count=367,
                states=states, cities=cities, counts={key: counts[key] for key in STATUSES},
                recorded_memberships=len(records), approved_anchors=0, connectors_approved=0,
                access_verified=False, release_eligible=False,
                scope='Principal-city state membership, distinct from the state containing a Census representative point.',
                warning='Source-work accounting only. Retained context is not an inspected vehicle entry or approved anchor. Not recorded here does not mean no evidence exists. Missing required anchors remain unknown; no geographic coverage or route costs are certified.')


def build(root=ROOT):
    root = Path(root)
    inputs = {}
    def read(relative):
        relative = Path(relative)
        require(not relative.is_absolute() and (root / relative).resolve().is_relative_to(root.resolve()),
                'Repository-local input required')
        inputs[str(relative)] = digest(root / relative)
        return json.loads((root / relative).read_text())
    principal = read(PRINCIPAL)
    from metro_principal_city_inventory import project as official
    require(official(source=root / PRINCIPAL.parent / 'list2_2023.xlsx',
                     domains_path=root / 'docs/research/utah-parent-reference/domains.json') == principal,
            'Official principal-city report differs from workbook/domain inputs')
    for relative in (PRINCIPAL.parent / 'list2_2023.xlsx', Path('docs/research/utah-parent-reference/domains.json')):
        inputs[str(relative)] = digest(root / relative)
    ledger = read('scripts/colorado_reviewed_connectors.json')
    require(ledger['schema_version'] == 1 and ledger['approved_evidence'] == [],
            'Approval ledger changed; independently review and version this inventory')
    records = []
    for path in sorted((root / 'docs/research').glob('*-principal-city-sources/manifest.json')):
        manifest = read(path.relative_to(root))
        state = manifest['state']
        require(state in CHECKERS, 'Register the new state source checker before freezing this inventory')
        module = importlib.import_module(CHECKERS[state] + '_principal_city_source_screen')
        module.check(root)
        inputs['scripts/' + module.__name__ + '.py'] = digest(root / 'scripts' / (module.__name__ + '.py'))
        for row in manifest['records']:
            source = read(row['source_path'])
            require(inputs[row['source_path']] == row['source_sha256'], 'Exact retained source required')
            unavailable = row.get('source_status', source.get('publication_status')) == 'selected_publication_unavailable'
            observations = source.get('observations', [])
            if not observations and source.get('interpretation'):
                observations = [source['interpretation']]
            records.append(dict(principal_city_id=row['principal_city_id'], cbsa=row['cbsa'], state=state,
                                city_name=row['city_name'], status=STATUSES[1 if unavailable else 0],
                                source_kind=source.get('source_kind', 'prior_retained_context'),
                                retrieval_method=source.get('retrieval_method', 'prior_retained_context'),
                                recorded_at_utc=source.get('capture_date_utc', source.get('retrieved_at_utc')),
                                source_path=row['source_path'], source_sha256=row['source_sha256'],
                                url=source.get('url'), observations=observations,
                                limitations=source.get('limitations', ['Retained context only; no exact vehicle connection or access approval.'])))
    # The four NM native-point contexts map exactly to its four official principal cities.
    from municipal_source_screen import check as check_nm
    nm_path = Path('docs/research/new-mexico-anchor-source-batch/manifest.json')
    check_nm(root / nm_path, root=root)
    manifest = read(nm_path)
    require({row['cbsa'] for row in manifest['records']} == set(NM), 'Complete NM city mapping required')
    for row in manifest['records']:
        cid, slug = NM[row['cbsa']]
        source = read(row['source_path'])
        require(source['city'] == slug and Path(row['source_path']).name == slug + '.json', 'NM source belongs to another city')
        name = next(c['name'] for s in principal['states'] if s['state'] == 'NM'
                    for c in s['principal_city_memberships'] if c['principal_city_id'] == cid)
        records.append(dict(principal_city_id=cid, cbsa=row['cbsa'], state='NM', city_name=name,
                            status='context_retained', source_kind=source['source_kind'],
                            retrieval_method='prior_retained_context', source_path=row['source_path'],
                            recorded_at_utc=source.get('retrieved_at_utc'),
                            source_sha256=row['source_sha256'], url=source['url'], observations=[source['interpretation']],
                            limitations=['Publication context only; no exact vehicle entry or independently certified connector.']))
    inputs['docs/research/native-state-inventory/report.json'] = digest(root / 'docs/research/native-state-inventory/report.json')
    for name in ('principal_city_source_work.py', 'principal_city_source_screen.py', 'municipal_source_screen.py',
                 'metro_principal_city_inventory.py'):
        inputs['scripts/' + name] = digest(root / 'scripts' / name)
    result = project(principal, records)
    result['input_sha256'] = dict(sorted(inputs.items()))
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    result = build()
    path = ROOT / OUTPUT
    if args.write:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    else:
        require(json.loads(path.read_text()) == result, 'Frozen source-work inventory differs')
    print(json.dumps({key: result[key] for key in ('membership_count', 'metro_count', 'counts', 'recorded_memberships', 'approved_anchors')}, indent=2))
