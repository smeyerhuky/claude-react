# Mixed via-node and static via-way declared-network queries

This separate kernel composes every supplied supported raw relation over the
same fixed-reference member permissions and segment weights. It supports the
existing timed via-node profile and the new narrow static via-way profile. No
older implementation, frozen checkpoint, inspector view or public map is changed.

## Every supplied control must compile

The unchanged earlier graph validator is reused only as an internal road-weight
stage over complete raw way/node records. No route query is executed or returned
at that stage. The original full relation list is then dispatched by raw via
member type, with complete member-node context and its explicit zone assignment.
No relation/tag is rewritten to masquerade as another topology or permission.
Each compiled sequence must reference this exact weighted universe and scenario.

Only after **every** supplied relation succeeds and the combined patterns pass
conflict/budget checks can a mixed graph or query result be returned. Unknown,
malformed, duplicate, external-member, mixed via-type or unsupported controls
reject the whole bundle. There is no fallback to a query with fewer constraints.
Limits remain the earlier 100 ways, 2,000 nodes, 100 relations and 4,000 arcs;
via-way patterns retain their sixteen-via-way/128-arc bounds.

The weight-stage hash is captured before attaching maneuver patterns. The final
graph hash binds the full compiled relation list, patterns, weights, scenario and
cost policy. The input hash binds complete original way/node/relation records
and explicit zones/default policy. Queries always recompile raw inputs; no
caller-edited compiled graph or reversal override is accepted.

## Frozen actual-source regressions

The declared union contains seven complete member ways, 23 distinct nodes and
22 weighted directed arcs, all from the same original Colorado snapshot. It
includes static via-way restrictions 9680890/9680891 and the separate conditional
via-node restriction 20193102. The latter is inactive at the adopted Wednesday
noon scenario and active only in a separately labeled evening regression.

Eight earlier two-way-kernel queries preserve their exact stored costs and arc
paths under both metrics, directions and clock cases. Twelve additional frozen
queries test both actual via-way restrictions with a complete prohibited
approach, an unconstrained start inside the via road, and an endpoint inside a
pattern prefix. The pattern constrains complete approach history; it does not
ban the via road for every start. A query ending at a prefix retains the existing
declared solver semantics. None establishes real-world turn or entry permission.

The supplied union omits connecting/incident/exterior roads. Its disconnected
components and missing paths are properties of that supplied universe, not a
claim about actual road connectivity or geographic NoData. Costs are not global
metro/anchor distances. Unknown controls such as the separate Tenney Court
bollard must still reject any bundle in which they are supplied; this kernel
does not remove them to assert geographic completeness.

## Verification and remaining gates

Ten tests include 450 all-pair/metric queries on the actual five-way via-way
member network against the independent NetworkX suffix-history solver. Fourteen
more synthetic mixed-pattern queries check overlapping node/way activation,
partial history, diversion and both metrics. Adversarial cases cover a successful
weight stage followed by an unsupported raw relation, conflicting `only` rules,
missing/external members, unknown controls, duplicate IDs and clocks/zones. The
oracle validates declared graph semantics, not source interpretation or physical
access truth. The checkpoint checks all twenty frozen query replays and binds
both earlier source/compiler reports and relevant code/policy/scenario hashes.

All 2,508 historical Census costs remain unchanged. Complete source/restriction
and incident-road accounting, independent signs/grade/access evidence, reviewed
urban anchor sets/directed attachments under #137, exterior/competitor/mask checks
under #138 and public-tab acceptance under #139 are still required. No connectors
are approved and no anchors are adopted; no release-eligible graph is emitted.

```sh
python -m unittest discover -s scripts -p test_road_reference_mixed_graph.py -v
python scripts/reference_mixed_graph_checkpoint.py
```

Source OSM data © OpenStreetMap contributors, ODbL.
