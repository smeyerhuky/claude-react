# Colorado OSM metro allocation — full engineering handoff

**Prepared:** 2026-10-25  
**Repository:** `smeyerhuky/claude-react`  
**Scope:** Experimental Colorado OSM road routing, metro winner allocation, geographic-preview tiles, validation, CI, limitations, and next engineering gates.  
**Status:** Experimental; **not** certified geographic coverage and **not** approved for production map shading.

## 1. Executive summary and decision

The repository contains a directed OSM road-graph experiment for assigning road locations to eligible 2025 Census metro representative points (CBSA) at population thresholds **100,000**, **250,000**, and **400,000**, using both shortest road length and modeled driving time. It also contains experimental road-proximity raster tiles. These are **not** true continuous metro service-area polygons.

Two stages of validation have been exercised on real Colorado OSM data:

1. **Road-node oracle:** independently compute NetworkX shortest paths from sampled graph nodes to eligible CBSA source nodes, and compare winners against the project's allocation algorithm.
2. **Directed edge-midpoint diagnostic:** independently route from modeled positions halfway along sampled directed edges and compare their CBSA winners against the origin-vertex approximation.

The first known successful validation run, [#40155851974](https://github.com/smeyerhuky/claude-react/actions/runs/40155851974), checked **8 nodes × 3 thresholds × 2 metrics = 48 checks, 0 mismatches**. It processed **591,511 graph nodes and 1,414,807 directed edges**. The later [#40204947377](https://github.com/smeyerhuky/claude-react/actions/runs/40204947377), reported successful in the validation review, included **5 synthetic tests**, **48 node checks**, and **4 midpoint edges × 6 datasets = 24 diagnostic comparisons**, with **0 observed midpoint/origin-vertex disagreements**. These samples are small, and agreement does not certify arbitrary-point coverage. Consult the actual run pages and retained artifacts when reproducing any numbers.

**Decision:** Preserve the code as a research/diagnostic pipeline. Do not claim geographically correct regional boundaries, nationwide coverage, or production readiness from the green workflows.

## 2. Where everything lives

| Path | Responsibility |
| --- | --- |
| `.github/workflows/colorado-metro-winners.yml` | Manual experiment generating real-data winner allocations and optional raster previews |
| `.github/workflows/colorado-geographic-validation.yml` | Manual plus path-scoped PR/main validation using real Colorado OSM |
| `scripts/stream_osm_roads.py` | Parse filtered PBF into a directed **NetworkX MultiDiGraph**; contract non-junction interiors and retain length/time weights |
| `scripts/road_spike.py` | Winner assignment implementation |
| `scripts/colorado_metro_winners.py` | Read CBSA CSV, snap candidate metros, allocate by threshold/metric, report reachability and candidate exclusions |
| `scripts/validate_colorado_geography.py` | Independent sampled road-node shortest-path oracle |
| `scripts/colorado_edge_midpoint_diagnostics.py` | Sample keyed directed road edges and calculate midpoint-to-source oracle; diagnostic only |
| `scripts/test_colorado_edge_midpoint_diagnostics.py` | Synthetic directed/parallel/unreachable-edge tests |
| `scripts/colorado_coverage_tiles.py` | Experimental globally aligned nearest-road-**vertex** tiles and optional polygon land mask |
| `public/data/metros-census-2025.csv` | Metro representative coordinates and population inputs |
| `docs/COLORADO_MULTI_THRESHOLD_WINNERS.md` | Existing experiment, tile, land-mask, and validation caveats |

Verify the latest source and workflows before making changes; paths above describe the handoff baseline.

## 3. Data, geometry, and routing semantics

- Source: Geofabrik `colorado-latest.osm.pbf` downloaded at run time. The input changes over time. Capture SHA256 for provenance.
- Extraction: `osmium extract --bbox=-106.1,38.65,-104.5,40.1 --strategy=complete_ways`; filter motorway/trunk/primary/secondary/tertiary and links, residential, unclassified, living_street, and service ways.
- Directed graph: `nx.MultiDiGraph`; parallel edges are **distinct** and have keys. OSM ways are contracted between junctions/endpoints. Retained nodes store `x` longitude and `y` latitude.
- Weights: `length` in meters and `travel_time` in modeled seconds, based on simplified road class / posted speed assumptions. No complete turn restrictions, traffic, or fully verified access semantics.
- Direction: **location → metro**. Reverse reachability is not interchangeable.
- Metro origins: Census representative coordinates snapped to nearest retained road graph node, with a 25 km default maximum. Eligible metros outside the corridor may be included if within snapping range; others are excluded. Missing candidates and paths that leave/reenter the clipped graph can change actual winners.
- Thresholds: `100000`, `250000`, `400000`. The 400k threshold intentionally excludes Boulder (CBSA 14500, population 328,560 in the input referenced by the existing experiment), making a nontrivial threshold comparison possible.
- Raster: global lon/lat grid; pixels currently inherit the nearest graph **vertex** within 1 km, not a snapped/independently routed edge origin. Far/off-network and unreachable pixels remain transparent. The optional `--land-geojson` mask preserves polygon holes, but the workflow does **not** supply a pinned authoritative land/water mask by default.

## 4. CI workflow and operational controls

**Workflow:** [Colorado geographic correctness validation](../.github/workflows/colorado-geographic-validation.yml).

- `workflow_dispatch`: always manually triggerable.
- `pull_request`: automatically runs for scoped changes to workflow, validation/edge scripts, routing scripts, and metro CSV.
- `push` on `main`: same scoped paths.
- Repository Actions variable **`COLORADO_GEO_VALIDATION_AUTO=false`** skips automated job executions; unset or any other value enables them. The manual dispatch path remains enabled.
- Runner: Ubuntu, Python 3.12, osmium-tool, NetworkX, PyOsmium, SciPy.
- Real OSM pipeline: download → extract → filter → build graph → allocate threshold winners → independent road-node oracle (`--samples 8`) → midpoint diagnostics (`--samples 4`) → upload artifacts.
- Workflow timeout: 45 minutes; road-node step 25 minutes; midpoint step 12 minutes. `upload-artifact` uses `if: always()` and retains artifacts **14 days**.
- Artifacts (when generated): `colorado-geographic-validation/report.json`, `processing.log`, `resources.txt`, `source-sha256.txt`, `edge-midpoints.json`, and `edge-midpoints.log`. Early failure can leave some absent.
- Important: a skipped, queued, or successful job is **not** evidence of geographic certification. Quote the exact workflow, run ID, commit SHA, job conclusion, and actual diagnostic report.

**Reproduction:** On a machine with `osmium` and Python dependencies, follow the workflow commands to download and filter the PBF. Then run:

```bash
python scripts/validate_colorado_geography.py \
  --osm local-data/roads.osm.pbf --samples 8 \
  --output colorado-geographic-validation/report.json
python scripts/colorado_edge_midpoint_diagnostics.py \
  --osm local-data/roads.osm.pbf --samples 4 \
  --output colorado-geographic-validation/edge-midpoints.json
PYTHONPATH=scripts python -m unittest scripts/test_colorado_edge_midpoint_diagnostics.py -v
```

The data download is large; use the GitHub Actions workflow for the normal reproducible experiment. Record runner CPU, peak memory, elapsed time, hashes, and code revision.

## 5. Known runs and incidents

| Item | Evidence and interpretation |
| --- | --- |
| PR [#118](https://github.com/smeyerhuky/claude-react/pull/118) | Initial independent node-validation script/workflow merged to `main`; merge commit `a8ce3e395ae75d5211f385a6e019f28fe3de92e8` |
| Commit `b8f26f7669d52ad35e22e0132e0469b77fd12866` | Enabled scoped push/PR triggers with opt-out repository variable and preserved manual dispatch |
| Run [#40155851974](https://github.com/smeyerhuky/claude-react/actions/runs/40155851974) | Confirmed success: 48 road-node checks, 0 mismatches; artifact [#12583864859](https://github.com/smeyerhuky/claude-react/actions/runs/40155851974/artifacts/12583864859) |
| PR [#119](https://github.com/smeyerhuky/claude-react/pull/119) | Added directed midpoint diagnostics, MultiDiGraph edge handling, regression tests, CI stage; user reported merging it and current `main` contains the files |
| Run [#40171701897](https://github.com/smeyerhuky/claude-react/actions/runs/40171701897) | Failed: midpoint diagnostic unpacked a two-item edge while actual MultiDiGraph yielded `(u,v,key)`; fixed in `d1f6c842...` |
| Run [#40173327225](https://github.com/smeyerhuky/claude-react/actions/runs/40173327225) | Failed: remaining synthetic test supplied `(2,3)` instead of `(2,3,0)`; fixed in `e70fa1f3bb5cc350e4b298feb706a21661c75c50` |
| Run [#40204947377](https://github.com/smeyerhuky/claude-react/actions/runs/40204947377) | Reported successful for `e70fa1f`: 5 tests, 48 node checks, 24 midpoint checks, 0 observed disagreements; artifact [#12602898806](https://github.com/smeyerhuky/claude-react/actions/runs/40204947377/artifacts/12602898806) |

**Avoid conflating workflows.** `Colorado OSM road comparison (manual)`, `Colorado multi-threshold metro winners`, and `Colorado geographic correctness validation` are different workflows. Only a specific run of the named workflow proves that workflow executed. Do not infer a comparison run from a geographic-validation run.

## 6. Why midpoint results are not independent geographic validation

The midpoint diagnostic models an edge as a straight line between retained contracted nodes and charges half of its edge weight to reach its downstream endpoint. When a reverse arc exists, it permits movement toward the upstream endpoint using half of the **cheapest reverse edge's** weight. This is an approximation:

1. The reverse edge may not represent the same physical centerline or traversal geometry as the selected forward keyed edge, especially with parallel carriageways.
2. A contracted edge may contain substantial geometry/curvature absent from the retained graph; its straight endpoint chord does not locate the true road midpoint.
3. The midpoint is *on a graph edge by construction*, not an arbitrary geographic pixel independently snapped to a road segment.
4. Comparing midpoint winners with the **origin vertex** is not the same as checking the raster's **nearest vertex** for a pixel.
5. Randomly sampling four edges is unlikely to encounter metro winner boundaries or difficult network discontinuities.
6. The shortest-path oracle uses the same clipped graph, candidate set, and modeled weights. It checks allocation implementation consistency, not real-world completeness.

The `midpoint_vs_origin_vertex_disagreements` counter is **diagnostic**, not a failure condition. Zero observed disagreements on 24 comparisons cannot establish that the raster or polygons are correct.

## 7. Highest-risk unresolved issues

**P0 — Correct geographic snapping and source completeness.** Retain full routable polyline geometries (not just endpoints), use a spatial edge index, snap arbitrary lon/lat points to eligible segments, and explicitly model approach cost and direction. Identify inaccessible points, disconnected components, parallel/one-way ambiguities, and distance-to-network thresholds. Never silently substitute straight-line metro distance.

**P0 — Clipped corridor boundary effects.** Compare corridor graph against a substantially buffered or larger reference graph, including eligible metro sources beyond the corridor. Detect routes that leave/reenter the crop and report winner changes. Do not call a boundary correct when external paths/sources are untested.

**P0 — Boundary-focused independent oracle.** Build a stratified test corpus of random interior pixels, near-edge points, roads with parallel arcs, water/roadless cells, disconnected areas, and especially places where neighboring vertices disagree on winner. Compute independent point-to-edge shortest-path winners and compare against raster outputs, reporting mismatches and tolerances by category and threshold/metric.

**P1 — Land/water provenance.** Select a verified polygon dataset, pin version/hash/licensing, test lakes, holes, islands and boundary pixels. A state outline is not a water mask. Track on-land assigned, on-land unassigned, off-land, unreachable, and too-far-from-road classes separately.

**P1 — Sampling/rendering fidelity.** Replace nearest-vertex coloring only after correctness gates. Quantify pixel resolution, aliasing, tile seam consistency, uncertainty bands around winner boundaries, and memory/build/network/browser costs. Preserve transparent no-data.

**P1 — Routing realism.** Validate one-way tags, turn restrictions, motorway ramps, access restrictions, speed assumptions, duplicate edges and travel-time profile. The current model is an approximate network cost, not live driving ETA.

**P2 — Generalization.** After Colorado passes, benchmark larger geographic regions and nationwide coverage, candidate indexing, incremental builds, stable versioned artifacts, and production UI integration. No production rollout before those gates.

## 8. Proposed implementation plan and measurable acceptance gates

### Phase A — Source and edge geometry correctness

1. Add a geometry-preserving edge export/index (with OSM way IDs, directed keyed edge IDs, complete polyline, length/time, provenance). Keep existing graph algorithm intact.
2. Add synthetic fixtures: bent road, two parallel roads, one-way road, reverse-only road, bridge crossing without junction, cul-de-sac, unreachable component, boundary crop.
3. Implement deterministic closest-*eligible-segment* snapping with multiple candidates, geodesic/projection error bound, and explicit `off_network` classification.
4. Gate: fixture snaps/approach costs and direction match hand-computed expectations, with no unsupported fallback.

### Phase B — Independent geographic routing oracle

1. For each point, generate valid directed starting states on snapped segments; compute route cost to all qualifying metro sources (or a demonstrably equivalent reverse multi-source oracle).
2. Handle partial-edge cost, parallel edge keys, bidirectional access, ties, unreachable outcomes, and source snap uncertainty explicitly.
3. Use separate implementation/tests for point sampling versus production tile renderer; report where shared graph/candidate assumptions limit independence.
4. Gate: all deterministic fixtures pass; no unexplained CBSA disagreements on a reproducible stratified corpus. Record **sample counts per stratum**, rather than only a global aggregate.

### Phase C — Boundary/crop robustness

1. Construct buffered/reference extracts and compare matched sample points to the current corridor.
2. Prioritize all near-crop points and high-disagreement candidate boundaries.
3. Gate: publish change rates and affected geographic regions; do not assert global correctness while missing sources or external paths can change winners.

### Phase D — Land and rendering validation

1. Pin authoritative land/water geometry and licenses; preserve holes and missing-data semantics.
2. Generate geographic point-to-edge tiles and independent reference samples; measure coverage/confidence.
3. Gate: seam checks, transparent/no-data checks, boundary mismatch audit, land/water QA, size and runtime budgets.
4. Only then propose production integration in a **separate PR** with screenshots, provenance and rollback plan.

**Suggested report schema:** `{status, code_sha, osm_sha256, metros_sha256, graph_bounds, graph_nodes, graph_edges, candidate_count, rejected_candidates, thresholds, metrics, sample_strategy, sample_seed, strata:[{name,count,mismatches,unreachable,too_far,examples}], crop_reference, land_mask_source, limitations, resource_usage}`. Include coordinates and expected/actual winners for mismatches while avoiding misleading labels such as `certified` until gates are met.

## 9. Reviewer checklist for the next engineering PR

- [ ] PR is scoped to experiments; no accidental production UI changes.
- [ ] Exact source SHA256 and data license/provenance recorded.
- [ ] Correct `MultiDiGraph` keyed-edge and parallel-edge semantics.
- [ ] One-way/partial-edge direction and cost tests, including nontrivial geometry.
- [ ] Independent geographic points (not only nodes or edge midpoints) tested.
- [ ] Explicit unreachable, unsnapped, excluded-source and clipped-route reporting.
- [ ] Boundary-focused sample strata and reproducible seeds.
- [ ] Real GitHub Actions run **confirmed**; run ID, SHA, logs, JSON artifacts inspected.
- [ ] No claim of geographic certification or production readiness without land/crop/boundary gates.
- [ ] Review artifact size/runtime; maintain manual dispatch and optional auto disable.

## 10. Immediate next action

Open a **separate implementation PR** for Phase A geometry-preserving edges and a small synthetic point-to-edge oracle, with fixtures first. Keep the existing successful road-node and midpoint checks as regressions. Only expand real-data CI sampling after resource budgets are measured. This handoff PR changes **documentation only** and should not be treated as validation evidence.


---

# Part II — Overall Metro Map / road-network allocation program

> **This is the project-level destination and implementation roadmap.** Part I is only the current Colorado validation substage. The authoritative detailed product specification is [ROAD_NETWORK_REGIONS_PLAN.md](./ROAD_NETWORK_REGIONS_PLAN.md), complemented by [METRO_MAP_ROAD_ROUTING_HANDOFF.md](./METRO_MAP_ROAD_ROUTING_HANDOFF.md), [METRO_MAP_HANDOFF.md](./METRO_MAP_HANDOFF.md), and [GETTING_STARTED_METRO_MAP.md](./GETTING_STARTED_METRO_MAP.md). Some older documents describe earlier historical states; verify current `main` and workflow runs before interpreting them as present status.

## 11. End product: national interactive metro population regions

The actual product is the existing **Metro Population Regions interactive map**, not a Colorado-only route explorer. It currently presents straight-line, population-threshold nearest-Census-metro Voronoi regions. The strategic feature is a second **By road** map mode that allocates each eligible geographic location to the qualifying Census Vintage 2025 metro representative point reachable with the least **directed driving cost**.

This is a **network nearest-facility / network Voronoi allocation**. It is *not* an official CBSA geographic boundary, and not merely a conventional isochrone: an isochrone is a single origin's equal-travel-time contour. Optional 30/60/90-minute contours are a separate, later overlay.

The long-term application must support **lower-48 national geography**, **state-focused views**, and eventually a second state-level **State places** basis (incorporated places/CDPs), while keeping the current national **Straight-line** experience intact and fast.

## 12. Product experience and invariants

### National metro map

- Preserve official Census Vintage 2025 CBSA IDs, representative coordinates and population thresholds. Do not replace official data with sample cities or call Voronoi regions official CBSA boundaries.
- Keep the existing **Straight-line** map as the default; add **By road** as an explicit choice.
- In By road, provide **Drive time** (fastest modeled travel time, recommended default) and **Drive distance** (shortest eligible road length), independently optimized. Do not substitute the distance traveled on the fastest-time path.
- The population threshold controls *which metros can win*; a new threshold must recompute/select mathematically correct allocations. Never silently substitute a nearby precomputed threshold.
- Preserve the current full-screen responsive map, compact gray controls, map labels/legend, city search, selected-city details, up to six pinned cities, pinned-population comparison, Copy link, browser Back/Forward, full-map reset, keyboard accessibility, and PNG export.
- In By road, show the winning metro and modeled travel cost on point inspection, plus route profile/data vintage and explicit `no routable connection` / `off network` states. Avoid live-traffic or ETA promises.
- Persist `mode`, `metric`, `threshold`, selected city, pins and comparison state in shareable URLs and browser history. Export must depict the selected mode/metric and include attribution/version/caveats.
- Preserve national metro colors and stable CBSA identity across mode switches. Make loading, unavailable coverage, retry and cancellation visible, not a hidden switch to straight-line assignments.

### State page: two distinct map bases

**S1 — National metros (state focus):** choose a state and clip/zoom the *display* to its geography while using the **same nationwide graph and national eligible metro set**. An out-of-state metro can legitimately win within the displayed state. State lines are not routing barriers. Keep national/state navigation, share state, inspector, pins, export, and both distance methods.

**S2 — State places (separate committed deliverable):** add a second **Map basis** control on the same state page, with **National metros** and **State places**. State places uses official Census incorporated places and CDPs with compatible population estimates and Gazetteer/TIGER geographic points; it has a **separate, smaller threshold** and facility eligibility policy. The road network must still permit cross-state travel. Recommend border-realistic nearby place competition, with any state-only facility restriction clearly disclosed. Save thresholds independently per basis. Before S2 data is ready, show it as disabled/coming later rather than pretending it works.

## 13. Full system architecture: from source data to browser

```text
Census Vintage 2025 CBSA origins + later Census place origins
              | provenance, joins, population eligibility
Versioned nationwide OSM PBF / stitched connected road graph
              | directed access, keyed parallel edges, turn policy, cost profiles
Globally equivalent location -> qualifying facility allocation
              | shortest time AND shortest distance, correct thresholds
Verified point-to-road snapping + geographic sample classifications
              | adaptive sampling near winner boundaries and road gaps
Land/water mask + no-data/unreachable confidence
              | global grid, seam checks, compressed versioned tiles
Manifest / immutable CDN or Pages assets / on-demand viewport loader
              | opt-in, cancel, progress, cache, mobile/browser budgets
Existing React metro map + Straight-line / By road + state map bases
              | legend, inspector, share URL, pins, export, accessibility
```

**Core algorithm:** For each metric, compute location→metro directed shortest-path costs, potentially via reversed-edge multi-source propagation where equivalent. The nationwide destination competition must be global. Partition/state boundaries are storage and display divisions, **not routing barriers**; detours may leave and re-enter partitions. A fixed geographic halo is not sufficient without proof.

**Threshold strategy:** Precomputed winner rasters for a few presets are correct *only* for those presets. Either build a threshold-independent cost/candidate representation that provably answers arbitrary population thresholds, or explicitly limit the By road UI to supported tested presets. Make that product decision before national tile design.

**Delivery strategy:** Prefer offline-generated, versioned, compressed static winner/cost tiles over a per-pixel browser route API. GitHub Pages serves actual published static files, not backend routes. A CDN/object store or paid routing service requires separate infrastructure, costs, CORS and operational review. Keep full PBF/graph outside the Vite bundle and ordinary first-load path.

## 14. Complete roadmap and stage gates

| Stage | Deliverable | Exit / evidence required | Current state |
| --- | --- | --- | --- |
| **Foundation — existing Metro Map** | Census 2025 straight-line map, search, threshold, pins, comparison, sharing, PNG export, responsive UI and screenshot CI | Preserve regression suite and deployed straight-line behavior | Existing application; verify latest deployed CI independently |
| **A0 — routing feasibility** | Colorado road graph, directional/cost semantics, routing equivalence, six-route explorer, performance/dashboard research | Real-data logs/artifacts, independent sample routes, resource benchmarks | Research work exists; see prior routing handoff |
| **A1 — winner field** | Colorado multi-threshold node allocations, independent distance/time, candidate/reachability diagnostics | Nontrivial threshold differences, independent node oracle | Implemented experimentally; 48 sampled node checks passed in known run |
| **A2 — geographic correctness** | Geometry-preserving edges, arbitrary point-to-edge snapping, independent geographic oracle, adaptive boundary sampling, land/water mask, crop robustness, raster validation | Verified sample strata and crop comparisons; no fabricated coverage | **Current critical path**. Existing midpoint diagnostics are insufficient |
| **A3 — browser road-mode prototype** | Scoped Colorado beta switch, time/distance tabs, inspector, attribution, transparent no-data, URL state, accessible loading | Visual screenshots, export checks, responsiveness, meaningful boundary evidence | Not production-ready; start only after A2 data gates |
| **N1 — nationwide routing correctness** | Connected lower-48 graph, global eligible CBSA sources, border-safe routing/partition equivalence | Exact sample equivalence across state/partition boundaries and external detours | Future |
| **N2 — nationwide geographic layers** | Land-masked adaptive winner/cost tiles, versioned manifests, threshold semantics, seam and payload validation | Cross-state goldens, refresh/provenance, storage/compute budgets | Future |
| **B — national By road UI release** | Opt-in nationwide map with both metrics, loading/progress/cancel/cache, pins/share/export | CI functional + visual + accessibility, acceptable performance and clear coverage | Future |
| **S1 — state-focused national metros** | State selector and display clipping, same national candidate competition | Out-of-state winner tests, URL/history/PNG and mobile QA | Future |
| **S2 — state places basis** | Census place estimates and points, separate thresholds and state-page map basis | Colorado + smaller-state pilot, vintage/ID joins, cross-border policy tests | Future |
| **D — optional overlays** | True 30/60/90-minute city isochrone contours, optional future traffic | Separate semantics, UX and hosting review | Optional later |

Stages may overlap for prototypes, but **no national production claim** until N1/N2 correctness gates. S1 and S2 are both planned, not interchangeable.

## 15. Nationwide cross-border correctness (non-negotiable)

1. Build a versioned lower-48 directed graph or seamlessly stitched partitions with stable global road IDs, directed border arcs, and eligible metro origins across state lines.
2. Establish a reference oracle with border-adjacent points, metro winners headquartered in other states, routes that exit/re-enter the selected state, one-way bridges, disconnected components, and long detours.
3. Test global winner and cost equivalence for optimized partition/hierarchical/distributed approaches. Reject independent per-state routing and unproven fixed buffers.
4. The state-focused UI may clip display, but must never filter the graph to the state or exclude out-of-state metro candidates when the basis is National metros.
5. Document how international borders, AK/HI, ferries and noncontiguous geography are handled; the initial target is the contiguous lower 48.

## 16. Opt-in loading, progressive rendering and budget

The normal Straight-line map must remain lightweight. Road data is an **explicit opt-in** with an estimated download size for the current view, approximate-data notice, and **Load / Cancel** affordance.

- After consent, fetch a small manifest, then coarse tiles intersecting the viewport; render verified partial coverage immediately, then refine. Prioritize visible tiles and cancel/reprioritize on view, state, metric or threshold changes.
- Distinguish **downloading**, **decoding**, **indexing**, and **rendering**. Use byte-accurate progress when total bytes are known; provide retry, cancellation, and failure states.
- Keep unloaded, unreachable, off-land and unsupported pixels distinct and transparent. Never paint unavailable road tiles with straight-line winners.
- Publish immutable checksummed assets under a real static URL namespace or CDN, with appropriate caching, CORS and licensing. Browser caching may use standard HTTP cache and tested optional persistent storage.
- Measure mobile bandwidth, decoding time, memory, GPU/canvas draw time, tile size, full lower-48 storage, regeneration time and hosting costs. Set concrete budgets from benchmarks rather than inventing numerical targets.

## 17. Testing, release process and ownership

**Correctness:** synthetic directed/keyed-edge and geometry fixtures; independent road-node and point-to-edge goldens; population threshold changes; unreachable classification; road/water masks; adaptive boundary strata; full-graph interstate and partition equivalence.

**UI:** keyboard/tab behavior, mobile header fit, search, pin limit and comparisons, state-page basis/threshold persistence, Back/Forward, share links, legends, selected markers, export PNG **visual content** (not only PNG signature/dimensions), dark/light and low-bandwidth/cancel/retry states.

**CI/release:** The Metro Map Screenshot workflow is scoped to metro-related paths; screenshot gallery and visual artifacts require review. Pages deploy and post-merge smoke/timelapse are distinct checks. Never treat a PR check as proof that Pages deployed correctly. Heavy Colorado workflows remain manual-capable and can be disabled for automatic execution via the documented variable.

**Working agreement:** Create focused feature branch → commit code and tests → open PR → inspect exact GitHub Actions run, logs, artifacts, screenshots and performance → **leave PR for user review and merge** unless the user explicitly directs otherwise. Document both failures and successes, with run URLs and commit SHAs. No silent merge and no assertion of execution without a workflow run.

## 18. What the next engineer should actually do

1. Read [GETTING_STARTED_METRO_MAP.md](./GETTING_STARTED_METRO_MAP.md), [METRO_MAP_ROAD_ROUTING_HANDOFF.md](./METRO_MAP_ROAD_ROUTING_HANDOFF.md), [ROAD_NETWORK_REGIONS_PLAN.md](./ROAD_NETWORK_REGIONS_PLAN.md), and **Part I of this handoff**. Resolve stale chronology by inspecting `main` and real Actions runs.
2. Confirm the production metro map still uses Straight-line and that PR #119's midpoint code is on `main`; verify latest workflow conclusions rather than relying on old summaries.
3. Implement **A2 Phase A** in a small PR: geometry-preserving keyed road segments, segment spatial index and synthetic arbitrary-point snapping fixtures. Preserve A1 and midpoint regression behavior.
4. Then add independent point-to-road route cost and boundary/crop sample tests; inspect real Colorado artifacts and resource costs before expanding.
5. Only after A2 succeeds, prototype the opt-in By road UI and plan N1/N2 lower-48 data delivery. Keep S1 state focus and S2 State places visible in the roadmap; do not quietly drop them.

### Resume prompt

> Continue the **entire Metro Population Regions / By road program**, not only the Colorado midpoint experiment, in `smeyerhuky/claude-react`. Read `docs/COLORADO_GEOGRAPHIC_VALIDATION_HANDOFF.md` (Parts I and II), `docs/ROAD_NETWORK_REGIONS_PLAN.md`, `docs/METRO_MAP_ROAD_ROUTING_HANDOFF.md`, and `docs/GETTING_STARTED_METRO_MAP.md`. Confirm latest `main` and Actions conclusions. Preserve the current Census 2025 Straight-line map and existing UI. The next critical path is A2 independent geographic point-to-edge validation in Colorado; then a scoped opt-in road UI, nationally connected lower-48 routing/tiles, state-focused National metros, and separate State places basis. Use independently optimized directed driving time and shortest road distance, correct threshold eligibility, explicit no-data, global cross-state routing, versioned opt-in tiles, accessibility, share/export and measured performance. Open focused PRs for my review; do not merge without my instruction. Never claim an experiment ran without verified Actions evidence.
