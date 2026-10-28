# Preserve the Census-origin experiment before testing urban anchors

The eventual destination policy is reviewed urban access anchors. The existing
Census-native-point experiment remains a separate regression scenario:
`census-native-origins-five-state-two-partition-v1`.

This checkpoint preserves every complete source record (including native point,
road-node lead, gap and unapproved status), exact five-PBF provenance, population
domain hash, units, probe coordinates, all 367 qualifying identities and all 341
unrepresented identities. It also retains all 1,872 graph-only cost records:
1,800 finite costs with exact rational replay sums and 72 unreachable Tucson
cases. It does not preserve the full upstream per-leg witness arrays; the
provenance manifest identifies that full report by SHA-256, head and source CI.
The projection was generated only after checking the original downloaded report's
exact hash. There is no expiring GitHub artifact dependency for these baseline
fields.

`python scripts/metro_scenario_checkpoint.py REPORT.json` checks a newly computed
report against the pinned projection. The existing full-source two-partition
workflow now invokes it after recomputing and replaying the experiment. A changed
origin, node, graph input, population domain, units, source inventory, probe or
cost fails. Unknown competitors must remain accounted for, and an unreachable
case cannot be replaced by zero or dropped. Tests additionally check duplicate
queries, missing costs and tampered checkpoint bytes.

This is intentionally an exact regression for this fixed scenario, not a rule
that new graph versions cannot improve costs. A different graph, anchor policy
or destination set needs a separately identified experiment and comparison; it
must not silently overwrite this baseline. Equivalent-cost path changes that
change the exact stored rational sum need explicit investigation and review.
The checker does not create an approved anchor registry, validate current legal
access, reimplement path replay or authorize geographic shading. The source
workflow performs path replay; the checker verifies that its retained outputs
have not changed. All access/release certification flags remain false.

The Denver pickup candidate remains unresolved at the curb level; see the
[municipal evidence audit](../denver-urban-anchor/README.md). Surface/two-way
road-junction agreement is useful evidence but is not permission to use an exact
pickup zone. Preserving this Census scenario lets urban-anchor experiments
proceed independently without losing the known negative and competitor cases.
