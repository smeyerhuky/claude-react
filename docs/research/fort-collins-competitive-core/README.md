# Source expansion around potentially competitive exits

The prior 45-node source core had six reachable first exits whose relaxed cost
prefixes could compete with either retained incumbent. A bounded selector now
absorbs such destinations until the **supplied known graph** has no remaining
competitive first exits. It includes equality, handles exact stored binary costs
and uses the union of both metric bounds. Saturating the prior 121-node graph
selects 96 source-inspection nodes over 17 checks. This selects nodes to inspect;
it supplies no geographic or access certificate.

The original Colorado extractor enumerates every way incident to those 96 nodes,
without spatial, highway or access filtering. Six explicit member-way requests
retain earlier complete context and complete the newly exposed conditional
restriction. The snapshot contains 71 incident ways, 76 total ways, 343 complete
nodes and ten controls, with no missing members. All prior source records,
incidences and weighted arcs remain exact. Twenty-two outside-class ways remain
explicit. Source size/SHA is checked before, between and after the original two
passes. Existing 100-way/2,000-node bounds are unchanged.

The supplied road model composes 54 roads, 216 road nodes and 359 directed arcs.
All ten declarations compile; relation 20193102 has its own explicit
`America/Denver` clock and is inactive under the adopted fixed scenario. Its full
geometry is required even when inactive. Nine maneuver patterns remain active.
Every one of the earlier 175 weighted arcs is exactly unchanged.

For the same unconstrained node-to-node query, the shortest-distance path stays
exactly 219.361325 modeled metres (39.261891 modeled seconds). The shortest-time
path changes: 326.802718 modelled metres in 34.146758 modeled seconds. The longer
distance path is faster under the fixed free-flow weights. Both paths obey the
independent maneuver declarations. These are supplied-model results, not observed
traffic, navigation guidance, approved metro-anchor costs or globally optimal
geographic routes. Older frozen reports are preserved.

Original-source expansion exposes more connections than the prior known graph.
At the new 96-node core, **15 distance exits and 26 time exits may still compete
or tie**. Fourteen distance exits and three time exits conditionally exceed the
respective incumbent, but no exterior-route exclusion is applied. The prefix
relaxation ignores maneuver/reversal constraints to obtain conservative lower
bounds; those prefixes are not asserted feasible routes. There are 247
unenumerated outer source-member nodes. Saturation of a known graph must never
be confused with closure of the source geography.

```sh
python -m unittest discover -s scripts -p test_road_competitive_core.py -v
python -m unittest discover -s scripts -p test_fort_collins_competitive_core.py -v
python scripts/fort_collins_competitive_checkpoint.py
python scripts/fort_collins_competitive_core.py --osm ORIGINAL_COLORADO_PBF --output /tmp/source-context.json
cmp /tmp/source-context.json docs/research/fort-collins-competitive-core/source-context.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Selection tests compare with independent full-graph Dijkstra over 60 seeded
directed graphs, including zero costs, asymmetry, ties and exact float boundaries.
The actual expanded maneuver model has 1,024 query/metric comparisons against an
independent history-graph oracle. Missing/unknown controls, incomplete members,
changed original records, exhausted budgets and false approvals fail closed.

The report binds the exact source, frozen parent, selector, fixed scenario,
implementation, graph and route/bound replays. Physical/legal access, grade/lane
connectivity, all competitors, masks and independent release gates remain
unresolved. Zero connectors are approved, no anchors adopted and #137 is intact.
Public straight-line map, inspector views and all 2,508 frozen Census comparison
costs remain unchanged. OSM-derived records are attributed to OpenStreetMap
contributors under ODbL; no private source archive, source PBF or environment
configuration is published.
