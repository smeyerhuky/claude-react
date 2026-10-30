"""Build the offline 33-source, 19-sample research explorer from audited reports."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path

from build_metro_probe_explorer import TEMPLATE
from las_vegas_ui_checkpoint import ROOT, REFERENCE, check_frozen


def build(output):
    data = check_frozen()
    labels = (ROOT / 'public/data/metros-census-2025.csv').read_bytes()
    sha = hashlib.sha256(labels).hexdigest()
    if sha != 'ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':
        raise ValueError('Exact original display-name CSV required')
    names = {row['cbsa']: row['name'] for row in csv.DictReader(io.StringIO(labels.decode()))}
    data['display_names'] = {s['cbsa']: names[s['cbsa']] for s in data['sources']}
    data['display_names_csv_sha256'] = sha
    vegas = next(s for s in data['sources'] if s['cbsa'] == '29820')
    data['sample_labels'] = {str(vegas['node']): 'Las Vegas road-lead sample'}
    template = TEMPLATE
    replacements = {
        '<title>Metro road-node research explorer</title>': '<title>Las Vegas eight-state Census road-node experiment</title>',
        '<h1>Metro road-node research explorer</h1>': '<h1>Las Vegas eight-state Census road-node experiment</h1>',
        'Costs among the 26 modeled sources only': 'Costs among the 33 modeled sources only',
        'Minimum stored cost among the 26 modeled sources:': 'Minimum stored cost among the 33 modeled sources:',
        'Five dated OSM inputs': 'Eight dated OSM inputs',
        'The 72 unreachable cases': 'The 152 modeled NoData cases',
        "o.textContent=probe;": "o.textContent=data.sample_labels[probe]?`${data.sample_labels[probe]} (${probe})`:probe;",
        "'Modeled unreachable'": "'Modeled NoData — unreachable in this graph'",
        '<th>Model result</th>': '<th>Model result</th><th>Unverified origin gap (km)</th>',
        "'Finite modeled cost'])": "'Finite modeled cost',(source.diagnostic_gap_m/1000).toFixed(3)])",
    }
    for before, after in replacements.items():
        if template.count(before) != 1:
            raise ValueError('Shared template changed; review scenario labels: ' + before)
        template = template.replace(before, after)
    notice = f'''<p class="notice">Frozen audit: <strong>33 sources × 19 samples × 2 metrics × 2 directions = 2,508 costs</strong>; 2,356 finite and 152 modeled NoData. All 18 inherited samples are retained unchanged, with one additional Las Vegas road-node sample. All 334 unrepresented qualifying competitors remain unknown.</p>
<p class="notice">Zero connectors are approved. No urban access anchors are adopted. Reviewed urban access anchors are the future direction; independent access evidence under #137 is still required. The Las Vegas road lead is {vegas['diagnostic_gap_m']/1000:.3f} km from its native Census point. Its selected road node lies inside the Hollywood Pit polygon; precise connector access remains unresolved. The four zero self costs at that road-node sample express node identity only. Every origin gap below is an unverified straight-line diagnostic, excluded from graph costs.</p>'''
    template = template.replace('<p id="inventory"></p>', '<p id="inventory"></p>' + notice)
    manifest = json.loads((REFERENCE / 'manifest.json').read_text())
    provenance = f" Parent original-source CI: {manifest['parent_ci']['run']}; protected-probe CI: {manifest['probe_ci']['run']}. Raw report SHA-256: parent {manifest['parent_report_sha256']}, probe {manifest['probe_report_sha256']}."
    template = template.replace('No road-region release approval is present.', 'No road-region release approval is present.' + provenance)
    html = template.replace('__DATA__', json.dumps(data, separators=(',', ':'), allow_nan=False).replace('<', '\\u003c'))
    html = html.replace('__IDENTITY__', json.dumps(manifest['baseline_sha256']))
    Path(output).write_text(html, encoding='utf-8')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(build(args.output))
