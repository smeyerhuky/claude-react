"""Keep Nebraska parking publications separate from verified vehicle access."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/nebraska-principal-city-sources')
PUBLISHERS = {
    '3128000': ('lincoln', 'www.lincoln.ne.gov'),
    '3137000': ('omaha', 'www.ned.uscourts.gov'),
}
CONDITIONS = {
    'lincoln': dict(monthly_keycard_is_unrestricted_public_entry=False,
                    facility_map_point_is_surveyed_vehicle_entry=False,
                    published_clearance_applies_to_complete_path=False,
                    vehicle_dimensions_assumed=False),
    'omaha': dict(guidance_scope='federal juror parking',
                  reimbursement_is_general_public_entitlement=False,
                  courthouse_building_entrance_is_vehicle_connector=False,
                  printed_garage_hours_are_reference_date_access_proof=False,
                  publication_or_revision_date_inferred=False),
}


def check(root=ROOT):
    result = check_batch('NE', FOLDER, PUBLISHERS, root=root)
    for slug, expected in CONDITIONS.items():
        source = json.loads((Path(root) / FOLDER / (slug + '.json')).read_text())
        require(source['published_conditions'] == expected
                and all(type(source['published_conditions'][key]) is type(value)
                        for key, value in expected.items()),
                'Retain publication scope without vehicle-access inference: ' + slug)
        if slug == 'omaha':
            require(source['source_kind'] == 'federal_juror_parking_guidance',
                    'Federal juror guidance cannot become general municipal parking')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
