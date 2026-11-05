# Fixed-reference selection of one raw via-node car rule

This research layer determines which supported raw restriction value applies to
one structurally declared via-node relation for the fixed solo-private-car
scenario. It does **not** compile geometric turn transitions, establish general
turn permission, solve routes, emit costs or approve access. The unchanged
Fort Collins review, legacy graph profile and frozen 2,508 costs remain separate.

The retained actual example is Colorado relation **20193102**:

```text
from way 696728766 → via node 6543050322 → to way 1475543490
restriction:conditional = no_u_turn @ (Th-Sa 19:00-00:00)
```

There is no static `restriction` tag. At the adopted **2026-10-28 18:00 UTC**
reference, the declared Denver clock is Wednesday noon MDT, outside that window.
The selection is `applies=false`, with the missing raw base remaining **null**.
The explicit bounded policy is *no rule from this relation when no supported
clause or applicable static value exists*. This does not erase the relation,
invent a raw base, permit a U-turn, account for other restrictions, or override
the existing maneuver policy. All those questions require separate contracts.

The [OSM relation documentation](https://wiki.openstreetmap.org/wiki/Relation:restriction)
describes conditional restrictions as existing under their stated conditions.
[Conditional restriction precedence](https://wiki.openstreetmap.org/wiki/Conditional_restrictions#Evaluation_of_conflicting_restrictions)
governs selection: `restriction:motorcar` takes precedence over
`restriction:motor_vehicle`, then generic `restriction`. A same-key active
conditional overrides its base, and its last matching clause wins. An inactive
more-specific conditional without a base can fall back to an applicable less
specific value. Unsupported syntax anywhere in the car-relevant context cannot
hide behind a more specific value or an exception.

## Bounded scope and failure behavior

The complete supplied relation must have exactly one positive from-way, one
positive via-node and one positive to-way. This structural check does not verify
that any of those ways/nodes are geometrically connected, traversable or on the
same grade. Via-way, extra/missing/duplicate-role membership, lane context,
unknown kinds and legacy timing fields are unsupported here. The eight existing
bounded `no_*`/`only_*` kinds are supported; `none`, `no_entry` and `no_exit` need
separate contracts and are not guessed.

Known simple car-class exceptions can make this one relation inapplicable;
the selected raw value is still retained. Known non-car exceptions do not exempt
the ordinary private car. Purpose/permit exceptions, conditional exceptions,
unknown modes, extra access/occupancy/dimensional/schedule context and unsupported
holiday/weather conditions reject the selection. More general OSM tagging may
be meaningful but remains outside this version's supported scope.

Every conditional relation requires its own explicit valid IANA zone with pinned
tzdata 2026.5 / IANA 2026e. No host, state or way-zone fallback is used. Geographic
zone assignment is still unverified. Unsupported output has `applies=null` and
no selected value; it is distinct from a resolved but inactive relation. No
partial applicability or routing result is returned. Raw tags/members are never
deleted or changed; exact inputs and scenario are hashed.

## Verification and source binding

The source context and its frozen parent report were reproduced from the exact
original Colorado PBF in PR #245. This checkpoint binds both hashes, the scenario
and relevant implementation hashes. It leaves that parent's
`conditional_maneuver_evaluated=false` history unchanged; this is a separately
versioned selection experiment, not a relabeling of previous outputs.

Fourteen tests cover the actual conditional-only relation, exact start/end
boundaries, car-mode precedence, static fallback, last matching clause,
exceptions, explicit zones, unsupported controls, structural/budget errors,
hashes and input mutation. The frozen report additionally retains six boundary
regressions. Their alternative instants are tests, not new adopted map scenarios.

An independent **opening_hours 3.15.0** interpreter compares all **10,080** minute
positions of a local-clock week against the selector for the actual retained
Thursday–Saturday schedule. The driver verifies exact raw-context identity,
expression, relation ID, absence of a static base and complete expected bits.
Its supplied wall clocks are treated as UTC clock components solely for schedule
comparison; this is not an elapsed-time route, geographic/timezone proof or an
independent legal-access audit.

```sh
python -m unittest discover -s scripts -p test_road_reference_turn_rules.py -v
python scripts/reference_turn_rule_checkpoint.py
python scripts/reference_turn_rule_checkpoint.py --oracle-fixture /tmp/turn-week.json
TZ=UTC NODE_PATH=/path/to/opening-hours/node_modules node scripts/check_reference_turn_rule_oracle.cjs /tmp/turn-week.json
```

CI runs the independent weekly comparison, parent/way/segment checkpoints and
unchanged frozen costs. The full regression workflow also covers future
reference-profile changes. No connector, anchor, geographic coverage or public
road layer is adopted; #137's independent evidence and different approver remain
required. Source OSM data © OpenStreetMap contributors, ODbL.
