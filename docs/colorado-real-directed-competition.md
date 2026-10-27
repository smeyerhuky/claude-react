# Real directed metro competition and network budgets

Research CLI:

```sh
python scripts/colorado_real_directed_competition.py \
  --baseline-osm local-data/roads.osm.pbf \
  --expanded-osm local-data/expanded-roads.osm.pbf \
  --metros public/data/metros-census-2025.csv \
  --output colorado-real-road-preview/real-directed-competition.json
```

The real OSM+Census workflow runs this after constructing both extracts.
It retains the full unique population >=100,000 Census CBSA inventory, explicitly
lists omitted CBSAs, and chooses Boulder, Colorado Springs and Denver as an
**unapproved diagnostic subset**. It fixes baseline snapped road-node identities
across both extracts so graph changes cannot be hidden by resnapping origins or
probes. Selection uses the existing 25km research snap bound. Connector lengths
and times are excluded: these are routes between graph vertices, not routes from
Census representative coordinates or evidence of drivable geographic access.

For each graph, metric (meters or modeled seconds), and orientation
(location-to-metro or metro-to-location), compare custom multi-source winner
labels to independent per-probe NetworkX Dijkstra source costs. Use each of the
three source nodes plus a road vertex selected near Sloan's Lake as fixed probes.
Require every metro to appear as a winner and at least one probe with two
reachable competitors. Report all reachable source costs, ties, unreachable
probes and differences between extracts. Missing fixed nodes fail closed.

Separately check a **single-metro network isochrone** using a 10,000m distance
budget or 600s time budget. Compare membership at each fixed probe to independent
shortest paths. Distance/time and outward/return budgets are separate queries;
a winner map is not an isochrone. Synthetic tests cover exact budget boundaries,
one-way direction, disconnected components and multiple connector nodes bearing
one metro label. Multiple connector support is algorithmic only; no connector is
approved by these tests.

`road_spike.assign` keeps location-to-metro as its default. New callers can request
metro-to-location explicitly and set `max_cost`. Reject invalid weights across
the entire graph before traversal, including otherwise unreachable arcs.
Production labels retain their historical 0.001-unit rounding; oracle comparisons
allow a conservative 0.002-unit tolerance. Budget membership uses unrounded costs.

No continuous polygon or off-road interpolation is produced. No public map,
release ledger or connector approval is changed. All reports retain
`release_eligible:false`, `access_certified:false`,
`complete_global_competition:false` and `graph_inclusion_proven:false`.
Equal winners do not prove coverage; lost arcs or exterior routes may be missing.
The stricter #153 inclusion comparison remains available for graphs with identical
arc subdivision. Rebuilt contracted OSM extracts may subdivide boundary arcs at
new junctions; a future common-refinement/cut-arc audit must establish inclusion
before treating a baseline/expanded comparison as a coverage argument.

See [coverage acceptance](colorado-coverage-acceptance.md) for remaining #138
obligations. This CLI adds real direction-specific algorithm evidence; it does
not discharge geographic boundary closure or independent access review.
