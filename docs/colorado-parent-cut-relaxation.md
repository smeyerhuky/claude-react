# Conditional exterior-route bounds (#138)

`road_boundary_relaxation.py` prepares the complete raw interface from #164 for
weighted routing, then bounds routes that leave and re-enter the known graph.
The scope is **relative to a supplied parent graph and an explicit source subset**.
No national competitor, geographic, access or release certificate follows.

## Preserve hidden junctions first

Every raw interface node must be represented explicitly. A port inside a
contracted edge is promoted by splitting each directed polyline, preserving
ordered OSM references, coordinates, way identity, tags, speed and both costs.
Reverse directions are never inferred. Zero-length subarcs are retained:
dropping a zero-length connection at a new junction could disconnect an old
path. Unknown/mismatched ports fail before mutation. The existing independent
primitive-segment multiset/path-preservation check verifies the result.

## Optimistic exterior relaxation

Let `G` be the promoted known graph. Every missing parent arc starting at a
retained raw node contributes an exit; every missing arc ending there contributes
an entry. This includes omitted-internal arcs with both endpoints retained.
For source `s` and destination `d`, compute

`L(s,d) = min(D_G(s,d), min_exit D_G(s,exit) + min_entry D_G(entry,d))`.

Every parent path either stays known, or has a known prefix before its first
missing arc and a known suffix after its last missing arc. Nonnegative exterior
travel can only add cost. Treating all such intervening travel as free therefore
gives an optimistic lower bound, even if it implies unrealistic teleports.
For location-to-metro routing, reverse the graph **and swap entry/exit roles**.
The calculation does not require loading the exterior network for production;
per-source prefix minima and shared entry labels can be reused across a tile.

The known feasible path provides an upper bound. A conditional subset winner
is identified only when every other included source's lower bound exceeds that
upper bound plus the chosen margin. A stable winner does not imply its route
cost cannot improve. Missing global sources remain explicitly omitted and
unresolved; this calculation never makes `complete_global_competition` true.

Comparisons use exact rational endpoints of conservative floating-point
summation intervals. With `u=2^-53`, `gamma=2N*u/(1-2N*u)` covers mixed
integer/float summation along a simple known path. Computed path labels divided
by `1+gamma` are used for lower bounds and by `1-gamma` for feasible upper
bounds. Overflow/invalid weights fail closed. This assumes standard IEEE-754
rounding and nonnegative representable edge costs; it is a computational cost
model statement, not geometric or physical travel accuracy.

## Independent evidence

Synthetic random parent graphs use **exact Fraction-weighted Bellman-Ford** to
check bounds and any claimed subset winner, separately from production Dijkstra
labels. Regressions include missing internal shortcuts, reverse-only exterior
routes, near ties, invalid weights, hidden junctions and zero-length splits.

`colorado_parent_cut_bound_audit.py` then uses genuine OSM. It promotes every
baseline port, preserves all baseline primitive paths, computes both metrics and
orientations, and separately loads the full original Colorado parent. It checks
baseline path inclusion in that parent, compares bounds against independent
parent per-source Dijkstra routes, and checks the custom allocator's parent
winners. The real inside-bbox time-winner flip must remain inconclusive under
the cut relaxation instead of falsely certifying the old winner. Floating-point
oracle comparisons use a declared 2mm/relative tolerance, not an exact physical
route oracle.

Three fixed unapproved baseline graph-node origins and five probes retain the
same diagnostic meaning; connector costs are excluded and 356 qualifying
competitors remain omitted. The urban-origin scenario is not substituted.
Colorado-parent exterior roads, source completeness, turns/grade, independent
connectors and geographic accuracy remain acceptance work under #138/#137.
