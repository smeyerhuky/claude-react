# Oklahoma principal-city sources and unresolved facility identity

All three official Oklahoma principal cities have separate retained primary-publication contexts: Lawton (30020), Oklahoma City (36420) and Tulsa (46140). This is source-work accounting, not three verified entries or approved anchors. No connector is approved, and #137's different-approver gate remains intact.

## Oklahoma City: named entrance streets, no adopted entry

[EMBARK's publication](https://www.embarkok.com/streetcar/park-and-ride-free), from the Central Oklahoma Transportation and Parking Authority, describes four public garages as open 24/7. Its table distinguishes each address from its entrance streets:

| Garage | Published address | Published entrance streets |
| --- | --- | --- |
| Arts District | 431 W. Main | Main & Colcord |
| Sheridan Walker | 501 W. Sheridan | Walker & Sheridan |
| Century Center | 100 W. Sheridan | Sheridan |
| Convention Center | 15 SW 4th | S. Broadway |

The transit-ride promotion does not state that garage access requires transit use; no such restriction is invented. It also supplies no verified entry coordinate, clearance, same-grade graph connection, complete local maneuvers or connector costs. A named street is a lead for inspecting a specific entrance, not permission to snap an address centroid to it. No garage is selected.

## Tulsa: keep the address ambiguity explicit

The [city's public garage list](https://www.cityoftulsa.org/residents/arts-recreation/downtown-tulsa/downtown-parking/parking-garages/) lists **Civic Center Parkade, 520 E. 3rd St.** The separately inspected [American Parking operator publication](https://www.americanparking.com/find-parking/tulsa/) lists **Lot 120 – Civic Center Parkade, 550 W. 3rd, Tulsa, OK 741035**. The operator's unusual postal-code text is retained literally.

Matching names do not establish that the records describe the same precise facility or entrance. They may reflect different addresses, entrances or an error; none is silently selected or corrected. The retained `tulsa.json` binds both primary publications and their direct HTTP capture identities inside `address_comparison`. `same_facility_verified` stays false and `selected_origin_lonlat` stays null. The city list also mixes garages with a Performing Arts Center surface lot; no uniform garage rules are assigned to all listed facilities.

## Lawton: location lead only

The [official city website](https://www.lawtonok.gov/) gives its contact location at 212 SW 9th Street. A former utility-services URL returned 404. Secondary reports of a payment drive-through are not treated here as primary vehicle-entry evidence. The retained Lawton context supplies no exact driveway, purpose-independent permission, geometry or adopted origin.

## Provenance and checks

Captured 2026-10-31 UTC. Oklahoma City and Tulsa were inspected from successful direct HTTP captures; the operator comparison is an additional successful direct capture. Lawton's primary page was inspected through the web renderer after a failed direct request. Its original successful HTTP status is unknown and remains null; a renderer may use an earlier cached crawl.

Short quotes, factual observations and limitations are retained. The manifest hashes each complete retained city record and binds the official principal-city inventory. Original raw-response hashes identify capture bytes that are not retained here. Full HTML, app state, error bodies, private source archives and search snippets are omitted. CI verifies retained consistency, not live-source freshness or physical/legal truth.

```sh
python -m unittest discover -s scripts -p 'test_*_principal_city_source_screen.py' -v
python scripts/oklahoma_principal_city_source_screen.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Tests reject incomplete city accounting, silently correcting the city address, resolving facility identity through name matching and assigning an origin from an address, including when the source record is rehashed. All three remain `needs_evidence`. Exact ordinary-car entries, independent physical/legal/grade/direction evidence, complete connector costs and separate approval are still required. No Census origin, frozen graph cost, public straight-line map or older inspector view changes.
