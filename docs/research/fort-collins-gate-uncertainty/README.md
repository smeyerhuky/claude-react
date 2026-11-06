# Opaque gate: conditional stored-cost bounds

The wider 82-road candidate remains unsupported at original gate node
8917794983 on Old Firehouse Alley way 201855578. Its tags, complete geometry and
unknown operating status stay unchanged. This diagnostic answers a narrower
question: can that uncertainty change the two retained query costs inside the
supplied finite model?

Start with 606 strict-supported arcs and all 12 active known maneuver patterns;
the thirteenth declaration is retained and inactive at the fixed scenario instant.
Validate each earlier 54-road witness against these supported arcs, exact
endpoints, maneuver sequences and unchanged immediate-reversal policy. That
witness supplies an upper bound. Add 12 explicitly hypothetical possibilities
along the opaque way's adjacent raw geometry, in both directions, using stored
spherical segment lengths and **zero time**. These relaxations supply lower
bounds, with no assumption about speed or gate operation. They are never legal
permissions, feasible routes, connectors or edges admitted by the strict API.

For both retained queries, lower and upper bounds are exactly equal as rational
sums of stored weights. Neither optimistic minimizing walk uses hypothetical
geometry. The distance cost remains approximately **219.361325 m**; the separate
fastest-time cost remains approximately **34.146758 s**. The witnesses differ.
`report.json` retains exact fractions, witness hashes, source/code fingerprints,
the hypothetical geometry catalogue and the unresolved strict parent.

The result is conditional on exactly this finite geometry universe: supported
arcs/weights, known maneuvers, endpoints, start history and reversal policy remain
unchanged; opaque controls can remove hypothetical arcs or add nonnegative costs;
unknown distance cannot fall below stored geometry and unknown time is nonnegative.
Additional roads, attachments, connectors or restrictions affecting the supported
witness are outside that domain. A synthetic counterexample demonstrates why
new geometry invalidates the claim. No global optimality or geographic closure
is certified; **436 outer source nodes remain unenumerated**. The wider strict
graph remains unsupported and no ordinary query result is returned.

`source-observations.json` records three live primary-source checks, their body
fingerprints and short excerpts. [DDA West](https://downtownfortcollins.com/alley-project/old-firehouse-alley-west)
and [DDA East](https://downtownfortcollins.com/alley-project/old-firehouse-alley-east-and-seckner-alley)
describe alley design; [City parking guidance](https://www.fortcollins.gov/Services/Parking/Where-to-Park)
describes garages. None establishes operation or ordinary-car access at this
exact gate. Raw way endpoints attach to Walnut Street and another Old Firehouse
Alley way; that topology does not identify a garage entrance or establish a match
to either design project's extent. Full page bodies stay outside the repository
and artifact. No field evidence or independent access approval is claimed.

```sh
python -m unittest discover -s scripts -p test_road_opaque_control_bounds.py -v
python -m unittest discover -s scripts -p test_fort_collins_gate_bounds.py -v
python scripts/fort_collins_gate_bounds_checkpoint.py
python scripts/fort_collins_partition_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Tests compare exhaustive small completions and sampled actual-model completions
against a separate history-based oracle. They also reject unknown maneuver
members, hypothetical witness arcs, nonzero time lower bounds, invalid costs,
broken geometry and promoted municipal context claims. Read-only CI checks the
frozen report and old costs; retained parent workflows reproduce original source
captures. Only derived records, short observations and documentation are uploaded.
OSM-derived records are attributed to OpenStreetMap contributors under ODbL.

The fixed 2026-10-28T18:00:00Z scenario, all older reports, public straight-line
map, inspector views and 2,508 Census costs remain unchanged. Zero connectors
are approved and no anchors adopted. Independent access evidence and a different
release approver under #137, geographic/competitor/mask checks under #138 and
public assets/UI release under #139 remain required. This change completes no
metro or state and does not activate the public road tab.
