# Colorado municipal parking-source screening

All seven native-point Colorado metro identities remain in the audited routing
comparison. Denver has two retained urban-candidate reviews. This batch adds
primary municipal source screening for Boulder, Colorado Springs, Fort Collins,
Grand Junction, Greeley and Pueblo. **Colorado is not release-ready.** No new
anchor, graph endpoint, connector cost or access approval is adopted.

| Metro/CBSA | Independently published context | Important limitation |
| --- | --- | --- |
| Boulder 14500 | Five public garages, level-specific height limits, paid-use terms; Trinity garage explicitly permit-only | Do not treat all garages as equivalent or adopt a building centroid as entry |
| Colorado Springs 17820 | Kiowa/CAB/Cascade garages; retained June 2026 individual-account terms list heights, no trailers, no vehicles over 20 ft, maximum 10 mph | City Hall lot is employees-only; monthly-account terms do not automatically define daily customer rights |
| Fort Collins 22660 | Three named garages, 24-hour opening, gateless operation, mandatory parking session; official January 2026 parking map | Web page describes first-hour treatment; map's short labels do not reproduce every fee rule. Follow posted signs; do not infer an unrestricted entry path |
| Grand Junction 24300 | Rood Avenue garage: 434 total, 126 public short-term/daily spaces; separate leased spaces; January 2026 map | Public and leased parking are different; no exact permitted entrance/grade/turn is established |
| Greeley 24540 | City parking page links its dashboard, web map and distinct public/permit layers; 75 public-layer features retained in requested EPSG:4326 | Three zone labels say Removed, even where lifecycle fields can say Operational; retain the conflict rather than auto-approve parking |
| Pueblo 39380 | City permit page names four facilities, including Main Street Garage Green Zone at 110 S. Main St. | A permit facility and one-vehicle-per-permit rule do not establish unrestricted public hourly access or its exact entry |

The source documents clarify conditions and help reject unsuitable hypotheses.
They do not independently establish complete origin-to-road connections, current
barriers, same-grade paths, legal directed turns or real-world path cost. All
five complete connector questions remain unresolved for newly screened venues.
No destination is silently selected to represent a multi-center CBSA.

`manifest.json` binds exact official PDFs/GIS response bytes and selected literal
HTML excerpts. Full HTML runtime/form state is omitted. Response digests identify
the fetched HTML, but cannot be recomputed from selected excerpts. URLs, retrieval
times, sizes and explicit false approval flags are retained. The original PDF
files are kept, along with selected Springs terms text extracted during review.
The Fort Collins PDF required a tolerant PDF reader; text extraction is context,
not exact geo-registration or an entrance survey.

The municipal sites' own linked URLs/sitemaps were followed. An initial Grand
Junction guess returned HTTP200 for an unrelated council page and was rejected;
HTTP success is not identity verification. Pueblo's generic parking-standards
page is not proof of a particular lot's vehicle rights. Neither unrelated page
was retained as supporting venue evidence.

Run `python scripts/colorado_anchor_source_batch.py` and
`python -m unittest discover -s scripts -p test_colorado_anchor_source_batch.py -v`.
The audit checks source bytes, explicit unapproved status, complete GIS responses,
CRS/identity inventory and ambiguous Removed labels. It does not authenticate
real-world truth, turn an Operational flag into permission or certify access.

Next: choose and geolocate exact candidate entry/exit paths using current agency
plans/sign records, document the passenger-vehicle profile and applicable use
conditions, match directed graph identities without guessing connector lengths,
and submit only supported findings to #137's separate independent approval.
Continue unblocked source/coverage work in the other states; do not call these
seven research identities a Colorado coverage certificate.
