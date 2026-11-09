# Source-backed Colorado principal-city location domains

This checkpoint joins all **12 required principal cities across seven Colorado
metros** to complete 2025 Census place footprints. It provides source-model
location checks and conditional distance bounds for future reviewed urban anchors.
It adopts no anchors and excludes no competitors. The existing anchor-set
aggregator still returns unknown when a required anchor result is missing.
The public map, historical 2,508 costs, fixed scenario and ten inspectors are
unchanged. Recorded user release authorization remains in place; missing source
facts do not become verified through that authorization.

## Source identity and complete membership

The official July 2023 List 2 workbook and its existing validated inventory supply
principal-city IDs and CBSA membership. No metro title is split into city names.
The independently published [2025 Colorado TIGER/Line place file](https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_08_place.zip)
supplies complete municipal polygons, including holes and disconnected pieces.
All 482 source records are scanned to retain exactly the 12 required identities:

| CBSA | Required principal cities |
| --- | --- |
| 14500 | Boulder |
| 17820 | Colorado Springs |
| 19740 | Aurora, Broomfield, Centennial, Commerce City, Denver |
| 22660 | Fort Collins, Loveland |
| 24300 | Grand Junction |
| 24540 | Greeley |
| 39380 | Pueblo |

Names, zero-preserving GEOIDs and state codes must agree across the join.
Every selected 2025 source record also has PCICBSA=Y, FUNCSTAT=A and CLASSFP=C1;
those literal fields are retained and checked, without interpreting them as
vehicle permission. Missing cities, duplicates or changed memberships fail.
There is no city population threshold or silent first-city selection.

The source ZIP is 2,791,333 bytes, SHA-256
`e0072e2f1c049e53d598119014e6bc93f82a0a02082b3604d81b0a8c3e8b043c`.
Replay requires its exact bytes, seven-member allowlist/CRC, 482 records and
native NAD83 CRS. The existing bounded Census archive reader is reused; no water
mask or OSM-derived boundary is substituted. Only derived public city geometry,
provenance and the report are published. The original ZIP stays outside Git.

The explicit conversion is EPSG:1188, NAD83 to WGS 84 (1), as in the water-mask
checkpoint. Its stated four-meter accuracy is not a worst-case error bound,
current legal-boundary survey or measured datum/epoch guarantee. Footprint
membership here means membership in the **supplied model polygon**. It does not
prove current jurisdiction, permission to enter, grade, turns or a vehicle path.

`candidate_city_check(city_id, lonlat)` checks the complete source-bound layer
before returning a polygon-coverage boolean. A Denver road-junction point is
inside the supplied Denver polygon and outside the supplied Fort Collins polygon.
The helper does not snap a point, choose an anchor, infer connector cost or grant
road access; all adoption/access/release flags remain false.

## Conditional lower bounds

A later reviewed registry may explicitly require its candidate coordinates to
lie inside these exact polygons. **That location policy is a precondition here,
not an adopted registry or a new constraint silently imposed on existing costs.**
Without it, these footprints cannot exclude any possible urban anchor.

For each city, the script records a complete-geometry bounding rectangle and a
spherical enclosing ball. The ball uses an exact rational upper bound on the
meridian-plus-parallel walk from its stored center to any point of the rectangle:
`R × (22/7) × (maximum longitude deviation + maximum latitude deviation) / 180`,
with R=6,371,000 m. Binary float centers and endpoints are converted exactly to
rationals, so a rounded midpoint cannot accidentally shrink the enclosing radius.

There are two admissible source-model distance lower bounds: the existing
center-to-query bound minus the enclosing radius, and a direct rectangle bound.
The latter uses minimum latitude and circular-longitude gaps, 3.14 < pi, and the
existing conservative sine/cosine inequalities. Their **maximum** is still a
lower bound. Latitude and longitude components are not added together.
Antimeridian query gaps and polar cases are tested even though these particular
city polygons are wholly in Colorado. Unwrapped boxes spanning 180 degrees or
more are rejected. No planar degree-distance estimate is called road length.

A metro's lower bound is the **minimum across every required principal city**,
because any city's reviewed anchor might be nearest. The context point
[-105.08, 40.59] is an arbitrary geographic probe, with no adopted road attachment.
These values are conditional model-distance bounds, not measured driving costs:

| CBSA | Lower bound, approximately km (display only) |
| --- | ---: |
| 14500 | 55.079 |
| 17820 | 172.724 |
| 19740 | 60.666 |
| 22660 | 0 |
| 24300 | 159.664 |
| 24540 | 12.114 |
| 39380 | 249.407 |

Only the stored exact rational values may drive future strict inequalities.
A competitor tied with an incumbent must remain eligible. The report supplies
no incumbent, applied exclusion, time bound or proof of global competition.
It cannot establish an exclusion until a compatible full-cost feasible incumbent,
reviewed location domains and full-route geometric cost domination are proven.
Travel time also needs an independently established global model speed ceiling,
including exterior roads and connectors; none is invented here.

## Reproduction and limits

```sh
python -m unittest discover -s scripts -p test_colorado_principal_city_domains.py -v
python scripts/colorado_principal_city_domains.py
python scripts/colorado_principal_city_domains.py --original /path/to/tl_2025_08_place.zip
python scripts/render_colorado_principal_city_domains.py /tmp/city-domains.png
```

Nine tests cover full sets, an independent spherical oracle, random boxes and
city vertices, dateline/polar cases, adjacent-float midpoint rounding, exact metro
minima, city membership without adoption, missing/duplicate/remapped cities even
with recomputed hashes, source/approval changes and original preflight.
Read-only CI re-downloads the exact public source, compares every derived byte,
checks the existing full inventory and missing-anchor contract, and retains a
comparison figure. The frozen report says original-source replay is false;
only a run actually reading the ZIP reports that optional verification as true.

Full geometry is retained without repair, clipping, simplification or rounding.
`--write --original ...` reconstructs geometry and checkpoint expectations only
from exact originals; inspect changes before accepting a new source or model.
This local domain work does not cover other metros, outside routes, legal/physical
access, land/water completeness, route assets or isochrones. #137/#138/#139 checks
remain substantive evidence and engineering tasks, not requests for another
routine user approval. All current missing-anchor results remain unknown.
