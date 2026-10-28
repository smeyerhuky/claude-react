"""Validate reproducible AI review records, never grant release approval."""
import argparse
import hashlib
import json
from pathlib import Path

QUESTIONS = {'physical_connection', 'legal_motor_access', 'same_grade',
             'direction_and_turns', 'connector_cost'}


def validate(packet, root):
    root = Path(root).resolve()
    def require(condition, message):
        if not condition:
            raise ValueError(message)
    require(packet.get('schema') == 'ai-connector-review-v1', 'Unknown review schema')
    require(packet.get('release_eligible') is False, 'Review cannot authorize release')
    require(packet.get('access_verified') is False, 'Review cannot self-certify access')
    require(packet.get('origin_policy') in {'census-regression-v1', 'urban-access-anchor-v1'},
            'Explicit origin policy required')
    require(isinstance(packet.get('cbsa'), str) and len(packet['cbsa']) == 5
            and packet['cbsa'].isdigit(), 'CBSA identity required')
    reviewer = packet.get('reviewer', {})
    require(reviewer.get('kind') == 'ai' and bool(reviewer.get('identity'))
            and bool(reviewer.get('procedure')), 'Disclose AI reviewer and procedure')
    sources = packet.get('sources', [])
    require(bool(sources), 'Evidence sources required')
    index = {}
    for source in sources:
        identity = source['id']
        require(identity not in index, 'Duplicate evidence source')
        path = (root / source['path']).resolve()
        require(path.is_relative_to(root) and path.is_file(), 'Source must be retained in repository')
        raw = path.read_bytes()
        require(hashlib.sha256(raw).hexdigest() == source['sha256'], 'Evidence bytes changed')
        require(source.get('kind') in {'routing_model', 'independent_access_record'},
                'Evidence source kind required')
        require(bool(source.get('provenance')), 'Source provenance required')
        index[identity] = (source, path)
    assertions = packet.get('machine_assertions', [])
    require(bool(assertions), 'At least one reproducible assertion required')
    for assertion in assertions:
        require(assertion['source'] in index, 'Unknown assertion source')
        value = json.loads(index[assertion['source']][1].read_text())
        # An explicit sequence of keys avoids ambiguous string path parsing.
        require(bool(assertion.get('keys')), 'Assertion key path required')
        for key in assertion['keys']:
            value = value[key]
        require(type(value) is type(assertion['equals']) and value == assertion['equals'],
                'Machine assertion failed')
    findings = packet.get('findings', {})
    require(set(findings) == QUESTIONS, 'All access questions must be answered')
    for question, finding in findings.items():
        require(finding.get('status') in {'supported', 'contradicted', 'unknown'},
                'Invalid finding status')
        require(bool(finding.get('reason')), 'Finding needs reasoning')
        refs = finding.get('sources', [])
        require(all(ref in index for ref in refs), 'Unknown finding source')
        if finding['status'] != 'unknown':
            require(bool(refs), 'Non-unknown finding needs retained evidence')
        if finding['status'] == 'supported':
            require(any(index[ref][0]['kind'] == 'independent_access_record' for ref in refs),
                    'Routing model alone cannot support real-world access')
    require(packet.get('decision') in {'needs_evidence', 'reject_modeled_candidate',
                                        'ready_for_separate_approval'}, 'Invalid decision')
    if packet['decision'] == 'ready_for_separate_approval':
        require(all(f['status'] == 'supported' for f in findings.values()),
                'Unresolved findings prevent approval handoff')
    require(bool(packet.get('limitations')), 'Review limitations required')
    return {'cbsa': packet['cbsa'], 'decision': packet['decision'],
            'machine_assertions_checked': len(assertions),
            'access_verified': False, 'release_eligible': False,
            'warning': 'Checks establish packet consistency, not truth or reviewer independence.'}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('packet', type=Path)
    parser.add_argument('--root', type=Path, default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    print(json.dumps(validate(json.loads(args.packet.read_text()), args.root), indent=2))
