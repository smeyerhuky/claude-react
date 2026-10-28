# Arizona exterior routes and weighted prefix interfaces (#138)

Arizona is the next supplied parent because Flagstaff (22380), Lake Havasu
City-Kingman (29420) and Prescott Valley-Prescott (39150) survive conditional
town/time frontier cases but have no mapped highway lead within 25 km in the
CO/NM source files. That negative is relative to supplied geometry, not proof of
physical inaccessibility or permission to exclude a source.

`colorado_exterior_parent_competition.py` retains the exact CO/NM source prefix
and adds an Arizona PBF with the same explicit replication timestamp. Every
overlapping highway must retain identical ordered nodes, coordinates and tags.
Duplicate highway IDs within a single source fail. The complete 367-source
Census inventory and CSV/domain/baseline hashes remain bound.

## Cumulative graph and actual exterior effects

The primitive builder can now freeze an independent prefix snapshot and then
append more source roads. Snapshot node identities, coordinates, matrices and
metadata remain unchanged after appends. The final three-state graph uses
explicit bounds of 15 million nodes / 40 million primitive arcs, within the
builder's existing hard resource limits; smaller workflows retain their defaults.

Before routing, the audit checks **every unique directed prefix pair**, not only
sampled paths. All prefix node identities/coordinates and arcs must remain;
each distance/time arc cost must be no greater in the expanded graph. This
establishes preservation of every modeled prefix path under the static node-state
model, not preservation of independently proven physical/legal routes.

The audit exports every weighted primitive interface port, inbound/outbound
directed-pair counts and cheaper parallel prefix-pair counts. Hidden contracted
shape vertices are explicit in this graph. Port limits fail rather than truncate.
These are graph cuts relative to the two supplied universes, never proof of the
expanded universe's exterior closure or complete area coverage.

All ten prior source-node identities are preserved. The three additional Arizona
sources use explicitly unapproved nearest-primitive-vertex leads within 25 km
of their unchanged native Census representative points. Missing leads fail the
run. No alternate city coordinate or connector is silently substituted.

Both metrics and directed orientations recompute all 600 original CO/NM source
costs and require them to match the prior report, including unreachable cases.
The three-state comparison computes 780 costs over the same 60 cases and
replays every finite path with exact stored-arc rational costs. Original-source
costs cannot increase; any improvements retain bounded actual-travel-direction
path witnesses and outside-prefix vertex counts. An improved path can also
use a new/cheaper arc between old vertices, so a positive outside-vertex count
is not required for every improvement.

Synthetic independent NetworkX checks exercise genuine changed winners,
leave/re-enter routes, newly reachable reverse routes, snapshot independence,
missing/increased arcs, altered data and incomplete source inventories. Real-data
path replay is not a second shortest-path solver for the additional sources.

After the existing ten-source report is produced:

```sh
python scripts/colorado_exterior_parent_competition.py \
  --domains neighbor-metro-competition/domains.json \
  --baseline-report neighbor-metro-competition/expanded-parent-competition.json \
  --metros public/data/metros-census-2025.csv \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf local-data/arizona.osm.pbf \
  --output neighbor-metro-competition/arizona-exterior-competition.json
```

## Remaining obligations

Thirteen unapproved modeled sources leave 354 qualifying identities unknown.
Amarillo, Lawton, Provo and St. George remain among the conditional exterior
priorities; other sources are not excluded by their omission from this list.
More sources and roads can change these finite sampled results. Header boxes,
state names and matching samples cannot certify geographic coverage.

Source/destination connector geometry and directed costs, independent legal and
physical access, turns/grade, datum compatibility, land/water coverage, exterior
closure and durable original-source archives remain unresolved. Every release,
access, global competition, geographic/road coverage and datum flag stays false.
No exclusions are applied. The public straight-line map, CSV, #137 independent
review/separate-approver gate and empty approval ledger remain unchanged.
