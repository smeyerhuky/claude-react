# Bounded remaining-Utah competitor comparison (#138)

This research adds Logan (30860), Ogden (36260) and Salt Lake City-Murray (41620)
to the same exact four-state graph used by #180. The source inventory is national;
these three additions do not establish geographic completeness. Logan's UT-ID
identity is not fully covered merely by having Utah roads.

Each experiment retains all fifteen existing source leads and native Census
origins and adds exactly one new unapproved nearest-primitive-vertex lead. The
existing 16-source engine cap and 15-million-node/40-million-arc graph limits
remain unchanged. The graph is built once from the four checksum-pinned PBFs;
no roads are appended, removed or reweighted between source batches.

## Why bounded results can be combined

A source-to-probe shortest-path cost depends on the graph, direction, metric and
that source's lead; it does not depend on which other source labels are evaluated.
The combined minimum can therefore be taken over the union of three batches,
but only after verifying a shared graph and scenario. The combiner checks the
complete graph report, all probe coordinates and directed metric cases, native
source/lead records, units, inventories and research-only flags. Same-graph cut
audits must preserve all 29,599,286 directed pairs with zero new boundary ports
and no cheaper arcs. This does not close the four-state graph's unknown exterior.

All 900 baseline costs are freshly reproduced in each batch. Every repeated
source option must agree exactly between batches; missing/duplicate cases,
changed graph/lead/costs, exclusions, certification flags or inconsistent replay
counts fail. A synthetic test compares the union with both a joint run and
independent NetworkX Dijkstra, including unreachable results and ties; deliberate
mismatches are rejected. The combiner is bounded to three additions; it does not
remove the existing per-experiment cap or provide an unbounded national solver.

The union records 1,080 distinct source/metric/direction/probe costs over eighteen
unapproved sources and the original sixty cases. Counters distinguish those
unique costs from 2,880 batch evaluations, 2,700 repeated baseline checks and the
actual finite-path replays. An unreachable path is not counted as replayed. New
sources' uncomputed prior-prefix costs are labeled separately from known
unreachable old-source costs.

## Reference and reproduction

`research/utah-batch-reference/baseline.json` retains the complete #180 report
from passed source CI run 40716527174, job 122915627722, code head
`ef7ca991578f2785df33f3b5500c7e088bc1ee44`. Its manifest binds the report SHA256,
all four exact PBF metadata records and the existing complete Census domains.
This is reproducibility evidence, not independent ground truth or access evidence.
OpenStreetMap data is © OpenStreetMap contributors, ODbL; Census inputs retain
their documented official provenance.

```sh
python scripts/colorado_utah_bounded_competitors.py \
  --metros public/data/metros-census-2025.csv \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
    local-data/arizona.osm.pbf local-data/utah.osm.pbf \
  --output utah-bounded-competitors/report.json
```

The dedicated workflow verifies the exact dated input bytes (read-only retained
archive first, checksum-pinned provider fallback), reconstructs the graph and
runs all three batches. It publishes a short-lived research artifact, never a
release-eligible region or a production connector. Exact source recovery remains
in the existing **unpublished** archive; no new raw inputs are needed.

Eighteen modeled identities leave 349 qualifying identities unrepresented,
with zero exclusions. No connector costs are included. The raw polyline leads
in [the prior investigation](colorado-utah-exterior-competition.md) remain a
different geometry diagnostic from nearest primitive vertices: notably Ogden's
closest mapped highway is private. No origin is relocated or access certified.
Public straight-line mode and #137's independent reviewer/separate approver gate
remain intact. Texas/Oklahoma roads, exterior closure, arbitrary destinations,
land/water/datum completeness, turns/grade and independent golden evidence remain
unresolved; sampled winner agreement would not discharge those obligations.
