# Bounded turn-aware Tucson street probe

This is a separate research graph near an **unadopted** municipal parking-map
lead, not a replacement for Tucson's native Census origin. The old three-node
Census-point component negative, frozen 33-source/19-sample costs and public
straight-line map remain unchanged. No anchor or connector is approved.

## Why the node-only costs cannot authorize public road regions

The inherited road model explicitly does not model turn restrictions. This probe
retains raw directed arc/way identities and adds forward arc-state search with
explicit via-node car restrictions. Parallel ways cannot be collapsed to their
cheapest incoming arc: the permitted departure can depend on the arrival way.

For raw restriction **18843106**, the selected local road-node query
`8365097507 -> 8365097506` costs 20.687m without the turn rule and 464.791m with
it under the declared model. Modeled time changes from 1.511s to 39.715s. The
reverse query remains 20.687m / 1.511s. These are exact shortest paths **within
this declared local graph and maneuver policy**, not global or real-world cost
certificates. The input has 209 road nodes and 364 directed arcs. Costs exclude
connectors, garage travel, parking delay, traffic and unsupported restrictions.

The solver does not permit automatic immediate same-way reversals at arbitrary
shape vertices. A reversal needs an explicit declared arc pair or an applicable
`only_u_turn` relation. A `no_u_turn` still overrides a caller's declared pair.
This is a restrictive research maneuver policy, not a claim that all real-world
U-turns are illegal or that their admissibility is independently established.
Initial road-node approach is unconstrained; a real anchor connector's arrival
orientation must be included in a separately reviewed route contract.

Unsupported via-way, ambiguous unsplit approaches/departures, unknown exception
semantics, conditional restrictions and conflicting only-turn disjunctions reject
the whole query. Input/state/transition budgets also reject without partial
results. This is intentionally not a national turn engine or a replacement for
the bounded two-shard/source-batch backend. No existing graph caps are raised.

## Municipal evidence and its actual limits

The official Park Tucson page links the retained public experience owned by
`tucsonapps_cotgis`, which links the web map and `AllLotsGaragesEntrances` layer.
The complete 40-feature response includes entrance text, hours, height and
public/permit information. FID1 is Pennington Street Garage, with published
entry **From Scott Av.**, 711 public spaces and a 24/7 access field. Its geometry
is a map point, not an adopted surveyed vehicle entrance or metro anchor.

The layer description says its initial source was provided in **February2017**.
A later service edit timestamp does not revalidate every record. FID32 has an
Active status alongside an address saying the garage is under construction.
Retain the conflict; do not translate Active or CityOwned into driving rights.
The CRS is explicitly requested EPSG:4326; the source metadata uses EPSG:2868.
The service's datum-operation accuracy and native Census/OSM alignment remain
unverified. No point displacement is assigned as connector length.

An initially inspected service was the **Meters** layer, with a truncated
1000-feature response. It was rejected and is not retained as entrance evidence.
The retained web map identifies the actual lot/garage layer. Publisher identity,
layer name and truncation are checked, not inferred from an HTTP200 response.

## Exact source and replay

`manifest.json` binds retained JSON and exact original Arizona PBF identity.
The extractor reads all raw highway ways with a vertex in the small declared
neighborhood and retains complete selected-way geometry. It separately retains
restriction relations referencing selected ways and tagged local nodes. It may
omit a crossing way with no vertex in that neighborhood; no arbitrary-endpoint,
complete local coverage or exterior-route claim is made. The 114 raw context
ways include footways and private/context ways; the probe's car graph uses the
inherited static-v2 road eligibility/speed predicate without certifying access.

The raw PBF/private draft archive is not published. The retained local subset is
OSM data © OpenStreetMap contributors, ODbL. Official GIS data remain municipal
publication context, not engineering/field certification. Original city HTML and
full app UI/runtime configuration are omitted; selected publication-link hashes
cannot be recomputed from those projections.

Run the retained checks and exact rational path replays:

```sh
python scripts/tucson_entry_evidence.py
python scripts/tucson_turn_probe.py --compare docs/research/tucson-urban-entry-context/turn-probe.json
python -m unittest discover -s scripts -p test_road_turn_aware_probe.py -v
```

The NetworkX oracle independently solves a tiny explicit transition graph, both
metrics and directions, including parallel ways, U-turn and only-turn cases,
unreachable/self-zero results, unknown/conditional restrictions and exhausted
budgets. Real-context cases also match that independent line-graph oracle.
Fresh-original CI regenerates the complete retained OSM context before merge.
None of these checks independently certifies current legal/physical access,
grade, entry/exit, temporal vehicle restrictions or geographic coverage under
#137/#138. All approval flags remain false.
