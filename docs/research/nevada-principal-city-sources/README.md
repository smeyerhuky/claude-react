# Nevada principal-city source work

All five official principal-city memberships have separate work records: Henderson, Las Vegas, North Las Vegas and Paradise in CBSA 29820, plus Reno in CBSA 39900. Four retain inspected context; the selected North Las Vegas parking-services publication is unavailable. None supplies an approved urban anchor or connector.

| Principal city | Retained context / gap |
| --- | --- |
| Henderson | Published Water Street Plaza event page names garage entry streets and requires checking event road closures |
| Las Vegas | Current City Hall page describes the garage, ticket/payment process and validation for free hours |
| North Las Vegas | Selected city publication unavailable through direct HTTP and renderer; snippets excluded |
| Paradise | Clark County advisory-board meeting venue and area-map context; Census/CDP alignment unresolved |
| Reno | Official police FAQ describes usual meter enforcement and meter-specific posted rules |

## Source scope stays explicit

[Henderson's published event-view page](https://www.cityofhenderson.com/government/departments/parks-and-recreation/facilities/other-venues/water-street-plaza/-toggle-all-1287) identifies free parking at 235 South Water Street and names Water Street or Texas Avenue for entry. It directs visitors to each event's road-closure information. The base URL was unavailable, while this separately published URL could be inspected through the renderer. Texas Avenue is not declared unconditionally open from its presence in the list. Exact geometry, reference-date closures, clearance and maneuvers remain unresolved.

[Las Vegas's City Hall page](https://www.lasvegasnevada.gov/Residents/Parks-Facilities/City-Hall) describes the 500 South Main garage and two free hours with validation. City-service counter hours and weekend building-rental restrictions do not automatically become garage access hours. The earlier [garage/one-way/clearance investigation](../las-vegas-urban-anchor/README.md) remains unchanged; this new city-source record does not resolve an entry or repair its access findings.

[Clark County's Paradise Town Advisory Board page](https://www.clarkcountynv.gov/government/departments/administrative_services/town___liaison_services/paradise-tab) identifies a meeting venue at 4775 McLeod and links its advisory-area map. The county advisory geography has not been equated to the Census principal-city/CDP geography. A meeting address is not promoted into a vehicle-entry point or anchor. The other Las Vegas-metro cities cannot stand in for Paradise.

[Reno's police FAQ](https://reno.gov/police/resources/faqs/index.php) describes usual meter enforcement and warns that individual posted rules may differ. Enforcement hours do not establish a garage's opening, a public entry or universal permission. The [North Las Vegas parking-services page](https://www.cityofnorthlasvegas.com/residents/parking-services) remains a retrieval gap; no indexed snippet becomes inspected evidence.

## Provenance and verification

Captured 2026-10-31 UTC. Paradise's county page was retrieved directly; Henderson, Las Vegas and Reno were inspected through the web renderer; North Las Vegas remains unavailable. Renderer caches may predate retrieval. Failed direct HTTP attempts are recorded separately, and successful original HTTP identities are not invented for rendered content.

The manifest binds each retained record and the official principal-city inventory. Records retain short literal quotes, factual observations, limitations, exact URLs and capture identities. Original full HTML, app/runtime state, error bodies, private source archives and search snippets are omitted. Original response hashes cannot be recomputed from these derived records.

```sh
python scripts/nevada_principal_city_source_screen.py
python -m unittest discover -s scripts -p test_nevada_principal_city_source_screen.py -v
python scripts/principal_city_source_work.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Tests reject substituting Las Vegas for Paradise, dropping the unavailable principal city, asserting CDP alignment from the county venue and guaranteeing an alternative entry without event review, even after rehashing. They establish retained source consistency, not independent real-world access certification.

The frozen development inventory now records all 56 principal-city work entries across the eight pilot states: 49 retained contexts, seven unavailable selected publications and 642 memberships not recorded here. All 698 access reviews remain unresolved and zero connectors are approved. The public straight-line map, older inspector views, graph costs and #137's different-approver gate remain unchanged.
