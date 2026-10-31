# Exact raw-segment permission projection

This is the next bounded research layer after
[whole-way permission composition](../reference-way-permissions/README.md).
It preserves complete source way geometry and every raw vertex-node record,
then reports modeled permissions for each **consecutive pair of raw vertices**.
It does not construct a routing graph, evaluate turn transitions, emit costs,
approve access or change any public map or frozen inspector result.

## Internal node restrictions are not whole-way reachability

For the declared raw geometry `A—B—C—D`, suppose B has applicable `access=no`:

| Raw segment | Modeled permission in both directions |
| --- | --- |
| A–B | Denied at endpoint B |
| B–C | Denied at endpoint B |
| C–D | Permitted by this bounded tag projection |

Traversal of the entire way is denied under the parent contract. C–D's permitted
projection does **not** establish that any origin can reach C or D, that a
connector can attach there, or that a turn into/out of that segment is legal.
Blocking both directions incident to a denied endpoint is this conservative
model's rule; it is not a claim about partial travel before that node.

The segment evaluator checks the entire way with the unchanged parent profile.
It never cuts down input geometry, removes tags, substitutes `access=yes`, or
omits an inconvenient node record. A known node prohibition affects incident
segments. An **unsupported** control anywhere on the supplied way rejects all
segment output, including distant segments. This first version does not claim
that supported subsegments can safely be salvaged from unknown context.

Each result retains raw way ID, segment index, original geometry, oriented
from/to IDs, selected way access, one-way permission and endpoint denials.
Forward/backward refer to original OSM vertex order, not compass direction or
metro outward/return direction. Distinct indexed segments of a closed way are
retained. Consecutive identical node IDs are unsupported; zero geographic length
between distinct IDs does not invent a cost or physical connection claim.

The full raw-input SHA and parent projection SHA bind even remote records.
The scenario remains the exact fixed-reference solo-car policy; explicit zones,
mode/direction/conditional precedence and all unsupported controls are inherited
unchanged. Dimensional, HOV, lane, barrier, traffic-sign and other unsupported
contexts cannot emit segment permissions. Unknown output has null segment data
and null counts, rather than a misleading zero cost or an asserted denial.

## Checkpoint and verification

`report.json` binds the exact frozen complete-node parent report, original
Colorado/Arizona context hashes, scenario SHA and implementation hashes. The
three retained Colorado ways each contain one segment: three forward directions
are permitted and three reverse directions denied by the projection. The four
Arizona contexts remain unsupported with no segment output. These source records
were independently re-extracted from the original dated PBFs in PR #242's CI;
the whole-way workflow also repeats that source replay for this PR's new tests.
They remain OSM topology/tag regressions, not independent physical/legal evidence.

Ten segment tests cover internal and endpoint denial, one-way orientation,
mode/conditional precedence, unknown remote controls, missing/duplicate/misaligned
records, closed geometry, exact hashes and input/output mutation isolation.
CI also checks the scenario/conditional/whole-way tests, parent checkpoint
mutation cases, strict via-way checkpoint and unchanged frozen 2,508-cost UI data.

```sh
python -m unittest discover -s scripts -p 'test_road_reference*.py' -v
python -m unittest discover -s scripts -p test_reference_way_permission_checkpoint.py -v
python scripts/reference_segment_permission_checkpoint.py
```

No old graph is relabeled as evaluated under this scenario. No connector cost,
anchor adoption, geographic coverage claim or #137 approval is created. A future
graph layer still needs exact node/arc identity, speed policy, restrictions and
independent closure/access/anchor/artifact gates before public road-map use.
