"""Audit municipal source screening, never certify a drivable urban anchor."""
import hashlib
import json
from pathlib import Path
from metro_scenario_checkpoint import require

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'docs/research/colorado-anchor-source-batch'
CBSA = {'boulder': '14500', 'colorado-springs': '17820', 'fort-collins': '22660',
        'greeley': '24540', 'grand-junction': '24300', 'pueblo': '39380'}


def public_parking_inventory(document):
    require('error' not in document and not document.get('exceededTransferLimit', False), 'Complete public GIS response required')
    require(document['spatialReference']['wkid'] == 4326, 'Explicit requested lon/lat CRS required')
    features = document['features']; ids = [r['attributes']['OBJECTID_1'] for r in features]
    require(features and len(ids) == len(set(ids)), 'Unique nonempty parking inventory required')
    # Conflicting labels are preserved; an Operational lifecycle flag cannot
    # turn a removed parking zone into permission for vehicle use.
    ambiguous = [r['attributes']['OBJECTID_1'] for r in features
                 if 'removed' in (r['attributes'].get('Name') or '').lower()]
    return dict(feature_count=len(ids), ambiguous_removed_zone_ids=sorted(ambiguous),
                parking_labels=sorted({r['attributes']['Name'] for r in features}),
                access_verified=False, release_eligible=False)


def audit():
    manifest = json.loads((FOLDER/'manifest.json').read_text())
    require(manifest['schema'] == 'colorado-municipal-parking-source-batch-v1'
            and manifest['access_verified'] is False and manifest['release_eligible'] is False,
            'Unapproved source batch required')
    require(set(manifest['excerpts']) == set(CBSA), 'All six additional Colorado identity screens required')
    records = list(manifest['retained_sources']) + list(manifest['excerpts'].values()) + manifest['derived_excerpts']
    for record in records:
        path = (ROOT/record['path']).resolve()
        require(path.is_relative_to(FOLDER.resolve()) and path.is_file(), 'Retained source must remain within batch')
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == record['sha256'], 'Retained municipal source bytes changed')
        if 'bytes' in record: require(len(raw) == record['bytes'], 'Source length changed')
    for city in CBSA:
        record = json.loads((FOLDER/(city+'.json')).read_text())
        require(record['http_status'] == 200 and record['excerpts']
                and record['access_verified'] is False and record['release_eligible'] is False,
                'Inspectable unapproved municipal excerpts required')
    terms = json.loads((FOLDER/'springs-terms-excerpts.json').read_text())
    require(terms['source_sha256'] == hashlib.sha256((FOLDER/'springs-terms.pdf').read_bytes()).hexdigest()
            and terms['access_verified'] is False and terms['release_eligible'] is False, 'Terms must bind retained PDF without approval')
    parking = public_parking_inventory(json.loads((FOLDER/'greeley-public-parking.json').read_text()))
    return dict(schema='colorado-anchor-source-screen-v1', source_screened_cbsa_ids=sorted(CBSA.values()),
                existing_denver_review_cbsa='19740', new_anchors_adopted=0, new_connectors_approved=0,
                greeley=parking, access_verified=False, release_eligible=False,
                remaining=['exact permitted directed entry and exit', 'independent current grade/turn and physical evidence',
                           'explicit vehicle/anchor policy and connector path costs', 'separate independent approval under #137'])


if __name__ == '__main__':
    print(json.dumps(audit(), indent=2))
