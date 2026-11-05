# Static via-way declarations under fixed-reference member permissions

Two actual Fort Collins source restrictions require maneuver history across a
via way. The complete original-source context contains five distinct member
ways, all 15 member-node records and the two full raw relation records. The
extractor verifies the original Colorado size/SHA before, between and after its
passes; CI reproduces the entire context byte for byte. No private archive or
environment configuration is published.

| Raw relation | Declared directed sequence |
| --- | --- |
| 9680890 | `raw:186582632:4:forward` → `raw:134584349:0:forward` → `raw:290286621:0:forward` |
| 9680891 | `raw:290286621:0:forward` → `raw:6172542:0:forward` → `raw:134584350:0:forward` |

Both raw static declarations are `no_u_turn`. This matches their declared
endpoint topology and exact segment orientation, not a physical turn-angle or
sign survey. No label is independently certified as physically or legally true.

## Strict compiler scope

The new compiler accepts one from way, one to way and one to sixteen ordered
via ways. Every consecutive join must share exactly one raw node, at both
members' endpoints. Repeated way/vertex identities, interior/ambiguous joins,
parallel substitutions and incomplete/foreign node context are unsupported.
Every raw member way and every distinct vertex's tags/coordinates are checked
before producing any output. The from/to use their exact incident segment;
every adjacent segment of every via way is traversed. Original reversed geometry
retains its original zero-based segment indices and forward/backward identities.

Complete member-way/node permissions use the same adopted fixed scenario and
explicit road-default policy as the via-node compiler. Controlled features need
their own explicit IANA zones; a relation zone never fills missing feature zones.
Known remote node denials affect only their incident segments, while an unknown
remote control rejects the entire member projection. No tags are stripped to
adapt inputs to the older static compiler. All earlier implementations and
frozen reports remain unchanged.

Relation semantics are deliberately **static only** in this version: bounded
generic/motor-vehicle/motorcar kinds with explicit mode precedence and a small
metadata allowlist. Conditional, exception, legacy-time, lane, other-mode and
unknown relation-control namespaces are rejected. Every supplied car value must
be supported, including overridden values. Conditional *member-road* permissions
remain evaluated by the unchanged fixed-reference permission contract.

The output is a `no` or `only` exact-arc sequence for the existing history solver,
with source-input, scenario and member-projection hashes. It does not ban the via
road outright: activation requires the declared approach history. Starting in a
via way, leaving it, or ending before the complete pattern has its existing
explicit-history semantics. Bounds are 1,000 vertices/member, 2,000 distinct raw
nodes, sixteen via ways and 128 pattern arcs; excess input rejects rather than
truncates. No route weights or costs are emitted here.

## Verification and limits

Thirteen tests check all eight orientation combinations, multiple ordered via
ways, complete-node mutations, exact joins, permissions and clocks, static mode
selection, rejected namespaces/budgets, unchanged raw evidence and both actual
source cases. Twenty-four synthetic `no`/`only` queries over both metrics and
partial/full approach histories match the independent NetworkX suffix-history
oracle. That verifies declared enforcement, not source interpretation or access.

The checkpoint binds the frozen seed-incidence parent, full original context,
adopted scenario and relevant code. The full regression suite and all 2,508
protected historical costs remain required. Full incident-road/other-restriction
accounting, physical signs/grade/access evidence, reviewed urban anchors,
directed attachments, exterior closure, masks and public-release checks remain
outstanding. The public straight-line map and every inspector view are unchanged.
Zero connectors are approved; no anchors are adopted. #137 stays intact.

```sh
python -m unittest discover -s scripts -p test_reference_via_way_compile.py -v
python scripts/reference_via_way_checkpoint.py
```

Source OSM data © OpenStreetMap contributors, ODbL.
