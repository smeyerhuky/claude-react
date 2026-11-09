# CDOT road-inventory context for the first-area candidates

The government's [CDOT production open-data service](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer)
provides independent published road records near Fort Collins, Loveland and
Greeley. This follow-up narrows direction-source questions for the potential
first supported area. It selects no anchor and certifies no vehicle connector.

`context.json` retains factual summaries, exact query URLs and response SHA-256 /
byte-count receipts. Nine bounded queries use Highway layer 7, Highway Geometrics
layer 12 and Local Roads layer 14. A separate IDs-only query for each matches the
complete returned OBJECTID set; no transfer-limit flag is true. These are complete
responses to those bounded queries, not complete incident-way, legal-access or
regional-road coverage. Features keep full geometry in the external captures;
only the selected observations and IDs are retained here.

| Geographic context | Highway records | Geometrics records | Local-road records |
| --- | ---: | ---: | ---: |
| Fort Collins | 22 | 18 | 28 |
| Loveland | 34 | 14 | 71 |
| Greeley | 19 | 14 | 56 |

The total is **276 returned feature records**, with overlap among layers; it is
not a count of distinct physical roads. The individual envelope parameters are
recorded in each query URL. No feature or window is adopted as a metro endpoint.

All selected Highway Geometrics records report UPDATEYR=2025. Their explicit
OPERATION labels are 18 Two-Way in the Fort Collins query, 14 One-Way in Loveland,
and 11 Two-Way plus three One-Way in Greeley. These are published inventory
attributes, not complete turn rules, a traffic-flow bearing or verified current
conditions. Update year is not a measured survey date or proof of applicability
at the fixed October 28 scenario instant.

The local-road numeric OPERATION and GOVLEVEL fields have no coded-value domain
in the retained layer metadata. They remain undecoded. Do not substitute SEGMDIR
for a legal driving orientation. ACCESS_ categories such as Non-Rural Arterial
are not unconditional vehicle-entry rights. SPEEDLIM units/model applicability
are not adopted, and those records cannot establish a global speed ceiling.

The service declares native NAD83 / UTM zone 13N (EPSG:26913); response geometry
was requested in EPSG:4326. The server's datum operation and positional accuracy
were not independently established. No measured connector length, same-grade
connection or exact OSM registration follows from these captures. Missing
editingInfo timestamps are not assertions that a record is current.

The Fort Collins AI packet now references this context while keeping its full
`direction_and_turns` finding unknown. Highway corridor labels do not establish
the garage's precise ingress/egress or all required maneuver permissions. All
other unresolved access findings remain unresolved; no approval ledger entry is
created. User release authorization is already recorded and is not being requested
again. The next work is exact path identification and source corroboration.

Full original GIS responses, metadata and hub HTML remain outside the repository.
The derived receipts identify those fetched bytes; the byte digests cannot be
reproduced from this summary alone. No raw private archive, environment settings,
complete publisher HTML or source configuration is published. The old costs,
scenario, public straight-line map, ten inspectors and geographic-bound results
remain unchanged.

Validation: source body sizes/hashes and literal operation/year summaries were
checked against the captures, and every feature set was checked against its
separate IDs-only query. The existing review-packet validator checks the retained
bindings and four new assertions; state-queue replay fingerprints the new packet.
