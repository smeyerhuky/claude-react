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

## Verified result and remaining Utah leads

PR #180 head `ef7ca991578f2785df33f3b5500c7e088bc1ee44` passed all 283
contract tests and exact-source run
[40716527174](https://github.com/smeyerhuky/claude-react/actions/runs/40716527174).
The final graph has 14,725,537 nodes and 29,599,286 unique directed pairs.
All 780 prior costs reproduce and all 900 finite paths replay. The 397 weighted
cut nodes carry 472 inbound and 471 outbound pairs. No sampled winners change
from either exterior roads or added sources. Two Grand Junction modeled-time
routes at Four Corners improve by 954.4 and 938.4 seconds; connector costs remain
omitted. CI computation took 757.6 seconds with 6,598,812 KiB peak process RSS.

A subsequent raw-way scan investigated the three other Utah-named qualifying
identities, which remain **unrepresented** in that 15-source routing comparison.
The exact report, input hashes, scanner/filter hashes and original code head are
retained in [remaining-origin evidence](research/utah-remaining-origins.json).
The scan uses raw polyline geometry rather than the graph nearest-vertex index:
these gaps do not describe the same quantity as the route-source leads.

| CBSA | Nearest mapped highway | Nearest model-eligible highway |
| --- | --- | --- |
| Logan UT-ID, 30860 | track, way 1122318901; 213.6 m | residential, way 10084613; 866.8 m |
| Ogden UT, 36260 | **private** track, way 10088573; 1,423.7 m | motorway, way 30451330; 1,454.0 m |
| Salt Lake City-Murray UT, 41620 | path, way 362270953; 1,573.2 m | unclassified, way 10165786; 4,041.0 m |

No missing-location highway ways occurred in this supplied Utah file. The scan
radius is 25 km, and Utah alone does not establish full coverage of the UT-ID
Logan identity. Model eligibility and nearest geometry do not establish legal
entry, a traversable connector, correct carriageway/grade or turn connectivity.
No lead is certified or excluded, and no origin is moved to an urban center.

Reproduce the raw evidence with the archived exact Utah input:

```sh
python scripts/colorado_origin_source_investigation.py \
  --osm local-data/utah.osm.pbf --metros public/data/metros-census-2025.csv \
  --cbsa 41620 36260 30860 --radius-m 25000 \
  --output utah-remaining-origin-investigation.json
```

This identifies concrete access-review candidates before any further route
comparison. The current diagnostic engine caps comparisons at 16 sources and the
four-state graph is already near its 15-million-node limit. Additional sources
need bounded comparisons or a separately verified scaling design; silently
raising caps or deleting unknown competitors would not establish completeness.
Texas/Oklahoma and the other unknown sources remain open. Independent physical
and legal connector evidence and a separate approver under #137 remain external
release prerequisites; these proximity findings cannot satisfy that gate.
