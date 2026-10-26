# Colorado road-region PNG preview (experimental, not the website)

The research pipeline can now generate two transparent RGBA PNG layers from a
**fully supplied** road graph, 2025 metro centers, polygon land source and
polygon water source:

- `by-road-distance.png`: directed shortest modeled road *distance*.
- `by-road-time.png`: directed shortest modeled *free-flow travel time*.

**Neither PNG is certified geographic coverage.** Unreachable, unsnapped,
ambiguous-road, water and off-road pixels remain transparent. Metro centers are
currently snapped for diagnostics, not independently certified. The road graph
is clipped and may omit a globally winning metro or route outside the extract.

## Example research invocation

```bash
python -m pip install 'networkx>=3.4,<4' 'osmium>=4,<5' 'scipy>=1.14,<2' 'numpy>=1.26,<3' 'shapely>=2,<3' 'pillow>=10,<13'
python scripts/colorado_research_road_preview.py \
  --osm local-data/roads.osm.pbf \
  --metros public/data/metros-census-2025.csv \
  --land-geojson local-data/audited-land.geojson \
  --water-geojson local-data/audited-water.geojson \
  --bounds -105.05 39.70 -104.93 39.78 \
  --threshold 100000 --pixels 64 --max-gap-m 30 \
  --output-dir colorado-research-road-regions
```

The land and water GeoJSON files are intentionally **not provided** as fake
defaults. The caller must separately acquire suitable WGS84 polygon sources
and preserve provenance. Candidate official water inputs include 2025 Census
TIGER/Line AREAWATER county files and USGS hydrography products; even these
require coverage auditing and appropriate transformations. The input hashes
are recorded in `preview-manifest.json`. Passing a polygon file never
certifies it as complete.

All saved results explicitly declare `release_eligible: false`,
`access_certified: false`, `extract_coverage_certified: false`, and
`land_water_completeness_certified: false`. Do not wire the PNGs directly into
the production map. The independent access audit (#137), geographic correctness
and coverage (#138), and gated UI acceptance (#139) remain release blockers.

The separate `Colorado masked road preview contract tests` action validates
synthetic routing, transparency, threshold behavior and the PNG artifact contract
without downloading a real Colorado graph or claiming physical truth.
