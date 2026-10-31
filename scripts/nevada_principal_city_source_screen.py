"""Keep Nevada's five principal cities and source-scope gaps separate."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/nevada-principal-city-sources')
PUBLISHERS = {
    '3231900': ('henderson', 'www.cityofhenderson.com'),
    '3240000': ('las-vegas', 'www.lasvegasnevada.gov'),
    '3251800': ('north-las-vegas', 'www.cityofnorthlasvegas.com'),
    '3254600': ('paradise', 'www.clarkcountynv.gov'),
    '3260600': ('reno', 'reno.gov'),
}


def check(root=ROOT):
    result = check_batch('NV', FOLDER, PUBLISHERS, root=root)
    folder = Path(root) / FOLDER
    paradise = json.loads((folder / 'paradise.json').read_text())
    require(paradise['source_kind'] == 'county_administrative_context'
            and paradise['geographic_identity'] == dict(cdp_boundary_alignment_verified=False,
                                                       meeting_location_promoted_to_vehicle_entry=False),
            'County advisory area or meeting venue cannot become a reviewed CDP anchor')
    henderson = json.loads((folder / 'henderson.json').read_text())
    require(henderson['published_scope'] == dict(event_closure_check_required=True,
                                                texas_avenue_guaranteed_unrestricted=False),
            'Named alternative entrance still needs event-closure review')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
