# Official principal cities for the complete metro competitor domain

The retained Census **List 2, July 2023** workbook supplies principal-city names
and separate state/place FIPS codes. Exact CBSA ID joins cover all **367** retained
population-qualifying metro domains and **698** principal-city memberships, including
the eight qualifying metros absent from the older public CSV. No metro is dropped,
city population threshold applied, anchor selected or connector approved.

This supplies source identities for the user's nearest-of-a-reviewed-set direction.
It does not establish any vehicle entry, choose the number or location of anchors,
or certify that an anchor set is sufficient. A later reviewed, versioned selection
must account explicitly for its required principal cities and all expected anchors.
Existing municipal source screens often cover one urban context per CBSA; those
screens do not establish complete principal-city or anchor coverage.

A CBSA title is not a complete city list. Denver–Aurora–Centennial has five official
principal cities here: Aurora, Broomfield, Centennial, Commerce City and Denver.
Phoenix–Mesa–Chandler has seven, and Miami–Fort Lauderdale–West Palm Beach has
thirteen. Hyphens in titles cannot produce an authoritative registry.

`principal_city_id` concatenates the zero-preserving two-digit state and five-digit
place codes from the workbook. This is a source place identity, not an OSM node,
coordinate or legal right of access. County/subdivision and other geographic
interpretation must follow Census source definitions where applicable; the helper
does not infer boundary extents or assign any geometry. Source city names are
retained verbatim alongside both source CBSA titles and qualifying-domain names.

Source: [Census principal-city workbook](https://www2.census.gov/programs-surveys/metro-micro/geographies/reference-files/2023/delineation-files/list2_2023.xlsx),
linked by the Census delineation-files series. Retrieved 2026-10-30 UTC, 79,368
bytes, SHA-256 `1e1091de28d1ad1423cebf18e7cdb6db4fbf2204fd357bc68c24e8261dcce161`.
The original public workbook is retained locally so replay needs no network.
It identifies OMB July 2023 delineations; retrieval in 2026 does not make it a
2026 city inventory. The qualifying population and geography domain remains the
separately hashed retained research input. No vintage reconciliation is silently
assumed, and later official changes require a new reviewed snapshot.

Run `python scripts/metro_principal_city_inventory.py` to verify the report, or
`--write` to reproduce it using `openpyxl==3.1.5`. Six tests verify all qualifying
IDs and omitted CSV rows, non-title principal cities, FIPS leading zeros, duplicate
and conflicting rows, altered source bytes and missing domains. The workflow has
read-only repository permission and verifies the unchanged 2,508-cost UI checkpoint.
All adoption, access and release flags remain false. The public map, existing
Census-origin routing, #137 approval gate and private source archive are unchanged.

The report also groups memberships by each principal city’s own state FIPS code
across all 50 states, DC and Puerto Rico. Cross-state CBSAs appear in every
applicable group. This complements the older native-point state queue: DC has
principal-city work even though no qualifying native CBSA representative point
was grouped there. Neither grouping certifies state or metro geographic coverage.
