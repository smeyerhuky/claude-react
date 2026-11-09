"""Complete displayed-metro location envelopes; conditional bounds, never approvals."""
import argparse
import hashlib
import json
from pathlib import Path

from larimer_census_water_mask import (ROOT, OPERATION, BOUNDS, source_reader, encoded,
                                       geometry_encoded, digest, require)
from colorado_principal_city_domains import (OUTPUT as CITY_ROOT, SOURCE as CITY_SOURCE,
    QUERY_POINT, audit as city_audit, verify_original as verify_city_original,
    enclosing_ball, rectangle_distance_lower_bound, exact, fraction)
from metro_principal_city_inventory import project as principal_inventory, REFERENCE as PRINCIPAL, DOMAINS, STATE_FIPS

OUTPUT = ROOT/'docs/research/metro-state-anchor-domains'
SOURCE = dict(name='tl_2025_us_state.zip',
              url='https://www2.census.gov/geo/tiger/TIGER2025/STATE/tl_2025_us_state.zip',
              size_bytes=9956072, sha256='59a220888a8d9be8117c4fcd38f542bd02d81abf0d198c78113595ad540dd957', records=56)
REFINEMENT_SOURCES = {
    'NE': dict(name='tl_2025_31_place.zip', url='https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_31_place.zip',
               size_bytes=826250, sha256='aa01fa8c3dafcea27cbe6bd009f38eb774b4c765fd2e5b81701d69a534da16e0', records=593),
    'WY': dict(name='tl_2025_56_place.zip', url='https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_56_place.zip',
               size_bytes=904349, sha256='3b077402b1090f9afed9662da7f70d66b791b01f61d8ac4b7032df2293715e96', records=205),
}
PLACE_FLAGS = {'NE': {'PCICBSA':'Y','FUNCSTAT':'A','CLASSFP':'C5'},
               'WY': {'PCICBSA':'Y','FUNCSTAT':'A','CLASSFP':'C1'}}
BUDGETS = [10000, 30000, 100000]  # Hypotheses in meters, not verified incumbent costs.


def scope():
    inventory = principal_inventory()
    require(inventory == json.loads((PRINCIPAL/'report.json').read_bytes()), 'Principal-city inventory changed')
    require(digest(DOMAINS) == inventory['domains_sha256'], 'Qualifying domain inventory changed')
    domains = json.loads(DOMAINS.read_bytes())['domains']
    ids = sorted(row['cbsa'] for row in domains if row['included_in_existing_csv'] is True)
    require(len(ids) == len(set(ids)) == 359, 'Exact displayed qualifying metro set required')
    memberships = []
    for state in inventory['states']:
        for city in state['principal_city_memberships']:
            if city['cbsa'] in ids:
                require(STATE_FIPS[city['principal_city_id'][:2]] == state['state'], 'City/state FIPS mismatch')
                memberships.append(dict(cbsa=city['cbsa'], principal_city_id=city['principal_city_id'],
                                        name=city['name'], state=state['state']))
    memberships.sort(key=lambda row: (row['cbsa'], row['principal_city_id']))
    require(len(memberships) == len({(m['cbsa'],m['principal_city_id']) for m in memberships}) == 686
            and {m['cbsa'] for m in memberships} == set(ids), 'Every displayed metro and principal-city membership required')
    states = sorted({m['state'] for m in memberships})
    require(len(states) == 49 and not set(states)&{'AK','HI','PR'}, 'Displayed contiguous-state/DC scope required')
    return ids, memberships, states


def preflight_originals(directory):
    for source in (SOURCE,CITY_SOURCE,*REFINEMENT_SOURCES.values()):
        path = Path(directory)/source['name']
        require(path.is_file() and path.stat().st_size == source['size_bytes'] and digest(path) == source['sha256'],
                'All four complete exact Census originals required')


def derive_refinements(directory, memberships):
    from pyproj import Transformer
    from shapely.geometry import shape
    from shapely.ops import transform
    expected = {m['principal_city_id']:m for m in memberships if m['state'] in REFINEMENT_SOURCES}
    require(len(expected) == 3, 'Complete Nebraska/Wyoming principal-city set required')
    operation = Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1188'); rows = []
    for state,source in REFINEMENT_SOURCES.items():
        with source_reader(Path(directory)/source['name'],source) as reader:
            for record in reader.iterShapeRecords():
                a = record.record.as_dict(); identity = a['GEOID']
                if identity not in expected: continue
                member = expected[identity]
                require(member['state'] == state and a['STATEFP'] == identity[:2] and a['NAME'] == member['name']
                        and all(a[key] == value for key,value in PLACE_FLAGS[state].items()), 'Refined place identity/status changed')
                geometry = transform(operation.transform,shape(record.shape.__geo_interface__))
                require(geometry.geom_type in ('Polygon','MultiPolygon') and geometry.is_valid and not geometry.is_empty,
                        'Valid complete refined-city geometry required; no repair')
                enclosing_ball(geometry.bounds)
                rows.append(dict(**member,source_flags=PLACE_FLAGS[state],bounds_lonlat=list(geometry.bounds)))
    rows.sort(key=lambda row:row['principal_city_id'])
    require(len(rows) == len(expected) and {r['principal_city_id'] for r in rows} == set(expected),
            'Complete unique Nebraska/Wyoming refinements required')
    return dict(schema='metro-refined-city-envelopes-v1',cities=rows)


def derive(original):
    from pyproj import Transformer
    from shapely.geometry import shape
    from shapely.ops import transform
    preflight_originals(Path(original).parent)
    ids, memberships, required_states = scope(); rows = []
    operation = Transformer.from_pipeline('urn:ogc:def:coordinateOperation:EPSG::1188')
    require(operation.accuracy == 4.0, 'Unexpected coordinate operation')
    with source_reader(Path(original), SOURCE) as reader:
        for record in reader.iterShapeRecords():
            a = record.record.as_dict()
            if a['STUSPS'] not in required_states: continue
            require(a['GEOID'] == a['STATEFP'] and STATE_FIPS[a['STATEFP']] == a['STUSPS']
                    and a['FUNCSTAT'] == 'A' and a['MTFCC'] == 'G4000', 'State source identity/status changed')
            geometry = transform(operation.transform, shape(record.shape.__geo_interface__))
            require(geometry.geom_type in ('Polygon','MultiPolygon') and geometry.is_valid
                    and not geometry.is_empty, 'Valid complete state geometry required; no repair')
            enclosing_ball(geometry.bounds)
            rows.append(dict(state=a['STUSPS'], state_fips=a['STATEFP'], name=a['NAME'], bounds_lonlat=list(geometry.bounds)))
    rows.sort(key=lambda row: row['state'])
    require([row['state'] for row in rows] == required_states, 'Complete unique state-envelope set required')
    state_bytes = geometry_encoded(dict(schema='metro-state-envelope-inputs-v1', states=rows))
    refined_bytes = geometry_encoded(derive_refinements(Path(original).parent,memberships))
    manifest = dict(schema='metro-state-anchor-domain-inputs-v1', state_source=SOURCE,
                    coordinate_operation=OPERATION, place_refinement_sources=REFINEMENT_SOURCES,
                    refinement_bounds_sha256=hashlib.sha256(refined_bytes).hexdigest(), displayed_cbsa_ids=ids, membership_count=len(memberships),
                    required_states=required_states, principal_inventory_sha256=digest(PRINCIPAL/'report.json'),
                    state_bounds_sha256=hashlib.sha256(state_bytes).hexdigest(),
                    colorado_city_report_sha256=digest(CITY_ROOT/'report.json'),
                    anchors_adopted=False, release_eligible=False)
    return {'states.json': state_bytes, 'refinements.json':refined_bytes, 'manifest.json': encoded(manifest)}


def inputs(root=OUTPUT):
    root = Path(root); ids, memberships, states = scope()
    manifest = json.loads((root/'manifest.json').read_bytes())
    require(set(manifest) == {'schema','state_source','coordinate_operation','displayed_cbsa_ids','membership_count',
                              'required_states','principal_inventory_sha256','state_bounds_sha256',
                              'colorado_city_report_sha256','anchors_adopted','release_eligible',
                              'place_refinement_sources','refinement_bounds_sha256'}
            and manifest['schema'] == 'metro-state-anchor-domain-inputs-v1'
            and manifest['state_source'] == SOURCE and manifest['coordinate_operation'] == OPERATION
            and manifest['place_refinement_sources'] == REFINEMENT_SOURCES
            and manifest['coordinate_operation']['accuracy_is_error_bound'] is False
            and manifest['displayed_cbsa_ids'] == ids and manifest['membership_count'] == len(memberships)
            and manifest['required_states'] == states
            and manifest['principal_inventory_sha256'] == digest(PRINCIPAL/'report.json')
            and manifest['colorado_city_report_sha256'] == digest(CITY_ROOT/'report.json')
            and manifest['anchors_adopted'] is False and manifest['release_eligible'] is False,
            'Exact complete displayed-scope and source bindings required')
    require(digest(root/'states.json') == manifest['state_bounds_sha256'], 'Retained state envelopes changed')
    data = json.loads((root/'states.json').read_bytes())
    require(set(data) == {'schema','states'} and data['schema'] == 'metro-state-envelope-inputs-v1'
            and [row['state'] for row in data['states']] == states, 'Complete unique retained state rows required')
    boxes = {}
    for row in data['states']:
        require(set(row) == {'state','state_fips','name','bounds_lonlat'}
                and STATE_FIPS[row['state_fips']] == row['state'] and bool(row['name']), 'Retained state identity changed')
        enclosing_ball(row['bounds_lonlat']); boxes[row['state']] = row['bounds_lonlat']
    city_report = city_audit()
    require(city_report == json.loads((CITY_ROOT/'report.json').read_bytes()), 'Frozen Colorado refinement changed')
    cities = {row['principal_city_id']: dict(**row,state='CO') for row in city_report['city_domains']}
    for city in cities.values():
        w,s,e,n = city['bounds_lonlat']; sw,ss,se,sn = boxes['CO']
        require(sw <= w <= e <= se and ss <= s <= n <= sn, 'City refinement escapes its source state envelope')
    require(digest(root/'refinements.json') == manifest['refinement_bounds_sha256'], 'Refinement envelope bytes changed')
    refinements = json.loads((root/'refinements.json').read_bytes())
    expected = {m['principal_city_id']:m for m in memberships if m['state'] in REFINEMENT_SOURCES}
    require(set(refinements) == {'schema','cities'} and refinements['schema'] == 'metro-refined-city-envelopes-v1'
            and len(refinements['cities']) == len(expected) == 3, 'Complete refinement inventory required')
    seen = set()
    for row in refinements['cities']:
        identity = row['principal_city_id']
        require(set(row) == {'cbsa','principal_city_id','name','state','source_flags','bounds_lonlat'}
                and identity in expected and identity not in seen
                and all(row[k] == value for k,value in expected[identity].items())
                and row['source_flags'] == PLACE_FLAGS[row['state']], 'Refinement identity/membership changed')
        seen.add(identity); enclosing_ball(row['bounds_lonlat'])
        w,s,e,n = row['bounds_lonlat']; sw,ss,se,sn = boxes[row['state']]
        require(sw <= w <= e <= se and ss <= s <= n <= sn, 'Refinement escapes source state envelope')
        cities[identity] = row
    require(len(cities) == 15, 'Complete three-state refinement set required')
    return ids, memberships, boxes, cities


def conditional_budget_case(rows, budget, incumbent_cbsa='22660'):
    from metro_competition_bounds import number
    upper = number(budget)
    require(rows and len({row['cbsa'] for row in rows}) == len(rows)
            and all(fraction(row['lower_bound_exact']) >= 0 for row in rows), 'Unique complete nonnegative bound rows required')
    require(upper >= 0 and incumbent_cbsa in {r['cbsa'] for r in rows}, 'Nonnegative budget and known incumbent identity required')
    lower = fraction(next(row['lower_bound_exact'] for row in rows if row['cbsa'] == incumbent_cbsa))
    refuted = lower > upper
    dominated = [] if refuted else [row['cbsa'] for row in rows if fraction(row['lower_bound_exact']) > upper]
    return dict(assumed_full_incumbent_upper_bound_m=exact(upper), incumbent_cbsa=incumbent_cbsa,
                assumption_refuted_by_incumbent_domain=refuted,
                conditional_bound_exceeds_assumption_ids=dominated,
                retained_or_unknown_ids=[row['cbsa'] for row in rows if row['cbsa'] not in dominated],
                feasible_incumbent_verified=False, applied_competitor_exclusions=[])


def audit(root=OUTPUT):
    root = Path(root); ids, memberships, boxes, cities = inputs(root)
    window_ball = enclosing_ball(BOUNDS)
    contexts = [('point', QUERY_POINT, fraction(['0','1'])),
                ('water-mask-window', window_ball['center_lonlat'], fraction(window_ball['radius_m_exact']))]
    results = []
    for label, center, radius in contexts:
        member_rows = []
        for member in memberships:
            city = cities.get(member['principal_city_id'])
            require(member['state'] not in {'CO','NE','WY'} or city is not None, 'Missing required city refinement')
            if city is not None:
                require(city['cbsa'] == member['cbsa'], 'City/metro refinement mismatch')
            bounds = city['bounds_lonlat'] if city else boxes[member['state']]
            lower = max(0, rectangle_distance_lower_bound(bounds, center)-radius)
            member_rows.append(dict(**member, domain_kind='city-envelope' if city else 'state-envelope', lower_bound_exact=exact(lower)))
        metros = []
        for cbsa in ids:
            required = [row for row in member_rows if row['cbsa'] == cbsa]
            lower = min(fraction(row['lower_bound_exact']) for row in required)
            metros.append(dict(cbsa=cbsa, principal_city_ids=[row['principal_city_id'] for row in required], lower_bound_exact=exact(lower)))
        results.append(dict(context=label, destination_center_lonlat=center, destination_radius_m_exact=exact(radius),
                            destination_bounds_lonlat=BOUNDS if radius else None,
                            principal_city_memberships=member_rows, metro_bounds=metros,
                            hypotheses=[conditional_budget_case(metros,budget) for budget in BUDGETS]))
    return dict(schema='metro-state-anchor-domains-research-v1', displayed_metros=len(ids), principal_city_memberships=len(memberships),
                state_envelopes=len(boxes), city_refinements=len(cities), refined_states=['CO','NE','WY'], metric='length', units='meters', contexts=results,
                manifest_sha256=digest(root/'manifest.json'),
                implementation_sha256={name:digest(ROOT/'scripts'/name) for name in (
                    'metro_state_anchor_domains.py','colorado_principal_city_domains.py','larimer_census_water_mask.py',
                    'metro_principal_city_inventory.py','metro_competition_bounds.py')},
                original_sources_replayed=False, anchor_registry_adopted=False, access_verified=False,
                complete_global_competition=False, release_eligible=False, applied_competitor_exclusions=[], travel_time_bounds=None,
                warning='Complete displayed inventory of conditional location domains, not complete route competition. Future anchor coordinates must satisfy the declared source-envelope restrictions; those restrictions and an anchor registry are not adopted here. Requires compatible full-route geometry domination and feasible fully costed directed incumbents. Window budget assumptions must hold uniformly at every destination; no such incumbent is verified. Missing required anchors remain unknown. No time ceiling, exterior-route closure, legal access or current jurisdiction is certified.')


def verify_originals(directory, root=OUTPUT):
    directory = Path(directory)
    preflight_originals(directory)
    verify_city_original(directory/CITY_SOURCE['name'])
    require(all((Path(root)/name).read_bytes() == value for name,value in derive(directory/SOURCE['name']).items()),
            'State original replay differs from retained envelopes or manifest')
    return dict(original_sources_replayed=True, displayed_metros=359, principal_city_memberships=686, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=OUTPUT)
    parser.add_argument('--original-dir', type=Path); parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    if args.write:
        require(args.original_dir is not None, 'Writing requires all four exact source ZIPs')
        preflight_originals(args.original_dir)
        verify_city_original(args.original_dir/CITY_SOURCE['name'])
        args.root.mkdir(parents=True, exist_ok=True)
        for name,value in derive(args.original_dir/SOURCE['name']).items(): (args.root/name).write_bytes(value)
        (args.root/'report.json').write_bytes(encoded(audit(args.root)))
    report = audit(args.root)
    require(report == json.loads((args.root/'report.json').read_bytes()), 'Frozen hierarchical domain report changed')
    summary = dict(displayed_metros=359, principal_city_memberships=686, state_envelopes=49, original_sources_replayed=False,
                   hypotheses=[{'context':c['context'],'retained_counts':[len(h['retained_or_unknown_ids']) for h in c['hypotheses']]} for c in report['contexts']],
                   release_eligible=False)
    if args.original_dir: summary.update(verify_originals(args.original_dir,args.root))
    print(json.dumps(summary,indent=2))
