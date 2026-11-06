# Conditional first-exit bound tied to actual source incidence

This artifact tests a conditional cost bound for **one existing unconstrained
raw-node forward query**. It does not return a graph, new route result, metro
winner, geographic region, anchor or connector approval. Every access/coverage/
release flag remains false. The wider 29-way candidate remains blocked by the
unresolved Tenney Court bollard; its source audit and failed preflight are kept.

## Exact first-exit argument

For a route whose first exit from a declared core is directed arc `(u,v)`, its
prefix through `u` costs at least the shortest directed core distance from the
start to `u` when all maneuver/reversal constraints are ignored. The full route
therefore costs at least:

```
relaxed_core_distance(start, u) + cost(u, v)
```

All remaining costs are optimistically zero. This is valid only if all exterior
continuation costs/penalties are nonnegative. Ignoring constraints expands the
prefix search, so it can lower a bound but cannot make it optimistic in the wrong
direction. If every reachable first-exit bound is **strictly greater** than a
feasible full incumbent plus margin, an exterior route cannot improve or tie
that incumbent under the stated model-completion assumptions. Equal bounds stay
unresolved. Unreachable prefix tails are labeled only within this relaxation.

Comparisons and sums use exact rational interpretations of stored costs,
including the actual binary64 value of float inputs. No floating display value
is used to break ties. The generic helper validates bounded node/arc identities,
all supplied metric costs and nonnegative incumbent/margin. It certifies neither
source completeness nor incumbent feasibility. No exclusions are applied.

Because the already-known first-exit **cost prefix alone** is compared, this
argument uses no geometric bound or global speed ceiling, even for modeled time.
It does not convert the supported 160 km/h input domain into a global speed
certificate or remove the speed-ceiling obligation from geographic time bounds.

## Actual source-bound comparison

The expanded frontier enumerates every original-source way at 27 named nodes.
Both tested cores are subsets of those enumerated IDs. Full raw incident records,
permissions, costs, declared restrictions and the adopted scenario are bound to
the frozen source/frontier/earlier-kernel reports. Every incident in-class road
must have supported complete member-node weights; an unknown incident car-road
control rejects the cut instead of being omitted. All touching retained controls
must compile, and the old incumbent's full path/cost replays exactly with them.

| Declared core | Reachable first-exit result for the existing forward query |
| --- | --- |
| Earlier eight-node core | Garage-service exit may compete for both metrics; no conditional dominance |
| Same core plus both garage-service nodes | Two remaining reachable first-exit prefixes exceed the incumbent for both metrics |

The two remaining prefixes are approximately 47.859/97.818 m versus the retained
39.385 m distance, and 4.491/7.585 s versus 3.228 s modeled time. Exact fractions
are retained in the report. The branch is included explicitly, rather than
declared closed. Building and footway records incident to the larger core remain
listed outside the explicit road-class model; that is not proof of real-world
car exclusion or a modeled garage/interior connection.

## Preconditions remain explicit

The conditional conclusion assumes unchanged source/model transitions incident
to the core, unchanged weights/permissions/scenario and nonnegative exterior
continuations. No extra attachment, garage-interior, connector or geometric-noding
edge may be added at the core. The supplied incumbent must be feasible for the
same endpoints, direction, approach history and metric. Original-PBF membership
enumeration does not independently establish source completeness/accuracy in
the real world or physical/legal/grade access. No global optimality or geographic
coverage certificate is asserted. Reverse queries, the active-window regression,
other endpoints, metro/anchor costs and other source/model completions are not
screened. No public road exclusion or query result is applied/emitted.

Ten tests include exact rounding ties, zero costs, margins, unreachable prefix
tails, invalid inputs, immutable evidence, actual source cores and rejection of
unenumerated/unknown-control core nodes. Forty random nonnegative directed parent
graphs across both metrics are checked against an independent NetworkX
Bellman-Ford graph that requires an actual outside-node visit. These validate a
declared cost argument, not access truth or real-world road closure.

```sh
python -m unittest discover -s scripts -p test_road_core_exit_bounds.py -v
python scripts/fort_collins_query_cut_checkpoint.py
```

All 2,508 historical Census costs, prior kernels, inspector views, the public
straight-line map and #137's independent review/approval gate remain unchanged.
Zero connectors are approved and no anchors are adopted. Geographic competitors,
masks, source coverage and public-tab obligations under #138/#139 remain open.
Source OSM data © OpenStreetMap contributors, ODbL.
