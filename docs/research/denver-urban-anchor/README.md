# Denver Union Station: georeferenced road and restriction review

AI review on 2026-10-28 identified the road-road reference junction at 17th and
Wynkoop, but did **not** establish an approved vehicle-pickup entrance. The
[review packet](../connector-reviews/denver-union-station-proposal.json) remains
`needs_evidence`. No origin, road model, public map or approval ledger changed.

## Established observations

| Evidence | Result |
| --- | --- |
| City streets 1002, 6783, 23202 | Shared municipal node 4993 at longitude -104.999734452924, latitude 39.7528550246765 |
| City coded-value definitions | `ONEWAY=0` means Two Way; `F_ZLEV=T_ZLEV=0` means Surface for all three segments |
| City identity/status | Constructed, Denver jurisdiction and maintenance |
| Exact Colorado OSM source | Ways 475723486 (17th) and 640085099 (Wynkoop) share node 3033992180 at [-104.9997276, 39.7528388] |
| City/OSM reference displacement | 1.897 m; a data disagreement, **not** connector cost or evidence of physical entry |
| Nearby city signs | 58 records in the precise request envelope, including 13 without a description |
| Sign 116106 | Loading only all times left / no parking anytime right |
| Sign 205538 | Street sweeping fourth Tuesday left / passenger loading only 7AM–5PM right |
| Sign 116092 | Reserved ADA parking left / no parking anytime right |
| Larger parking-restrictions query | Zero records; no inference of unrestricted parking |
| OSM relation 8877780 | No left turn from selected Wynkoop way at node 11952210822 to way 905039434; this is **not** the reference junction node |

The three selected restriction records have July 2022 collection dates. The city
sign service has no attachments; its returned image fields for these records are
empty. Neither an `Inactive=null` field nor an unexpired website is proof of
current sign validity. Sign locations and facing directions do not, by themselves,
define the whole curb zone or tell us which lane a private car may use.

The city street data provide independent evidence for a surface road-road
junction, stronger than OSM proximity alone. They do not settle the final curb
entry, bicycle-lane crossing, barriers, vehicle class, legal stopping conditions
or exact maneuver. The operator's taxi/rideshare and valet guidance cannot be
extended automatically to unrestricted private-car access. We have not assigned
an off-road path, snapped a building centroid, or invented a zero-cost connector.

## Reproduction and provenance

`manifest.json` binds exact retained response bytes, URL/query parameters, sizes
and hashes. City item and organization records identify the public GIS publisher;
`streets-layer.json` retains the coded-value definitions. Full queried street/sign
records are retained, including nulls and unknowns. Both queries explicitly ask
for WGS84 coordinates; their envelopes differ and are recorded in the URLs.
The script rejects API errors, truncated responses and changed retained bytes.

Run:

```sh
python scripts/denver_anchor_evidence.py
python -m unittest discover -s scripts -p 'test_denver_anchor_evidence.py' -v
python scripts/denver_anchor_evidence.py --osm /path/to/colorado.osm.pbf
```

The final command checks the complete PBF size and hash before re-extracting the
two ways and every restriction relation that references either. It verifies
versions, timestamps, tags, all node coordinates, and restriction members against
the retained subset. It does not rebuild the road graph, validate all barriers,
prove a route to the station, or independently certify real-world access.

GitHub `Denver urban anchor evidence` runs this full-source check on relevant PRs
and manual dispatches, using the dated source URL and exact hash. The existing
AI packet workflow also validates citations and findings. Neither workflow may
write an approval ledger or grant release eligibility.

City data are supplied AS IS, with no accuracy/completeness warranty and **NOT FOR
ENGINEERING PURPOSES**; full terms are retained in `streets-item.json` and
`parking-item.json`. OSM data © OpenStreetMap contributors, ODbL. The full pinned
PBF remains in the existing unpublished research archive. No environment or source
archive publication is involved.

## Actual remaining evidence

To approve this **pickup** candidate, identify the precise permitted curb zone and
entry/exit path from a dated authoritative plan or current inspectable imagery/
sign record, reconcile unknown signs and vehicle/time restrictions, and bind the
path/maneuvers/costs to the selected graph and anchor policy. These are unresolved
evidence questions, not a request for another generic authorization. Defining a
through-road waypoint instead would be a different explicit candidate with its
own review; this record does not silently make that substitution.
