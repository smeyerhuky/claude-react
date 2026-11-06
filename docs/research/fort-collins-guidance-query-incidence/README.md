# Source incidence around the focused guidance query

Original Colorado source enumeration now covers all 19 raw nodes of the focused
Jefferson Street two-way model. Only one was a seed in the earlier 40-node
source corpus; 18 gain explicit source incidence here. The bounded extractor
retains every incident way without spatial, highway or access filtering, its
full raw geometry/node/tag records and every touching restriction/connectivity
type or namespace. Source size/SHA is checked before, between and after passes.

The ten incident ways expose two restrictions. Four explicitly requested full
member ways complete those restrictions and expose a third. The resulting
snapshot contains 14 ways, 58 complete member nodes, all three controls and no
missing control members. Every raw record shared with the retained original
corpus remains exactly equal. Two footways remain in the source snapshot and
are explicitly outside the declared car road classes.

All 12 in-class roads and all three supplied controls compile atomically into a
declared model with 45 nodes and 65 directed arcs. No unknown supplied control
is omitted. The separate larger candidate containing the unknown Tenney Court
bollard remains unsupported; this snapshot does not modify or approve it.

Across the earlier 19-node universe, each metric has 361 ordered pairs. Finite
results increase from 154 to 246: **92 previously local NoData pairs gain paths
per metric**. All previously finite costs remain exactly unchanged. The original
focused no-left-turn test stays unreachable within this expanded universe.
The old reports remain frozen; new witnesses explicitly distinguish their old
local result from the expanded local result. All 4,050 expanded node-pair/metric
queries are checked against an independent history-graph oracle.

This is source incidence at 19 named nodes, not geographic closure. The snapshot
has **39 unenumerated outer member nodes** (including outside-class geometry).
Physical/grade/lane connectivity, actual legal access, exterior competitors and
geographic masks remain unverified. Finite modeled paths and local NoData do
not establish public road access or geographic disconnection. No reviewed anchor
is adopted, no connector is approved and #137 remains intact. Public straight-line
map, older inspector views and all 2,508 frozen Census costs remain unchanged.

```sh
python -m unittest discover -s scripts -p test_fort_collins_guidance_incidence.py -v
python scripts/fort_collins_guidance_incidence_checkpoint.py
python scripts/fort_collins_guidance_query_incidence.py --osm ORIGINAL_COLORADO_PBF --output /tmp/source-context.json
cmp /tmp/source-context.json docs/research/fort-collins-guidance-query-incidence/source-context.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The report binds source identity, source records, frozen parents, implementation
and the fixed scenario. Original OSM-derived records are attributed to
OpenStreetMap contributors under ODbL. No source PBF, private source archive or
environment configuration is retained here.
