# Conditional connector budgets for complete source inventory (#138)

The full-parent primitive oracle supplies exact stored-edge costs of graph paths.
It does not cost or establish source/destination connectors. Treating these graph
costs as full feasible incumbent routes would silently omit those obligations.

`metro_connector_budget_frontier.py` instead computes a sensitivity threshold.
Let G be the exact cost of a replayed graph path, B a hypothetical upper bound
on the **total** directed source and destination connector costs, L an admissible
lower bound on a competing source's full route, and M a nonnegative margin.
If independently feasible connectors satisfy the budget, the incumbent costs
at most G+B. The competitor cannot win only when:

```text
B < L - G - M
```

All arithmetic is rational; equality remains a possible competitor. Larger
connector budgets retain monotonically more competitors. Unknown source domains
and missing global speed ceilings never receive a threshold. This helper applies
no exclusions and certifies no preconditions.

`colorado_connector_budget_frontier.py` binds the exact Census domains, regional
report and primitive-parent report hashes. It keeps all 367 supplied qualifying
CBSA identities, including the eight absent from the public 359-row inventory.
Each of the 60 fixed directed probe/metric cases chooses a replayed graph-only
incumbent and computes thresholds for all 367 sources: 22,020 thresholds.
The chosen source's exact Census representative coordinate must match the
regional scenario. Missing costs, identities or cases fail closed.

The scenarios are explicitly Census native representative points, without
urban-anchor fallback. Destinations are raw road nodes, including unapproved
town leads; town query-to-road connector costs are not measured. Budgets of
0/5,000/25,000 meters and 0/600/3,600 seconds are **assumptions to investigate**,
not claims about actual feasible connections. In particular, a zero budget does
not make the reported kilometer-scale origin gaps disappear.

The travel-time threshold additionally assumes a global 140 km/h model ceiling,
including all exterior roads and connectors. The local speed clamp does not
prove that global assumption. Census/OSM datum compatibility, domination of
geometric bounds by all full route costs, origin/destination feasibility, access,
turn restrictions and graph closure remain unverified. Thresholds are conditional
research diagnostics, not source omission certificates. All 363 unrepresented
sources remain explicitly unrepresented and zero exclusions are applied.

CI runs this analysis on the coupled actual-source reports and checks complete
inventory coverage. This advances the practical bounded-competition strategy
without manufacturing independent connector evidence or changing the public map.
