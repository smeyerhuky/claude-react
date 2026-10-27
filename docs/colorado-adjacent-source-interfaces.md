# Colorado parent-exterior source investigation (#138)

The full Colorado Geofabrik PBF is a supplied parent, not a complete routing
universe. `colorado_adjacent_source_interfaces.py` inventories directed raw-node
connections omitted from that PBF but present in an explicitly supplied union.
The first PBF is retained; subsequent PBFs add highway ways. The first real-data
workflow uses Colorado and New Mexico, not all adjacent states.

Before scanning, every PBF must have the same explicit UTC replication timestamp
and a different SHA256. Matching timestamps do not prove completeness. Every
overlapping highway way must have the same ordered node references, coordinates,
and all tags. Private and unsupported-direction highways are checked too, so
support-policy changes cannot be silently resolved by input order. Identical
copies count once; different parallel way IDs keep their multiplicity. Duplicate
IDs inside a source, conflicting shared retained-node coordinates, incomplete
retained-way lineage, missing locations and memory/output limits fail closed.
Ways without a highway tag are outside this inventory. It does not validate
all OSM object histories or source-provider clipping rules.

The existing raw-interface implementation supplies complete port IDs, native
coordinates and entry/exit roles, including joins at hidden interior shape nodes
and omitted arcs between retained nodes. Adjacency examples alone are bounded;
ports are never truncated. Both inbound and outbound leads are required by CI.

Run:

```sh
PYTHONPATH=scripts python scripts/colorado_adjacent_source_interfaces.py \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
  --output local-data/colorado-new-mexico-interfaces.json
```

The report binds exact input hashes, sizes, timestamps and per-source overlap
counts. Mutable `latest` download URLs are acquisition locations, not immutable
archives; reproduce a result with its exact recorded source bytes. A publication
still needs durable source-byte retention.

This is source topology evidence only: no new weighted routes, verified access,
turn restrictions, global source exclusions or geographic completeness claims.
Every release/access/coverage flag remains false and the public map is unchanged.
Next, weighted boundary labels must be checked against actual union paths for
both metrics and directions. Other adjacent states and the union exterior remain
unresolved even if those checks pass.
