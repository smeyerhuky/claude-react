"""Keep Arkansas publication timing, jurisdiction and retrieval limits explicit."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/arkansas-principal-city-sources')
PUBLISHERS = {
    '0505320': ('bentonville', 'www.bentonville.ar.gov'),
    '0515190': ('conway', 'conwayarkansas.gov'),
    '0523290': ('fayetteville', 'www.fayetteville-ar.gov'),
    '0524550': ('fort-smith', 'www.fortsmithar.gov'),
    '0535710': ('jonesboro', 'www.jonesboroar.gov'),
    '0541000': ('little-rock', 'littlerock.gov'),
    '0550450': ('north-little-rock', 'nlr.ar.gov'),
    '0560410': ('rogers', 'www.rogersar.gov'),
    '0566080': ('springdale', 'www.springdalear.gov'),
}
CONDITIONS = {
    'bentonville': dict(contact_address_is_reviewed_vehicle_entry=False,
                       historic_parking_plan_used_as_current_inventory=False),
    'conway': dict(publication_date='2026-05-19', scheduled_start_date='2026-05-26',
                   scheduled_completion_year=2026, actual_start_or_completion_verified=False,
                   construction_notice_is_reference_date_access_proof=False),
    'fayetteville': dict(parking_time_windows_are_unrestricted_entry=False,
                         reserved_level_is_general_public_parking=False),
    'fort-smith': dict(direct_retrieval_blocked=True, search_result_is_inspected_publication=False,
                       failed_request_means_no_car_access=False),
    'jonesboro': dict(office_hours_are_vehicle_access_hours=False),
    'little-rock': dict(free_meter_periods_are_alley_access_permission=False),
    'north-little-rock': dict(argenta_theater_opposite_lot_is_city_owned=False,
                              another_principal_city_source_substitution_permitted=False),
    'rogers': dict(museum_accessibility_is_driveway_grade_proof=False,
                   museum_hours_are_vehicle_access_hours=False),
    'springdale': dict(contact_address_is_reviewed_vehicle_entry=False,
                       office_hours_inferred_from_unrendered_page=False),
}


def check(root=ROOT):
    result = check_batch('AR', FOLDER, PUBLISHERS, root=root)
    for slug, expected in CONDITIONS.items():
        source = json.loads((Path(root) / FOLDER / (slug + '.json')).read_text())
        require(source['published_conditions'] == expected
                and all(type(source['published_conditions'][key]) is type(value)
                        for key, value in expected.items()),
                'Retain published timing/scope/retrieval limits without access inference: ' + slug)
        if slug == 'fort-smith':
            require(source['retrieval_method'] == 'unavailable',
                    'Fort Smith blocked request cannot become an inspected publication')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
