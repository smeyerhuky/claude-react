# Real Colorado research PNG validation (OSM + Census 2025)

The `Colorado real OSM and Census research road PNGs` GitHub Actions
workflow runs a **real-data** integration of the components merged in
#129–#145, without shipping any road map to the public site.

1. Downloads and filters the Geofabrik Colorado OSM PBF to the existing
   research corridor `-106.1,38.65,-104.5,40.1`.
2. Acquires the official TIGER2025 Colorado land and intersecting
   county AREAWATER polygons with archive hashes, using the verified
   [2025 Census geography preparer](colorado-tiger2025-research-geography.md).
3. Computes metro-to-road graph-node winners separately for modeled
   **road distance** and **free-flow road time**.
4. Renders 64×64 transparent RGBA PNGs over the bounded downtown
   Sloan's Lake / west-Denver research window `-105.060,39.732,-105.020,39.762`.
5. Independently checks every rendered pixel against the land/water
   exclusion mask: **all water and off-land pixels must be alpha=0**.
   A mixture of road-supported and unsupported/no-data pixels is
   required, and the real Census mask must identify at least one
   **water-excluded** pixel (a zero-water test must fail). Both outputs are artifact-only and never served as site
   assets.

## The artifacts

GitHub Actions uploads `colorado-real-source-road-region-pngs`,
containing:
- `routed-layers/by-road-distance.png`
- `routed-layers/by-road-time.png`
- `routed-layers/preview-manifest.json` (source/hashes and no-data reasons)
- `tiger2025/tiger2025-geography-manifest.json`
- Both clipping GeoJSONs, OSM source hashes, diagnostic logs and
  `alpha-verification.json` with pixel counts.
- `dijkstra-oracle.json`: deterministic samples of actual colored pixels
  cross-checked by independent NetworkX directed Dijkstra **within the same
  clipped OSM graph**; zero reported winner disagreements required.
- `connector-review-queue.json`: every threshold-qualifying Census metro,
  including metros with no local graph road candidate, and unapproved OSM
  road-way links for independent physical/legal access reviewers (#137).

## Do NOT deploy or interpret as a complete shaded road Voronoi map

Both PNGs are expected to have **large transparent areas**. That is
intentional: proximity to a graph centerline is not proof of legal
physical entry, and an incomplete road extract can omit alternative
routes or metro competitors. Census 2025 AREAWATER polygons do not
include every thin stream or seasonal feature. We have **not**
independently verified the connectors required by #137, geographic
coverage/graph closure required by #138, or UI acceptance #139.

The PNGs are research diagnostics with `release_eligible:false` and
cannot bypass the repository-owned, initially empty release connector
approval ledger established in #141. The existing straight-line
website, filters, search, sharing and export remain unchanged.
