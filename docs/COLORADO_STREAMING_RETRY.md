# Colorado bounded streaming road-graph retry

The first 250,000-threshold run #40050869301 stopped after ~7.5 minutes attempting to parse a **649 MiB XML** file generated from the real Colorado OSM extract. No allocations or comparison image were produced.

## Changes
- Stream the **filtered OSM PBF directly** through pyosmium with a sparse node-location index. No intermediate XML and no OSMnx `graph_from_xml` stage.
- Study a smaller **Denver ↔ Colorado Springs** rectangle (`-105.35,38.65,-104.5,40.05`). It includes at least two major Census metro representatives at population 250,000, though other qualifying metro points may lie outside this artificial boundary.
- Make road graph traversal directed, assign simplified OSM highway speeds and lengths, and calculate independent shortest road length and modeled fastest time.
- Cap the extracted graph to 900,000 nodes; retain the processing timeout, phase logs and resource statistics already added by PR #96.
- Assign graph nodes to metro origin points using a KD-tree; output a three-panel **road-node** comparison and run manifest. This is experimental, not official polygons and not a final routable national product.

## Known modeling limitations
Traffic, junction delays, full turn restrictions, access restrictions on complex tagged roads, and out-of-bounds detours are **not** fully modeled. Edges use simplified highway speed defaults; verify routes before publishing any user-facing distance/time claims. OSM source remains © OpenStreetMap contributors, ODbL.

## How to test
After merging the change, run **Colorado OSM road comparison (manual)** on `main` at threshold `250000`. The new comparison builds a smaller graph from filtered PBF. Observe distinct `Streaming PBF`, `Built directed graph`, distance/time allocation and rendering progress logs. Verify the manifest has at least two metro sources and that `road-node-comparison.png` is produced. The workflow still has a 15-minute processing cap and 35-minute overall cap.

The synthetic graph unit tests from the earlier spike remain in place, but **real-road integration has not been verified yet**. Do not infer success from a green synthetic test.
