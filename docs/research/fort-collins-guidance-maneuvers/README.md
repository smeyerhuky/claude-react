# Independent maneuver restrictions with static guidance

The new via-node compiler retains original lane indications while separately
compiling the raw no-left-turn relation 10475907:

`raw:140486410:8:forward` → `raw:322900293:0:forward`.

All ten retained restriction declarations now compile individually from complete
members. Via-node declarations use the explicit static-guidance road profile;
static via-way declarations retain the unchanged stricter historical compiler,
which still rejects lane-bearing members. This checkpoint does not compose a
full geographic graph. The complete corpus remains blocked by the unknown
removable bollard, and none of its controls is omitted to produce a graph.

The road profile projects 169 weighted arcs across 34 supported roads. Every old
supported arc retains its exact geometry, speed and weights; Jefferson Street
adds 18 adjacent directed arcs. Scalar weights use the frozen distance/speed
policy. Indications impose no maneuver permissions or prohibitions and supply no
lane links, lane changes, occupancy or physical access evidence.

The focused replay declares only the two member ways, 19 nodes and 27 arcs.
Applying the independent restriction makes the tested approach-to-departure
query unreachable **within that supplied universe** for both metrics. A negative
control intentionally omits the restriction to demonstrate that the prohibited
two-arc sequence would otherwise be chosen. Its costs are test diagnostics,
never a permitted route claim. Starting at a node imposes no prior approach;
same-way immediate reversals require explicitly declared pairs, as in the parent
solver. All 722 node-pair/metric queries in the restricted focused universe are
checked against an independent history-graph oracle.

The implementation follows the frozen via-node geometry contract in a separately
versioned compiler. It checks original full records and never strips lane tags
to force them through the historical profile. Missing or unknown node/way/control
context rejects the complete declaration before an arc pattern is emitted.

```sh
python -m unittest discover -s scripts -p test_road_guidance_maneuvers.py -v
python scripts/fort_collins_guidance_maneuver_checkpoint.py
python scripts/fort_collins_guidance_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

This checkpoint binds the frozen original-source parent, fixed scenario, cost
policy and implementation. All outer-node incidence, competitor/exterior closure,
geographic masks, physical lane connectivity and independent access gates remain
unfinished. Zero connectors are approved and no anchors adopted. Public map and
all older inspector views remain unchanged. Original OSM-derived records retain
the parent corpus attribution to OpenStreetMap contributors under ODbL.
