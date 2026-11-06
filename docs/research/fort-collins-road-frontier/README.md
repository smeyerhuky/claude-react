# Expanded original-source road frontier with a blocked model preflight

The original Colorado source is enumerated at **all 27 member-node IDs** from
the frozen first-hop witness. No bounding-box, highway or access filter can
conceal an incident way. The result contains 27 ways, 94 complete member-node
records and three touching restriction-namespace relations. Every raw tag,
version/timestamp and complete geometry is retained. Original size/SHA are
verified before, between and after the extraction passes; CI repeats the whole
scan and compares the retained context byte for byte.

Per-seed memberships preserve the earlier eight-seed witness exactly. Existing
raw records must agree in full with the retained Fort Collins context and the
separately frozen complete via-way member context. The latter contributes two
external member ways, producing a **29-way, 106-node union** with complete
members for all three supplied relations. Each declaration compiles independently
under the same fixed-reference permission profile. That establishes declared
source topology and applicability, not physical turn/grade/access truth.

## The full candidate stays blocked

| Model observation | Count / identity |
| --- | --- |
| Ways with supported segment weights | 20 ways, 103 directed weights |
| Ways outside the explicit modeled road classes | 8 building/footway records |
| Car-road context with an unsupported control | Tenney Court way 815164359 |
| Source-member nodes beyond the 27 enumerated seeds | 67 |
| Full member-union nodes beyond those seeds | 79 |

The removable bollard at raw node 7614361913 remains unresolved. The audit keeps
its complete tags and supplies **every** in-class road, including this road, to
the mixed graph compiler with every retained relation. The whole candidate must
return `unsupported`, `graph=null`, no query result and no route cost. No smaller
or control-free graph is substituted. A change that deletes the bollard/road,
omits memberships, hides frontier nodes or fabricates approval fails the audit.

The eight outside-class records are not proof that cars can never use those
places, and are not zero-cost shortcuts or geometric masks. They remain source
context with explicit unsupported model-class status. Supported weights likewise
do not certify real-world access or global optimality. No new road regions,
metro costs, connector costs, adopted anchors or approved assets are emitted.

## Limits and verification

The original-source incidence enumeration applies only at the 27 named seeds.
The 79 additional union nodes still lack their own incident-way accounting.
Crossings without shared node IDs, other relation semantics, physical/grade
connectivity, independent access/anchor review, exterior paths, competitor
closure, masks and release artifacts remain unverified. This is one bounded
source expansion, not recursive geographic closure or a completed city/state.

Caps remain 100 ways, 1,000 vertices per way, 2,000 distinct member nodes, 100
touching restriction-namespace relations and 32 members per relation. Exceeding
a cap rejects the extraction instead of truncating. Eight tests check omitted
or invented incidence, hidden frontier nodes, removed bollards/roads, missing or
conflicting full records/members, source/parent identities, invented approval,
budgets and road-class relabeling. The report binds raw contexts, frozen parents,
relevant implementation hashes and the adopted scenario.

```sh
python scripts/fort_collins_road_frontier.py --osm /path/to/original/colorado.osm.pbf --output /tmp/road-frontier.json
cmp /tmp/road-frontier.json docs/research/fort-collins-road-frontier/source-context.json
python -m unittest discover -s scripts -p test_fort_collins_road_frontier.py -v
python scripts/fort_collins_frontier_checkpoint.py
```

The old 2,508 Census costs, earlier tiny kernels, every inspector view and the
public straight-line map remain unchanged. Zero connectors are approved and
no anchors are adopted; #137's independent reviewer/separate approver gate and
the geographic/UI obligations under #138/#139 remain intact.
Source OSM data © OpenStreetMap contributors, ODbL.
