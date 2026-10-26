# Reproducible official Census TIGER2025 Colorado land/water inputs

This research-only preparation script uses the Census Bureau's **2025
TIGER/Line** files, selecting **all** Colorado counties whose official
2025 polygon intersects the requested viewport. It does not hardcode
Denver county names or assume a missing water file means dry land.

Source endpoints (US Census Bureau):

- [2025 states](https://www2.census.gov/geo/tiger/TIGER2025/STATE/tl_2025_us_state.zip)
- [2025 counties](https://www2.census.gov/geo/tiger/TIGER2025/COUNTY/tl_2025_us_county.zip)
- [2025 county area water](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/),
  specifically `tl_2025_{county GEOID}_areawater.zip` for **every
  intersecting** Colorado county, e.g. `tl_2025_08031_areawater.zip`
  for Denver.

## Real source preparation

```bash
python -m pip install 'pyshp>=2.3,<3' 'shapely>=2,<3' 'numpy>=1.26,<3'
python scripts/colorado_tiger2025_geography.py \
  --bbox -105.1 39.65 -104.85 39.90 \
  --cache local-data/tiger2025 \
  --output-dir colorado-geographic-validation/tiger2025

python scripts/colorado_geographic_mask.py \
  --land-geojson colorado-geographic-validation/tiger2025/tiger2025-colorado-land.geojson \
  --water-geojson colorado-geographic-validation/tiger2025/tiger2025-colorado-areawater.geojson \
  --bounds -105.1 39.65 -104.85 39.90 \
  --width 64 --height 64 \
  --output colorado-geographic-validation/tiger2025/census-water-mask.json
```

The `Colorado TIGER2025 official geography research` GitHub workflow
runs synthetic missing-county/zip-corruption regressions **and** a real
Census geography download, then publishes the GeoJSON, byte-hash source
manifest and unassigned/water-pixel diagnostic mask for inspection.
Re-downloads keep SHA-256 checksums in a research artifact; the cache
is an optimization and **not** an immutable or independently trusted
snapshot of Census geometry.

### Source and coverage limitations

Census TIGER **AREAWATER** represents polygonal area water; narrow
streams mapped as *single-line hydrography* and seasonal features may
be missing. A source file can be genuine but insufficient for an
all-water mask. Detailed completeness against USGS hydrography is still
required under [issue #138](https://github.com/smeyerhuky/claude-react/issues/138).
State/county geometry does not prove which roads are legally accessible;
[issue #137](https://github.com/smeyerhuky/claude-react/issues/137)
remains an independent release blocker.

The generator **fails closed** on missing county files, incomplete
county/state geometric coverage, invalid polygons, broken source ZIPs,
missing water polygons or an unsupported bounding box. It never
creates a fake 'all land' mask. All outputs say `release_eligible:
false` and `land_water_completeness_certified: false`.

The TIGER source is intended for experimental use with
`scripts/colorado_research_road_preview.py`, but source polygons,
routing graph closure, verified physical road access, and the UI
(#139) still need to pass separate reviews before any beta release.
