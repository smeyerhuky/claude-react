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
