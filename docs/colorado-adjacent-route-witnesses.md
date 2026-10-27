# Directed border-route regressions (#138)

`colorado_adjacent_route_witnesses.py` builds two bounded research graphs from
an already audited, timestamp-consistent Colorado/New Mexico source union.
The Colorado-only graph and the union graph reuse `JunctionIndex`, `RoadHandler`
and the production allocator. SHA256-multiset primitive-path inclusion checks
allow added roads to introduce junctions inside existing contracted edges.
All source byte hashes/timestamps must match the completed raw-interface audit.

Selection retains complete modeled ways whose consecutive segment bounding
boxes intersect longitude [-109.1,-102], latitude [36.5,37.3]. This conservative
selection may include geometry outside the rectangle. No segment is replaced by
a clipped chord and the selection is not an area-coverage certificate.

Eight fixed road-node probes were discovered among raw source-interface ports.
They are not metro origins. All 56 ordered distinct pairs are checked under road
distance and modeled driving time. For each graph/source/metric, the production
allocator is compared to separate per-source NetworkX directed Dijkstra labels,
including self-label and unreachable cases (256 labels total). Losing an old
route or increasing its cost fails closed. Added-road path witnesses retain full
node paths, directed primitive OSM references, coordinates, way IDs and speeds;
length/time is separately replayed from that geometry. Diagnostic witnesses are
bounded to six per metric; all 112 route comparisons remain in the report.
This independent calculation checks algorithms within the same sourced graph,
not independent physical ground truth or a separate road cost model.

The initial local source snapshot (2026-10-26T21:24:46Z) produced 20,915 retained
and 70,921 union corridor nodes. All 112 comparisons changed, through newly
reachable routes or lower cost. A fixed directed case from node 144605514 to
141782050 changed from 136,473.530 to 99,307.955 meters and from 10,200.792 to
6,738.276 seconds. These are costs in the bounded modeled graphs, not real-world
travel promises or evidence that a globally shortest path has been found.
CI guards decreases above 30 km and 3,000 seconds for this case so loss of the
observed border effect prompts investigation rather than silent fixture drift.

Reproduce after the raw-interface audit:

```sh
PYTHONPATH=scripts python scripts/colorado_adjacent_route_witnesses.py \
  --parent-osm local-data/colorado.osm.pbf local-data/new-mexico.osm.pbf \
  --interfaces local-data/colorado-new-mexico-interfaces.json \
  --output local-data/adjacent-route-witnesses.json
```

No qualifying metro competition is tested or source excluded. No physical/legal
access, connectors, turn restrictions, complete regional network, parent-exterior
closure or geographic support is certified. All release and coverage flags stay
false. The two original metro-origin scenarios and public map/data are unchanged.
Other adjacent states, routes outside the selected corridor and the exterior of
the supplied union remain unresolved.
