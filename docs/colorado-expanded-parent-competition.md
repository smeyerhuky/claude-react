# Expanded primitive-parent metro competition (#138)

`colorado_expanded_parent_competition.py` adds Boulder, Colorado Springs,
Denver, Fort Collins, Grand Junction and Greeley to the four-source
Albuquerque/Farmington/Pueblo/Santa Fe investigation. It preserves the exact
original four road-node identities and coordinates. It does not silently
resnap them when enlarging the source list.

The additional sources use an explicitly different geometric lead policy:
nearest stored primitive road vertex within 25 km, with OSM ID breaking equal
spherical-distance ties. All native Census origin coordinates are unchanged.
The bound is a research resource/selection limit, never an approved connector
length. Primitive vertices are not necessarily entrances, and kilometer-scale
gaps remain unapproved and uncosted. A missing additional lead fails the run;
it cannot silently shrink the source inventory.

The CLI binds exact Census CSV/domain/regional/parent report hashes and the
original PBF hashes, sizes and shared replication timestamp. It requires the
same primitive graph/model report. Every original probe coordinate and source
lead is checked against the parent. All 240 original graph costs must reproduce,
including unreachable cases. Both directed orientations and both metrics then
compare ten sources across 15 original road-node probes: 600 source costs.
Every finite predecessor path is replayed with exact stored-arc rational costs.
The four-source and expanded winners retain numerical ties.

Synthetic tests compare all directed source costs with a separate NetworkX
shortest-path solver, including a new source that actually changes a winner,
asymmetric reachability, missing leads, altered original costs/coordinates,
duplicate inventories, and equal-coordinate vertex ties. Real-data path replay
checks stored paths; it is not a second real-data shortest-path solver for the
additional sources. The original four sources retain the preceding regional
NetworkX and primitive-reference checks.

After producing the existing coupled reports:

```sh
python scripts/colorado_expanded_parent_competition.py \
  --domains neighbor-metro-competition/domains.json \
  --regional-report neighbor-metro-competition/report.json \
  --parent-report neighbor-metro-competition/primitive-parent-oracle.json \
  --metros public/data/metros-census-2025.csv \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
  --output neighbor-metro-competition/expanded-parent-competition.json
```

## Remaining missing competitors and geographic scope

All 367 supplied qualifying identities remain in the report; 357 are still
unrepresented. No exclusions are applied. Ten modeled graph sources do not
constitute complete national competition.

The exact #174 frontier artifact (run 40616223284) retains these additional
unrepresented sources in at least one town's zero-budget modeled-time case:

| CBSA | Metro | Retained town cases (both directions) |
| --- | --- | --- |
| 11100 | Amarillo, TX | Antonito, Ignacio, San Luis |
| 22380 | Flagstaff, AZ | Antonito, Ignacio, San Luis |
| 29420 | Lake Havasu City-Kingman, AZ | Antonito, Ignacio |
| 30020 | Lawton, OK | Antonito, San Luis |
| 39150 | Prescott Valley-Prescott, AZ | Antonito, Ignacio, San Luis |
| 39340 | Provo-Orem-Lehi, UT | Antonito, San Luis |
| 41100 | St. George, UT | Antonito, Ignacio |

These are **conditional investigation priorities**, not approved exclusions or
measured feasible connector budgets. Even a zero-budget case that is not
geometrically refuted does not prove feasible connectors. Larger assumed
connector budgets retain more sources. The assumed global 140 km/h ceiling,
datum compatibility and full-route cost domination remain unproven.

Full CO/NM parent routes do not account for these sources' exterior road
networks, all leave/re-enter alternatives, or arbitrary geographic destinations.
Preserve and investigate raw boundary interfaces before claiming closure;
matching fixed samples is not a completeness proof. Complete sourced land/water
handling and datum/uncertainty evidence are still required for any claimed map
scope. Source bytes must be durably archived, not merely reacquired from mutable
`latest` URLs.

Every access, global competition, road coverage, exterior coverage, datum and
release flag remains false. Independent physical/legal source and destination
connector review and a separate approver under #137 remain mandatory. Neither
graph proximity nor this code can self-certify those facts. The public
straight-line map, its CSV and the approval ledger remain unchanged.
