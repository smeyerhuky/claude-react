# Expanded competitor investigation on retained extracts

Investigate 22 additional native Census metro identities using existing dated Texas, Arkansas, Missouri and Kansas PBFs. The dev inspector now displays retained native-point scans for **36 unrepresented identities**, up from 14; **305** of the frozen 341 unrepresented competitors still lack these scans. All 341 remain outside the frozen 26-source cost comparison. The separate 31-source cost checkpoint is unchanged.

The selection advances the distance-ranked investigation queue through rank 43 wherever retained TX/AR/MO/KS extracts provide a relevant search area. Cheyenne, Shreveport, Lincoln, Las Vegas, Monroe, Omaha and Des Moines still need different extracts and remain unknown. This is a scheduling batch, never state completion or a claim that all relevant roads/competitors have been included.

Each bounded raw-way scan keeps native Census coordinates unchanged and distinguishes nearest mapped highway from nearest geometry accepted by the existing driving filter. It does not build a routed graph, approve a connector, establish travel cost or choose an urban access anchor. Report absence remains extract-limited no-data, never real-world inaccessibility. No graph caps or source-archive budgets change; all four source inputs are already retained in the unpublished revision-6 archive.

Texarkana is scanned separately in Texas and Arkansas, and St. Joseph separately in Missouri and Kansas. These paired observations expose extract effects rather than moving the origin to a more convenient road. Memphis's native point has no candidate in the retained Arkansas scan within 25 km; this does not establish an absence of roads or access at the native point.

The retained AI triage reviews all 24 extract observations across 22 identities, rejects model-unsupported nearest candidates, flags the two cross-border comparisons and directs Memphis to an appropriate extract. It is displayed for each added identity in the dev inspector and grants no access approval.

The manifest binds exact dated PBF bytes, native Census CSV and each full report. The dedicated source CI reacquires those exact sources and must reproduce the report byte for byte. It also checks unchanged native coordinates against the independently retained Census domain inventory and confirms source bytes again after scanning. UI checks compare every displayed observation to its retained report, preserve all 367 qualifier identities and the public-map state, and require zero external requests.

```sh
python scripts/frontier_origin_evidence.py --state texas --osm texas.osm.pbf --output result/texas.json
python scripts/build_metro_competitor_explorer.py --output inventory.html
```

Public straight-line mode, Census origins, 26/31-source snapshots and #137 independent access approval remain unchanged. No new connector attestation is inferred from green CI or short geometry gaps.
