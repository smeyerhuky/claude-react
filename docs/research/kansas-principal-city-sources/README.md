# Kansas principal-city source work

All **seven official Kansas principal cities in five qualifying metros** have separate work records. Six retain inspected primary-publication context; the selected Kansas City, Kansas publication remains unavailable. No anchor or connector is adopted or approved.

| Principal city | CBSA | Context / gap |
| --- | --- | --- |
| Kansas City | 28140 | Unified Government homepage unavailable through direct HTTP and renderer; no Missouri source substituted |
| Lenexa | 28140 | Civic Campus garage: named entry/exit streets, overnight parking prohibition, reserved EV spaces |
| Overland Park | 28140 | Canonical city website contact address only |
| Lawrence | 29940 | Parking-service guidance distinguishes floors, space markings, hotel spaces, permits and public use |
| Manhattan | 31740 | Public Downtown Garage access requires visitor registration; free hours retain that condition |
| Topeka | 45820 | Garages with hourly spaces distinguished from records with no hourly parking |
| Wichita | 48620 | City Hall surface-parking guidance names approach streets and separates paid and free lots |

The three Kansas members of CBSA 28140 cannot substitute for one another or its Missouri principal cities. A source about Kansas City, Missouri does not establish an entry in Kansas City, Kansas. Missing required members of the future reviewed anchor set remain unknown.

## Conditions retained without inferring road access

Lenexa publishes Winchester Street and 88th Street as entry/exit streets and prohibits parking from 1 to 4 a.m. That parking prohibition is not automatically a road-entry closure. Library drive-through use and EV-charging-only spaces have distinct conditions. The retained structured condition explicitly keeps `road_entry_closure_inferred=false`; no garage clearance, exact entry node, grade or connector is verified.

Manhattan describes 24-hour public garage parking with registration required for each visitor session, including the first two free hours. Registration through an app or pay station and discounted permits have different conditions. The record keeps registration required and `access_approval_inferred=false`.

Lawrence distinguishes levels and colored spaces, including hotel-only Riverfront spaces with towing consequences. Opening hours are distinct from enforcement hours, and portions may close for weather or construction. Topeka's published list includes facilities with no hourly parking and others with only some hourly stalls; no citywide permission or blanket operating-hours rule is inferred.

Wichita identifies paid lots approached off 3rd Street or Central and a separate free lot east of Waco. Payment and validation requirements are distinct from vehicle entry. The linked map has not been visually verified in this retained review, and no exact path is selected. The existing modeled-unreachable Wichita Census-origin experiment remains unchanged; a new urban source lead does not repair or replace that origin.

Overland Park's former `.org` homepage redirects to its canonical `.gov` website. Its City Hall address remains a contact-location lead, not a car entrance. The unavailable Unified Government page is recorded as a retrieval gap, not a world-accessibility conclusion.

## Provenance, reproduction and development view

Captured 2026-10-31 UTC: four direct HTTP captures, two primary pages inspected through the web renderer and one unavailable selected publication. Lawrence's direct HTTP retrieval succeeded despite a renderer failure. Rendered sources retain null original HTTP status and the separate failed direct attempt; cached content may predate retrieval. No original successful response identity is invented.

Short literal quotes, factual observations and limitations are retained with exact primary URLs and capture identities. The manifest hashes every city record and binds the official Census inventory. Full HTML, app/runtime state, error bodies, search snippets, environment configuration and private source archives are omitted. Capture hashes identify original response bytes that are not retained in these derived records.

```sh
python -m unittest discover -s scripts -p 'test_*_principal_city_source_screen.py' -v
python scripts/kansas_principal_city_source_screen.py
python scripts/principal_city_source_work.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Tests reject substituting Lenexa for Kansas City in the shared CBSA, turning an overnight parking rule into a road closure and removing registration from free parking, even after rehashing. The frozen development inventory now records 50 city work entries: 44 retained contexts, six unavailable selected publications and 648 memberships not recorded here. All 698 access reviews remain unresolved; zero anchors and connectors are approved. The standalone HTML is regenerated from that exact snapshot. No public map, older inspector view, graph cost or independent approval gate changes.
