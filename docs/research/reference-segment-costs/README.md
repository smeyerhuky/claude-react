# Fixed-reference raw adjacent-segment weights

This bounded model adds a distance and modeled free-flow time to each permitted
adjacent raw segment. Complete member-node/way permissions remain required.
It does not construct a complete geographic graph, solve a route, adopt an
anchor, cost a connector or certify legal/physical access. Zero connectors
are approved. The public map and protected 2,508 historical costs are unchanged.

## Explicit cost model

`policy.json` records the assumptions independently of the adopted fixed-time
vehicle scenario. Distance is the shortest spherical surface arc between each
pair of consecutive raw vertices, using radius 6,371,000 m, without elevation.
The computation uses a stable cross/dot central angle, including dateline and
near-antipodal cases. It does not replace a curved multi-vertex road with one
endpoint chord. Same-location segments are unsupported, including equivalent
dateline/pole coordinates. Stored weights are binary64 values; the existing
solver's exact stored-weight arithmetic remains a separate contract.

Static `maxspeed:forward`/`maxspeed:backward` override static `maxspeed` for the
corresponding original OSM vertex orientation. Supported values are positive
ASCII decimals (up to three digits and three fractional places), optionally
followed by ` mph`, ` km/h` or ` kph`; a bare number means km/h. mph conversion
uses exact factor 1.609344. The supported domain ends at 160 km/h: out-of-domain
values are rejected, never clamped. **160 is not a certified global speed bound**
and cannot justify a geographic escape/closure certificate.

If no supported explicit limit exists, the model uses the highway-class speeds
already used in the historical research builder: e.g. residential 30 km/h,
service 15 km/h, secondary 55 km/h and secondary_link 30 km/h. These are declared
model assumptions, not raw posted limits or independently established operating
speeds. Defaults and all supported classes appear in the policy file. No claim
is made that results are conservative or upper/lower bounds on actual times.

Every supplied speed is validated, including overridden or prohibited directions.
Unknown speed syntax/namespaces, conditional/dynamic/lane/advisory/mode-specific
speed controls and node speed-control extents are unsupported without fallback.
The unchanged parent permission grammar also rejects unsupported conditionals.
Surface, acceleration, intersection/turn delays, congestion and elevation are
not modeled. A posted limit is used as modeled speed, not predicted attainable
or lawful speed under every physical condition.

## Frozen actual-source examples

Five selected ways from the retained full Fort Collins source context yield
15 weighted directed segments across four supported ways. Way 815164359
(Tenney Court) remains unsupported because its complete member-node context
includes the unresolved removable bollard. It produces no partial weights.

The exact incoming/outgoing IDs from the prior turn compiler remain present:
`raw:696728766:5:forward` uses the explicit secondary_link model default;
`raw:1475543490:0:forward` uses the raw `30 mph` limit. Their coexistence is an
identity/weight compatibility check, not a solved route or physical turn audit.
Service-way segment weights are not connector/garage-entry costs or approvals.
All previous source, permission and turn reports retain their original claims.

## Verification

Thirteen tests cover unit conversion, original-orientation directional
precedence, unknown/overridden speed controls, missing node context, access
denials, one-way direction, zero geometry, raw immutability and the actual
bollard counterexample. An independent PROJ geodesic implementation configured
as the same sphere checks 206 coordinate pairs, including randomized local
segments, tiny distances, dateline crossings, poles and near antipodes.
This numerical oracle does not independently verify real road geometry or speed.

The checkpoint binds full raw inputs via the permission projection, frozen source
and turn reports, cost policy, adopted scenario and relevant code hashes.
The full regression suite and unchanged 2,508-cost checkpoint remain required.

```sh
python -m unittest discover -s scripts -p test_road_reference_segment_costs.py -v
python scripts/reference_segment_cost_checkpoint.py
```

Remaining work includes composition with complete restriction/incident-road
accounting, independent access/anchor review under #137, graph/source coverage,
exterior closure, masks, compatible assets and eventual public-tab interactions.
Source OSM data © OpenStreetMap contributors, ODbL.
