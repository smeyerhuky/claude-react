# Utah exterior comparison (#138)

The next supplied-source parent adds Utah and two qualifying source identities:
Provo-Orem-Lehi (39340) and St. George (41100). Every existing CO/NM/AZ source
lead and native Census coordinate is preserved. The new leads use the same
explicitly unapproved nearest-primitive-vertex policy within 25 km. Connector
geometry, directed costs and legal/physical entry remain unverified.

## Reuse validated results, then reproduce them

The pinned reference in `research/utah-parent-reference/` retains the exact
complete Census domains and required fields of #176's passed three-state report.
Its manifest binds those files and the full upstream report hash/run/code head.
The Utah check does not depend on an expiring CI download or rerun unrelated
regional research stages. It reconstructs the full exact three-state prefix and
requires all 780 prior costs to reproduce before checking four-state effects.

The same primitive graph audit verifies preservation of every one of the
24,898,833 unique directed prefix pairs and non-increased distance/time weights.
All weighted cut ports are retained, including raw shape nodes. The 15-source
comparison computes 900 costs over all 60 original probe/metric/orientation cases
and replays every finite stored path. Outside-prefix path witnesses are bounded;
the full cost inventory and interface ports are not silently truncated.

Winner changes are separated into two comparisons: the original 13 sources on
the old and new graphs (exterior-road effect), then 13 versus 15 sources on the
same enlarged graph (added-competitor effect). New sources' old-prefix costs are
marked **not computed**, never mislabeled unreachable. Known unreachable old
costs remain distinct and are reproduced.

The new cumulative synthetic regression snapshots an already-expanded graph,
preserves its leads/costs, then adds another source and changes winners. Previous
NetworkX cross-checks for the common engine remain. Real-data stored-path replay
is not a second shortest-path solver or independent access evidence.

## Resource and source contract

A bounded full-Utah supported-way scan found 2,349,316 modeled node IDs. Added
to the 12,398,597-node prefix this gives a conservative upper bound of 14,747,913
nodes before cross-source overlap. The existing explicit 15-million-node /
40-million-arc limits suffice; no default or hard limit is increased. CI reports
actual graph size, elapsed time and peak RSS.

All four exact PBFs share replication timestamp 2026-10-27T21:23:59Z. Read-only
CI tries the retained archive when accessible, with checksum-pinned dated
Geofabrik acquisition as a fallback. Every file must match SHA256 and byte size; changed
bytes fail rather than being accepted as a newer snapshot. Revision 3 of the
unpublished source archive retains Utah without replacing earlier inputs or
metadata. See [source recovery](research-source-archive.md).

```sh
python scripts/colorado_utah_exterior_competition.py \
  --metros public/data/metros-census-2025.csv \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
    local-data/arizona.osm.pbf local-data/utah.osm.pbf \
  --output utah-exterior-competition/report.json
```

Fifteen modeled sources leave 352 qualifying identities unrepresented. No source
is excluded. Other Utah sources, Texas/Oklahoma sources, the enlarged parent's
exterior, arbitrary geographic destinations, land/water/datum completeness,
turns/grade and independent connectors remain unresolved. Public straight-line
mode, its CSV and #137's independent reviewer/separate approver gate are intact.
No release/access/global/geographic coverage certification is asserted.
