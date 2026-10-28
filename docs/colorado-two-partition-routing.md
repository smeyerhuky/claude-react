# Bounded two-partition road research (#138)

This experiment retains the exact CO/NM/AZ/UT primitive graph as one partition
and builds Oklahoma as a second partition. Their individual node counts are
14,725,537 and 4,016,550, within the existing 15-million-node / 40-million-arc
limits. The conceptual union has 18,740,644 distinct nodes; no road matrix for
that union is constructed. Public straight-line mode remains unchanged.

## Interface and cost composition

Shared vertices must have the same OSM identity and exact stored coordinates.
The source loader verifies fingerprints of every overlapping raw highway,
including private/unsupported highways; contradictory source tags or geometry
fail before routing. Each partition retains the static node-state driving model,
explicit zero arcs and metric-specific minimum costs for parallel directed arcs.
This model does not include turn restrictions or physical/legal access evidence.

The interface includes both endpoints needed for every directed crossing to or
from an Oklahoma-only vertex. It also exposes endpoints of a shared/shared
Oklahoma arc that is absent from, or cheaper than, the corresponding prefix arc
in either metric. Considering only new vertices would miss those improvements.
A shared/shared arc dominated by a prefix arc in both metrics can stay in the
prefix; this reduces duplicated road interiors without deleting a useful route.
The computed ports must remain a subset of the 37 conservative raw-source ports
and reproduce 1,443 shared vertices and 51 crossings in each direction.

Bounded local Dijkstra queries supply directed costs between interface vertices,
source vertices and requested target vertices. The small interface graph takes
per-pair minima across partitions, preserving explicit zero-cost edges. Its
shortest paths may leave and re-enter either partition repeatedly. Shared query
endpoints remain available in both partitions even if they are not cut ports.
Transfers join identical OSM vertices; no geometric snap or access connector is
invented at the interface.

A second pass recomputes only the local routes selected by composed queries.
Every selected local leg is replayed against its partition's stored directed
arcs, summing binary64 weights as exact rational values. Composed leg sums must
agree with the interface distance within the existing 0.002 absolute / 1e-9
relative numerical tolerance. Legs retain exact sums, node counts and path
hashes. Reverse queries also retain the actual directed path hash obtained by
reversing the solver traversal. Replay is not independent real-world evidence.

The API has explicit research budgets: at most two partitions, 128 ports,
32 source vertices, 32 target vertices, 1,024 query pairs, 192 interface/query
vertices and 512 local Dijkstra calls per metric/direction run. Limits fail
rather than truncate. The earlier 16-source comparison engine is unchanged;
this separately tested interface API operates on a bounded small graph instead
of materializing the road union. Neither primitive road resource cap is raised.

## Source and destination scope

All eighteen existing source records and native Census points are preserved.
Eight additions investigate Las Cruces; Phoenix, Sierra Vista-Douglas, Tucson
and Yuma; and Lawton, Oklahoma City and Tulsa. New nearest-vertex leads are
explicitly unapproved, assigned to the supplied source partition and bounded
within 25 km. A missing lead fails the run; it cannot remove a competitor or
move its origin. No connector costs are included.

The original fifteen raw-node probes remain. Three extra raw-node destinations
use the Oklahoma source leads to exercise cross-partition routes; they are not
arbitrary geographic destinations or approved metro access anchors. The
26-source / 18-probe experiment computes 1,872 directed metric costs and must
freshly reproduce all 1,080 prior prefix costs from the passed eighteen-source
checkpoint. Every finite composed query must replay. Old finite paths may
improve after adding Oklahoma roads but may not disappear or become more costly.
Road-only and added-source sampled winner effects are reported separately.

All 341 other qualifying identities remain unrepresented, with zero exclusions.
State names here describe input packages and source identities, not completed
state coverage. In particular, UT-ID Logan, exterior travel, missing Texas and
other competitors remain unresolved. These subset winners cannot authorize
painting geographic ownership on the public map.

## Independent reference checks and reproduction

Synthetic tests compare all directions and both metrics with an independently
flattened NetworkX union. They include repeated leave/re-enter paths, shared
query interiors, coincident distinct vertices, unreachable cases, metric-specific
parallel minima, 26-source queries and varied overlaps. Deliberate geometry,
metric, index, source-fingerprint and budget errors are rejected. The real
loader binds every source byte, the Census CSV/domains and the complete passed
#182 report, not an expiring artifact alone.

```sh
python scripts/colorado_two_partition_competition.py \
  --metros public/data/metros-census-2025.csv \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
    local-data/arizona.osm.pbf local-data/utah.osm.pbf local-data/oklahoma.osm.pbf \
  --output two-partition-routing/report.json
```

All five PBFs share replication timestamp 2026-10-27T21:23:59Z and are retained in
the existing unpublished archive. The dedicated source workflow downloads only
checksum-pinned bytes, bounds runtime, checks all accounting and retains the
research report. OpenStreetMap data is © OpenStreetMap contributors, ODbL;
Census sources retain their documented official provenance.

No source/destination connector, legal entry, turns/grade, land/water/datum,
exterior closure or independent golden evidence is certified. #137's independent
reviewer and separate approver gate, empty approval ledger and public map remain
intact. UI integration must continue to await those release obligations.
