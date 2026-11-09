# Northern Colorado local-street detour experiment

This extends the [major-road research checkpoint](../northern-urban-paths/README.md)
with supported detour streets. It changes no public map code, permission grammar,
speed policy, scenario, solver budget, anchor adoption or connector approvals.
The five unadopted endpoint hypotheses are exactly the parent's native nodes.
These are modeled native-node witnesses, not independently verified access routes.

Road selection has three explicit tiers:

- The parent's motorway/trunk/primary/secondary classes and their links anywhere
  in the original regional window `[-105.20,40.34,-104.60,40.67]`.
- Tertiary roads and links within the declared Fort Collins, Loveland and Greeley
  boxes retained in `report.json`.
- Residential, unclassified and living streets within the small Greeley window
  `[-104.71,40.41,-104.68,40.44]` surrounding the two existing hypotheses.

A whole way is selected when any native member node is inside its tier's closed
box. Ways are never clipped. Service roads are not selected for travel, although
complete service-way context is captured if a restriction needs it. A box is a
selection device, not a geographic coverage or access certificate.

The complete exact frozen Colorado PBF is verified before and after three full
passes. Every touching restriction/connectivity/restriction-prefixed relation is
captured with its whole member ways and tagged member nodes. The same existing
weight and restriction compilers reject unknown lane controls, clearance or barrier
conditions and other unsupported source information. All travel ways belonging
to an uncompiled control or a control with unsupported member weights are
quarantined. Combined/projection failures stop the run. No tags are stripped and
no turn rule is dropped to obtain a route.

The same resource limits remain: 3,000,000 regional node identities, 10,000 travel
ways, 12,000 context ways, 50,000 member nodes and 2,000 touching controls. The
existing search still allows at most 50,000 nodes, 100,000 arcs and its original
state/transition budgets. Exceeding a limit returns no partial checkpoint. The
older small-graph compiler's 100-way guard is unchanged.

The extended capture also reconstructs the **exact parent raw context and weighted
graph hashes**. Every previously retained travel arc must remain byte-for-value
identical. Every old finite witness is checked against the expanded graph's
original, preprojection controls and exact costs, and every new cost for those
queries must be no worse. The endpoint hypothesis list must remain identical.
The retained parent report and its separate replay workflow are unchanged.

The original-source run produces **40 finite modeled metric-query witnesses and
zero unresolved queries**, compared with 12 finite and 28 unresolved in the
parent. All 12 parent finite queries improve strictly in their own metric. This
covers the five hypotheses' 20 ordered non-self pairs × two metrics; it does not
mean 40 metros or independently approved routes. The retained subset has 41,799
nodes, 68,298 directed arcs and 341 projected maneuver rules, derived from 47,999
raw member nodes and 1,020 touching controls. Unsupported context ways remain
1,418 and failed controls remain 292; they are excluded/quarantined rather than
assumed safe.

Each finite result retains ordered raw arc identities, a rational sum of stored
binary costs, solver diagnostics and independent endpoint/reversal/original-rule
checks. Missing witnesses remain **unresolved**, never real-world unreachable or
modeled NoData. Weak-component membership is a subset diagnostic, not evidence of
directed reachability. Meters and seconds exclude connectors and do not establish
a uniform destination/window incumbent bound, world-optimal routes or isochrones.

The fixed solo ordinary-car scenario remains **2026-10-28T18:00:00Z** with frozen
access conditions and no traffic/waiting/arrival-time reevaluation. Per-feature
America/Denver assignment remains an explicit research assumption rather than a
certified geographic timezone join. Hypotheses use unconstrained native-node
starts and permit terminal stops inside an ONLY prefix under the existing solver
policy. Context-point displacement is not connector cost. No anchors are adopted
and zero connectors are approved; physical/legal access and coverage gates remain.

Replay with the workflow's pinned osmium/networkx/tzdata dependencies, Shapely and
openpyxl installed:

```sh
python scripts/northern_local_detour_checkpoint.py --osm /path/to/colorado.osm.pbf
```

`--write` explicitly regenerates the derived report. Read-only CI reconstructs the
experiment from the existing hash-bound original-source cache and compares the
entire report. Its artifact contains only this README and `report.json`. Original
PBFs, full regional raw/graph archives, private source archives and environment
configuration stay outside published files. The historical 33-source × 19-sample
matrix remains 2,508 costs: 2,356 finite and 152 modeled NoData.

Derived OSM records: © OpenStreetMap contributors, available under the
[Open Database License](https://www.openstreetmap.org/copyright).
