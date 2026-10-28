# Full supplied-parent primitive oracle (#138)

`road_primitive_sparse.py` streams all highway geometry from the supplied PBFs
into a directed raw-node sparse reference graph. It does not select the regional
corridor or contract away shape nodes. Exact highway-way content fingerprints
reject conflicting overlap. Shared node IDs must have identical coordinates.
The static driving filter/directions follow model v2; unsupported directional
ways remain omitted and counted. No turns or physical/legal access are certified.

Dense internal indices are 32-bit, while original OSM IDs remain 64-bit. Length
and time use binary64 data. Parallel directed primitives are reduced to their
minimum **separately per metric**, not summed by a default COO conversion.
Explicit zero-cost arcs remain present: removing them can disconnect distinct
coincident OSM nodes linked by a real way. Parallel reduction is valid for the
current node-state model; edge-specific turn constraints would require revisiting
this representation and retaining the needed incoming-way state.

Node, arc and highway-fingerprint limits fail closed. Source conflicts or budget
failures poison the builder so it cannot emit a partial successful graph. Compact
arrays and CSR matrices avoid allocating a NetworkX object for every raw node
and edge. No full graph or original PBF is uploaded as a CI artifact.

`colorado_sparse_parent_oracle.py` binds the exact regional report and parent
PBF byte hashes/sizes/timestamps. SciPy directed Dijkstra on the uncontracted
reference independently checks all four metro sources, 15 probes, both metrics
and both orientations: 240 costs and 60 subset comparisons. This differs from
the production allocator, contracted representation, and regional way selection.
Unrepresented eligible IDs stay unknown, with zero applied exclusions.

A parent cost cannot exceed a known regional path cost beyond the declared
0.002 metric-unit /1e-9 relative tolerance. Improvements and budget/winner
changes are reported. Every finite sampled path is replayed against stored
primitive arcs, checked against the SciPy cost label, and records its exact
binary64-edge rational sum. This is a graph-only cost, excluding connectors.
Up to 12 diagnostic improved paths retain OSM node IDs,
outside-rectangle counts, and an exact rational sum of stored binary64 edge
costs. Actual travel direction is preserved for reverse-orientation queries;
missing directed arcs and predecessor cycles fail. These witnesses do not retain
parallel-way identity and cannot serve as physical/legal route evidence.
An improvement entirely inside the region is explicitly marked for investigation
of contraction/zero-arc semantics, not automatically credited to exterior roads.

The initial full-source local benchmark on matching CO/NM bytes produced:

| Measurement | Result |
| --- | ---: |
| Raw road nodes | 8,191,913 |
| Directed primitive arcs | 16,453,130 |
| Unique directed pairs | 16,452,953 |
| Modeled unique ways | 935,651 |
| Matching overlapping highways | 564 |
| Zero-length primitive arcs retained | 2 |
| Unsupported-direction ways | 8 |
| Peak process RSS | about 2.81 GiB |

The coupled actual-source run checked all 240 regional source costs: zero
improvements, changed subset winners, or changed budget cases in these fixed
samples. CI repeats the coupled run from newly acquired sources and guards that
sample agreement; a future shortcut requires investigation. Synthetic tests use
independent Bellman-Ford/vector geometry and a missing exterior connection that
changes a subset winner and isochrone reachability, plus reverse-only, zero,
parallel, 64-bit identity, resource, malformed source, and exact-path cases.

This is evidence **relative to all supplied CO/NM roads**, not proof of global
road closure, every regional pixel, every eligible competitor, legal turns,
connectors, datum alignment or physical access. The 363 unrepresented eligible
IDs remain unknown. All release/access/global/road/parent-exterior certification
flags stay false. The public map/data and both origin scenarios are unchanged.
Exact source-byte archiving beyond mutable provider/short-lived CI retention
also remains a release requirement.

```sh
PYTHONPATH=scripts python scripts/colorado_sparse_parent_oracle.py \
  --regional-report neighbor-metro-competition/report.json \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
  --output neighbor-metro-competition/primitive-parent-oracle.json
```
