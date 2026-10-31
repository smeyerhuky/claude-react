# Bounded weekly-clock conditional values at the declared reference

The fixed reference scenario now has an isolated **raw tag-value resolver** for
explicit weekday sets/ranges and daily clock intervals. It supports multiple
daily intervals, midnight carry from the previous selected weekday, whole days
and clock-only expressions. Starts are inclusive and ends exclusive. Repeated
matching outer value-condition clauses use the last matching value.

These rules follow the community's
[conditional tagging scheme](https://wiki.openstreetmap.org/wiki/Conditional_restrictions)
and [weekly/opening-hours conventions](https://wiki.openstreetmap.org/wiki/Key:opening_hours).
They describe OSM tag syntax, not independent evidence of physical or legal access.
The parser deliberately handles a bounded subset, not the complete language.

All clauses are parsed before evaluation: an earlier matching clause cannot hide
a later unknown condition. Holidays, calendar/date selectors, weather, purpose or
vehicle tests, nested/compound conditions, extended-hour clocks and unsupported
syntax reject the whole expression. Equal clock endpoints also reject; a full day
must be explicit. Missing inactive base values stay missing, never become yes.

Evaluation uses the canonical scenario SHA-256, exact declared timezone package
and an explicit IANA zone. UTC is converted to the local clock; there is no host
clock/timezone fallback, arrival-time reevaluation or waiting. Unknown timezone
assignment remains unsupported. Input, clause, weekday-term and interval budgets
reject without partial resolution.

## Retained Arizona example and limits

Way437327483 in the exact retained Arizona via-way context has an explicit
motor-vehicle base value and weekday peak-hour conditional exclusion. At the
declared reference, Phoenix's clock is11 a.m., outside those intervals, so the
**single raw motor_vehicle value** resolves to its base. Peak-window test instants
resolve to the conditional value instead.

That is **not a solo-car access decision**. Transport-mode hierarchy, directional
and lane rules, HOV/purpose applicability, physical rights and other controls must
still be composed separately. The raw tags remain unchanged, the strict via-way
compiler still rejects that source context, and no route cost is emitted. No
existing source, endpoint, graph filter or frozen cost is changed or relabeled.

Nine tests cover the actual retained tag, precise boundaries, different local
clocks at one instant, overnight/day wrapping, last-match behavior, missing bases,
all-or-nothing unsupported clauses, budgets, repeated/skipped DST clocks and
unchanged compiler rejection. An independent opening_hours@3.15.0 implementation
also checks **30,240 synthetic weekly minute states**, using full wall-clock
schedules rather than this parser's implementation. This is an independent
scheduler oracle, not an independently audited real-world routing golden.

```sh
python -m unittest discover -s scripts -p test_road_reference_conditionals.py -v
python scripts/road_reference_conditionals.py --oracle-fixture /tmp/conditions.json
TZ=UTC NODE_PATH=/path/to/isolated/node_modules node scripts/check_reference_condition_oracle.cjs /tmp/conditions.json
```

Every output retains false access/release flags. #137's independent evidence and
different-approver gate remains intact; zero connectors are approved. The public
straight-line map and all older research inspectors remain unchanged. The future
road tab still needs complete applicability/lane semantics, approved anchors and
connectors, masks, exterior/competitor closure, real-world goldens and trusted assets.
