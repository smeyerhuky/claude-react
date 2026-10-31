# Strict raw via-way compilation: Colorado positive, Arizona negative

This isolated compiler maps a narrowly supported **raw member-way chain** to the
directed arc history consumed by the bounded maneuver probe. It preserves member
identities, ordered via-way members and every intermediate shape segment. It
never chooses a nearby way, reorders disconnected via members to find a route,
or silently drops a restriction that cannot compile.

The supported shape is one from way, one or more ordered via ways and one to way,
with unique endpoint junctions between consecutive members. Each via way must be
traversed completely endpoint to endpoint. From/to roles can appear anywhere in
the raw member list; only the relative order of via members defines that chain.
The activated pattern starts on the final from-way arc and ends on the first
to-way arc. Every required directed segment must exist uniquely in the declared
graph and agree with the inherited static direction interpretation, including
explicit `oneway=-1` and car-specific one-way overrides.

Interior or ambiguous junctions, repeated member ways/nodes, missing/duplicate
arcs, unknown directions, unknown restriction types, non-car mode overrides,
exception/conditional relation semantics and exceeded input/pattern budgets reject.
This version also rejects conditional member-way tags, HOV occupancy, lane-specific
turn/change/HOV controls and unsupported access-purpose values. A caller's supplied
arc cannot override these raw controls. The strict profile intentionally supports
a limited subset; rejection means unsupported, not real-world inaccessibility.
No current sign, physical grade or legal access is independently certified.

## Raw Colorado regression

Exact original relation **2516794** is a `no_u_turn` from South Shields Street
way **800937106**, via West Horsetooth Road way **186839303**, to South Shields
Street way **800937105**. The retained context contains only these three complete
raw ways and the relation, not a complete street neighborhood. The compiler emits:

```
800937106:0:0 -> 186839303:0:0 -> 800937105:0:0
```

In this tiny four-node, three-directed-arc graph, the forward road-node query is
finite without that declared rule and modeled NoData with it. The reverse query
is already NoData because these selected ways are one-way. This is an inspectable
raw-source topology regression, **not** an independently audited legal driving
route, proof that no exterior detour exists or a claim of actual inaccessibility.
No garage, anchor or connector is involved.

## Raw Arizona negative

Exact original relation **2451750** has two ordered via ways and an unconditional
`no_right_turn`. Its from way **437327483** has `hov=yes` and conditional motor
vehicle exclusion during weekday peak windows. Other member ways carry lane-level
turn/change/HOV tags. The absence of a conditional key on the relation therefore
does not establish an unconditional passenger-car maneuver.

This compiler rejects the context before emitting a maneuver or route cost,
reporting the conditional member-way controls. HOV occupancy and lane controls
also remain unsupported; removing just the temporal tag would not make this a
valid positive. This preserves a concrete failure case for a graph builder that
would otherwise retain arcs without interpreting those restrictions.

## Exact source and validation

Both small contexts are reproducible from the original October 27, 2026 Colorado
and Arizona PBFs. Source sizes, hashes and replication timestamps bind to the frozen
33-source checkpoint. The extractor verifies each full source before and after
reading and requires all exact relation/member IDs. Raw versions, last-edit times,
tags and node coordinates are retained; old edit times are not field inspection
or current legal proof. Only selected raw member contexts are published, ©
OpenStreetMap contributors, ODbL; full PBFs and the private archive remain private.

Eight compiler tests cover ordered multi-via chains with interior shape vertices,
non-positional roles, reversed raw geometry, explicit direction, manual expected
arc identities/detours, missing/ambiguous members, conditional/mode/purpose/HOV/lane
rejection, forged source/adoption claims and both real-source cases. Eight independent-oracle maneuver tests also
run. The retained report includes both metrics and directions and hashed contexts.
Fresh-original CI re-extracts every selected way/relation for both sources before
merge. It uploads no original source files.

```sh
python -m unittest discover -s scripts -p test_road_via_way_compile.py -v
python scripts/via_way_compiler_checkpoint.py
python scripts/via_way_raw_context.py --state colorado --osm /path/colorado.osm.pbf --output /tmp/colorado-context.json
cmp /tmp/colorado-context.json docs/research/raw-via-way-compiler/colorado-context.json
```

All access, adoption, geographic coverage and release flags remain false. The
#137 evidence/different-approver gate is unchanged. Existing Census origins,
33-source graph-only costs, older inspector views and the public straight-line map
remain unchanged. This is not a state-wide turn engine or an audited #138 golden.
