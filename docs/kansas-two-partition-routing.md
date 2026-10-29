# Research extension: bounded six-state routing

This experiment investigates adding five Kansas competitors while retaining the
frozen 26-source/five-state checkpoint. Its result is a reproducible bounded
preflight rejection, not an expanded route comparison. The public straight-line map and #137 access-evidence gate are unchanged.

## Measured rejected layouts

- Retaining CO/NM/AZ/UT opposite OK/KS exceeds the unchanged 128-port cap.
  [Local negative](research/kansas-partition-layouts/retained-prefix-negative.json).
- CO/OK/KS opposite NM/AZ/UT has 661 ports, rejected in fresh source CI at
  `06bb880a52d28fe76554ba9e1229868692ad6026`.
  [Measured CI negative](research/kansas-partition-layouts/central-western-negative.json).
- A complete 56-cut midpoint-longitude inventory finds no unscoped cut whose
  shared-node bound fits 128 alongside the original node/arc caps.
  [Exact inventory](research/kansas-partition-layouts/longitude-sweep.json).
  This counts shared nodes, a conservative port bound, rather than claiming every
  shared node is necessarily an active oracle port.
- At longitude -107.4, removing unqueried components and nonquery leaves reduces
  the full graph's 245 shared vertices to 178 active shared vertices. It still
  produces no route comparison: the oracle rejects its active interface at the
  unchanged cap. [Local query-view negative](research/kansas-partition-layouts/query-core-negative.json).

`--layout retained-prefix-v1` and `--layout central-western-v1` reproduce the
atomic groupings. `longitude-query-v1` assigns each original primitive segment
once by its endpoint-longitude midpoint; runs preserve original OSM identities,
tags, coordinates and edge-weight formulas. There are no interpolated nodes or
new chords. Different cuts remain explicit experiments, never silent fallbacks.

## Query-preserving views

All source files are audited first. The original six-state model contains
22,027,949 distinct modeled nodes and 44,749,222 raw directed arcs. Individual
full shards must fit 15 million nodes and 40 million raw arcs. Global raw-way
identity conflicts are checked using a disposable bounded SQLite fingerprint
store (10 million original records, 1 GB, 64 MiB cache). Each existing shard
builder retains its five-million-run fingerprint cap. Scratch files cannot be
resumed after failure and are removed on close. No full union road matrix is built.

The query view protects all 42 distinct endpoints used by the 31 sources and
18 probes. With nonnegative node-state weights, an unqueried connected component
and an unprotected undirected leaf cannot contribute to a shortest path between
protected endpoints. Leaf removal repeats to convergence. Structural adjacency
retains genuine zero-weight arcs; weighted graph zeros are never eliminated.
Shared neighbor identities are deduplicated across owners. Removing empty owner
entries avoids artificial ports. A protected isolated node keeps one owner.

Both views bind the same sorted endpoint set and SHA-256 digest. The oracle
rejects new endpoints, mixed full/pruned inputs, tampered scopes and repeated
pruning. Adding an endpoint requires deriving fresh views from the full model.
These views do not support arbitrary destinations or establish geographic
coverage. Their node counts are reported separately from full input inventory.
All existing oracle budgets remain: 128 ports, 32 sources, 32 targets, 192 overlay
nodes and 512 local Dijkstra calls per run. Exceeding any cap fails without
truncation. The query-cut diagnostic schedules candidates only; full-source
budget checks and exact route replays remain necessary.

The [protected 56-cut inventory](research/kansas-partition-layouts/query-cut-sweep.json)
finds no cut with a shared-node upper bound of 128, even before intersecting full
shard budgets. The smallest query shared-node count among full-budget cuts is
171 at -105.8. This does not prove every possible layout or actual port count
infeasible. The measured -107.4 oracle interface has 178 ports.

CI runs `--expect-interface-rejection` at the pinned cut. Only the dedicated
interface-budget exception with exactly 178 ports against 128 is accepted as the
expected negative. Other failures remain failures; unexpected feasibility also
fails pending review. The output explicitly has **zero computed/replayed route
cases**, 31 candidate leads, and the unchanged published scenario's 26 sources /
341 unrepresented qualifiers. It rechecks all 56 protected-cut counts against the
pinned audit. Ordinary routing invocation still raises on budget rejection.
Green negative-result CI does not establish successful routing.

## Required comparison before adoption

All 26 old records are copied into `retained_reference_record`, including native
points, road-node coordinates and unapproved access state. Full-shard membership
and query-view ownership are recorded separately. The five new native-point
leads are Kansas City, Lawrence, Manhattan, Topeka and Wichita. Required endpoints
cannot be dropped or moved to satisfy a resource cap.

A successful run must compute 2,232 costs, compare all 1,872 old cases and replay
every finite selected path. Old finite routes must remain feasible without an
increase beyond the existing tolerance. Old unreachable cases and new-source
cases remain distinct. Winner changes from added roads and added competitors
are reported separately. Only after completion would this diagnostic represent
31 sources and leave 336 qualifying identities unrepresented; the published
26-source checkpoint and its 341 unknown competitors remain unchanged.

No connector, urban access anchor, turn model, exterior completeness, datum or
land/water coverage is certified by these experiments. All access and release
flags remain false. The optional dev inspector continues showing frozen reviewed
research reports, not this unfinished experiment.
