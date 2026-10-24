# Getting started: Metro Map / Road-Network Regions (new session)

**The goal:** complete the existing **Metro Population Voronoi Map** by adding an accurate **By road** mode, assigning locations to the nearest qualifying Census 2025 metro by independently optimized **driving time** or **road distance**, while keeping the existing straight-line mode, thresholds, pinned-city comparisons, search, responsive UI, URL sharing and PNG export intact.

**Read in this order:**
1. [Full up-to-date project handoff and success/failure ledger](./METRO_MAP_ROAD_ROUTING_HANDOFF.md).
2. [Older shipped metro-map UI/architecture handoff](./METRO_MAP_HANDOFF.md).
3. [Full road-network regions product plan](./ROAD_NETWORK_REGIONS_PLAN.md).
4. [Initial real-data experiment](./COLORADO_REAL_ROAD_EXPERIMENT.md) and [large XML/streaming retry retrospective](./COLORADO_STREAMING_RETRY.md).

**As of October 24, 2026:** routing compression/equivalence, six geographic routes, and an offline interactive explorer have passed real Colorado GitHub Actions runs. Dashboard PR #109 merged, but [run #40140558960](https://github.com/smeyerhuky/claude-react/actions/runs/40140558960) was still **in progress when this document was prepared**. Verify status NOW; do not assume success from this doc. The production metro map still uses **straight-line Voronoi**; route explorer and dashboard are *offline research artifacts*, not a production By road map.

## 5-minute resume checklist

- [ ] Confirm current `main` and recent PR merges in [repo](https://github.com/smeyerhuky/claude-react); preserve user's **PR review/merge decision**.
- [ ] Check [run #40140558960](https://github.com/smeyerhuky/claude-react/actions/runs/40140558960) **conclusion, job steps, raw log, artifact**. If failed, diagnose exact step and fix via PR; if success, inspect `performance.html`, `routes.json` and empirical latency numbers. Update handoff ledger.
- [ ] Inspect original real-road winner pipeline: `.github/workflows/colorado-road-evidence.yml` and `scripts/visualize_colorado_roads.py`; inspect metro frontend `src/components/MetroPopulationVoronoi.jsx`.
- [ ] Respect **location→metro** directed traversal, two *independently* optimized metrics, official 2025 Census CBSA coordinates/IDs, threshold semantics, unreachable samples and regional clipping.
- [ ] Implement next **critical-path PR**: Colorado multi-threshold nearest-qualifying-metro winner dataset (not another isolated city-pair demo), with JSON/manifest/sample evidence, synthetic + real OSM tests and meaningful comparison visualization. Do not present roads as official Census boundaries or claim full geographic shading from sampled road nodes.
- [ ] Do not merge your own PR without explicit user permission. No claims of CI success without GitHub run/job/log verification.

## Where to find implementation

| Concern | Files |
| --- | --- |
| Frontend metro map and official Census dataset | `src/components/MetroPopulationVoronoi.jsx`; `public/data/metros-census-2025.csv` |
| Road allocation research | `scripts/visualize_colorado_roads.py`; `scripts/stream_osm_roads.py` |
| Routing reference and equivalence | `scripts/validate_colorado_routing.py`; `.github/workflows/colorado-routing-equivalence.yml` |
| Routing speed/memory | `scripts/benchmark_colorado_routing.py`; `scripts/benchmark_colorado_point_to_point.py` |
| Six road routes, offline explorer and dashboard | `scripts/colorado_route_explorer.py`; `scripts/colorado_route_explorer_html.py`; `scripts/colorado_route_performance_html.py` |
| Main manual experiment | `.github/workflows/colorado-route-explorer.yml` |
| Map visual/browser regression | `scripts/capture-metro.mjs`; `.github/workflows/metro-screenshot.yml` |

## Local commands

```bash
git clone https://github.com/smeyerhuky/claude-react.git
cd claude-react
corepack enable
yarn install --frozen-lockfile
yarn dev
# Metro frontend:
yarn build
# Python unit tests (requires networkx, matplotlib and the PBF tool dependencies):
PYTHONPATH=scripts python -m unittest discover -s scripts -p 'test_colorado_route_explorer.py' -v
PYTHONPATH=scripts python -m unittest discover -s scripts -p 'test_colorado_route_explorer_html.py' -v
PYTHONPATH=scripts python -m unittest discover -s scripts -p 'test_colorado_route_performance_html.py' -v
```

Use [Actions: Colorado Route Explorer](https://github.com/smeyerhuky/claude-react/actions/workflows/colorado-route-explorer.yml) for the real PBF download and validation; this is **manual** and resource-intensive. Don't put the full PBF in the Vite bundle. Read logs for checksum/coverage/errors, then download the ZIP artifact. Artifacts expire; retain durable numerical outcomes in the evidence ledger.

## Immediate engineering priorities

**First:** resolve and record #40140558960; correct any failure. **Then:** build metro allocation dataset correctness and threshold support (road graph nodes → geographic coverage → UI), while checking browser budget, accessibility, share state and export. **Later:** scale to lower 48 with partitioned static data, immutable source manifests, licenses, and optional API/isochrone overlays. The complete ranked roadmap and each past failure are in the full handoff.

## Paste this to resume

> Use the connected GitHub repo `smeyerhuky/claude-react`. Read `docs/GETTING_STARTED_METRO_MAP.md` and `docs/METRO_MAP_ROAD_ROUTING_HANDOFF.md`, then the linked older metro map handoff and road-network plan. Check the latest Actions state for run #40140558960, including job logs and artifacts, and update its success/failure ledger with evidence. Our end goal is a national metro population map with switchable straight-line and By road travel-time/road-distance nearest qualifying CBSA regions, not merely standalone route demos. Next implementation target is a verified Colorado multi-threshold **location→metro winner** pipeline, independent time/distance results and unreachable coverage; open a targeted PR for my review, never merge without my approval. Catalog failures and successes, don't invent benchmark data, and preserve existing metro map behavior.
