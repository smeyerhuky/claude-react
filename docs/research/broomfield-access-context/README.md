# Broomfield access leads: none adopted

This bounded audit concerns Broomfield (principal city 0809280, Denver–Aurora–Centennial CBSA 19740). It rejects shortcuts from a building address or office name to a vehicle entry. It does **not** choose an anchor, create a connector, evaluate a route or certify access. All five #137 questions remain unknown for any future proposed connection: physical connection, legal motor access, same grade, direction/turns and connector cost. A different approver remains required after independent evidence resolves those questions.

## Retained sources and provenance

Captured 2026-10-31 UTC. `manifest.json` hashes the exact retained files and records the public agency query URLs. Agency responses are normalized JSON, **not original HTTP response bytes**. `raw-osm-context.json` is a bounded raw OpenStreetMap subset reproduced from the exact original Colorado PBF, SHA256 `ef1f9e0832de42ccae2b5614d9d1a00ec41d1b6506e4ca9ef12e1eb895e5d4b7`, 386,197,077 bytes, pinned in the existing 33-source checkpoint. Data © OpenStreetMap contributors, [ODbL](https://www.openstreetmap.org/copyright).

The [municipal GIS page](https://www.broomfield.org/gis) links the [official Parcel Search page](https://www.broomfield.org/2739/Parcel-Search), which links public ArcGIS application `5971305936d4491caa2d252905cd4222`, owned by `BroomfieldOpenData`. The public [Addresses item](https://www.arcgis.com/home/item.html?id=2aa832f778224f068b9f271b1d3e5e0f) and [Streets item](https://www.arcgis.com/home/item.html?id=6a82c45da77947aeae5930cc0bd35a0c) have the same owner and identify the queried services. These are public municipal data, not an access attestation. The agency states that it makes every effort toward accuracy and assumes no liability for use or misuse. No app runtime configuration, private source archive or basemap raster is included.

Both agency layers report native EPSG:2876; these queries request EPSG:4326. Output transformation accuracy and alignment to OSM are unverified. Nearby points or lines therefore cannot establish a physical or same-grade connection. Public item timestamps do not establish current opening or driving permission.

## Findings that prevent accidental promotion

| Lead | Retained evidence | Consequence |
| --- | --- | --- |
| 1 Descombes Drive government address, GIS_ID 22443 | `POSITIONED_METHOD=Building Footprint`; four other results are three signs and an electrical feature | No surveyed vehicle entry; none becomes a routing origin |
| 136 nearby municipal street features | 110 parking-lot features, 12 local, seven minor arterial, seven connector; 11 parking features have unknown maintenance | Not 136 certified public drivable roads |
| Descombes/Spader/E 3rd agency records | Null `ONE_WAY`; field domains do not define null as two-way | Direction remains unknown; level codes do not independently certify same grade |
| OSM node 3417588506, named “Motor Vehicles” | `entrance=main`, no `motor_vehicle` permission tag; incident ways 334698996 (`path`) and 367179594 (`pedestrian`, `area=yes`) | Office-name/building-door lead, not a supported car entrance; no inferred driving permission |
| Sallyport gates 3428679371 and 3428679379 | Both `barrier=gate`, `access=no`; incident service driveway 45845852 also `access=no` | Explicit modeled denials retained; no public connector proposed |
| Descombes/Spader reference junction 3428618002 | Three named tertiary way segments **and a fourth service driveway**, way 332347408 | Unadopted reference lead only; all four incident ways retained, no nearest-road snapping |
| Raw no-U-turn relation 11810211 | North Spader split at node 176076727, from 16982912 to 646140587 | Local restriction context retained; no claim that it constrains the southern reference junction |

The [current municipal construction advisory](https://www.broomfield.org/4390/Broomfield-Police-Building-Expansion) distinguishes visitor, staff and closed parking areas. Its [parking image](https://www.broomfield.org/ImageRepository/Document?documentID=68815), visually inspected in the working cache, labels lot closures 7/27/26 and 8/31/26. Basemap imagery date and positional accuracy are unknown. The earlier retained advisory observation remains in `../colorado-principal-city-sources/broomfield.json`; no unsupported claim about E 3rd's operational state at the fixed reference instant is added here. No closure geometry or legal vehicle entry is inferred from the picture.

## Reproduction and limits

```sh
python -m unittest discover -s scripts -p test_broomfield_access_context.py -v
python scripts/broomfield_access_context.py --check
python scripts/broomfield_raw_context.py --osm /path/to/exact/colorado.osm.pbf --output /tmp/context.json
cmp /tmp/context.json docs/research/broomfield-access-context/raw-osm-context.json
```

The extractor uses osmium 4.3.2, verifies the source before and after scanning, retains all 275 raw highway ways with a vertex inside `[-105.072,39.918,-105.065,39.923]`, their full geometry, 235 locally tagged nodes and the one referencing restriction. It can omit a crossing way without a local vertex, and does not collect tagged nodes outside the box even when a retained way extends outside. Caps remain 2,000 ways, 200,000 node references, 10,000 tagged nodes and 1,000 restrictions. This is not exterior closure, complete access-context coverage or a routing graph.

CI re-extracts from the original public dated Colorado input and compares every retained OSM byte. Offline audit checks establish consistency of retained municipal facts, not that a live agency endpoint is unchanged. Mutation tests reject truncated queries and changes to the footprint, null direction, permission interpretation, sallyport denials and fourth junction arm, even when the manifest is rehashed.

The frozen 2,508 graph costs, Census origins, zero-approved-connector ledger, public straight-line map and old inspector views remain unchanged. These costs are not rerun under the new fixed-reference policy. Before a proposed anchor is ready: obtain independently attributable, date-appropriate evidence for an exact public vehicle entry and its full connection; resolve rights, grade, dimensions, direction and maneuver rules; include full connector costs in both metrics/directions; then use #137's separate approval gate. Missing evidence remains unknown, never approval or world inaccessibility.
