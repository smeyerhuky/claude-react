# Colorado 2025 TIGER real-input research geography (NOT a release map)

This workflow bridges the merged synthetic land/water mask (#142) and routed
PNG preview (#143) with **real, separately acquired Census geometry**. It is
strictly research: a Census file is not a completeness, physical-access, or
legal-access attestation. The production straight-line UI and road release gate
are untouched.

## Exact upstream source identity

The downloader uses only these official 2025 Census TIGER/Line directories:

- https://www2.census.gov/geo/tiger/TIGER2025/STATE/tl_2025_us_state.zip
- https://www2.census.gov/geo/tiger/TIGER2025/COUNTY/tl_2025_us_county.zip
- https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_<COUNTY_GEOID>_areawater.zip

The 2025 archive is published by the Census Bureau. The script reads the
Colorado state polygon (`STATEFP=08`), selects **every** 2025 county polygon
intersecting the specified bounded viewport, then downloads **each selected
county's** corresponding areawater archive. It refuses incomplete county
coverage, a viewport extending outside Colorado, missing water archives,
non-NAD83 source CRS, invalid polygons, oversized inputs, and missing water
features. No preselected county shortlist is silently treated as complete.

Source shapefile coordinates are NAD83 / EPSG:4269 and are explicitly
transformed to WGS84 / EPSG:4326 before the two separate GeoJSON layers are
written. The **land** layer is a Colorado *administrative state extent* clipped
to the viewport; it is NOT a validated terrestrial land mask. The water layer
contains TIGER/Line *areal* water polygons intersecting the viewport. Small
streams, wetlands, seasonal water, boundary mismatches, and other hydrology
can be absent. The separate mask logic excludes supplied water pixels and
leaves other unsupported road origins transparent, but it cannot independently
certify all unshaded pixels as dry or road-accessible.

## Reproduce the bounded Denver sample

```bash
python -m pip install 'numpy>=1.26,<3' 'shapely>=2,<3' 'pyproj>=3.6,<4' 'pyshp>=2.3,<3' 'pillow>=10,<13'
python scripts/colorado_tiger2025_research_masks.py \
  --bounds -105.075 39.70 -104.92 39.79 --pixels 96 \
  --download-dir local-data/tiger2025 \
  --output-dir colorado-tiger2025-research
```

Outputs: `tiger2025-colorado-land.geojson`,
`tiger2025-colorado-water.geojson`, `tiger2025-geography-diagnostic.png`,
`tiger2025-source-manifest.json` and `tiger2025-candidate-hashes.json`.
The manifest records the exact official archive URLs, bytes, SHA256 digests,
selected county GEOIDs, polygon counts, pixel reasons, output hashes, and
explicit `release_eligible:false` / `input_completeness_certified:false`.

For byte-exact replay, preserve the original ZIPs or supply an independently
reviewed `--expected-hashes path/to/sha256-lock.json`. This strict lock must
list **every** requested ZIP basename and digest; missing or changed archives
are rejected. The generated *candidate* hashes are merely observed bytes,
not independently reviewed evidence and **never** release approval. The
Census 2025 URLs may be reissued or replaced, and `colorado-latest.osm.pbf`
changes over time: a manifest alone cannot make a moving upstream immutable.

The `Colorado TIGER 2025 real-data research PNGs` workflow first runs offline
synthetic tests, then downloads the actual TIGER files and produces a geographic
PNG. It also downloads a dated-at-run Geofabrik Colorado OSM PBF, records its
SHA256, extracts a bounded road graph and attempts separate transparent
`road-preview/by-road-distance.png` and `road-preview/by-road-time.png` layers
with the real Census geometry. All artifacts and failure logs are uploaded
for 14 days. CI success validates execution, **not** independent geographic,
physical or legal correctness. A failed road stage may still leave a valid
geography-only diagnostic artifact.

## Remaining blockers

- #137: independent audit of legal/physical metro-to-road connectors.
- #138: independent geographic/hydrologic completeness, cross-extract route
  closure, arbitrary point validation and truthful no-data shading.
- #139: guarded UI modes and independently approved release manifest.

Never deploy these research PNGs or promote their generated hashes into the
repository-pinned release approval ledger without the required external audits.
