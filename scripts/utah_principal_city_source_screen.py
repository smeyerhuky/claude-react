"""Account for Utah principal-city source work without certifying access."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch

FOLDER = Path('docs/research/utah-principal-city-sources')
PUBLISHERS = {
    '4944320': ('lehi', 'www.lehi-ut.gov'),
    '4945860': ('logan', 'www.loganutah.gov'),
    '4953230': ('murray', 'www.murray.utah.gov'),
    '4955980': ('ogden', 'www.ogdencity.gov'),
    '4957300': ('orem', 'orem.gov'),
    '4962470': ('provo', 'www.provo.gov'),
    '4965330': ('st-george', 'sgcityutah.gov'),
    '4967000': ('salt-lake-city', 'www.slc.gov'),
}


def check(root=ROOT):
    return check_batch('UT', FOLDER, PUBLISHERS, root=root)


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
