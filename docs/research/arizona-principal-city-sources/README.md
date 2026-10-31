# Arizona principal-city source work

The official July 2023 Census principal-city inventory lists **16 Arizona principal cities across seven qualifying metros**. This batch accounts for every city individually, including all seven principal cities in the Phoenix metro. A CBSA-level source cannot stand in for its other principal cities. No reviewed anchor set is adopted and no connector is approved.

| Principal city | CBSA | Retained context / gap |
| --- | --- | --- |
| Casa Grande | 38060 | City Hall facility record: address and parking amenity, no entry |
| Chandler | 38060 | City downtown garage guidance: distinct schedules and height limits |
| Douglas | 43420 | City streetscape concepts, not verified as-built driving conditions |
| Flagstaff | 22380 | Court visit page identifies nearby public parking streets |
| Gilbert | 38060 | Selected official parking page unavailable (HTTP 403); no snippet promoted |
| Kingman | 29420 | City Office of Tourism visitor-center address, hours and holidays; no driving permission |
| Lake Havasu City | 29420 | City London Bridge Beach parking guidance; park and dog-park hours distinguished |
| Mesa | 38060 | Arts-center operator guidance: Sirrine public-parking hours and separate south-lot lead |
| Phoenix | 38060 | County Recorder guidance: free lot, paid city garage, meter enforcement and pedestrian access distinguished |
| Prescott | 39150 | Selected city parking page unavailable through direct HTTP and renderer; indexed snippet excluded |
| Prescott Valley | 39150 | Town contact address only; no parking or entry claim |
| Scottsdale | 38060 | Court construction warning, limited front-lot use and named garage access streets |
| Sierra Vista | 43420 | Selected city contact page unavailable (HTTP 403); no snippet promoted |
| Tempe | 38060 | Selected city transportation page unavailable (HTTP 403); no snippet promoted |
| Tucson | 46060 | Reuses exact previously retained visitor publication; Scott Avenue entry/exit remains unresolved as a full connector |
| Yuma | 49740 | Visitor-center operator parking guidance; center hours are not automatically lot hours |

## Retrieval provenance

Captured 2026-10-31 UTC, except the explicitly reused Tucson record. The 12 inspected publication contexts consist of five direct HTTP captures, six pages inspected through the web renderer and one previously retained record. Four selected publications remain unavailable. This is **source-work accounting**, not 16 inspected vehicle entries, an adopted set of 16 anchors or geographic coverage.

The JSON records retain primary URLs, short literal quotes, factual observations, limitations and hashes of retained record bytes through the manifest. Direct HTTP attempt metadata identifies the original response bytes, which are **not** retained in the repository. A failed direct request remains recorded even if the renderer could inspect the primary page. For rendered content, `source_http_status` is null: no successful original HTTP status or raw-response hash is invented. Renderer caches can predate the retrieval. Error-response bodies, full HTML, app state, private source archives and search snippets are omitted.

Sources include municipal publications and the actual facility operators' guidance. Kingman's page identifies its visitor center as a division of the City Office of Tourism. Visit Yuma identifies itself as the visitor-center operator. The Mesa record is arts-center operator guidance; the Phoenix record comes from the county Recorder. These are distinct publisher roles, not all municipal road-authority determinations.

## Reference-scenario implications

The planned fixed reference is 2026-10-28 18:00 UTC, Wednesday 11 a.m. in Phoenix. Chandler's **free** parking schedules do not establish legal public access outside the free period. Its garage height limits also require a specified vehicle profile; the current scenario leaves vehicle dimensions unspecified, so clearance-controlled connections remain unsupported.

Mesa's operator expressly limits Sirrine Garage **public parking** to after 5 p.m. on weekdays and weekends. That publication does not supply a public-parking candidate at the reference instant. The south lot is a distinct unresolved lead. No road or garage edge is changed from this observation; historic opening at the reference date is not independently established by a later retrieval.

Scottsdale's court page warns of changed parking availability during construction and limits the front lot to accessible parking. It names Drinkwater Boulevard and 2nd Street for garage access, but walking routes to the court do not establish car maneuvers. An awkward sentence about the time limit is retained as uncertainty, not automatically parsed into a legal rule.

The Douglas concept is planning context, not proof that a center turn lane has actually been removed. Lake Havasu's dog-park maintenance hours are not generalized to parking closure. Yuma's visitor-center hours are not generalized to the rear lot. Building addresses, descriptive names and free parking do not establish complete connectors.

## Verification and next evidence

```sh
python -m unittest discover -s scripts -p test_arizona_principal_city_source_screen.py -v
python scripts/arizona_principal_city_source_screen.py
python scripts/tucson_parking_publication.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The checker binds the exact official inventory, every city/FIPS/CBSA, assigned primary publisher, source path and retained hash. Tests reject missing cities, substituting one Phoenix-metro city's record for another, promoting a failed source from a snippet, claiming a successful raw HTTP capture for rendered content and self-approval even after rehashing a record. CI checks retained evidence consistency; it does not assert that live websites remain unchanged or independently certify access.

All entries remain `needs_evidence`. Before adoption: identify an exact ordinary-car entry and full connection with independent, date-appropriate physical, legal, grade, direction/maneuver and cost evidence. Then apply #137's different-approver gate. The future metro result must use the nearest member of a complete reviewed anchor set; missing required anchors remain unknown. Existing Census origins and the 2,508 frozen graph costs remain unchanged, exclude connector costs and have not been evaluated under the fixed-reference scenario. The public straight-line map and all old inspector views are unchanged.
