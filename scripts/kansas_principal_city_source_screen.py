"""Account for Kansas publications without turning parking rules into road access."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/kansas-principal-city-sources')
PUBLISHERS = {
    '2036000': ('kansas-city', 'www.wycokck.org'),
    '2039350': ('lenexa', 'www.lenexa.com'),
    '2053775': ('overland-park', 'www.opkansas.gov'),
    '2038900': ('lawrence', 'www.lawrenceks.gov'),
    '2044250': ('manhattan', 'www.manhattanks.gov'),
    '2071000': ('topeka', 'topeka.gov'),
    '2079000': ('wichita', 'www.wichita.gov'),
}


def check(root=ROOT):
    result = check_batch('KS', FOLDER, PUBLISHERS, root=root)
    folder = Path(root) / FOLDER
    lenexa = json.loads((folder / 'lenexa.json').read_text())
    require(lenexa['published_conditions'] == dict(overnight_parking_prohibited_local=['01:00', '04:00'],
                                                  road_entry_closure_inferred=False),
            'Overnight parking rule cannot certify a road-entry closure')
    manhattan = json.loads((folder / 'manhattan.json').read_text())
    require(manhattan['published_conditions'] == dict(visitor_registration_required=True,
                  first_free_hours_with_registration=2, max_continuous_parking_hours=24,
                  access_approval_inferred=False), 'Free visitor parking cannot erase registration or infer access approval')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
