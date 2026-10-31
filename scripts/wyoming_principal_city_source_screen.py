"""Account for Cheyenne source context without replacing its Census origin."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/wyoming-principal-city-sources')
PUBLISHERS = {'5613900': ('cheyenne', 'www.cheyennepd.org')}


def check(root=ROOT):
    result = check_batch('WY', FOLDER, PUBLISHERS, root=root)
    source = json.loads((Path(root) / FOLDER / 'cheyenne.json').read_text())
    require(source['published_scope'] == dict(overnight_street_answer_generalized_to_garages=False,
                                             origin_replaced=False),
            'Street parking scope cannot approve garage access or replace the origin')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
