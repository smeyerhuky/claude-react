# Static passenger-car road model v2

Research graphs now preserve positive-length closed-way loops, reject missing
node locations instead of bridging them, and interpret static car direction tags
before contracting geometry. Explicit yes/no/-1 overrides implied direction.
Unspecified motorway and roundabout directions are forward-only. More specific
`oneway:motorcar` / `oneway:motor_vehicle` values override generic `oneway`.

References: [OSM oneway semantics](https://wiki.openstreetmap.org/wiki/Key:oneway),
particularly explicit reverse, implied restrictions and explicit no overrides.
These describe mapped tags; they do not independently verify traffic law or access.

Unknown, alternating, reversible and conditional one-way values are omitted from
this static graph, with exact way IDs and a count in graph metadata. They are not
silently treated as bidirectional. Research PNG and directed-comparison manifests
record model version, omissions and the absence of turn-restriction/access
certification. The raw origin investigation applies the same direction-support
filter when reporting model-drivable geometry. Earlier checked evidence snapshots
retain their original source/model meaning.

Regression cases cover reverse roundabouts, explicit no overrides, implicit
motorways, car-specific direction, unsupported temporal directions, closed loops
and missing geometry. Source PBF hashes alone no longer identify equivalent
outputs across model versions; retain the exact code revision and model metadata.

This is still an incomplete road model. It does not implement OSM restriction
relations, turn costs, barriers, conditional access, construction closure evidence,
all vehicle/access hierarchy semantics, or traffic. Motorway-link implicit defaults
are not inferred. Missing those obligations prevents release certification even
when shortest paths on the modeled graph match the independent oracle. No public
map or release-approval ledger changes.
