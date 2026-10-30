"""Check inspectable Tucson visitor-parking publication and timed closure notice.

No chosen driveway geometry, path cost, real-world access or anchor is approved.
"""
import hashlib
import json
from pathlib import Path
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/tucson-parking-publication'


def audit(root=REFERENCE):
    manifest = json.loads((root/'manifest.json').read_text())
    def require(value, message):
        if not value: raise ValueError(message)
    require(manifest['schema'] == 'tucson-parking-publication-manifest-v1', 'Explicit publication manifest required')
    require(set(manifest['files']) == {'visitor-excerpts.json', 'publication-chain.json', 'congress-closure-20261029.pdf'}, 'Exact retained publication files required')
    for name, record in manifest['files'].items():
        raw = (root/name).read_bytes()
        require(len(raw) == record['bytes'] and hashlib.sha256(raw).hexdigest() == record['sha256'], 'Publication bytes changed: '+name)
    visitor = json.loads((root/'visitor-excerpts.json').read_text())
    chain = json.loads((root/'publication-chain.json').read_text())
    require(visitor['url'] == chain['visitor_url'] == 'https://www.tucsonaz.gov/Departments/Transportation-Mobility/Park-Tucson/Daily-Visitor-Parking', 'Exact visitor publication identity required')
    text = '\n'.join(visitor['excerpts'])
    for literal in ('Visitor parking is available in all six Park Tucson garages',
                    'Pennington Street Garage - 110 E. Pennington St., entrance and exit on Scott Avenue',
                    'Open 24 hours, 7 days/week', '711 Public Spaces', 'pressing a green button',
                    'insert the same card at the exit', '$15 Lost Ticket Fee'):
        require(literal in text, 'Retain published use/entry/payment context: '+literal)
    require(chain['closure_link_label'] == 'Oct 31 2026 Halloween Congress Street Pilot Closure Map'
            and chain['pdf_url'].endswith('/map_congress-st-closure_rev-3_20261029.pdf'), 'Dated city publication link required')
    pdf = PdfReader(root/'congress-closure-20261029.pdf')
    require(len(pdf.pages) == 1, 'Review changed closure map extent')
    text = ' '.join(pdf.pages[0].extract_text().split())
    for literal in ('Congress St Road Closure', 'Halloween Night (10/31/2026)', 'Map Exported: 10/29/2026',
                    'Congress St will be CLOSED from 5:00p.m., Saturday October 31st to 3:00a.m., Sunday November 1st',
                    'Local Traffic Only', 'Sun Link Operational', 'Neighborhood Parking Permit Program restrictions'):
        require(literal in text, 'Retain timed closure/conditional street context: '+literal)
    event = manifest['closure_event']
    require(event['start_local'] == '2026-10-31T17:00:00' and event['end_local'] == '2026-11-01T03:00:00'
            and event['map_export_date'] == '2026-10-29', 'Do not silently broaden or shift event window')
    for obj in (manifest, visitor):
        require(all(obj.get(k) is False for k in ('entry_path_verified','anchor_adopted','access_verified','release_eligible')), 'Publication is not a verified connector')
    return dict(facility='Pennington Street Garage', published_entry_exit_street='Scott Avenue',
                closure_start_local=event['start_local'], closure_end_local=event['end_local'],
                entry_path_verified=False, anchor_adopted=False, access_verified=False, release_eligible=False)


if __name__ == '__main__': print(json.dumps(audit(), indent=2))
