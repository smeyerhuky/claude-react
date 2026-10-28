# Southern probe land/water diagnostics (#138)

The Antonito, Ignacio and San Luis road-node investigations now have bounded
official-source geography checks at their actual study locations, in addition
to the existing Denver/Sloan's Lake workflow. No public map is changed.

`colorado_town_geography_audit.py` prepares the state, all intersecting Colorado
counties and every required county AREAWATER archive through the existing
TIGER2025 ingestion. Missing county/water data, invalid native `.prj`, county
coverage gaps and invalid polygons fail. Each output retains archive/GeoJSON
hashes and the declared EPSG:4269 -> EPSG:4326 operation.

The fixed 64x64 views are:

| Area | Bounds (west, south, east, north) | Purpose |
| --- | --- | --- |
| Antonito | -106.08, 36.97, -105.95, 37.15 | Town area plus state-border/off-land negatives |
| Ignacio | -107.70, 37.05, -107.55, 37.20 | Actual southwestern town probe area |
| San Luis | -105.50, 37.13, -105.35, 37.28 | Actual southern town probe area |

The entire outward-enclosing pixel footprint must be within supplied state land
and disjoint from supplied water. The geography-only diagnostic PNG is checked
cell by cell by the separate scalar polygon-difference/intersection oracle,
which imports no production mask functions. All 12,288 cell reason counts must
agree. These colored cells represent geography support only, **not roads,
reachability, metro ownership or physical/legal access**.

Each area also deliberately paints one water-overlapping cell; the independent
checker must reject the altered PNG. Antonito additionally requires positive
off-land cells and rejection of a deliberately painted off-land cell. A missing
required negative fails rather than becoming a skipped/pass case. The
`negative-painted-*` files are intentionally invalid test artifacts, not masks
for consumption.

Local official-source results were 5 / 9 / 10 water-contact exclusions for
Antonito / Ignacio / San Luis, with 598 additional off-land cells at Antonito.
These totals describe one exact input vintage, bounds and resolution; they are
not statewide hydrological coverage estimates. CI checks nonvacuous source
behavior and accounting rather than freezing mutable-source pixel totals.

Run and repeat entirely from retained source archives with:

```sh
python scripts/colorado_town_geography_audit.py \
  --cache local-data/tiger2025 \
  --output-dir colorado-geographic-validation/southern-towns
# Add --offline to require all exact cached source files.
```

The original Denver regression remains. The source workflow now retains all
three town manifests, masks, positive and deliberately invalid PNGs, oracle
accounting and source hashes. Synthetic tests exercise both negative classes
and reject changed polygon hashes, bounds and certification assertions.

## What this does not establish

The scalar and vector implementations share GEOS and the same source polygons;
agreement is not independent evidence that Census water is complete. Narrow
single-line drainage and seasonal water may be absent. EPSG:1188 reports 4 m
accuracy, **not an absolute error bound**; source realization/epoch and shoreline
uncertainty remain unverified. Cells near real boundaries are not certified by
these exact-geometry calculations.

Road/connector evidence, exterior routes, complete metro competition and an
independent geographic/routing golden set remain separate requirements. Every
release/access/land-water-completeness/geographic-accuracy flag stays false.
The public straight-line UI/data and #137's independent reviewer plus separate
approver gate remain intact.
