"""Keep Missouri construction dates, visitor scope and operating rules distinct."""
import json
from pathlib import Path
from principal_city_source_screen import ROOT, INVENTORY, check_batch, require

FOLDER = Path('docs/research/missouri-principal-city-sources')
PUBLISHERS = {
    '2915670': ('columbia', 'www.como.gov'),
    '2937000': ('jefferson-city', 'www.parkjcmo.org'),
    '2937592': ('joplin', 'www.joplinmo.org'),
    '2938000': ('kansas-city', 'www.kcmo.gov'),
    '2964550': ('st-joseph', 'www.stjosephmo.gov'),
    '2964082': ('st-charles', 'www.stcharlescitymo.gov'),
    '2965000': ('st-louis', 'www.stlouis-mo.gov'),
    '2970000': ('springfield', 'www.mow.uscourts.gov'),
}
CONDITIONS = {
    'columbia': dict(entry_clearance_applies_to_entire_facility=False, vehicle_dimensions_assumed=False),
    'jefferson-city': dict(madison_garage_selected_as_open=False, payment_hours_are_road_closure=False,
                          future_kiosks_assumed_operational=False),
    'joplin': dict(publication_date='2026-10-12', proposed_duration_months=9,
                   work_start_or_completion_inferred=False),
    'kansas-city': dict(announced_open_date='2026-05-22', published_paid_rate_effective_date='2026-06-08',
                        introductory_free_period_is_current_default=False, event_shuttle_is_general_access_proof=False),
    'springfield': dict(division='Springfield, Missouri', guidance_scope='juror parking',
                        general_public_motor_access_verified=False, same_named_city_substitution_permitted=False),
    'st-charles': dict(anticipated_reopen_year_in_publication=2014, project_is_current_2026=False,
                       subsequent_reopening_or_entrance_operation_verified=False),
    'st-joseph': dict(notice_date='2026-05-11', first_announced_closure_date='2026-05-18',
                      subsequent_completion_verified=False, reference_date_access_confirmed=False),
    'st-louis': dict(monthly_or_employee_24h_is_unrestricted_hourly_access=False,
                     payment_or_hours_are_connector_approval=False),
}


def check(root=ROOT):
    result = check_batch('MO', FOLDER, PUBLISHERS, root=root)
    for slug, expected in CONDITIONS.items():
        source = json.loads((Path(root) / FOLDER / (slug + '.json')).read_text())
        require(source['published_conditions'] == expected
                and all(type(source['published_conditions'][key]) is type(value) for key, value in expected.items()),
                'Retain published timing/scope limits without access inference: ' + slug)
        if slug == 'springfield':
            require(source['source_kind'] == 'federal_juror_parking_guidance',
                    'Court juror guidance cannot become general municipal parking')
    return result


if __name__ == '__main__':
    print(json.dumps(check(), indent=2, sort_keys=True))
