# Strict via-way compiler diagnostics across five state snapshots

Every raw via-way candidate from the five-state restriction inventory remains
accounted for. Exact-source passes accepted **1,879 declared topological shapes**
and rejected **2,006** candidates under the current deliberately strict compiler.
No shortest-path solver was called, costs computed, anchors adopted or access
approved. Acceptance here does not establish applicable ordinary-car restrictions,
physical/legal correctness, current conditions or state routing coverage.

| Source | Raw via-way candidates | Compiled declared shapes | Rejected |
| --- | ---: | ---: | ---: |
| Colorado | 1,163 | 531 | 632 |
| New Mexico | 367 | 336 | 31 |
| Arizona | 1,691 | 862 | 829 |
| Utah | 277 | 117 | 160 |
| Oklahoma | 387 | 33 | 354 |

Lane-specific turn/change/HOV controls are the largest first-rejection category:
572 Colorado, 21 New Mexico, 695 Arizona, 109 Utah and 303 Oklahoma candidates.
These controls are deliberately not guessed from way-level arc availability.
Other categories include conditional or exception semantics, access-purpose
restrictions, unsupported classes/modes, raw direction contradictions, ambiguous
or interior joins, repeated members/nodes and malformed member lists. Each rejected
candidate has **one first reason** here; it may have additional unresolved controls.
Do not interpret these mutually exclusive first reasons as exhaustive independent
legal findings, or compare accepted fractions as state readiness rankings.

The selection includes any `type=restriction` relation with a via-way member.
Mixed node/way or malformed candidates remain in the denominator and reject rather
than disappearing. Mode-specific/exempt relations also remain; applicability to a
particular private-car profile requires separate review. There were no missing or
oversized member ways in these five exact inputs, but either case remains an
explicit unsupported result, not an excuse to omit the relation.

The scanner checks full source size and hash before and after reading, and checks
that the canonical complete raw relation projection matches the retained raw
inventory. A second source pass reads selected member **node IDs and tags only**.
Coordinates, lengths and speeds are not fabricated to make synthetic routes.
Topology-only arc records have no costs, and are never passed to a route solver.
Member/input/node-reference budgets reject without a partial state report. Individual
oversized ways classify as unsupported before any geometry is truncated or compiled.

Examples retain at most three ascending relation IDs per result category. They
are diagnostics pointing into the exact original source, not complete evidence
packets. The report binds the source inventory and all original identities; no
original PBF or private archive is published. Raw-source code/counts are research
observations, not independently audited real-world golden fixtures.

Reproduce with `osmium==4.3.2`, `networkx==3.7` and all five pinned original inputs:

```sh
python scripts/metro_via_way_compile_inventory.py --osm-dir /path/to/exact/inputs --compare docs/research/state-via-way-compiler-inventory/report.json
```

These full-source passes were run locally. Four tests cover raw positive/negative
classification without invented costs, full accounting for missing/mixed/oversized
members, duplicate rejection, deterministic counts, bounded samples and changed compiler dependency rejection. CI checks
fixtures, identity/accounting and false certification flags; **it does not repeat
the five full-source passes**. The separately required Colorado/Arizona exact-source
context CI for the raw compiler remains intact and is not replaced by these checks.

The user selected a fixed reference-time approximation; its contract is retained
separately. The current strict compiler still leaves all conditional profiles
unsupported here; this inventory was not reevaluated under that new scenario. Full lane/turn applicability, connector orientation and independent
access evidence, different-approver approval, complete competitor/exterior routing,
land/water masks and audited golden cases remain release requirements. Zero connectors
are approved. The old graph, its frozen 2,508 costs and all older inspector views are
unchanged. The public straight-line map remains unchanged and no road tab is enabled.

The v2 report also binds the exact scanner, compiler, restriction helper and static
direction/profile implementation by SHA-256. CI rejects a code/profile change
until all five exact-source diagnostics are regenerated and reviewed. The report
therefore cannot silently retain old support counts after a classifier change.
