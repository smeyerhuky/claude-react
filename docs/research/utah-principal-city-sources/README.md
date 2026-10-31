# Utah principal-city source work

The official Census principal-city inventory assigns **eight Utah principal cities to five qualifying metros**. All eight have individually retained primary-publication context. Five concern parking; three supply only department/contact locations. No city has a selected or adopted anchor, verified connector or release eligibility.

| Principal city | CBSA | Retained context |
| --- | --- | --- |
| Lehi | 39340 | Municipal department directory: Administration address only |
| Logan | 30860 | Official city contact address only |
| Murray | 41620 | Official city contact address only |
| Ogden | 36260 | City parking service identifies its official operator, maps and location-specific rules |
| Orem | 39340 | City Hall construction parking guidance and pedestrian approach |
| Provo | 39340 | Municipal downtown parking guidance, longer stays and restricted permit areas |
| St. George | 41100 | City Hall opening article and distinct older parking project promises |
| Salt Lake City | 41620 | City meter prices, enforcement hours and different daytime/evening limits |

Lehi, Orem and Provo are separate members of the same metro; neither Provo's publication nor a CBSA title substitutes for the other two. Murray and Salt Lake City are also separate required members. Logan's metro crosses the Idaho border; this city-source accounting does not certify either state's geographic routing coverage.

## Provenance and verification

Captured 2026-10-31 UTC. Three records derive from successful direct HTTP captures; five were inspected through the web renderer after direct requests failed. Each JSON record identifies the exact primary URL, retrieval method, short selected quote, factual observations, limitations and direct-attempt metadata. The manifest binds each record's retained bytes and exact official principal-city inventory.

For rendered publications, `source_http_status` stays null. The failed raw request is not relabeled HTTP 200 and its error-response hash is not passed off as the rendered page's original response identity. A renderer may use cached material predating retrieval. Original HTML, app configuration, form state, error bodies, private source archives and uninspected images are omitted. Live-source freshness and legal/physical truth are not established by CI.

The shared `principal_city_source_screen.py` checks the same contract for Utah and Arizona, with explicit publisher and source-path assignments per city. Arizona's existing counts remain unchanged: 16 city records, 12 inspected contexts and four unavailable selected publications. Existing Colorado source checks and all frozen costs remain unchanged.

```sh
python -m unittest discover -s scripts -p 'test_*_principal_city_source_screen.py' -v
python scripts/utah_principal_city_source_screen.py
python scripts/arizona_principal_city_source_screen.py
python scripts/colorado_principal_city_source_screen.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Tests reject missing/duplicate city members, substituting Provo for Orem, source self-approval even after rehashing, and the existing Arizona source/transport mutations. These checks establish evidence-accounting consistency, not eight verified entries or an approved anchor registry.

## Access questions remain unresolved

Orem directs visitors toward parking near the police station during construction and then along the Center Street **sidewalk** to a south building entrance. The linked grand-opening map was identified but has not been visually verified in this retained review. No vehicle route is inferred from a walking instruction or building door, and City Hall hours do not automatically become parking hours.

The separately inspected [Lehi civic-center consultation page](https://www.engagelehi.org/civic-center?tool=news_feed) includes a May 2024 construction parking notice and an expected January 2026 completion. That old notice and expected date do not establish current vehicle access; the retained Lehi record stays a department-contact lead.

St. George's newer article announces January 17, 2026 opening and a 290-stall structure open seven days a week. The same page preserves older future-tense 24-hour-operation material. It is not treated as proof of current 24-hour access. Weekday City Hall hours and the covered atrium are separate from garage vehicle hours, clearance and entry/exit maneuvers. No adopted entry results from that article.

Ogden points to its official operator rather than establishing every downtown space's rules. Salt Lake City's pay-station time limits differ between daytime and evening; free pricing or unmonitored meters do not establish unrestricted permission. Provo distinguishes permit areas from general downtown parking. None of these broad publications is a complete vehicle connector record.

Every city remains `needs_evidence`. Exact entry/exit geometry, independent physical/legal/grade/direction evidence, full costs and #137's separate approver are still required. The future nearest-reviewed-anchor metro measure requires complete required-set accounting; unknown members cannot be silently dropped. Existing 2,508 costs still exclude connector costs and have not been evaluated under the fixed-reference scenario. The public straight-line map and older inspector views remain unchanged.
