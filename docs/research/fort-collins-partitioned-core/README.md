# Two bounded source partitions and an unresolved gate

The next known-graph selection has 177 source nodes. A single original-source
capture reaches its unchanged 100-way guard and returns no partial snapshot.
Retain the audited 96-node capture and enumerate the 81 complementary nodes in
a second capture. The two snapshots contain **76 and 79 full ways**, respectively,
each below the original limit. A separately bounded reconciliation accepts at
most two captures/200 raw ways while retaining the 2,000-node/100-control union
limits. It does not change the original capture or road-compiler limits.

Reconciliation requires identical original-source identities, exact shared raw
way/node/control records, consistent incidence at every seed and every touching
control in each applicable partition. It retains complete geometry and tags,
outside-class ways, explicit missing/nested members and immutable input records.
It never merges tag dictionaries, trims ways or resolves conflicts by choosing
one snapshot. Each input must separately reproduce against the exact original
source; the reconciliation helper itself does not re-read that source.

The reconciled context contains **123 ways, 613 nodes and 13 controls** at 177
enumerated source seeds. The second capture explicitly completes member way
179738363; four other missing local member references resolve from the retained
first capture. All union member identities are present, and all thirteen
restriction declarations compile individually. There are 436 unenumerated outer
source-member nodes. Forty-one outside-class ways remain explicit.

The 82-road/353-node candidate stays **unsupported**. Node **8917794983**, on
Old Firehouse Alley way **201855578**, retains the original `barrier=gate` tag.
The raw tags do not establish ordinary-car operation at the fixed instant.
The gate is neither assumed open nor closed; its road is not removed or
reclassified to force support. Although 81 other roads yield 606 individual
weighted arcs, no partial graph, query answer or modeled NoData is returned.
The previous 54-road model and all earlier frozen reports remain unchanged.

`report.json` includes the exact gate record, full member way and unresolved
review status. It is a source-context packet, not field evidence or approval.
Independent operation/access evidence is still required before the wider model
can be admitted. No anchor is adopted, no connector approved and #137's
independent access-evidence gate remains intact.

```sh
python -m unittest discover -s scripts -p test_road_source_partition_union.py -v
python -m unittest discover -s scripts -p test_fort_collins_partitioned_core.py -v
python scripts/fort_collins_partition_checkpoint.py
python scripts/fort_collins_partitioned_core.py --osm ORIGINAL_COLORADO_PBF --output /tmp/new-node-source-context.json
cmp /tmp/new-node-source-context.json docs/research/fort-collins-partitioned-core/new-node-source-context.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Synthetic tests cover missing members completed across partitions, shared-record
conflicts, omitted incidence/touching controls, nested and unknown namespaces,
unchanged per-capture limits, aggregate rejection, immutable input/output and
geometry. Actual-source mutations preserve the gate and verify atomic rejection.
Read-only CI reproduces both captures through the current and retained workflows,
verifies the frozen parents and old 2,508 Census costs, and retains only derived
source/report/docs. No source PBF, private archive or environment configuration
is published. Geographic closure, all competitor/mask work and public release
remain unresolved; the public straight-line map and older inspector views do not
change. OSM-derived records retain attribution to OpenStreetMap contributors
under ODbL.
