# Independent northern endpoint source evidence

This checkpoint adds point-specific transportation-agency evidence for the five
unchanged native hypotheses in the [40-query detour experiment](../northern-local-detours/README.md).
It retains 37 exact public response fingerprints, a small original-PBF projection
and a derived audit. These records support road-identity and directional review;
they do not install anchors, certify connectors or activate the public road tab.

Each native point has three bounded agency queries: CDOT Highways, CDOT Geometrics
and its municipality's road centerlines. Each feature response must match a
separate IDs-only response exactly. Duplicate IDs, missing records, transfer-limit
truncation, unsupported geometry and absent named roads stop the audit. The CDOT
queries return native EPSG:26913 coordinates, Fort Collins native EPSG:2231, and
Loveland/Greeley native EPSG:2876. Source-appropriate datum operations and US survey
foot conversion are explicit. Their stated 4 m / 1 m datum accuracies are **not**
worst-case error bounds; registration distances are **not connector lengths**.

| Native hypothesis | Named municipal record(s) | Nominal registration | Retained facts |
| --- | --- | --- | --- |
| Fort Collins · North College | 8988 | 7.969 m | Non-private/built source flags; one-way value absent; record revision 2013 |
| Loveland · North Lincoln | 4560 | 0.576 m | Non-private, built, active, CDOT owned/maintained; defined From-To one-way code |
| Loveland · North Cleveland | 4556 | 0.877 m | Same administrative fields; defined From-To one-way code |
| Greeley · 9th Street | 10216, 23469 | 0.688 m | Duplicate geometry, built, city maintained; raw FT has no retained code definition; update unknown |
| Greeley · 10th Street | 6690, 23683 | 1.325 m | Duplicate geometry, built, city maintained; raw NA has no retained code definition; update unknown |

CDOT route identifiers agree with the recorded OSM route identifier at all five
hypotheses. This is an identity cross-check, not independent access certification.

Loveland's one-way dictionary explicitly relates From-To to the source arc's
orientation. At both named matches its direction agrees with the original OSM
permitted direction under the declared coordinate model (cosines above 0.99998).
Both selected records have an October 6, 2026 update timestamp. A capture date is
not the date of a site inspection, and neither an active lifecycle nor these
attributes establish all current restrictions or grade.

A real negative case is retained: at North Cleveland, **Artist Alley is closer**
than the named road (about 0.064 m versus 0.877 m under this model). Matching uses
street identity before ranking candidates; a nearer unrelated line cannot become
an anchor or connector. Multiple identical Greeley records are retained as duplicate
geometry, not counted as independent corroboration. CDOT's Greeley route feature
can carry a different whole-feature alias from the municipal local street name;
nearest metadata alone does not rename the native hypothesis.

Fort Collins publisher identity is bound to the City of Fort Collins ArcGIS
organization and its exact public item. A similarly named dataset published for
another city was excluded. Uncoded, null and Not Applicable one-way values never
become a confirmed two-way interpretation, and one agency's code dictionary is not
borrowed for another. A two-way corridor record can represent separate carriageways;
it does not establish either carriageway's legal bearing.

`native.json` comes from the exact frozen Colorado PBF. It retains the five raw
candidate-node records, three neighboring native vertices per way, and a limited
way-tag projection. Original PBF fingerprints are checked before and after capture.
It does not replace the complete tagged-node/permission/restriction replays that
already bind the road witnesses. No source projection is itself access approval.

`manifest.json` records exact query URLs, capture times, response sizes and SHA-256
values. Original full agency JSON, personal editor fields, HTML and the broader
source archive remain outside the repository and artifacts. The retained report
uses allowlisted factual fields. `report.json` binds the manifest, native data,
implementation and witness report; it preserves undefined codes and source dates.

```sh
python scripts/northern_endpoint_evidence.py --osm /path/to/colorado.osm.pbf
python scripts/northern_endpoint_evidence.py --original-dir /tmp/agency-originals --download
```

The first reproduces the exact native projection; the second fetches all 37
allowlisted public originals and reproduces the audit. Source comparison canonicalizes
JSON object-key/whitespace presentation and sorts only the top-level ID inventory.
Only the pinned Fort Collins publishing item also excludes its two observed
volatile usage counters, numViews and lastViewed. Its owner, organization, URL
and all other fields stay bound. Every road ID, attribute, code definition,
feature order and native coordinate must otherwise match.
The original captured byte hashes remain in the manifest; fresh replay receipts
retain actual response hashes and whether the captured bytes match exactly.
`--write` explicitly regenerates derived records. A changed live response fails
closed and requires source inspection before refreshing the snapshot. Read-only
CI runs both original-source replays plus negative tests. Its artifact contains
only this README, the small native projection, source manifest, derived report
and fresh response-hash receipts.

The five hypotheses are still unadopted. Separate same-grade/site access, temporary
and turn controls, full anchor-set/graph compatibility and geographic/competitor/
land-water coverage evidence remain outside this checkpoint. No missing fact is
supplied by a green test or an approval field. Existing public straight-line mode,
all eleven inspector views, forty native query results and all historical 2,508
Census costs remain unchanged.

Primary services: [CDOT](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer),
[Fort Collins](https://services1.arcgis.com/dLpFH5mwVvxSN4OE/arcgis/rest/services/Street_Centerlines/FeatureServer/0),
[Loveland](https://mapserv.cityofloveland.org/arcgis/rest/services/layers/RoadCenterline/MapServer/0),
[Greeley](https://gis.greeleygov.com/arcgis_svr5/rest/services/TrakIT2025/MapServer/5).
Native derived records: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL.
