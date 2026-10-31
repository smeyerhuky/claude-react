# Fixed-reference whole-way permission composition

This bounded research checkpoint combines raw car-access tags, one-way tags,
weekly conditions and complete vertex-node records. It emits no route costs or
access approvals. It does not alter the public map, legacy static graph profile,
old inspectors, frozen 2,508 costs, anchor ledger or #137 independent access gate.

The reference scenario is 2026-10-28 18:00 UTC, with access frozen at that instant
for a solo private passenger car. Time is converted using an explicit IANA zone
for each controlled feature and pinned tzdata 2026.5 / IANA 2026e. There is no
inherited state/way/node zone, geographic zone assignment proof, arrival-time
reevaluation, waiting, traffic or dimensional assumption. The scenario and exact
implementation hashes are in `report.json`.

## Composition contract

The hierarchy follows the OSM documentation's
[evaluation of conflicting restrictions](https://wiki.openstreetmap.org/wiki/Conditional_restrictions#Evaluation_of_conflicting_restrictions):

1. More specific transport mode: `motorcar`, `motor_vehicle`, `vehicle`, `access`.
2. Within a mode, direction-specific access overrides bare access.
3. Within the same mode and direction, an active conditional overrides its base.
4. The last matching outer conditional clause wins.

Lane controls are unsupported in this version. All relevant conditional syntax
is checked before any permission is emitted; an overridden or late unsupported
condition cannot hide behind a permissive selected value. The weekly grammar is
shared with the previously tested conditional resolver, including overnight
weekday handling and half-open time windows. The existing independent schedule
oracle covers 30,240 weekly minute comparisons; this new composition layer is
tested separately and makes no claim to an independent routing oracle.

Selected `yes`, `permissive` and `designated` values permit modeled traversal;
`no` and `private` deny it. Selected purpose, customer, permit and other unknown
values are unsupported. Most specific car one-way values override less specific
ones. Explicit forward/reverse/both directions and the declared roundabout and
motorway defaults are supported; untagged motorway links and circular junctions
require a future contract. Unknown/reversible/alternating values are unsupported.

An explicit `declared-us-common-road-car-defaults-v1` assumption permits the
listed common road classes when no applicable access value is present. Missing
raw values remain null, including an inactive conditional with no base. The
default is separately labeled; it is not a fabricated raw `access=yes`, legal
finding or proof of physical car access. An untagged node adds no new restriction.

Way access, one-way directions and **all supplied vertex-node access controls**
compose by conjunction. A node's permission cannot lift a way's prohibition.
A denied internal node denies traversal of the entire declared way; it does not
establish that all vertices or partial segments are unreachable. The evaluator
requires exactly one matching raw node record for every distinct way vertex,
including untagged nodes. This is a structural requirement. Only re-extraction
from the exact original PBF establishes that these records carry its raw tags.
Neither operation supplies every incident way or proves geographic closure.

HOV, lane, dimensional, barrier operation, traffic-sign interpretation, opening
hours, construction, unknown conditional families and directional node controls
remain unsupported. No direction permissions are emitted if composition fails.
Signals/stops do not add modeled waiting time; turn maneuvers and speed weights
are outside this projection. A supported projection alone cannot admit an arc
to a future routing graph without those separate contracts.

## Retained source replay

The exact original Colorado and Arizona source identities match the 33-source
baseline. The snapshots add every raw vertex node to the unchanged member ways
and restrictions of the earlier strict via-way compiler:

| Source | Selected ways | Distinct vertex nodes | Supported projections | Unsupported projections |
| --- | ---: | ---: | ---: | ---: |
| Colorado | 3 | 4 | 3 forward-only | 0 |
| Arizona | 4 | 8 | 0 | 4 |

Colorado's selected ways have untagged vertices. Arizona way 437327478 includes
node 10229321984 with raw `traffic_sign=yes`; its meaning and orientation are
unresolved. Ways 123445153 and 1340007750 have lane controls. Way 437327483 has
conditional HOV context outside this supported composition grammar, so resolving
its separate midday `motor_vehicle=yes` value never admits it. The explicit
Phoenix zone in that diagnostic is a declaration, not a geographic attestation.
The previous strict via-way compiler still rejects the Arizona case unchanged.

These are bounded topology/tag regressions, not audited ground truth. There is
no claim that a retained legacy route crossed a controlled node. Zero connectors
are approved, no urban anchors are adopted, and no costs are evaluated here.

## Reproduce

Use Python 3.12, osmium 4.3.2, networkx 3.7 and tzdata 2026.5:

```sh
python -m unittest discover -s scripts -p 'test_road_reference*.py' -v
python -m unittest discover -s scripts -p test_reference_way_permission_checkpoint.py -v
python scripts/reference_way_permission_checkpoint.py
python scripts/via_way_compiler_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The CI matrix downloads the dated public 261027 Geofabrik inputs, verifies their
original size/SHA against the baseline, re-extracts each exact member way,
restriction and complete vertex record, then compares the full JSON bytes.
The extractor rechecks the original source hash after extraction. No PBF,
private draft archive, application state or environment configuration is included
in the commit or bounded report artifact.

OSM data © OpenStreetMap contributors, ODbL. Source snapshots retain raw IDs,
versions, timestamps, coordinates and tags; source-derived modeled permissions
are not independent access evidence and cannot satisfy #137.
