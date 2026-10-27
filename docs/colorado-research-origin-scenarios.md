# Two explicit origin research scenarios (#138)

The user chose to keep both Census representative origins and urban-access
origins as research scenarios. `colorado_origin_scenarios.py` preserves separate
versioned inventories for this investigation. It never replaces public-map
coordinates or approves access.

* `census-cbsa-representative-point-v1`: all 359 qualifying original CBSA points,
  unchanged, with connector costs and access explicitly unverified.
* `colorado-named-city-point-leads-v1`: seven Colorado **place representative
  point leads** from the official 2025 Census Gazetteer. The other 352 qualifying
  metros have missing urban-anchor evidence, with no coordinate fallback.

The second scenario is only an initial lead inventory for urban-access research,
not a complete urban-access policy. Census place points are not proven urban
centers, road entrances, same-grade connections or legal access anchors. An
explicit selection file binds exact CBSA/name and place GEOID/name identities
and the exact Gazetteer SHA256. It selects one named-city alternative per Colorado
metro, not every principal city. The associations are research choices, **not**
an independently established CBSA-place crosswalk. No proximity join is hidden.

Source: [official Census Gazetteer page](https://www.census.gov/geographies/reference-files/time-series/geo/gazetteer-files.2025.html)
and [2025 Colorado places](https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2025_Gazetteer/2025_gaz_place_08.txt).
The file has 482 records; acquired bytes SHA256
`bf6eef3e2ef556da6c4b6f448aa83d63d00de25477182a45155407f16dcbcdb5`.
A source change fails the CLI until its evidence and versioning are reviewed.
Metro CSV, selection and optional original OSM PBF hashes bind each artifact.

Optional `--osm` scans the entire original source separately for both scenarios,
using the existing raw highway-way investigator at 20km for the seven selected
Colorado CBSAs. It reports modeled-driving geometry separately from any mapped
highway, maintaining false access flags. Both scenarios must supply all requested
points before scanning; missing urban evidence cannot borrow the Census point.
Coordinate displacement and road proximity are diagnostics, never connector
costs or proof that either origin is preferable. Source datum alignment remains
unverified and must be addressed before any geographic accuracy claim.

Actual Census+OSM CI checks both complete inventories, exact source hashes,
fourteen investigations and missing-origin/safety invariants. Future comparisons
must use the same directed graph, destination contracts and independently
justified, costed connectors. No map winners, isochrone polygons, global source
exclusions or physical/legal certifications are granted by this registry.
