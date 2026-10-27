# Conditional competitor bounds (#138)

`metro_competition_bounds.py` provides a conservative way to screen a national
source inventory without routing every source in every destination tile. It is
research tooling: **no source is actually removed and no certificate is issued**.
`colorado_competition_bound_audit.py` checks those bounds against the independent
real-data directed-route audit, preserving all 359 qualifying CBSA identities.
Unknown origins remain unknown; a geographic representative point is never
silently substituted for an approved road origin.

## Inequality and assumptions

For the same radius-6,371,000m spherical geometry as the current road model,
let the source-domain center and destination-domain center have coordinates in
degrees. Let `d_lon` be their longitude separation wrapped into [0,180]. A
conservative lower bound between centers is the larger of:

* `R * 3.14 * abs(delta_lat) / 180` (meridional variation is no longer than a
  spherical path, and 3.14 is less than pi).
* `2 * R * (1 - max(abs(lat1),abs(lat2))/90) * d_lon/180` (the horizontal
  spherical chord is at least this large).

For the second bound, horizontal radii are `R*cos(lat)`; their chord separation
is at least `2*min(radius1,radius2)*sin(d_lon/2)`. Concavity gives
`cos(lat) >= 1-abs(lat)/90` and `sin(d_lon/2) >= d_lon/180`. This is deliberately
weaker than a great-circle calculation and works at the poles and date line.

Subtract the source and destination domain radii, then clamp to zero. Triangle
inequality makes the result a lower bound for **every** pair of permitted
endpoints. Distance costs must dominate the same spherical geometry along the
entire route. Time costs must additionally obey a *global* speed ceiling,
including exterior roads and connectors; divide the length bound by that speed.
The comparison is strict: a source can only be conditionally screened when its
lower bound exceeds a feasible incumbent upper bound plus the chosen margin.
Version 2 preserves Python float inputs as their exact stored binary values;
explicit decimal strings, integers and rational inputs retain their exact
semantics. All bound arithmetic and comparisons use rational operations.
Display floats do not determine screening decisions. Converting a float via
`Fraction(str(value))` would substitute a nearby decimal endpoint: for adjacent
binary floats at latitude 40 degrees this previously inflated the rational
lower bound to 1.111e-9 m, above even a 7.901e-10 m upper bound on the spherical
meridian distance. Regression tests use the independent rational inequality
`pi < 355/113` to reject this failure at tiny separations and ensure the source
remains a possible competitor. This fixes numerical input interpretation; it
does not establish datum alignment, modeled-cost domination or legal access.

These are conditional mathematical statements, not proof that a particular
origin envelope, incumbent route, floating-point graph model or global speed
ceiling satisfies the assumptions. An unapproved off-road connector cannot be
ignored to invent a feasible full incumbent. An unknown origin domain or unknown
time ceiling prevents screening. Equal costs remain competitors. Directed
restrictions can increase route cost or make a route unreachable; they cannot
invalidate a geometric lower bound if the cost-domination assumptions hold.

## Real-data validation and scaling scope

The audit uses only the three fixed, unapproved baseline **graph vertices** as
zero-radius origins. Source selection coordinates and their snap offsets are
not those origins. All 356 other metros have unknown origin domains, and none
is conditionally excluded. Probe destinations are fixed graph vertices too.
Both graphs, both metrics, both orientations and all six probes are checked:
144 independently calculated source-route costs must exceed their corresponding
lower bounds. The audit also rejects inventory, model, probe and cost mismatches.
The assumed 140km/h ceiling caps this static road model; it does not establish a
speed bound for unmodeled connectors, exterior data or real travel.

The output retains exact inventory IDs, source-data hashes, the input audit hash,
unknown origin IDs and the rational bounds. `applied_source_exclusions` stays
empty, and global/access/release certifications stay false. This is not a
complete competition map. It establishes a reusable conditional calculation
and measures it on actual OSM routes without making a product choice about
metro origins.

To apply screening, separately discharge the [coverage and origin contracts](colorado-coverage-acceptance.md),
provide justified endpoint domains and a feasible full incumbent, prove model
cost domination and the time ceiling, and independently validate boundary/cut
arcs and geographic masking. The bounds alone cannot prove a clipped graph
complete, identify inaccessible metros, or satisfy #137/#139.
