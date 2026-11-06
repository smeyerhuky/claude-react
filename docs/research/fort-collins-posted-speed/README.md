# Separate numeric posted-sign speed profile

This version accepts only the literal static `maxspeed:type=sign` annotation,
requires an explicit valid numeric base `maxspeed`, and retains both original
tags. It creates no speed value from metadata. When `source:maxspeed` is also
present, it must agree with `sign`. Unknown, contextual, electronic, construction,
conditional or directional type namespaces remain unsupported. Node speed
control extent still requires a separate contract. Every explicit numeric speed
is validated, including overridden or denied directions; all original geometry,
permission, conditional, lane, node and physical-control guards remain in force.

The primary [OSM type documentation](https://wiki.openstreetmap.org/wiki/Key:maxspeed:type)
describes `sign` as a numeric posted-limit type. The
[source documentation](https://wiki.openstreetmap.org/wiki/Key:source:maxspeed)
describes its role in recording the origin of a separate speed value. The narrow
derived observations are frozen in `policy.json`. They are tagging semantics,
not independent field verification of a sign, legal advice or access evidence.

The immutable strict profile and its frozen source-frontier report still reject
Maple Street's `maxspeed:type`. The new version uses the original complete source
records and validates this annotation explicitly, without stripping tags or
passing filtered copies to the strict profile. It retains the same numeric units,
distance/speed model, directional precedence and fixed scenario. All 165 old
supported weighted arcs remain exactly equal; Maple Street adds ten arcs.

All 32 supplied roads, 121 road nodes, 175 directed arcs and nine original
restrictions now compose under the new profile. The previous strict parent
remains unsupported. The original query gains an 11-arc modeled detour around the
independent no-left-turn: approximately 219.361325 metres and 39.261891 modeled
free-flow seconds. These are the outputs of the supplied model, not navigation
instructions, observed driving times or globally optimal geographic costs.
Intersection/traffic delays, actual legal access and physical lane links remain
unverified. All 4,050 ordered pair/metric queries among the preceding 45-node core
and 242 source-to-node/metric queries match an independent history-graph oracle.

```sh
python -m unittest discover -s scripts -p test_road_posted_speed.py -v
python scripts/fort_collins_posted_speed_checkpoint.py
python scripts/fort_collins_guidance_frontier_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The checkpoint binds the exact original source, frozen strict parent, fixed
scenario, semantic/numeric policy and implementation. Source enumeration covers
only 45 named nodes; 124 outer source-member nodes remain unenumerated. No global
speed ceiling, geographic closure, physical/legal access, approved connector,
reviewed anchor or public release is certified. The separate bollard candidate
remains unsupported. Public straight-line map, older inspector views, previous
reports and all 2,508 Census comparison costs remain unchanged. OSM-derived
records retain the parent attribution to OpenStreetMap contributors under ODbL.
