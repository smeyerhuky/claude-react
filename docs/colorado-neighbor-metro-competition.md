# Neighboring eligible metro sources (#138)

`colorado_neighbor_metro_competition.py` investigates Albuquerque (10740),
Farmington (22140), Pueblo (39380) and Santa Fe (42140) in a bounded union of
actual Colorado and New Mexico roads. These are qualifying Census metros,
not invented labels for arbitrary boundary nodes. Source coordinates remain the
explicit Census representative-point research scenario. The existing named-city
scenario is preserved separately with no fallback or substitution.

The full supplied-source **367** qualifying metro inventory is checked against
locked official 2025 Census population/CBSA files, preserving the public CONUS
**359** inventory. The four diagnostic sources are bound by identity, name,
population and representative coordinates. All other **363** source IDs remain
unrepresented/unknown; no exclusions are applied. Reported winners are among
these four unapproved graph-vertex sources only.

Road sources must match the full raw-interface audit by byte hash, size and
replication timestamp. Retain complete supported ways whose primitive segment
bboxes intersect [-109.1,35.0,-102.0,38.4]; no chord clipping or implied area
coverage. Primitive-path preservation permits added junctions. Baseline raw-node
presence and contracted-node presence are separate: hidden shape nodes must not
be misclassified as missing geography. In the initial source data the three
selected NM source vertices are absent from the retained Colorado roads. No
baseline competing winners are computed from a reduced source list.

An initial experiment stopped at the existing 200,000-way limit. This broader
experiment uses explicit research budgets of 350,000 ways and 650,000 nodes;
configurable budgets have hard upper limits. Smaller-route defaults stay the
same. The junction counter is released before edge construction and retained
raw records before routing. The original local run used 234,818 ways, 385,548
nodes and 932,663 edges, peaking near 2.54 GiB process RSS (Linux). Larger graphs
and resource measurements do not certify complete competition or closure.

Official Colorado Gazetteer representative-point leads add query nodes near
Antonito (0802355), Ignacio (0838535) and San Luis (0868105). GEOID, name, state,
status and exact Gazetteer SHA256 are checked. Original node-lead gaps were
35.2 m, 13.6 m and 31.5 m. They are unapproved destination leads, not additional
metro origins. Origin/destination connector costs and verification are absent.

Independent per-source NetworkX Dijkstra checks every source cost, including
unreachable cases, against the production allocator for both metrics/directions.
Fifteen probes yield 240 source-cost checks and 60 subset-winner cases. Separate
single-source budgets (100,000 m /3,600 s) use those independent distances for
240 isochrone probe checks. Isochrones here mean directed graph-vertex
reachability, not continuous polygons or physical/legal access.

Initial actual-source results at the query road nodes were:

| Query lead | Four-source distance winner | Four-source modeled-time winner |
| --- | --- | --- |
| Antonito | Santa Fe | Santa Fe |
| Ignacio | Farmington | Farmington |
| San Luis | Pueblo | Pueblo |

Both directions gave those subset identities with different costs. Border
probe 144231228 (in New Mexico) instead had Santa Fe's lower distance and Pueblo's
lower time. This makes neighboring competitors materially relevant to research;
it does not establish nearest-global-metro winners. Source node leads were
495–2,139 m from representative points and remain unapproved. All release,
access, road/global coverage and datum-alignment flags stay false. Public map
and data are unchanged.

After producing the source-domain inventory and full raw union audit:

```sh
PYTHONPATH=scripts python scripts/colorado_neighbor_metro_competition.py \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
  --interfaces local-data/colorado-new-mexico-interfaces.json \
  --domains local-data/national-origin-domains-current.json \
  --metros public/data/metros-census-2025.csv \
  --places local-data/2025_gaz_place_08.txt \
  --output local-data/neighbor-metro-competition.json
```

The dedicated workflow reacquires inputs, validates source locks/lineage, checks
both competitions and separate network budgets, and retains inventories,
unknown IDs, resource measurements and provenance. Exterior paths, all omitted
competitors, legal turns, independently costed connectors and release gates
remain unresolved. Initial local results predated a workspace interruption;
the recovered implementation requires fresh exact-head actual-source CI.
