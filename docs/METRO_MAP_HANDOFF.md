> **Current continuation (2026-10-24):** This original UI handoff is retained for historical map implementation details. For the latest Colorado routing experiments, verified run evidence, failures, performance dashboard, product-critical remaining work and fresh-session kickoff, start with **[GETTING_STARTED_METRO_MAP.md](./GETTING_STARTED_METRO_MAP.md)** and **[METRO_MAP_ROAD_ROUTING_HANDOFF.md](./METRO_MAP_ROAD_ROUTING_HANDOFF.md)**. Older “no routing implementation” statements below are historical, not current.\n\n# Metro Population Voronoi Map — Project Handoff

> **Roadmap update (2026-10-23):** The comprehensive proposed **By road** mode (driving-time and shortest-road-distance nearest qualifying metro allocation) is documented in [ROAD_NETWORK_REGIONS_PLAN.md](./ROAD_NETWORK_REGIONS_PLAN.md). This design supersedes the older *optional distance-hover enhancement* as the next major product capability. **Priority:** first a bounded Colorado/Front Range routing-data feasibility PR; then mode tabs/prototype; then national precomputed network data. Existing straight-line map remains the default. No implementation is merged or implied. PRs #86–#92 progressed quality work since this handoff's original baseline; update/reconcile the chronological shipped list after confirming post-merge CI.\n\n
_Last updated: 2026-10-23 · Baseline: `main` after merged PR #84 (`a4ea40146b820b3b14166c843e97e57ef4585076`)._

## Purpose and working agreement

This is the handoff for the next development session on the **Metro Population Regions — Interactive Map** in `smeyerhuky/claude-react`. The user personally reviews and merges PRs: **implement on a feature branch, open a PR, verify GitHub Actions and screenshot comments, and NEVER merge without an explicit instruction**. Favor actual code/test updates over proposals. For UI changes, show the relevant states in PR screenshots, not only the default map.

The map is a nearest-metro **Voronoi visualization**, **not official Census metropolitan statistical area / CBSA boundaries**. Preserve that distinction in UI, exports, and documentation.

## Shipped and merged work (chronological)

- **#63–#69:** Lower-48 `geoAlbers` map projection and land clipping, official Census Vintage 2025 metro dataset (359 metro areas), screenshot and timelapse foundations, short collision-aware labels, search, statistics/detail view.
- **#70–#73:** Desktop/mobile application state screenshots, viewport-first full-screen app, collapsible left controls, expanding search, multi-pin workflows, dotted cell borders, CSS scoping and screenshot workflow container fixes.
- **#74–#77:** Accessibility and dark-preference contrast, blue selected/orange pinned map markers, full-map reset, pinned-population comparison and ratios, shareable hash-router URLs using stable CBSA codes and Copy link.
- **#78–#82:** Render/capture timing instrumentation; Pages deployment payload integrity verification; CI dependency caching; browser history regression; fix broken Actions YAML; metro-specific workflow path filters and main-branch smoke tests.
- **#83:** Map key and geography explainer; larger magnifying-glass search button; pushpin icon buttons; single configurable limit of **6 pinned cities**; in-place city accordion (one automatically expanded, 2–3 compact, 4–6 with up/down scrolling across three rows); neutral, low-saturation gray visual controls; dedicated screenshots of five pinning scenarios. **Merged** as `8dba430528ecac1252597aba4e9e1a72ad95a485`.
- **#84:** **Export PNG** button: composites existing Canvas shading and SVG outlines/labels/markers, adds population threshold and pinned-city summary, saves a 2× PNG. Automated Playwright checks verify PNG signature, filename and dimensions. **Merged** as `a4ea40146b820b3b14166c843e97e57ef4585076`. CI last passed in [run #40031045385](https://github.com/smeyerhuky/claude-react/actions/runs/40031045385).

## Repository map / important files

| Path | Role |
| --- | --- |
| `src/components/MetroPopulationVoronoi.jsx` | D3 projection, Voronoi, Canvas shading, SVG overlays, Census loading, controls, search, pins, accordion, comparisons, hash sharing, PNG export. |
| `public/data/metros-census-2025.csv` | Official metro populations and CBSA identifiers. **Do not replace with approximate fallback seeds.** |
| `src/components/layout/ComponentView.jsx` | Metro route full-screen hosting and viewport handling. |
| `src/config/navigation.jsx` | Metro component entry/navigation route. |
| `src/index.css` | Shared styles; beware unrelated EDM component styles spilling into metro UI. |
| `scripts/capture-metro.mjs` | Functional Playwright coverage: loading, contrast, search, pins, accordion, sharing, history, geometry, downloaded PNG. |
| `scripts/capture-app-states.mjs` | Desktop/tablet/mobile/light/dark plus pin use-case screenshots and visual manifest. |
| `.github/workflows/metro-screenshot.yml` | Screenshot/test CI; artifact upload, screenshot commit on PR, screenshot-gallery PR comment, post-merge `main` smoke tests. |
| `.github/workflows/metro-merge-timelapse.yml` | On metro-related merged PRs, produce MP4 timelapse and release asset/comment. |
| `scripts/build_metro_merge_timelapse.py` | Merge-video builder. |
| `.github/workflows/deploy.yml` | Vite build and GitHub Pages deployment, verifies HTML and Census CSV in deployed branch. |
| `docs/screenshots/` | Automated visual-state PNGs and `visual-manifest.json`. |

## UI / behavior contract

- Full viewport with no outer page scroll; collapsible left controls panel; header has **Map key**, **Export PNG**, **Copy link**, and search.
- Official Vintage 2025 Census data; nearest qualifying metro centers produce color-coded clipped Voronoi regions. Region colors are identifiers, **not population magnitudes**. Dotted Voronoi borders are not official Census boundaries.
- User can change minimum population threshold and label visibility. Selected metro ring is blue; pinned metro ring is orange, with persistent labels on the map.
- Search/tap/keyboard reveals full metro statistics; pins are toggled by pushpin icon with proper accessible names.
- `MAX_PINNED_METROS = 6` and `VISIBLE_PIN_ROWS = 3` live near the top of `MetroPopulationVoronoi.jsx`. Maintain one limit for interactive pins **and** restored shared URLs. One pin auto-expands; multiple pins use a single expanded row; more than three pins have compact up/down list navigation.
- A population comparison overlay for two or more pins includes bars, gap, ratios, and rank. **Design preference:** subdued slate/gray controls, compact whitespace, avoid intense saturated blue call-to-action blocks.
- Shareable state is encoded in the hash-router route `#/metro-population-voronoi?threshold=...&labels=0&city=CBSA&pins=code,code&compare=1`, omitting defaults. Browser back/forward and restoring shared pins are tested.
- PNG export is available on map header and includes underlying Canvas/SVG map plus summary/footer. Export correctness at the *pixel-content* level is **not yet verified**.

## GitHub Actions lessons / runbook

1. When changing metro map/component/test/workflow files, the **Metro Map Screenshot** PR workflow should trigger. Other demo changes should not. The same workflow does a smoke check on `main` after relevant merges. The post-merge video is metro-path scoped; Pages deploy remains a separate general `main` workflow.
2. Critical incident in #80–#82: a single-line YAML `run: echo "... cache: ..."` with an unquoted `:` rendered the workflow YAML invalid. GitHub recorded immediate failures **without jobs or a screenshot comment**; run name appeared as the workflow filename. Fix was using `run: |`. **Always validate workflow YAML if no job appears.**
3. CI uses `mcr.microsoft.com/playwright:v1.56.1-noble`, Node 22, Yarn lockfile and dependency caching. A runner cache miss may be slow. Workflow Git checkout must configure `safe.directory` inside the container.
4. Screenshot CI commits images to PR branch with `[skip ci]`, changing the PR head SHA after tests. To find the relevant passing check, look up the **previous feature commit** or the latest **PR screenshot comment**, not only the current head SHA.
5. The screenshot PR comment links desktop/mobile states and pin scenarios: `pins-one-expanded`, `pins-two-collapsed`, `pins-three-expanded`, `pins-four-scrolled`, `pins-six-scrolled-expanded`. Image URLs should use the bot screenshot commit SHA.
6. Do not mistake screenshot capture failure for map failure. Read failed job step and logs. Prior Playwright mistakes included overbroad selectors matching `Unpin` and an immediate assertion racing React state; use specific role/labels and wait for visible/attached states as appropriate.
7. On a merged metro PR, check the `main` smoke test, Pages deploy, and timelapse release. A passing PR test is **not** proof that the later deployment itself passed.

## Latest state / known gaps

- **#84 is merged** and the baseline for follow-on PRs. This handoff PR contains **documentation only**; no runtime/UI change and should not run metro-only screenshot CI by design.
- **Important next quality gap:** the Playwright PNG test confirms a real downloaded PNG and dimensions; it **does not inspect its rendered visual content**. In particular, inspect whether exported SVG outlines, map labels, selected and pinned markers render correctly on Chromium, whether long city names truncate gracefully and whether up to six footer items are visible. Capture actual downloaded PNGs as CI artifacts and link/embed one or more meaningful examples in the PR comment.
- The screenshot gallery demonstrates pin accordions, but export screenshots should show zero pins, selected city, and multiple pins. Consider visual checks of alpha/background/nonblank map pixels and footer content. Prefer a dedicated PNG export capture path.
- Export draw uses `XMLSerializer` + SVG Blob + `Image.decode()`; if there are failures, investigate foreign font/style references, security constraints, and coordinate scaling without silently dropping overlays.
- Keep geography truthful: `geoAlbers` lower-48, clipped regions, Census data, dotted borders and explicit not-CBSA-boundaries disclaimer.
- Responsive header currently has Map key, Export PNG, Copy link, search; check constrained mobile header widths before adding further controls.
- The docs/README may be stale and contain unrelated showcase instructions; keep the metro handoff here.

## Recommended roadmap (in priority order)

### NEW highest-priority strategic feature: road-network nearest-metro shading
- **Next implementation milestone:** feasibility spike limited to Colorado/Front Range and mountain corridor; choose OSM routing graph, prove multi-source nearest-metro driving time and shortest-road-distance allocations, validate route direction/threshold semantics, measure bytes/compute and collect screenshots. See [full plan](./ROAD_NETWORK_REGIONS_PLAN.md).
- **Follow-on:** switchable Straight-line / By road tabs; secondary Drive time / Drive distance mode; map attribution, legend, location inspector, pins, sharing, PNG export and accessibility. Do not ship road mode as complete until actual routable nationwide allocation data exists.
- **Later:** static lower-48 data generation, tile delivery, tests/benchmarks, optional true isochrone contours. This outranks optional comparison export polish and general hover/tooltips; the PNG export reliability and current CI deployment verification remain release-critical cleanup.


### Next PR: PNG export visual assurance
- In `scripts/capture-metro.mjs` (or a dedicated script) download PNG files for: (1) default map, (2) selected Denver, (3) two–six pins plus comparison if relevant. Save clear artifact names, e.g. `metro-export-default.png`, `metro-export-six-pins.png`.
- Verify PNG dimensions **and visible composition** (map shading/nonblank pixels, footer rows, SVG labels/pins visible). Check that screenshot links actually render in PR comments. Keep the metro screenshot workflow file-path limited.
- Capture representative exported PNGs in the CI PR gallery; make sure exporting does not mutate current app state.

### Later UX polish
- Reduce duplicated actions and extra height in mobile navigation; test header actions and map-shell fitting at small widths.
- Provide obvious but neutral pin accordion affordances, keyboard/focus checks and screen-reader aria-expanded/pressed semantics.
- Improve downloadable image typography and metadata layout if exported screenshots expose spacing problems.
- Consider optional export of the *comparison* itself as a standalone image, if requested; current export is the map with a pinned-city summary, not a recreation of the comparison overlay.

### Later engineering
- Add targeted regression around export failure handling (no Canvas/invalid SVG/disabled button while loading), and consider user-visible feedback for download failure.
- Monitor map readiness benchmarks (~0.55–0.60s in CI at previous baseline), dependency install/cache hits, and Pages integrity step as dependencies evolve.
- Keep screenshot and timelapse workflows aligned with changed component/metro-only file paths.

## Local commands and review sequence

```bash
corepack enable
yarn install --frozen-lockfile
yarn dev
# CI-style smoke testing:
yarn build
yarn preview --host 127.0.0.1 --port 4173
node scripts/capture-metro.mjs
node scripts/capture-app-states.mjs
```

The Playwright browser must be installed/available locally (CI supplies it via the Playwright Docker image, with a driver installed as part of the workflow).

**PR workflow:** Create feature branch → edit component/tests → open PR → wait for Metro Map Screenshot result → inspect test logs **and** screenshot comment/gallery → fix/retest → tell user when merge-ready → **user merges** → verify main smoke/deploy/timelapse before beginning next change.

## Suggested first prompt in a fresh chat

> Read `docs/METRO_MAP_HANDOFF.md` on `main` in `smeyerhuky/claude-react`, verify the latest merged PR and workflow state, then implement the next roadmap item: exported-PNG visual screenshot verification in CI. Open a PR and leave it unmerged for my review.
