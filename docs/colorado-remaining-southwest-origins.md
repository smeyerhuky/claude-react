# Remaining supplied-state source-origin investigations (#137, #138)

The four supplied PBFs do not imply that all qualifying metros named for those
states are represented in routing. Beyond the three Utah identities investigated
in #181, the national Census inventory retains five further identities named for
Arizona or New Mexico that were absent from #180. These raw-way scans investigate
their unchanged native Census points without adding or excluding a routing source.
They are not an independent access review or a geographic coverage certificate.

| Identity | Nearest mapped geometry | Nearest model-eligible geometry |
| --- | --- | --- |
| Las Cruces NM, 29740 | residential way 14460243; 57.4 m | same; 57.4 m |
| Phoenix-Mesa-Chandler AZ, 38060 | track way 836803538; 3,538.4 m | primary way 529995284; 3,720.7 m |
| Sierra Vista-Douglas AZ, 43420 | track way 16798965; 2,904.3 m | residential way 16811609; 3,730.5 m |
| Tucson AZ, 46060 | track way 16891431; 1,256.3 m | residential way 16894310; 5,691.8 m |
| Yuma AZ, 49740 | residential way 16952553; 543.2 m | same; 543.2 m |

The bounded scanner considers raw highway polylines within 25 km; these distances
are not nearest-primitive-vertex route-source leads. Unsupported classes stay
separate from model-eligible classes. Zero missing-location highway ways occurred
in either supplied input, but that does not establish mapping completeness.
Absent restrictive OSM tags do not prove public access. Even Las Cruces' 57 m gap
requires independent evidence of a legal, physically drivable connector, correct
direction and grade before approval. No point is moved to a named downtown.

The reports retain exact input/CSV hashes, scanner/filter hashes, native points,
way URLs, access tags and unapproved status:

- [Arizona report](research/southwest-remaining-origins/arizona.json)
- [New Mexico report](research/southwest-remaining-origins/new-mexico.json)

Both original PBFs belong to the retained 2026-10-27T21:23:59Z snapshot. The
read-only CI matrix checks exact dated bytes and reproduces every raw scanner
field against these records. These are same-source regression checks, not a
second independently sourced access attestation. OpenStreetMap data is
© OpenStreetMap contributors, ODbL; Census origins retain official provenance.

```sh
python scripts/colorado_origin_source_investigation.py \
  --osm local-data/arizona.osm.pbf --metros public/data/metros-census-2025.csv \
  --cbsa 38060 43420 46060 49740 --radius-m 25000 --output arizona-origins.json
python scripts/colorado_origin_source_investigation.py \
  --osm local-data/new-mexico.osm.pbf --metros public/data/metros-census-2025.csv \
  --cbsa 29740 --radius-m 25000 --output new-mexico-origins.json
```

Las Cruces is a concrete next source-lead investigation using already retained
roads. Arizona's longer gaps require careful origin semantics and access review;
expanding a snap radius or changing vehicle classes would not resolve them.
Additional competitors, Texas/Oklahoma roads, arbitrary destination geography,
land/water/datum completeness, turns/grade and exterior closure remain unresolved.
All access/release flags remain false. Public straight-line mode and #137's
independent reviewer/separate approver gate remain intact; no archive or
environment publication is requested by this research.
