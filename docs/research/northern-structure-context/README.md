# Northern CDOT structure and access context

This checkpoint binds **33 primary CDOT responses** to the five existing native northern road hypotheses: three layer metadata responses plus fifteen feature queries and fifteen separate ID inventories. It complements the municipal road correspondence and dated NAIP imagery; it does not adopt any anchor or certify an attachment.

Each query requests a 500 m neighborhood of the exact candidate, with native EPSG:26913 output. Layer 0 publishes bridge/major-culvert points, layer 31 publishes structure points including signals, and layer 9 publishes highway access-class lines. The queries are bounded context, not a complete physical-world inventory. Null `objectIds` is accepted only as an explicit empty inventory paired with zero features; a missing inventory is rejected. Duplicate IDs, truncated queries, missing fields, altered coordinates, wrong geometry/CRS or source changes stop replay.

## Findings that matter for review

- **Fort Collins:** layer 0 returns no bridge points, while layer 31 returns one bridge and 22 signals. The bridge point refers to Linden Street over the Cache La Poudre River, about 472 m from the candidate. An empty layer 0 query therefore cannot establish absence of bridges.
- **Loveland:** both candidate neighborhoods return two state-route bridge points in layer 0. Layer 31 additionally includes local bridge points. The nearest reported bridge points are roughly 448–460 m away and refer to the Greeley–Loveland Canal. Those are point registration distances, not deck footprints or proof about the candidate's grade.
- **Signals:** labels near the Fort College, Loveland Lincoln and Greeley Ninth candidates include southbound, northbound and westbound mainline wording, respectively. Other nearby records describe crossing traffic. Cleveland's four nearest signals carry route `287C`, while its native recorded route is `287Z`; proximity cannot transfer that route/lane assignment.
- **Access classes:** returned lines describe non-rural arterial categories NR-B/NR-C. These classifications do not grant ordinary-car permission, private-driveway access or a particular turning movement.

Layer 0 and layer 31 share a publisher. Overlapping records are compared by opaque `STRUCTURE_KEY`, never by layer-local object IDs, and never counted as independent corroboration. `STRUCTURE_TYPE`, `ON_UNDER`, null dates and other uncoded fields remain literal values. A point/label is not a surveyed footprint, a lane topology or a turn-prohibition inventory. The source's stated coordinate-operation accuracy is not a worst-case error bound and is not converted into a connector cost.

## Reproduce

```sh
python scripts/northern_structure_context.py --original-dir /tmp/northern-structure-originals --download
python -m unittest discover -s scripts -p test_northern_structure_context.py -v
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

`manifest.json` binds the exact native, agency and imagery checkpoints; all 33 original response hashes, canonical content hashes, capture times and public URLs; and top-level field digests for safe mismatch diagnostics. Normalization changes only JSON presentation and ordering of an explicit top-level ID array. Null and empty arrays remain distinct. No source attributes, geometry, feature order, code definitions or metadata fields are exempted.

`report.json` derives complete returned ID inventories, class counts, selected bridge/signal facts, source-geometry hashes and access-class registration diagnostics. Original agency bodies remain external or in CI runner temporary storage. The artifact contains only this README, the manifest, the report and fresh response receipts. Reproduction uses pyproj 3.8.0 / PROJ 9.8.1 and the existing explicit datum operation.

All five sites remain unresolved for release: zero connectors are approved, no anchors are adopted, and access, grade, geographic coverage and release flags remain false. Public-map behavior, eleven inspector views, graph/model costs, the fixed departure scenario and the historical 2,508 / 2,356 / 152 checkpoint are unchanged.

Primary service: [CDOT Open Data FeatureServer](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer), layers [0](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer/0), [31](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer/31) and [9](https://dtdapps.codot.gov/server/rest/services/Webapps/open_data_sde/FeatureServer/9). Exact requests are retained in the manifest. Native-road hypotheses retain the parent OpenStreetMap attribution, © OpenStreetMap contributors, ODbL 1.0.
