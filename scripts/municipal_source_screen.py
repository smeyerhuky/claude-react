"""Validate complete state source screens without approving any driving access."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.parse import urlsplit
from metro_scenario_checkpoint import require

ROOT = Path(__file__).resolve().parents[1]
NATIVE = ROOT/'docs/research/native-state-inventory/report.json'
KINDS = {'municipal_parking_guidance', 'municipal_facility_location', 'municipal_planning'}


def check(manifest_path, root=ROOT):
    root = Path(root).resolve(); manifest_path = Path(manifest_path).resolve()
    require(manifest_path.is_relative_to(root), 'Manifest must be retained in repository')
    manifest = json.loads(manifest_path.read_text()); raw = (root/NATIVE.relative_to(ROOT)).read_bytes()
    require(hashlib.sha256(raw).hexdigest() == manifest['native_state_report_sha256'], 'Exact native state inventory required')
    native = json.loads(raw)
    require(manifest['schema'] == 'municipal-source-screen-batch-v1'
            and all(manifest.get(f) is False for f in ('access_verified', 'release_eligible', 'geographic_coverage_certified')),
            'Source screens cannot claim certified access or coverage')
    state = manifest['state']
    eligible = {r['cbsa'] for r in native['rows'] if any(s['abbreviation'] == state for s in r['point_states'])}
    records = manifest['records']; ids = [r['cbsa'] for r in records]
    require(eligible and set(ids) == eligible and len(set(ids)) == len(ids), 'Complete nonempty unique state metro screen required')
    kinds = {}
    for row in records:
        require(row['entry_review_status'] == 'needs_evidence'
                and all(row.get(f) is False for f in ('anchor_adopted', 'access_verified', 'release_eligible')),
                'Municipal source context is not connector review approval')
        require(row['source_kind'] in KINDS, 'Explicit source context required')
        path = (root/row['source_path']).resolve()
        require(path.is_relative_to(manifest_path.parent) and path.is_file(), 'Evidence must remain in source batch')
        raw = path.read_bytes(); require(hashlib.sha256(raw).hexdigest() == row['source_sha256'], 'Retained municipal source changed')
        source = json.loads(raw); url = urlsplit(source['url'])
        require(url.scheme == 'https' and url.hostname and not url.username and not url.password, 'Public HTTPS provenance required')
        require(source['schema'] == 'municipal-source-excerpts-v1' and source['http_status'] == 200
                and source['cbsa'] == row['cbsa'] and source['source_kind'] == row['source_kind']
                and source['excerpts'] and source['interpretation'] and source['retention']
                and source['access_verified'] is False and source['release_eligible'] is False,
                'Inspectable, identity-bound, unapproved source excerpts required')
        kinds[row['cbsa']] = row['source_kind']
    return dict(state=state, source_screened_metros=len(records), source_context_by_cbsa=kinds,
                new_anchors_adopted=0, new_connectors_approved=0, access_verified=False, release_eligible=False)


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('manifest', type=Path); a = p.parse_args()
    print(json.dumps(check(a.manifest), indent=2))
