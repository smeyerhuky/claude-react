# Directed raw boundary interfaces (#138)

`colorado_raw_boundary_interfaces.py` scans a full parent OSM PBF against up to
two bounded complete-way extracts. It verifies every modeled extract way exists
in the parent with the same ID, all tags, ordered node references and coordinates
(SHA256 comparison). Missing/changed parent ways, duplicate modeled IDs and
missing locations fail closed. The same static passenger-car driving filter
and direction rules are used; unsupported directional ways are explicitly counted.

For each omitted parent way touching retained **raw OSM nodes**, it inventories
each directed consecutive-node adjacency as inbound, outbound or omitted
internal. Internal means both endpoints belong to that retained node set, not
that the road lies geographically inside a bbox. Reverse-only roads cannot
create outgoing connections. Repeated and parallel adjacencies retain their
multiplicity. Samples are deterministically bounded and include way ID,
segment index and directed endpoint IDs.
All interface node IDs, coordinates and entry/exit roles are emitted in full,
including endpoints of omitted-internal arcs. Only adjacency *samples* are
bounded. More than 100,000 ports fails closed rather than silently truncating
the interface that a future boundary relaxation would need.

Raw shape nodes matter: an omitted road can join an interior vertex of a
contracted edge. Such an interface requires promoting the shape vertex to a
junction before attaching any external routing labels. Looking only at current
contracted graph vertices can miss the connection entirely.

This inventory is **not a routing cut-arc certificate**. It deliberately retains
identical-coordinate/zero-length adjacencies as conservative leads; it does not
invent positive costs, validate turns/grade, or establish physical/legal access.
Raw topology must be reconciled with the weighted contracted graph before
using the interface for optimization. Cost-bearing, independently validated
boundary labels and all relevant omitted connections are still required.

Even an empty interface is only relative to the supplied parent. The Colorado
state PBF can omit adjacent-state roads and leave/re-enter routes. All graph,
parent-exterior, access and release coverage flags therefore stay false. No
metro is excluded and the public map does not change.

CI reproduces the same baseline/expanded extracts from genuine original OSM,
checks exact lineage and nonvacuous directed interfaces, and uploads source hashes,
counts and samples. Synthetic cases cover reverse-only boundaries, hidden
shape-node joins, repeated/parallel adjacencies, zero-length leads, private and
unsupported-direction roads, and altered/missing source geometry.
