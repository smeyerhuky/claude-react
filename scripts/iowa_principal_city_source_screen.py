"""Retain Iowa publication ownership, timing and retrieval limits without access approval."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/iowa-principal-city-sources')
PUBLISHERS = {
    '1901855': ('ames', 'www.cityofames.org'),
    '1912000': ('cedar-rapids', 'parkcedarrapids.com'),
    '1919000': ('davenport', 'www.davenportiowa.com'),
    '1921000': ('des-moines', 'councildocs.dsm.city'),
    '1983910': ('west-des-moines', 'www.wdm.iowa.gov'),
    '1938595': ('iowa-city', 'www.icgov.org'),
    '1973335': ('sioux-city', 'www.sioux-city.org'),
    '1911755': ('cedar-falls', 'cedarfalls.com'),
    '1982425': ('waterloo', 'www.cityofwaterlooiowa.com'),
}
CONDITIONS = {
    'ames': dict(employee_tag_is_unrestricted_public_parking=False,
                 parking_exclusion_is_road_closure=False, program_year_proves_reference_date_access=False),
    'cedar-rapids': dict(five_seasons_ramp_selected_as_open=False,
                         operator_listing_is_city_access_attestation=False),
    'davenport': dict(prepayment_is_connector_access_evidence=False,
                      monthly_resident_rate_is_unrestricted_parking=False),
    'des-moines': dict(council_communication_date='2025-01-13', proposal_is_enacted_ordinance=False,
                       future_reservation_system_operation_verified=False),
    'west-des-moines': dict(blocked_request_is_inspected_publication=False,
                            retrieval_failure_proves_no_car_access=False),
    'iowa-city': dict(blocked_request_is_inspected_publication=False,
                      retrieval_failure_proves_no_car_access=False),
    'sioux-city': dict(skywalk_is_motor_vehicle_connector=False,
                       free_periods_are_unrestricted_car_entry=False),
    'cedar-falls': dict(shared_business_lots_are_unrestricted_city_roads=False,
                        parking_limit_is_entry_gate_hours=False),
    'waterloo': dict(office_hours_are_car_access_hours=False,
                     city_hall_postal_address_is_reviewed_driveway=False),
}


def check(root=ROOT):
    result = check_batch('IA', FOLDER, PUBLISHERS, root=root)
    for slug, expected in CONDITIONS.items():
        source = json.loads((Path(root) / FOLDER / (slug + '.json')).read_text())
        require(source['published_conditions'] == expected
                and all(type(source['published_conditions'][key]) is type(value)
                        for key, value in expected.items()),
                'Retain publication scope, timing and retrieval limits: ' + slug)
        if slug in ('west-des-moines', 'iowa-city'):
            require(source['retrieval_method'] == 'unavailable',
                    'Blocked selected publication cannot become inspected evidence')
        if slug == 'cedar-rapids':
            require(source['source_kind'] == 'operator_parking_guidance',
                    'Operator listing cannot become municipal access attestation')
        if slug == 'des-moines':
            require(source['source_kind'] == 'municipal_planning',
                    'Council proposal retains its planning scope')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
