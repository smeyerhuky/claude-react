# Bounded directed maneuver-history research

The five-state raw inventory contains thousands of via-way restrictions. A route
state consisting only of the current node or incoming arc cannot represent a
restriction activated several segments earlier. `scripts/road_maneuver_probe.py`
adds isolated shortest-path search over **declared directed-arc sequences**, keeping
active prefixes as part of the state. It does not compile raw OSM relations,
determine car applicability or replace any existing graph experiment.

A `no` sequence prohibits completing that exact consecutive sequence of directed
arcs. A diversion ends that activation; a later matching prefix may activate again.
An `only` sequence requires each next arc once the first arc has been traversed.
The route may end at a node within that sequence; the rule constrains continuation,
not the right to reach the node. These are explicitly declared research semantics,
not a claim that every raw OSM only relation has already been interpreted correctly.

All overlapping prefixes survive. Entering a via-way midway from another approach
does not inherit a restriction requiring an earlier from arc. Parallel incoming
arcs retain identity. Distance and time, outward and reverse queries, are solved
separately in explicit forward orientation. Exact rational arithmetic and directed
arc replay check the sums of stored costs. Initial approach at the declared source
node is unconstrained; actual connector orientation is not modeled or approved.

Immediate same-way reversal requires an explicit declared arc pair. This is a
restrictive research maneuver policy, not independently certified U-turn legality.
A declared reversal cannot override a prohibited sequence. Conflicting only-prefix
continuations and an only sequence forcing a prohibited subsequence reject the
whole query rather than guessing a disjunctive interpretation. Duplicate, missing,
disconnected or malformed sequences also reject.

Inputs, total sequence arcs, compilation comparisons, active prefixes per state,
total stored prefix entries, discovered states and examined transitions all have
fixed caps. Exceeding a cap raises without partial results. The compiler's work
and accumulated history memory are bounded in addition to the Dijkstra search.
No national/state graph cap is raised. Existing node-state costs and the small
via-node Tucson probe are unchanged; no production caller is installed.

Eight tests compare costs with an independent NetworkX oracle that stores full
bounded suffix histories instead of the production active-prefix representation.
They cover multi-segment prohibitions, metric-specific/asymmetric detours, entry
midway through a via-way, only continuations, route endpoints inside a sequence,
parallel arrivals, overlapping repeated prefixes after forced loops, declared
reversals, conflicting constraints, zero-cost cycles, exact stored-cost replay and
exhausted input/compiler/history/search budgets. Fixtures are synthetic and never
certify real roads, anchors or connectors.

```sh
python -m unittest discover -s scripts -p test_road_maneuver_probe.py -v
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Next requirements include exact raw-relation-to-directed-arc compilation, all
applicable car/mode/conditional semantics, junction/U-turn policy, independently
reviewed connector arrival/departure states, exterior/competitor coverage and
independent real-world golden checks. This helper proves none of those. Every
output keeps access, geographic coverage and release eligibility false. Zero
connectors are approved; the #137 independent evidence and different approver gate
is unchanged. All older inspectors and the public straight-line map stay unchanged.
