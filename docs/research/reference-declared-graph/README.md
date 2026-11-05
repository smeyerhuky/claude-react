# Bounded declared raw-source graph composition

This research kernel composes complete raw member-node permissions, declared
segment distance/time weights and fixed-reference via-node declarations with
the existing maneuver-history solver. It answers only within the supplied way
universe. **It does not construct a complete geographic graph or approve access,
metro anchors, connectors, regions or public-map release.** Zero connectors
are approved. The public straight-line map and all 2,508 old costs are unchanged.

## Fail-closed composition

Each raw way and node identity must be unique and complete. Shared node IDs must
have identical coordinates across all member ways and the raw node record.
Missing/foreign records, unsupported controls anywhere in the supplied universe,
unknown relation members, unsupported/ambiguous maneuver joins, duplicate or
conflicting restrictions and exhausted budgets reject the entire bundle without
partial arcs, patterns or route results. Bounds are 100 ways, 2,000 distinct
nodes, 100 relations and 4,000 arcs, below the unchanged solver budgets.

All permissions, speed weights and relation patterns use the same validated
scenario. Relation zones never fill missing controlled way/node zones. Zones
must name only supplied features. The graph hash includes selected patterns,
weights, policy/scenario identities and the constituent projection hashes;
the input hash binds full raw records and declared zones/default policy.

Queries compile afresh from raw records, rather than accepting a caller-edited
compiled graph, stale active pattern or invented approval metadata. Same-way
immediate reversals remain forbidden under the existing solver policy; this
interface offers no reversal override. Starts/ends are unconstrained declared
raw nodes, not metro centers, attachments or approved road entries.

The compiler cannot establish whether a caller supplied all incident/exterior
roads or restrictions. Its coverage and approval flags always remain false.
A caller's smaller universe is not a certificate that omitted roads are absent,
closed or irrelevant. No closure, geographic NoData or global shortest-path
claim follows from a converged query.

## Retained Fort Collins regression

The two actual source member ways of relation 20193102 contain eight distinct
nodes and seven forward arcs. At the adopted Wednesday-noon reference, the raw
conditional declaration is inactive; the declared path from the incoming arc's
start to the outgoing arc's end traverses:

`raw:696728766:5:forward` → `raw:1475543490:0:forward`.

During the supported Thursday-evening regression instant, the active raw
prohibition blocks that sequence. The two-way declared universe then has no
path for this query. Reverse queries also have no path because both members
are modeled one-way. Eight frozen replays cover both metrics, both directions
and both instants. The alternative instant is a test, not an adopted map scenario.

These finite/unreachable costs describe that declared universe only. They do
not independently establish the raw maneuver label's physical geometry, turn
permission, grade separation, real-world access, all surrounding roads, global
optimality or a metro cost. Old source findings remain unknown and unchanged.
Adding the supplied Tenney Court way and all its nodes rejects the whole bundle
because the removable-bollard control is unresolved; it is never cropped away.

## Verification and next requirements

Thirteen new tests cover raw identity and completeness, cross-way coordinate
conflicts, unsupported disconnected context, relation membership, contradictory
`only` patterns, clock/zone composition, budgets, invalid queries, unchanged raw
records and the actual source regression. A varied-speed case also checks that
distance and time select different paths. Fifty synthetic-universe queries
using generated segment weights match the independent NetworkX suffix-history
oracle across both metrics and `no`/`only` constraints. The oracle validates
declared solver semantics, not source interpretation or actual access truth.

The checkpoint binds the original raw context, prior frozen segment-cost report,
adopted scenario, declared graph and relevant implementation hashes. All earlier
reports and protected costs retain their original claims.

```sh
python -m unittest discover -s scripts -p test_road_reference_declared_graph.py -v
python scripts/reference_declared_graph_checkpoint.py
```

Still required: complete restriction and incident-road/source accounting,
supported handling or independent resolution of unknown controls, reviewed
urban anchor sets and directed attachments under #137, geographic coverage and
exterior/competitor/mask checks under #138, then compatible assets and public-tab
interaction/export/mobile checks under #139. Source OSM data © OpenStreetMap
contributors, ODbL.
