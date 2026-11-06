# Static lane indication metadata

The versioned road permission profile retains Jefferson Street way 140486410's
original `turn:lanes:backward=left|through` as two driver-facing indication rows.
Both raw road directions are permitted by the existing road-level car model.
The arrows create no turn permission or prohibition. Restriction 10475907 remains
in the complete source corpus and requires separate maneuver compilation under
this profile before any route can be produced.

This is an explicit road-level abstraction. It does not evaluate legal lane
occupancy, lane changes, lane-specific access/speed/HOV rules, dynamic indications
or connectivity relations. Those controls remain unsupported. Empty/`none`
indications mean no indication, and backward lane rows retain their driver-facing
order. Only bounded explicit static integer counts and a narrow indication
grammar are accepted. Unknown or conflicting values reject the projection.

The implementation checks the original full raw records without removing tags.
It retains all historical geometry, tag-budget, conditional, access, direction,
node, barrier, dimensional and other control guards. The immutable historical
profile and all its frozen reports remain unchanged. The new source-bound
checkpoint classifies 34 roads as supported permission projections, 13 ways
outside declared road classes and one road with an unknown removable bollard.
These are permission projections, not weighted arcs or routes.

`semantic-sources.json` records the primary OSM tagging documentation and narrow
observations used for the grammar. It supplies no independent access evidence.
The checkpoint binds the original 48-way/175-node source corpus, its frozen
parent, fixed scenario, semantic notes and implementation hashes.

Run:

```sh
python -m unittest discover -s scripts -p test_road_static_lane_guidance.py -v
python scripts/fort_collins_guidance_checkpoint.py
python scripts/fort_collins_control_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

No graph or route is returned. All ten source controls remain retained; their
composition under the new profile is unfinished. The bollard remains unknown,
135 outer nodes remain unenumerated and lane connectivity is not established.
Zero connectors are approved, no anchors are adopted and #137's independent
access-evidence gate remains intact. Public-map behavior and older inspector
views do not change. Original OSM-derived records are attributed in the parent
corpus to OpenStreetMap contributors under ODbL.
