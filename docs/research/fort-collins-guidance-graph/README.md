# Atomic admission of a declared guidance graph

The graph compiler validates every supplied complete raw way, node and control
before returning a bundle. It uses the static-guidance road permission/weight
profile, the new via-node compiler, the unchanged strict static via-way compiler
and the existing maneuver-history solver. Missing, conflicting or unsupported
supplied controls reject the entire bundle. The query API compiles afresh from
raw records and returns no weight-only fallback or partial result on rejection.

The complete retained in-class candidate has 35 roads and ten controls. Original
way 815164359's removable bollard remains unsupported, so the checkpoint records
an actual rejected compilation **and** rejected query with no graph or answer.
It never removes that road to claim that the complete candidate is routable.
Thirteen outside-class source ways remain retained in the parent source corpus.

The focused two-member universe compiles with its independent no-left-turn
restriction. Its protected results match the previous checkpoint exactly. All
722 node-pair/metric queries through the new raw-input API match an independent
history-graph oracle. Synthetic mixed via-node/static-via-way cases also match
the oracle, while unsupported controls, duplicate members, conflicting only
rules, unknown lane controls, coordinate disagreements, extra feature clocks
and missing context reject before any graph is returned. Static via-way members
with lane indications remain unsupported by that stricter profile.

```sh
python -m unittest discover -s scripts -p test_road_guidance_mixed_graph.py -v
python scripts/fort_collins_guidance_graph_checkpoint.py
python scripts/fort_collins_guidance_maneuver_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Admission establishes only the internally modeled supplied universe. It does
not establish all incident ways, exterior competitors, geographic masks, grade,
lane links or actual physical/legal access. Fixed scenario and scalar speed
assumptions remain unchanged. Node starts have no prior approach and immediate
same-way reversals require explicit pairs under the existing solver policy.
No connectors are approved, no anchors are adopted and #137 remains intact.
Public map, all previous inspector views and frozen reports remain unchanged.
Original source records retain the parent attribution to OpenStreetMap
contributors under ODbL.
