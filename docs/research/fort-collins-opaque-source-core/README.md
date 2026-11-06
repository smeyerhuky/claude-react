# Expanded source inspection with unresolved controls

The earlier opaque-gate bounds select the next source-inspection nodes without
assuming gate operation. Saturate relaxed cost prefixes for both metrics, keeping
ties and zero-time hypothetical gate geometry. This selects **247 nodes**, 70
more than the prior 177. Selection is confined to the supplied geometry and
chooses where to inspect; it does not admit a graph or certify coverage.

The declared layout divides these nodes between **two replacement captures**,
with 156/91 seeds and 94/95 full raw ways. Each uses the unchanged 100-way,
2,000-node and 100-control capture limits and requests the same seven explicit
member ways. Reconcile only those two captures under the existing two-input,
200-raw-way union contract. Shared records must match exactly. All earlier
whole raw ways, nodes and control declarations are preserved unchanged.

The result contains **152 raw ways, 799 nodes, 15 controls and 96 candidate road
ways**. All referenced members are present. There are 552 unenumerated outer
source-member nodes; growth of that count reflects additional retained whole
geometry, not an assertion of closure. Ninety-four roads yield individual weights.
Two remain unsupported: original gate way **201855578**, and Cherry Street link
**1216151141**, whose original whole-way `turn=right` indication remains intact.
No unknown road is excluded or treated as permitted.

Fourteen declarations compile individually. Relation **11978581** remains
unsupported: its `no_left_turn` declaration runs from Jefferson Street way
880882424 via node 51123941 to Chestnut Street way 1216151139. Chestnut's raw
`oneway=yes` runs toward that endpoint, so this declared departure is against
the modeled direction. The existing compiler rejects that transition. The
reverse `only_right_turn` declaration **11978582** remains explicit and compiles.
No relation is discarded, rewritten or automatically deemed redundant. The
report retains the rejected declaration and both complete member ways for review.

**The wider graph and wider cost brackets remain blocked.** Earlier equal
brackets concern their earlier finite universe and are not extended to these new
ways or controls. No partial route, fallback or modeled NoData is emitted.
Additional compiler work must account for every retained control before a new
bound can be claimed. All physical/legal access remains independently unverified.

```sh
python -m unittest discover -s scripts -p test_fort_collins_opaque_source_core.py -v
python scripts/fort_collins_opaque_source_checkpoint.py
python scripts/fort_collins_opaque_source_core.py --osm ORIGINAL_COLORADO_PBF --partition 0 --output /tmp/source-partition-0.json
python scripts/fort_collins_opaque_source_core.py --osm ORIGINAL_COLORADO_PBF --partition 1 --output /tmp/source-partition-1.json
cmp /tmp/source-partition-0.json docs/research/fort-collins-opaque-source-core/source-partition-0.json
cmp /tmp/source-partition-1.json docs/research/fort-collins-opaque-source-core/source-partition-1.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Read-only CI reproduces both captures against the exact original Colorado source,
checks frozen parents and all 2,508 Census costs, and uploads only derived source,
layout, report and documentation. Tests reject missing inspection nodes, shared
record conflicts, omitted controls and promoted layout claims. No PBF, private
archive, environment configuration or full municipal page body is published.
OSM-derived records are attributed to OpenStreetMap contributors under ODbL.

The fixed October 28 scenario, public straight-line map, older inspector views
and earlier reports stay unchanged. Zero connectors are approved, no anchors
adopted, and no metro or state is completed. Independent access evidence and a
different release approver (#137), coverage/competitor/mask checks (#138) and
public assets/UI release (#139) remain required.
