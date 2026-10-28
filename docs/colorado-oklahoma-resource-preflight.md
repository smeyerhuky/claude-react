# Oklahoma full-state node-limit counterexample (#138)

The supplied CO/NM/AZ/UT primitive graph already has 14,725,537 nodes. Before
attempting another full-state expansion, an exact-source raw-node preflight
scanned all model-eligible ways in that four-state prefix and then Oklahoma.
It reproduced all four complete prefix counts (5,292,810; 8,191,913; 12,398,597;
14,725,537) and stopped upon observing the 15,000,001st distinct eligible node ID.
The unchanged primitive engine's 15-million-node limit therefore cannot hold
this full supplied union. No limit was raised, source excluded or road truncated
into an allegedly complete graph.

This is a **lower bound from a deliberately incomplete Oklahoma scan**, not the
full five-state node count. The first exceeding witness is way 14699540, node
145059100 at [-98.605935, 35.371261]. The count uses the same road-class, access
and direction eligibility as the primitive builder, including zero-length arcs'
vertices. A unit cross-check compares the node set with an actually materialized
primitive fixture; cap tests verify a stopped counter cannot resume silently.

The [reference](research/oklahoma-preflight-reference.json) binds exact hashes,
sizes and shared replication timestamp 2026-10-27T21:23:59Z for all five PBFs.
A dedicated source CI must reproduce every complete prefix count, the stopped
lower bound and the first exceeding witness. The counter does not audit full
cross-source way fingerprints, coordinate compatibility or routing costs: those
remain separate obligations for any later graph construction. No legal/physical
access, geographic completeness, exterior closure or release eligibility is
certified. OpenStreetMap data is © OpenStreetMap contributors, ODbL.

```sh
python scripts/colorado_node_union_preflight.py \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
    local-data/arizona.osm.pbf local-data/utah.osm.pbf local-data/oklahoma.osm.pbf \
  --output node-preflight/report.json
```

The next viable engineering step is a separately verified partitioned or otherwise
bounded design with explicit cut costs and leave/re-enter obligations. This
negative size check supplies no exclusion bound for any Oklahoma competitor.
Texas remains unmeasured; this result must not be presented as a Texas preflight.
The independent access-review and separate-approver gate under #137, all unknown
competitors and the public straight-line map remain intact.

Archive revision 4 retains the new raw Oklahoma input using fresh metadata names
and the existing unpublished draft. Retention is input recovery, never production
road coverage or an environment publication.
