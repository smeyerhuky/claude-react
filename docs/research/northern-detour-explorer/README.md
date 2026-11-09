# Offline northern road-witness inspector

The development inspector adds an eleventh view for the frozen
[northern local-street detour checkpoint](../northern-local-detours/README.md).
It retains all ten older views, the public straight-line map and all historical
2,508 Census costs. It does not activate a public road tab or approve access.

Choose two of the same five unadopted native endpoint hypotheses, distance or
modeled free-flow time, and a map extent. Swap direction to inspect its separately
computed cost and route. A comparison table covers all 20 directed pairs and both
metrics; a paginated segment table exposes original arc identities, way names,
native orientation, meters, seconds and posted/default speed basis. Every native
vertex is drawn without simplification. The browser performs no routing and
requests no basemap, external data, fonts or routing services. The standalone HTML
also works offline outside the development app.

`geometry.json` contains **only** the 6,632 unique witness arcs, their 4,746 native
nodes and limited names/refs/classes for 820 ways. It excludes the full regional
raw source/graph archive and unreferenced geometry. `manifest.json` binds those
bytes to the retained report, extractor and exact original Colorado PBF. Each
arc retains its exact modeled speed fraction. Validation checks native segment
lengths, time derived from length/speed, endpoint continuity, undeclared immediate
reversals and all 40 exact stored-cost sums. Candidate coordinates and original
raw arc indices/orientations must match the frozen checkpoint. These checks do
not certify missing controls, geographic registration, physical joins or access.

Original-source replay reads the exact PBF twice: whole witness-way locations and
tags first, complete member-node tags second. Unknown node controls cannot be
omitted. Whole-way limits remain 1,000 nodes, 1,500 selected ways and 20,000 member
nodes; exceeding a limit returns no partial asset. The original is verified before
and after extraction, and existing typed weights are regenerated under the same
fixed scenario. Only witness arcs are exported after every exact report cost has
been reproduced. No new route search or relaxed permission grammar is introduced.

```sh
python scripts/northern_detour_geometry.py --osm /path/to/colorado.osm.pbf
python scripts/build_northern_detour_explorer.py --output /tmp/northern-detours.html
```

The first command compares exact retained bytes; `--write` explicitly regenerates
the geometry and manifest. The second requires those exact bound inputs and
reproduces `src/research/metro-northern-detours.html`.

The opt-in remains `VITE_METRO_ROAD_RESEARCH=1` in a **development** server; select
“Metro Population Regions — Interactive Map,” open “Inspect road research (dev)”
and choose “Northern Colorado road witnesses.” Production excludes the inspector
and its data even if the opt-in variable is set. Original PBFs, private draft
source archives and environment configuration are not published.

Read-only CI independently re-extracts the geometry from the existing hash-bound
source cache. Full regression checks preserve the previous report. Browser checks
compare all 40 displayed results with the frozen report, verify drawn vertices
against the separately retained native geometry, exercise direction swapping,
pagination, overlays, self-query prevention and mobile layout, and require zero
network requests. Integration checks retain the ten older views, sandboxing,
keyboard closure and identical public map state/canvas; production inspection
rejects research code/data markers.

The fixed scenario remains 2026-10-28T18:00:00Z (12:00 MDT), solo ordinary car,
conditions frozen for the entire route. Time excludes traffic/waiting and arrival
reevaluation. Vehicle dimensions remain unspecified. No anchors are adopted and
zero connectors are approved. Finite supported-subset witnesses do not certify
complete metro coverage, world-optimal routes or isochrones. The existing factual
access, endpoint, competitor, geographic and land/water release gates remain.

Derived OSM records: © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), ODbL.
