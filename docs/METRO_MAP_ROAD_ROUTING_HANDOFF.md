# Metro Map + Colorado Road Routing — Full Session Handoff

_Last verified: 2026-10-24 UTC. Repository: [smeyerhuky/claude-react](https://github.com/smeyerhuky/claude-react). This is a living handoff, not an assertion that every roadmap item has shipped._

> **START HERE IN A NEW SESSION:** Read **[GETTING_STARTED_METRO_MAP.md](./GETTING_STARTED_METRO_MAP.md)**, then this document, [METRO_MAP_HANDOFF.md](./METRO_MAP_HANDOFF.md), and [ROAD_NETWORK_REGIONS_PLAN.md](./ROAD_NETWORK_REGIONS_PLAN.md). **Verify GitHub Actions live**, particularly [dashboard run #40140558960](https://github.com/smeyerhuky/claude-react/actions/runs/40140558960), before declaring it passed/failed. This handoff was initially written while its real-data route/benchmark step was **still running**. Update the evidence ledger with the final result and artifact ID after checking GitHub.

## Mission and definition of done

The real product is the **Metro Population Regions interactive map**, not a standalone routing toy. Keep the official Census Vintage 2025 metro inventory, population-threshold filtering, labels, search, selected/pinned cities, comparisons, shareable URLs, PNG export, accessible responsive UI, and existing **Straight-line** Voronoi map. Add a clearly labeled **By road** mode with independently computed **Drive time** and **Drive distance** winner assignments: **each land/road sample is allocated to its nearest qualifying metropolitan representative by directed road-network cost from location to metro**. Use truthful unreachable/coverage semantics. This is network nearest-facility/Voronoi allocation—not official CBSA boundaries and not simply isochrone rings.

Successful end state: a responsive lower-48 map whose straight-line mode keeps its current behavior while the road mode loads appropriate static/persisted network-allocation data; any supported population threshold yields correct winners, correct independently optimized road time/distance, and accurate road-mode attribution; pins, search, history/share, labels and export work for both. Measured browser/network budgets, CI screenshot/e2e tests, reproducible graph/tiles, versioned input metadata and licensing review are mandatory for shipping.

**Current boundary:** Colorado graph, comparison experiments, routes and dashboards are **experimental research artifacts**. The road-mode population-threshold map **has not been integrated into production UI**. Never conflate proving point-to-point routing equivalence with proving every metro allocation correct across the country.

## Operating agreement (important)

- User reviews and merges PRs. Work on a targeted feature branch and open a reviewable PR; do **not** merge without explicit permission.
- When told “go,” implement the next useful milestone, not just a proposal.
- Inspect **actual GitHub workflow run, job steps, logs and artifacts** before asserting success, failure, or performance numbers. A merged PR or green synthetic tests alone do not prove a real-data workflow.
- Distinguish: code committed → PR open → merged → workflow dispatched → job in progress → completed with conclusion → logs/artifact inspected.
- Record failed experiments, root causes and remediations, not just wins; never silently discard evidence.
- Regional bboxes, snapping and simplifying routing assumptions must be documented. No synthetic paths should be presented as real roads.

## Existing metro map / UI baseline

Older detailed map history and behavior contract: [METRO_MAP_HANDOFF.md](./METRO_MAP_HANDOFF.md). Main components: `src/components/MetroPopulationVoronoi.jsx`, `public/data/metros-census-2025.csv`, `src/components/layout/ComponentView.jsx`, `src/config/navigation.jsx`, `scripts/capture-metro.mjs`, `scripts/capture-app-states.mjs`; workflows `.github/workflows/metro-screenshot.yml`, `.github/workflows/metro-merge-timelapse.yml`, and `.github/workflows/deploy.yml`. Read these on current `main` before changing them.

Previously merged metro PRs #63–#84: lower-48 Albers projection/land clipping; official Census 2025 metro data and stable CBSA IDs; metro Voronoi shading, search/statistics, mobile/fullscreen navigation, neutral map controls, up to six city pins, selected/pinned colors, comparisons, hash deep linking/history, PNG export, PR screenshots and deployment verification. PRs #86–#92 later advanced map quality (inspect their diffs/workflows rather than making unverified individual claims here). **Existing shading is straight-line, not road cost.**

Metro map product rules: regions are *not* Census administrative boundaries; preserve population-threshold semantics; straight-line stays default and fast; road-mode browser loads lazily; full-screen mobile composition must remain usable; no fabricated coverage or unlabelled traffic ETA.

## Technical road-research sequence and evidence ledger

All URLs below are real GitHub references. Recheck statuses as needed; old artifact retention is short (often 14 days), so logs, manifest summaries and this ledger matter.

| Milestone | PR(s) / workflow | Evidence and measured outcome |
| --- | --- | --- |
| Initial bounded Colorado real-road extraction and winner comparison | Early experiments, `colorado-road-evidence.yml` | [Run #40060661146](https://github.com/smeyerhuky/claude-react/actions/runs/40060661146): **success**. 366,595 road ways, 544,304 compressed nodes, 1,308,248 directed edges; 532,943 reachable nodes; 50,284 (~9.4%) differed on time vs distance metro allocation. Samples are road graph nodes, **not raster polygons**. |
| Routing topology correction | [PR #100](https://github.com/smeyerhuky/claude-react/pull/100) | Preserve repeated OSM nodes as junctions while contracting graph; important for network connectivity and equivalence. |
| All-source cost/reachability equivalence | `colorado-routing-equivalence.yml` | [Run #40061136481](https://github.com/smeyerhuky/claude-react/actions/runs/40061136481): **success**, 13,065,168 directed origin–destination–metric comparisons, **zero cost and reachability mismatches** at 0.001 m / 0.001 s. Full graph 2,238,812 vs compressed 544,382 nodes. |
| Compression performance baseline | [PR #101](https://github.com/smeyerhuky/claude-react/pull/101), `colorado-routing-performance.yml` | [Run #40067445662](https://github.com/smeyerhuky/claude-react/actions/runs/40067445662): **success**. Nodes 2,238,812→544,382; edges 4,400,653→1,308,543; build 46.62→27.32 s; peak RSS 4.19→1.25 GiB; median single-source routing length 8.32→2.32 s (3.59×), time 9.02→2.48 s (3.63×). |
| Point-to-point graph validation | [PR #102](https://github.com/smeyerhuky/claude-react/pull/102), fix [#103](https://github.com/smeyerhuky/claude-react/pull/103), `colorado-point-to-point.yml` | Initial [run #40074608214](https://github.com/smeyerhuky/claude-react/actions/runs/40074608214) **failed** synthetic test because test endpoints were not retained by compression. Fixed in #103. [Run #40101722369](https://github.com/smeyerhuky/claude-react/actions/runs/40101722369): **success**, 408 directed pairs / 816 metric comparisons, 0 reachability/cost mismatches; median distance 2.120→0.659 s, time 1.632→0.494 s (~3.2–3.3×), peak RSS 4.17→1.23 GiB. |
| First static route explorer (real OSM) | [PR #104](https://github.com/smeyerhuky/claude-react/pull/104), `colorado-route-explorer.yml` | [Run #40129638930](https://github.com/smeyerhuky/claude-react/actions/runs/40129638930): **success**. Denver→Boulder and Denver→Colorado Springs, shortest distance and fastest modeled time, strict graph cost cross-check, PNG/JSON/log artifact. |
| Offline interactive HTML explorer | [PR #105](https://github.com/smeyerhuky/claude-react/pull/105), fixes [#106](https://github.com/smeyerhuky/claude-react/pull/106), [#107](https://github.com/smeyerhuky/claude-react/pull/107) | [Runs #40130323884](https://github.com/smeyerhuky/claude-react/actions/runs/40130323884) and [#40130445863](https://github.com/smeyerhuky/claude-react/actions/runs/40130445863) **failed before jobs** (literal `\\n` escaped newlines made workflow YAML invalid). #106 fixed YAML. [Run #40133377396](https://github.com/smeyerhuky/claude-react/actions/runs/40133377396) **failed during synthetic tests**: literal `\\n` in Python source triggered `SyntaxError`. #107 fixed Python. [Run #40134173216](https://github.com/smeyerhuky/claude-react/actions/runs/40134173216): **success**, 2 city pairs/both metrics, viewer tests passed; artifact [#12575802748](https://github.com/smeyerhuky/claude-react/actions/runs/40134173216/artifacts/12575802748) includes standalone `interactive.html`. |
| Route Explorer v2: mountain/rural | [PR #108](https://github.com/smeyerhuky/claude-react/pull/108), merged | [Run #40136868252](https://github.com/smeyerhuky/claude-react/actions/runs/40136868252): **success**. 395,724 OSM ways, 591,328 compressed nodes, 1,414,451 directed edges; six city pairs, three categories, both metrics, strict cost equivalence; five synthetic and three viewer tests passed. Artifact [#12577236006](https://github.com/smeyerhuky/claude-react/actions/runs/40136868252/artifacts/12577236006). |
| Per-route offline performance dashboard | [PR #109](https://github.com/smeyerhuky/claude-react/pull/109), **merged 2026-10-24 22:54:50 UTC** | [Run #40140558960](https://github.com/smeyerhuky/claude-react/actions/runs/40140558960), initiated 22:55 UTC. **At documentation checkpoint: in progress; setup, OSM extraction, synthetic explorer tests, viewer tests and dashboard tests passed; real six-pair benchmark step in progress; no artifact yet.** Check live status, job logs, conclusion and upload before updating this row or quoting numbers. |

**Comparison warning:** graph sizes/timing vary across different bboxes, OSM snapshots and benchmark types. Single-source and point-to-point latency cannot be directly compared as the same benchmark. Benchmark samples in #109 are **three warm-cache sequential bidirectional Dijkstra calls per graph/route/metric**; not p95/p99, memory, throughput or end-to-end build cost. The prior 4.19/1.25 GiB result comes from a **different, separately verified benchmark**, not #109.

## What exactly exists after PR #109

- `.github/workflows/colorado-road-evidence.yml`: manual metro allocation comparison at sampled Colorado road nodes.
- `.github/workflows/colorado-routing-equivalence.yml`: strict route equivalence.
- `.github/workflows/colorado-routing-performance.yml`: build, memory, and single-source latency benchmark.
- `.github/workflows/colorado-point-to-point.yml`: directed point-to-point benchmark/equivalence.
- `.github/workflows/colorado-route-explorer.yml`: downloads Geofabrik Colorado PBF; extracts `--bbox=-106.1,38.65,-104.5,40.1`, filters tagged highways; runs regression tests; builds graph/routes; uploads 14-day artifact.
- `scripts/stream_osm_roads.py`: PBF directed road graph and contraction.
- `scripts/validate_colorado_routing.py`: uncompressed reference graph and validation support.
- `scripts/benchmark_colorado_routing.py`, `scripts/benchmark_colorado_point_to_point.py`: other benchmarking modes.
- `scripts/colorado_route_explorer.py`: seven city-center coordinates, six directed trips, path drawing, strict `0.001` m/s cost comparison, graph sizes and timing samples; writes `routes.json`, `colorado-routes.png`, `interactive.html`, `performance.html`.
- `scripts/colorado_route_explorer_html.py`: embedded offline SVG route viewer, trip/category/metric controls and zoom/pan.
- `scripts/colorado_route_performance_html.py`: offline comparison of per-route full/compressed median query milliseconds, calculated speedup, graph sizes, cost deltas, category filter. Checks input `status=pass`, positive timing samples and bounded deltas.
- `scripts/test_colorado_route_explorer.py`, `scripts/test_colorado_route_explorer_html.py`, `scripts/test_colorado_route_performance_html.py`: synthetic regressions.

Six pairs: Denver→Boulder; Denver→Colorado Springs; Denver→Idaho Springs; Idaho Springs→Georgetown; Boulder→Nederland; Colorado Springs→Fairplay. Categories: Front Range, Mountain corridor, Rural / mountain.

## Known limits and open correctness questions

1. Regional clipping can omit cross-boundary detours; it is not a statewide or nationwide routability guarantee. The v2 bbox does not cover all Colorado highways.
2. Static simplified OSM road speeds, filtered roadway tags, nearest road vertex snapping and no full turn restrictions/traffic/junction delays/access policy; not a navigation product or live ETA.
3. Explorer currently validates **full-vs-compressed path cost**, but **not the original metro-allocation winner grids under all thresholds**. The route explorer starts at snapped city centers; production allocation must explicitly handle location→metro direction using reverse-graph multi-source routing.
4. Viewer shows geographic polyline SVG with no basemap, not complete geographic road-network shading.
5. OSM downloaded from `colorado-latest.osm.pbf`, SHA-256 recorded for each workflow; this does **not** pin an immutable upstream version for full replay. Capture stable snapshots if reproducibility across dates is required.
6. Repeated three-sample query timing is a **demo benchmark**, not statistically robust latency. Larger N, warmup policy, p50/p95/p99, RSS, OS/runner details, cost/edge parity and repeated CI runs are future work.
7. No national packaging, browser tile delivery, arbitrary-threshold-correct winner representation, threshold-dependent metro snapping/profiles, full road-mode interaction, or ODbL distribution/attribution review is finished.
8. Existing earlier handoffs/docs carry **historical statuses** (for example “no routing implementation committed”), and are outdated in that respect. Treat **this document and live GitHub** as newer evidence; retain old docs for their architecture/decision rationale.

## Failure catalog and what we learned

| Failure | Observed evidence | Root cause / corrective action | Permanent prevention |
| --- | --- | --- | --- |
| Large XML graph path stalled | [Run #40050869301](https://github.com/smeyerhuky/claude-react/actions/runs/40050869301), detailed [COLORADO_STREAMING_RETRY.md](./COLORADO_STREAMING_RETRY.md) | ~649 MiB intermediate XML was costly to parse; switched to pyosmium streaming PBF, bounded extraction and graph phases. | Log timings/RSS, preserve input checksum; no huge XML roundtrip. |
| Compressed topology misconnection risk | [PR #100](https://github.com/smeyerhuky/claude-react/pull/100) | Repeated OSM nodes must remain graph junctions. | Enforce directed equivalence test and tiny synthetic network topologies. |
| Synthetic point-to-point test failed | [Run #40074608214](https://github.com/smeyerhuky/claude-react/actions/runs/40074608214) | Test used source/destination vertices removed by contraction. [PR #103](https://github.com/smeyerhuky/claude-react/pull/103) selected retained nodes. | Tests must respect contraction invariant; assess unreachable/one-way cases. |
| Two explorer workflows failed before any jobs | [Runs #40130323884](https://github.com/smeyerhuky/claude-react/actions/runs/40130323884), [#40130445863](https://github.com/smeyerhuky/claude-react/actions/runs/40130445863) | Literal `\\n` in YAML source, fixed in [PR #106](https://github.com/smeyerhuky/claude-react/pull/106). | YAML parse/validation before PR; if zero jobs, inspect workflow syntax immediately. |
| Explorer job scheduled but Python synthetic test failed | [Run #40133377396](https://github.com/smeyerhuky/claude-react/actions/runs/40133377396) | Literal `\\n` in generated Python statements → `SyntaxError`; fixed [PR #107](https://github.com/smeyerhuky/claude-react/pull/107). | Run `python -m py_compile` + tests on modified scripts before dispatch; inspect written file, not only intended change. |
| Frontend metro CI workflow YAML failure | Historic [METRO_MAP_HANDOFF.md](./METRO_MAP_HANDOFF.md) (#80–#82) | Unquoted colon in single-line YAML `run:` caused invalid workflow. | Prefer block scalar `run: |` and validate YAML. |
| PNG export has incomplete visual assurance | Historic [METRO_MAP_HANDOFF.md](./METRO_MAP_HANDOFF.md) | Existing Playwright checks prove PNG header/dimensions, not accurate pixels/labels/markers. | Artifact visual captures and meaningful pixel/content checks; do not claim full export fidelity. |

**Evidence discipline:** record run ID, commit SHA, source checksum, parameters, pass/fail phase, error excerpts, first reproducible cause, corrective PR, rerun and artifact; update this document after each experiment. Never “fix” data errors by falling back silently to straight-line routing or fake edges.

## Overall roadmap: what remains

### Track A — ship the product feature (primary critical path)

- **A1: Reconnect experiment to actual metro population map.** Build a bounded Colorado **location→qualifying-CBSA** winner-data pipeline, not another arbitrary city-pair viewer. Use the official Census 2025 centers and a minimum-population threshold; confirm snapping policy. Validate two+ thresholds; compare direct/road-distance/road-time assignments and identify known diverging geographic samples. Road winners must include CBSA ID, modeled cost and reachable flag. **Recommended next implementation PR.**
- **A2: Produce displayable region data.** Adaptive sample/grid/tiled raster from valid road allocation; distinguish land/water/unreachable. Quantify gaps, aliasing, border artifacts, geographic accuracy, compressed bytes, build RAM/time and browser rendering, rather than claiming that graph-node dots are continuous regions.
- **A3: Integrate switchable Colorado beta** into `MetroPopulationVoronoi.jsx`: Straight-line default + By road beta (time/distance), scoped coverage, road disclaimer, loading/error/fallback, legend/location inspector and accessible responsive interactions. Test all existing metro states and screenshot gallery.
- **A4: Integrate threshold, pins, search, URL/history and export** with correct road-mode data/version metadata. Ensure supported threshold changes recompute/choose correct winners; do not fake arbitrary threshold support from preset-only tiles.
- **A5: Lower-48 scale**, partitioned reproducible static dataset/tile caching/manifest, independent correctness goldens, infrastructure/payload budgets, precomputed threshold strategy, licensing/ODbL attribution and separate release gating.
- **A6 (optional):** travel-time isochrone contours distinct from winner assignments; persistent hosted routing API only if justified by product constraints and hosting budget.

### Track B — engineering quality / evidence

- **B1 (immediate):** get final conclusion/logs/artifact for [run #40140558960](https://github.com/smeyerhuky/claude-react/actions/runs/40140558960). If failure, diagnose and open repair PR; if success, report measured medians and artifact link, and update ledger. Validate that `performance.html` is in the artifact, not just that upload step ran.
- **B2:** stronger benchmark: warmup, >=30 query samples on representative metro-origin paths, percentile distribution, repeat trials, peak RSS and build time, controls for graph/network snapshot. Do not compare different runner/bbox setups without explicit labels.
- **B3:** CI guardrails: `py_compile`, YAML parse, synthetic directed cases, manifest schema + checksums, pinned Python dependencies or lockfile, failure report preservation (`if: always()`), and artifact index.
- **B4:** audit metro PNG rendering, screenshots, UI accessibility and map deployment; update old dated handoffs to point at this doc. Do not regress straight-line startup/performance.
- **B5:** archive successful and failed experiment metadata in durable committed docs because Actions artifacts expire; make a small repeatable `evidence.json`/Markdown ledger.

## Practical next-session workflow

1. Read [GETTING_STARTED_METRO_MAP.md](./GETTING_STARTED_METRO_MAP.md) and this page; check live `main`, PR #109, and run #40140558960 before trusting any historical status.
2. Review [ROAD_NETWORK_REGIONS_PLAN.md](./ROAD_NETWORK_REGIONS_PLAN.md) for semantics: **location→metro**, threshold, independent shortest time vs length; scrutinize OSM routing assumptions.
3. If #40140558960 failed, fix it first. If passed, inspect `performance.html`, `routes.json` and verified sample measurements. Update the evidence ledger in a documentation PR if needed.
4. Begin **A1**: real Colorado qualifying-CBSA winner data, multiple thresholds, correctness and artifact, without changing production map until the dataset is trustworthy.
5. User-reviewable PR, tests, manual real-data workflow, evidenced results and screenshots; user decides whether to merge.
6. Preserve every run outcome and concrete failure/fix here and link to GitHub logs/artifacts.

### Exact kickoff message to paste into a new chat

> We are continuing the Metro Population Voronoi Map / road-network nearest-metro project in `smeyerhuky/claude-react`. Connect to GitHub and read `docs/GETTING_STARTED_METRO_MAP.md`, `docs/METRO_MAP_ROAD_ROUTING_HANDOFF.md`, `docs/METRO_MAP_HANDOFF.md`, and `docs/ROAD_NETWORK_REGIONS_PLAN.md` on `main`. Verify the final conclusion, logs and artifacts for GitHub Actions run #40140558960 and latest main; do not infer workflow status. Preserve the user-review-and-merge PR rule. Then implement the next roadmap item: **A1, a real Colorado location-to-qualifying-CBSA multi-threshold road time/road distance winner dataset with explicit unreachable coverage, independent costs and actual GitHub Actions validation**, as a focused PR. Keep the existing straight-line metro map unchanged until the data is proven. Record any failures as well as successes.

## Source links / context

- [Map baseline handoff](./METRO_MAP_HANDOFF.md)
- [Road-network regions product and algorithm plan](./ROAD_NETWORK_REGIONS_PLAN.md)
- [Original real OSM road experiment](./COLORADO_REAL_ROAD_EXPERIMENT.md)
- [Streaming PBF retry/failure](./COLORADO_STREAMING_RETRY.md)
- [Route Explorer workflow](https://github.com/smeyerhuky/claude-react/actions/workflows/colorado-route-explorer.yml)
- [GitHub Actions run list](https://github.com/smeyerhuky/claude-react/actions)
