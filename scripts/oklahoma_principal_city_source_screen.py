"""Account for Oklahoma source work and preserve an unresolved address ambiguity."""
import json
from pathlib import Path
import re

from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/oklahoma-principal-city-sources')
PUBLISHERS = {
    '4041850': ('lawton', 'www.lawtonok.gov'),
    '4055000': ('oklahoma-city', 'www.embarkok.com'),
    '4075000': ('tulsa', 'www.cityoftulsa.org'),
}


def check(root=ROOT):
    result = check_batch('OK', FOLDER, PUBLISHERS, root=root)
    source = json.loads((Path(root) / FOLDER / 'tulsa.json').read_text())
    comparison = source['address_comparison']
    require(comparison['city_literal'] == source['selected_quote'] == '520 E. 3rd St.'
            and comparison['operator_literal'] == comparison['operator_quote'] == '550 W. 3rd, Tulsa, OK 741035'
            and comparison['operator_facility_literal'] == 'Lot 120 – Civic Center Parkade',
            'Literal city/operator discrepancy must remain inspectable')
    capture = comparison['operator_capture']
    require(capture['url'] == capture['final_url'] == 'https://www.americanparking.com/find-parking/tulsa/'
            and capture['http_status'] == 200 and capture['capture_date_utc'] == source['capture_date_utc']
            and type(capture['response_bytes']) is int and capture['response_bytes'] > 0
            and re.fullmatch('[a-f0-9]{64}', capture['response_sha256']),
            'Inspectably distinct operator publication required')
    require(comparison['same_facility_verified'] is False and comparison['selected_origin_lonlat'] is None
            and comparison['decision'] == 'unresolved_address_and_facility_identity' and comparison['limitations'],
            'Address/name matching cannot resolve identity or select an origin')
    result['unresolved_address_comparisons'] = 1
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
