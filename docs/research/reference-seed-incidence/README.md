# Original-source incidence at eight frozen kernel nodes

This checkpoint enumerates **every OSM way containing any of the eight raw seed
node IDs** in the original hash-bound Colorado PBF. It applies no bounding box,
highway-class, access or drivable-way filter. The result is eight incident ways,
27 complete member-node records and one touching restriction-namespace relation.
All these records already exist in the retained Fort Collins raw context; no
record, tag, geometry or older report is rewritten.

The source is verified by original size and SHA-256 before, between and after
the two extraction passes. Every returned way has complete geometry and every
distinct member vertex has its full raw node record, with exact ID/coordinate
agreement. A second pass also enumerates touching relations with `type=restriction`
or a `restriction`/`restriction:*` tag, preserving complete tags/members in the
record hashes. Other relation semantics are outside this predicate.

`source-incidence.json` stores exact per-seed way memberships and canonical hashes
of all full way/node/relation records, including retained version/timestamp and
raw tags. The auditor matches these hashes to the existing raw context. CI
independently repeats the scan against the original PBF and compares the whole
witness byte for byte. Added or missing source ways cannot be silently discarded
to fit the older local extract. The original-source cache is untrusted until the
existing exact-file verifier passes; no archive/configuration is published.

## Deliberately limited completion

Only incidence at the **eight original seed nodes** is enumerated. The returned
ways introduce **19 additional raw nodes** whose incident ways have not been
enumerated here. They remain explicitly listed. This is one bounded source
expansion, not recursive graph closure or a complete local/state graph.

It does not establish crossings without a shared seed ID, source accuracy,
geographic timezone assignment, physical connectivity or grade, current/legal
car access, all control semantics, exterior paths, competing metros or masks.
A source way membership is not a verified road connection or a route permission.
No new route/cost, adopted anchor, connector cost or approval is emitted. The
old two-way kernel, all 2,508 frozen Census costs, every inspector view and the
public straight-line map remain unchanged. Zero connectors are approved.

## Bounded verification

The extractor rejects rather than truncates above 100 ways, 1,000 vertices per
way, 2,000 distinct member nodes, 100 touching restriction-namespace relations
or 32 members per relation. All bounds are below existing graph/query budgets.
Four tests reject altered/omitted incident memberships, hidden outer nodes,
changed complete-record/source hashes and invented graph/access/release claims.
The report binds the exact witness, prior raw/kernel reports and implementation.

```sh
python scripts/reference_seed_incidence.py --osm /path/to/original/colorado.osm.pbf --output /tmp/source-incidence.json
cmp /tmp/source-incidence.json docs/research/reference-seed-incidence/source-incidence.json
python -m unittest discover -s scripts -p test_reference_seed_incidence.py -v
python scripts/reference_seed_incidence_checkpoint.py
```

Next accounting must examine incident ways at the additional member nodes and
the resulting boundary, while preserving unresolved controls. Independent
entry/anchor review under #137, geographic obligations under #138 and public-tab
acceptance under #139 remain separate. Source OSM data © OpenStreetMap
contributors, ODbL.
