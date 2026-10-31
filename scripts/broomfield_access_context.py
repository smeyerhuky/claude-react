"""Audit retained Broomfield leads without selecting or certifying an anchor."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIRECTORY = ROOT / 'docs/research/broomfield-access-context'
FILES = {'raw-osm-context.json', 'broomfield-addresses-context.json',
         'broomfield-streets-context.json'}


def require(condition, reason):
    if not condition:
        raise ValueError(reason)


def audit(directory=DIRECTORY):
    directory = Path(directory)
    manifest = json.loads((directory / 'manifest.json').read_text())
    require(manifest['schema'] == 'broomfield-access-context-manifest-v1', 'Unknown manifest')
    require(set(manifest['files']) == FILES, 'Exact retained evidence set required')
    for flag in ('access_verified', 'anchor_adopted', 'release_eligible'):
        require(manifest.get(flag) is False, 'Evidence audit cannot adopt or approve access')
    data = {}
    for name, record in manifest['files'].items():
        raw = (directory / name).read_bytes()
        require(hashlib.sha256(raw).hexdigest() == record['sha256'], 'Evidence bytes changed')
        data[name] = json.loads(raw)
    addresses = data['broomfield-addresses-context.json']
    streets = data['broomfield-streets-context.json']
    for source in (addresses, streets):
        require(not source.get('exceededTransferLimit'), 'Truncated agency query')
        require(source['spatialReference']['wkid'] == 4326, 'Explicit agency output CRS required')
        ids = [f['attributes']['OBJECTID'] for f in source['features']]
        require(len(ids) == len(set(ids)), 'Duplicate agency feature')
    rows = [f['attributes'] for f in addresses['features']]
    require(len(rows) == 5, 'Complete five-feature address response required')
    government = [r for r in rows if r['GIS_ID'] == 22443]
    require(len(government) == 1 and government[0]['FEATURE_TYPE'] == 'Government'
            and government[0]['POSITIONED_METHOD'] == 'Building Footprint',
            'Address is a building-footprint lead, not a vehicle entry')
    require(Counter(r['FEATURE_TYPE'] for r in rows) ==
            Counter({'Government': 1, 'Sign': 3, 'Electrical': 1}), 'Address feature classes changed')
    street_rows = [f['attributes'] for f in streets['features']]
    classes = Counter((r['FUNCTIONAL_CLASS'], r['MAINTENANCE_RESPONSIBILITY']) for r in street_rows)
    require(classes == Counter({('Parking Lot', 'CCOB'): 99, ('Parking Lot', None): 11,
                               ('Local', 'CCOB'): 12, ('Minor Arterial', 'CCOB'): 7,
                               ('Connector', 'CCOB'): 7}), 'Street class accounting changed')
    fields = {f['name']: f for f in streets['fields']}
    require(all(fields[k].get('domain') is None for k in ('ONE_WAY', 'FROM_Z_LEVEL', 'TO_Z_LEVEL')),
            'Reassess agency field definitions')
    named = [r for r in street_rows if r['FULL_STREETNAME'] in ('Descombes Dr', 'Spader Way', 'E 3Rd Ave')]
    require(named and all(r['ONE_WAY'] is None for r in named), 'Null direction evidence changed')
    context = data['raw-osm-context.json']
    for flag in ('anchor_adopted', 'connector_costs_included', 'access_verified',
                 'datum_alignment_verified', 'release_eligible'):
        require(context.get(flag) is False, 'Raw OSM context cannot certify access')
    require(context['source_sha256'] == 'ef1f9e0832de42ccae2b5614d9d1a00ec41d1b6506e4ca9ef12e1eb895e5d4b7'
            and context['source_bytes'] == 386197077, 'Wrong original Colorado source')
    require(context['bounds_lonlat'] == [-105.072, 39.918, -105.065, 39.923], 'Bounded context changed')
    require((len(context['ways']), len(context['tagged_nodes']), len(context['restrictions'])) == (275, 235, 1),
            'Raw context accounting changed')
    ways = {w['id']: w for w in context['ways']}
    nodes = {n['id']: n for n in context['tagged_nodes']}
    require(len(ways) == 275 and len(nodes) == 235, 'Duplicate OSM identity')
    def incident(nid):
        return {wid for wid, w in ways.items() if any(n[0] == nid for n in w['nodes'])}
    door = nodes[3417588506]['tags']
    require(door.get('name') == 'Motor Vehicles' and door.get('entrance') == 'main'
            and 'motor_vehicle' not in door, 'Office name is not a motor_vehicle permission tag')
    require(incident(3417588506) == {334698996, 367179594}
            and ways[334698996]['tags']['highway'] == 'path'
            and ways[367179594]['tags']['highway'] == 'pedestrian', 'Door incidence changed')
    for nid in (3428679371, 3428679379):
        require(nodes[nid]['tags'].get('access') == 'no' and nodes[nid]['tags'].get('barrier') == 'gate'
                and incident(nid) == {45845852} and ways[45845852]['tags'].get('access') == 'no',
                'Sallyport rejection context changed')
    # Four ways, including a service driveway: do not silently hide that fourth arm.
    require(incident(3428618002) == {16984817, 132723727, 132723728, 332347408},
            'Reference-junction incidence changed')
    require(context['restrictions'][0]['id'] == 11810211
            and context['restrictions'][0]['tags']['restriction'] == 'no_u_turn', 'Restriction context changed')
    return dict(schema='broomfield-access-context-audit-v1', agency_address_features=5,
                agency_street_features=136, agency_parking_lot_features=110,
                raw_highway_ways=275, raw_tagged_nodes=235, raw_restrictions=1,
                building_door_incident_highways=['path', 'pedestrian'],
                reference_junction=dict(node=3428618002, incident_ways=sorted(incident(3428618002)), adopted=False),
                findings={k: 'unknown' for k in ('physical_connection', 'legal_motor_access', 'same_grade',
                                                'direction_and_turns', 'connector_cost')},
                decision='needs_evidence', access_verified=False, anchor_adopted=False,
                connector_costs_included=False, release_eligible=False,
                warning='Source/model consistency only; no real-world access certification or chosen anchor.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true')
    args = parser.parse_args()
    result = json.dumps(audit(), indent=2, sort_keys=True) + '\n'
    target = DIRECTORY / 'report.json'
    if args.check:
        require(target.read_text() == result, 'Retained audit report changed')
    else:
        target.write_text(result)
    print(result, end='')
