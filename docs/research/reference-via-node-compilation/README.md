# Exact directed-segment compilation of a selected via-node declaration

This bounded layer joins the fixed-reference raw-rule selector with complete
member-node and adjacent-segment permission projections. It matches a declared
from-way/via-node/to-way relation to two exact directed raw segments. It does not
build a complete graph, validate the signed maneuver's geometry or establish
real-world legal/physical/grade access. No real road costs or anchors are emitted.

## Actual Fort Collins declaration

The frozen source for relation 20193102 supplies:

| Role | Raw segment identity | Directed nodes |
| --- | --- | --- |
| Incoming | `raw:696728766:5:forward` | Last adjacent segment of member way 696728766, ending at 6543050322 |
| Outgoing | `raw:1475543490:0:forward` | First adjacent segment of member way 1475543490, starting at 6543050322 |

The full geometry and every distinct member-node record are required before
matching this pair. IDs use original way ID, zero-based adjacent-segment index
and orientation in original OSM vertex order. A neighboring/parallel way or a
point with the same coordinates is not substituted for the declared member or
shared node.

At the adopted Wednesday-noon reference, the conditional declaration is retained
with **no active pattern**. During the supported Thursday–Saturday evening
window, it emits a declared `no` pattern over that same exact two-arc sequence.
Six frozen boundary regressions preserve this behavior. Alternative instants are
test scenarios, not new adopted map scenarios. Neither an inactive prohibition
nor an explicit car exception establishes permission to turn; the general
maneuver policy and all other controls remain separate.

## Strict scope

The supplied way set must be exactly the complete from/to member set, and the
node collection must contain one full record for every distinct vertex. Source
metadata and geometry/tag budgets are bounded. Member-way permissions are
evaluated under the same scenario and explicit modeled road-default policy;
relation zones are not inherited by controlled way/node features. A denied
approach/departure, unknown control, missing/misaligned node or malformed
membership rejects the whole compilation without a partial arc pair or pattern.

The via node must occur once and be an endpoint of each member way. Interior joins
and repeated-via geometry require a separately verified split contract. Reversed
raw geometry changes segment index/orientation while preserving the intended
directed node continuity. Same-way declarations retain distinct forward/backward
segment IDs. Matching an adjacent segment does not claim the entire member way
is reachable: a known remote node denial affects its incident segments, while an
unsupported remote control rejects the entire member projection in this version.

`topology_compiled=true` means only this declared raw-source pair has been
matched. **Independent maneuver geometry, all incident ways, other restrictions,
geographic zone assignment and access remain unverified.** A raw `no_u_turn`
label is not independently checked against a physical sign or actual turn angle.
No raw tags, members or source geometry are deleted or rewritten. Exact full
inputs, scenario and each member projection are hashed.

## Verification

The checkpoint binds the frozen source and prior raw-rule report, original
member/node context and relevant implementation hashes. Source identity was
reproduced from the original PBF in prior exact-source CI. Those historical
reports remain unchanged; their `topology_compiled=false` fields are not relabeled.

Fourteen new tests cover four orientation combinations, exact indices and shared
node identity, one-way/node prohibitions, known vs unknown remote controls,
complete node records, parallel/member substitutions, ambiguous joins,
same-way reversals, inactive/exempted declarations, independent feature zones,
budgets and unchanged raw evidence. The actual Fort Collins pair is checked at
both inactive and active instants.

Synthetic `no` and `only` patterns also run through the existing maneuver-history
solver for both metrics and several source/target pairs. Results match the
independent NetworkX suffix-history oracle. That verifies enforcement of the
emitted declarations using **synthetic weights**, not an independent physical
compiler audit or actual driving costs.

```sh
python -m unittest discover -s scripts -p test_reference_via_node_compile.py -v
python scripts/reference_via_node_checkpoint.py
```

The full regression suite, prior selector/segment/source checkpoints and frozen
2,508 costs remain checked. No graph cap, source identity, public map or #137
approval gate changes. Zero connectors are approved. Real road weights, complete
restriction/incident-road accounting, independent anchor/access evidence,
exterior closure, geographic masks and release artifacts are still required.

Source OSM data © OpenStreetMap contributors, ODbL.
