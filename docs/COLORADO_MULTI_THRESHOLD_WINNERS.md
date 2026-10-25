# Experimental Colorado multi-threshold metro winners

Manual workflow: **Colorado multi-threshold metro winners**. It generates
independent directed location-to-CBSA shortest-road-distance and modeled
driving-time winner allocations for Census 2025 representative points at
population thresholds 100,000 and 250,000. Each threshold produces a JSON
winner dataset and a three-panel road-node sampled image. The manifest records
OSM and Census CSV SHA256, source counts, rejected metro candidates, reachability,
metric divergence and output size.

**Cross-boundary behavior:** Unlike the prior bounding-box-only experiment,
metro representatives outside the study area are considered if they snap within
25 km of a road graph node. Synthetic regression proves such an outside metro
can win. This does NOT certify true global winners: a winning destination could
be farther than the snap limit, and a shortest route might exit the clipped
road graph. The output explicitly warns of this limitation. Do not treat
road-node coloring as geographic polygons or OSM-derived Census boundaries.

Assumptions: directed graph, simplified OSM car access, static speeds, no
complete turn restrictions or live traffic, nearest retained vertex. Isolated
nodes remain unassigned. © OpenStreetMap contributors, ODbL.

Acceptance before claiming real-data success: inspect the workflow conclusion,
real processing logs, both threshold datasets, PNGs, manifest and resource usage.
Further work must address complete regional boundary coverage, geographic
sampling and national packaging before production UI integration.

## Follow-up validation gate

The manual workflow now includes a third **400,000** population threshold.
Boulder (CBSA 14500; population 328,560) ceases to qualify, allowing a
real Colorado road-node comparison against the 100,000 baseline.
`manifest.json.threshold_winner_changes` reports actual changed winners by
metric and distinguishes reachability changes. CI fails if neither metric
has any changed winner, preventing a vacuous multi-threshold pass.
`boundary_proximity` reports vertices near the extracted graph bbox edges,
while `excluded_qualifying_candidates` describes all qualifying representatives
rejected by snapping. **Neither proves boundary completeness.**

Inspect the resulting actual winner change counts and validate representative
changed nodes manually before treating this as a successful real-data gate.

## A2 experimental road-proximity geographic tiles (not production land regions)

The Colorado workflow can now pass `--coverage-tiles` to create a globally aligned
512 × 512 lon/lat preview grid split into 256 × 256 PNG tiles for each threshold
and metric. `coverage-tiles/tiles-manifest.json` contains bounds, palette
indices, no-data pixel counts, covered fractions, and tile paths.
Pixel centers sample the *nearest road graph vertex*, using a 1 km maximum
proximity. Vertices without a winner, and pixels farther from a vertex, remain
**transparent**: there is no invented straight-line fallback.

This is an **A2 diagnostic intermediate** rather than finished geographic
coverage: no Census land/water polygon mask, no independent point-to-road edge
routing, no guarantee that graph vertices approximate all nearby land, no
semantic guarantee that nearest-vertex allocation matches that of the nearest
routable road segment, and no exterior-route/bbox correctness proof. Tile
seams use the same global pixel grid. Synthetic regression checks transparency
and tile stitching, but real OSM artifacts must be visually inspected and
covered/no-data fractions recorded before extending the renderer.

**Next A2 gates:** clip to verified land polygons and identify water;
sample or snap directly to eligible road segments (not just vertices) with
confidence and unreachable classes; compare sample winners against independently
routed origins; test adaptive sampling at boundaries; measure aliasing and
payload/build/browser budgets; finally generalize global-grid tiling to seamless
national display after nationwide routing correctness is established.
