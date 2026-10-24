# Real Colorado road experiment — controlled workflow

**Status:** experimental pipeline; no validated routing screenshot until workflow
`Colorado OSM road comparison (manual)` has completed and artifacts reviewed.
Production map and main app bundle stay unchanged.

## How to run

After this workflow is on `main`, open **Actions → Colorado OSM road
comparison (manual) → Run workflow** and choose threshold `100000`.
It downloads a real Colorado Geofabrik OSM PBF, extracts a bounded
Front Range/foothills corridor including Denver, Colorado Springs and Pueblo,
and generates a three-panel **road-node sample** comparison:

- straight-line assignment at sampled road intersections (reference)
- shortest drivable road distance (meters)
- fastest modeled driving time (seconds)

Each panel uses identical metro CBSA colors. The output artifact contains
`road-node-comparison.png`, `manifest.json`, download UTC metadata and the
full input PBF checksum. **No synthetic road edges** enter these results.

The workflow deliberately is `workflow_dispatch` **only**. ~hundreds of MB
are fetched, significant memory may be required, and no mass Overpass API
queries are made. Errors must be reviewed, not silently converted into a
straight-line fallback. Input version is recorded by checksum and timestamp
but the first implementation fetches Geofabrik `latest`, so it is
**not fully reproducible until archived by a stable dated URL**.

## Limitations and acceptance gate

This provides real OSM road **nodes**, not geographic raster regions yet.
Road sample points are colored; they must not be presented as official
Census regions or full isochrone fills. For motorways or disconnected
road fragments, accessibility may depend on filtered ways and access tags.

The source graph is clipped at a regional bbox and may omit a route that
temporarily leaves the corridor. Road speeds are static approximations, with
no turn delay or traffic. City access points are snapped to the nearest graph
node. Direction is *location-to-city*. Manual review of interstate routing,
one-way streets, mountain crossings, route detours and the differences
between shortest and fastest routes is required before any UI release.

The workflow must finish successfully and produce: two+ metro origins,
meaningful road-node coverage, a credible map comparison and sensible
metric divergence in `manifest.json`. If it fails to build due to memory
or software API changes, revise the bounded experiment and rerun before
claiming real-road validation.

© OpenStreetMap contributors (ODbL). Geofabrik source:
https://download.geofabrik.de/north-america/us/colorado.html
