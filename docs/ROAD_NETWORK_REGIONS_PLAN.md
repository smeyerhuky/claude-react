# Road-network nearest-metro regions — product and technical plan

_Status: planned; research/design only, no routing implementation committed. October 2026._

## Product goal

Keep the current population-threshold nearest-metro map as the **Straight-line** mode, and introduce a **By road** mode that assigns each reachable location to the qualifying Census 2025 metro center with the lowest *driving cost* across OpenStreetMap roads. The map will show the existing city/threshold/selection/pinning data in both modes. The intent is to reveal how highways, mountains, rivers, and road connectivity affect practical access to large cities.

**Terminology:** a single-origin *isochrone* represents equal travel time, and an *isodistance* equal road distance. The requested full-map result is a **network travel-time/distance Voronoi or nearest-facility allocation**, not merely overlapping isochrone polygons. We may optionally overlay true isochrone contours later.

## User interface and interaction contract

- Small segmented/tabbed mode switch in existing controls or map header: **Straight-line** (current default) / **By road**. No dramatic color change; preserve neutral-gray compact controls, search, legend, pins, comparisons, map labels, and full-map reset.
- In By road, secondary metric switch: **Drive time** (recommended default; shortest modeled travel time) / **Drive distance** (shortest routable road length). These may assign different nearest cities. Do not label fastest-route distance as shortest distance.
- Legend changes to **Nearest qualifying metro by driving time/distance**, notes approximate conditions and road-data date. The selected population threshold still determines qualifying metro origins; changing the threshold changes network assignments, not the Census metro inventory.
- Pointer/tap on a location: nearest qualifying metro, estimated minutes or roadway miles, straight-line reference (optional), and metadata explaining static modeled speeds/no live traffic. Mark locations with no feasible route as **No routable connection**, not artificially assign a city.
- Pins, selected city, comparisons, link sharing, and PNG export remain consistent. Hash stores mode and metric (for example `mode=road&metric=time`) and restores them via browser history; omit default values. Exports include mode/metric, data/version and disclaimer.
- While road data loads: show clear loading/progress, retry/fallback and unchanged straight-line map rather than silent approximations. Accessible tabs with keyboard focus/arrow semantics (or simpler radiogroup). On small screens mode controls must not push map outside viewport.

## Correctness / modeling decisions

1. **Origins:** use the existing official Census metro dataset and stable CBSA IDs. Decide an explicit *representative access point* per metro (existing point initially, reviewed/snapped to nearby drivable road); avoid implying an MSA polygon is an origin.
2. **Graph:** directed road network for lower 48, with turn restrictions, one-way roads, restricted access, ferries policies, border edges and road classification. State the car routing profile and OSM snapshot.
3. **Cost:** independently compute (a) modeled **fastest driving time** and (b) **shortest eligible driving distance**, each through multi-source shortest paths (or equivalent engine). Do not relabel the length of the fastest-time route as shortest-road-distance. Static travel times are NOT live traffic or an ETA prediction.
4. **Direction:** choose explicit direction: **from sampled location to metro** (access to city); for directed graphs this is not always the same as from metro outward. Reverse-edge multi-source routing may support location→metro. Document and test orientation.
5. **Geographic sampling/render:** snap lower-48 grid cells or sampled locations to viable roads, compute winning CBSA, cost and reachable flag; rasterize into the existing projected map clip. Use sufficiently dense adaptive sampling near network allocation boundaries to avoid coarse stair-steps, with no false claim of street-level accuracy at initial resolution. Smooth display *without changing assignments*; do not interpolate winners through inaccessible areas.
6. **Disconnected regions and artifacts:** explicit unmapped/isolated cells, water and offshore geography masks, no fabricated straight-line fallback, islands/ferries and roadless areas identified. Road regions need not be contiguous; not all boundaries become smooth.
7. **Accuracy:** benchmark against independently requested routes for metro/point pairs across mountains, rivers, sparse Plains roads, and east/west cross-border highways. Compare drive time and distance separately.

## Architecture recommendation

**Precompute static road-network allocation layers**, rather than firing a route API call per browser pixel or per metro whenever threshold changes.

- Source: versioned OSM `.osm.pbf` extracts (e.g. Geofabrik), plus existing Census Vintage 2025 origins. Review OSM/ODbL attribution and derivative-database obligations before distribution.
- Prototype in one contained western-region study area, with a reproducible build script and fixed graph snapshot. Evaluate self-hosted Valhalla, OSRM and/or purpose-built graph multi-source Dijkstra; choose by ability to compute a full winner field, correct metric semantics, licensing, and total compute cost. A standard isochrone endpoint alone does not solve competition between many qualifying origins.
- For national coverage, offline pipeline generates a **versioned, threshold-independent travel-cost representation** (graph-based regional tiles, or precomputed multi-threshold winner/cost rasters). Investigate precomputation for the existing preset thresholds versus arbitrary numeric threshold: precomputing only presets is insufficient if users may enter arbitrary values. Do not claim threshold-independence until validated; storing nearest candidates or graph distances must handle all qualifying changes correctly. If cost/storage is prohibitive, constrain By road thresholds explicitly as a separate product decision.
- Use spatial tiling and compression for browser payloads. Lazy-load *only* in By road mode; cache by graph revision, metric, threshold, tile extent and resolution. Keep route graph and large inputs outside the Vite app bundle. GitHub Pages cannot run a routing server, so either ship static baked tiles/assets on Pages/CDN or fund a separately hosted routing service.
- Maintain existing Canvas shading + SVG overlays, preserving source-specific metadata and no-cloud-fetch behavior for Straight-line.
- If dynamic server service becomes necessary, obtain a hosting/cost budget, abuse/rate limits, CORS plan, authentication, observable error handling and monitoring before committing to it.

## Milestone implementation sequence

### Phase A — feasibility spike (next implementation PR; no new production mode yet)
- Choose representative **Colorado/Front Range + mountain corridor** study area, with Denver, Colorado Springs, Pueblo, and western metros across two population thresholds; explicitly include a barrier/route divergence example.
- Version road inputs and output a small experimental driving-time and shortest-road-distance winner grid, showing nontrivial differences from straight-line assignments and between metrics.
- Validate direction, road snapping, unreachable land points, routing profile and a handful of gold-standard OD checks. Measure build CPU/RAM, compressed output size, browser draw time, and licensing costs.
- Produce reviewable comparison screenshots and a feasibility report with an algorithm decision and national extrapolation. No token, hosted dependency or production UI commitment yet.

### Phase B — UI prototype
- Ship mode/metric tabs with disabled or clearly scoped beta road geography, loading and legend semantics, share URL, accessibility and tests; show correct attribution and no unsupported nationwide promise.
- Add sampled location inspector; reuse existing pins and threshold controls.

### Phase C — nationwide generation and delivery
- Reproducible partitioned lower-48 processing, dataset manifest with Census version, OSM snapshot, cost profile, direction, units and checksum.
- Tile caching, sampling accuracy boundaries, unreachable rendering, reasonable package/network load budget; compare representative city pairs and transition regions to independent routes.
- CI verifies sample query results, tiles, threshold changes, hash Back/Forward, low-bandwidth fallback, dark/mobile screenshots and PNG export appearance. Timelapse PR comments must not become the only verification evidence.

### Phase D — optional contour overlay
- Add individual-city 30/60/90 minute isochrone overlays if desired. Keep these distinct from winner-region fill; assess local real-time traffic integration separately.

## Acceptance criteria before shipping nationally

- For at least two representative thresholds, road assignments show documented, expected divergences from straight-line map.
- Time and road-distance modes are independently correct, with travel direction clearly indicated.
- No visible fake coverage for unreachable/off-network samples or water.
- Any threshold offered in the UI is correct for the chosen data product, not silently approximated from nearest preset.
- Map interactions, pins, comparisons, copy URL, history and PNG export operate unchanged across modes.
- Offline generated inputs are pinned/reproducible and cite OSM attribution; users can read the date/profile caveats.
- Normal first-load (Straight-line) cost is unaffected; road mode loads only on demand and meets an explicit, measured payload/performance budget.

## Nationwide border-safe routing and state-focused maps (roadmap addition, October 2026)

**Scope decision:** The lower-48 **national metro** mode must have one nationwide qualifying-CBSA destination set and a directed routable graph with cross-state connectivity. State boundaries and processing-tile boundaries are **display/partition boundaries only**, never barriers or automatic destination filters. Support legitimate detours that leave a state/partition and re-enter it. International border handling and excluded non-lower-48 coverage require explicit, documented policies.

### N1 — Nation-scale reference and boundary correctness (before national tiles)
- Produce an immutable/versioned contiguous lower-48 OSM extract or seamlessly stitched partitioned graph; keep global road-node identities and all directed interpartition arcs, turn/access policies and metro snaps. Independent shortest **length** and modeled **time**, location→metro.
- Establish a full-network/reference-oracle run on representative cross-state origin/destination fixtures; validate border-adjacent cases, long detours leaving and reentering partitions, connected components, one-way bridges, source centers outside display regions and candidate metros across state lines. State-by-state independent Dijkstra or fixed border buffer **does not guarantee** correct winners.
- Prototype scalable globally equivalent computation (partition boundary transfer costs, contraction/hierarchical routing, distributed multi-source graph processing), verify exact winner and cost equivalence against reference before optimizing. Explicitly reject any fixed-halo shortcut not proven sufficient.

### N2 — Nation-scale geographic allocation and delivery
- Sample lower-48 land at multi-resolution/adaptive density, snap with road-access tolerances, mark water/unreachable/no-data rather than silently painting; rasterize/cache only after global winner competition. Measure seam equality on overlapping tile samples and between states.
- Store versioned compressed tiles with metric, supported threshold, location→metro routing profile, OSM/Census checksums, resolution, eligibility semantics and area coverage. Browser uses lazy loading; no nationwide graph in client bundle.
- Support arbitrary population thresholds by a provably correct threshold-indexed winner representation, or explicitly scope By road to tested threshold presets with UI disclosure; **do not silently approximate** arbitrary thresholds from preset tiles.
- Validate nontrivial cross-state winners, seam-free display, performance, build RAM, storage, hosting/CDN costs, legal attribution/ODbL and ability to refresh datasets.

### S1 — State focus mode: same national metro universe (first state-map release)
- Add state selection (dropdown, searchable state list or click-to-focus), zoom/fit and clip **display only** to the selected state, plus clear return-to-US action. Keep the national Census CBSA population filter, eligible metros across state borders, the same allocation layers, metric choice and selection/share/export state.
- Allow metro winners headquartered outside the selected state when their driving cost is smallest; state-focus is **not** an independent network graph nor a state-only race. Surface out-of-state winner labels clearly.
- Preserve national-to-state navigation/back/forward URLs and accessibility, pinned locations and existing default national view. Test small/narrow and noncontiguous states, DC handling and performance. Lower-48 launch scope; separately plan AK/HI if desired.

### S2 — Optional state-local **places** Voronoi (separate dataset and semantics)
- Distinguish the explicit product choice **State places** from **National metros (state view)**. State places uses incorporated places and Census-designated places (CDPs) as eligible facilities, and 2025 place-level population estimates linked by geographic identifiers to 2025 Gazetteer/TIGER place representative coordinates. The state-population threshold is independent of national CBSA thresholds and should default to an appropriate smaller, configurable number.
- Census place population estimates and boundary/point geography are separate products; enforce vintage and geography compatibility, inclusion policy (CDPs versus incorporated), missing/suppressed values, geographic identifiers, duplicates/multi-state facilities and candidate accessibility. Do **not** relabel CBSA metropolitan populations as local city populations.
- Define a transparent **facility eligibility** policy: either restrict candidate places to the selected state (purposeful state-only competition) or include nearby out-of-state places (border-realistic competition); the directed road graph always crosses the border under either policy. Recommend border-realistic by default with a clear optional state-only filter.
- Reuse straight-line and By road algorithms, tile infrastructure, metrics, accessibility, inspector, legends, sharing and exports, but version state-local datasets and thresholds independently. Prototype Colorado plus a smaller state before rolling out all states.
- Use official Census place-population estimates and official Gazetteer/TIGER coordinates, with traceable joins, display labels and explicit distinction between estimated place population and metro population.

### Ordering and gates
1. Finish A2 Colorado **geographic** layer and test snapping, gaps, raster seams and browser payload.
2. N1 national-connected graph and inter-state winner equivalence; validate sample interstate crossings before claiming national correctness.
3. N2 national tiles, CI goldens and performance budgets; add S1 state focus as a display-only reuse of the same national layers.
4. S2 optional state-local places product after a small-state pilot, precise eligibility/data/vintage decision and measured tile/build cost.
5. Extend outside lower 48 only as a separate scope decision. Existing straight-line national view remains the default until all gates pass.

## Decision log / open questions

- **Drive time vs drive distance:** ship both, with time initially selected as the more actionable accessibility measure.
- **Static vs live:** begin with static OSM road speeds; real-time traffic would be a different costly product.
- **Thresholds:** retain arbitrary numerical input if feasible; resolve algorithm/storage strategy during Phase A, or explicitly restrict road mode if unavoidable.
- **Network scale:** lower 48 first, as in existing map; account for roads crossing international borders where necessary.
- **Roads ownership:** use open/versioned data, do not treat public demo routing APIs as a free bulk-matrix backend.

## References (research)

- Valhalla isochrone and isodistance API: https://valhalla.github.io/valhalla/api/isochrone/
- Valhalla sources-to-targets matrix and isochrone API: https://github.com/valhalla/valhalla/blob/master/docs/docs/api/openapi.yaml
- OSRM matrix semantics: https://project-osrm.org/docs/v26.6.1/http
- Geofabrik US OSM PBF extracts: https://download.geofabrik.de/north-america/us.html
