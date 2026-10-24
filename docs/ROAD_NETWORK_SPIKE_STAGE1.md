# Colorado road-allocation feasibility spike (stage 1)

This is **algorithm scaffolding and an acquisition recipe, not yet a validated
real-road Colorado map**. Production Straight-line map behavior is unchanged.
The full feature plan is in `docs/ROAD_NETWORK_REGIONS_PLAN.md` (PR #93).

## Why two separate modes?

The computation assigns each routable road vertex to the qualifying Census metro
with lowest **node→metro directed** cost. It computes independent winners for
shortest eligible road length (meters) and fastest modeled free-flow travel
time (seconds). This is a *network allocation*, not a conventional single-city
isochrone polygon; the winning metro can differ for the two metrics.

## Reproduce

Requires Python 3.12+, `networkx>=3.4,<4` and `osmnx>=2.1,<3`.
```sh
python -m pip install "networkx>=3.4,<4" "osmnx>=2.1,<3"
python -m unittest discover -s scripts -p test_road_spike.py -v
# Download only a SMALL permitted research area to local ignored data:
python scripts/get_road_spike_graph.py --bbox -105.03 39.70 -104.89 39.84 --output local-data/denver-small.graphml
# Note: the small example usually has only the Denver metro representative
# point, so it CANNOT form multi-city regions. For two origins, acquire a
# larger regional graph using a local, timestamped OSM PBF extract, not
# repeated bulk Overpass requests.
python scripts/road_spike.py --graphml local-data/front-range.graphml --threshold 250000 --output local-data/winners-250k.json
```

Outputs are network-node winner and cost assignments with bounding box,
source origin metadata, counts and compute time. **No map raster yet.** For
a large graph the JSON may be very big and memory-intensive; it is for a bounded
research graph only, not a deployable network tile product.

## Current limitations and next work

- Offline synthetic tests cover **direction, two metric definitions, and
  unreachable nodes**. They do not validate routing realism against OSM.
- OSMnx free-flow speed imputation is **not live traffic**. This prototype does
  not implement turn restrictions, intersection delay, nearest-road snap
  distance rejection, sampled land raster allocation or cross-boundary routes.
- Source points use Census 2025 CBSA center coordinates, snapped to a graph
  vertex; they are NOT metro polygons or verified access points.
- The graph must include all compared metro origins and enough connecting
  roads. Cropped networks can change winner assignments at their edges.
- Public Overpass must **not** be used for large metro-to-metro downloads;
  use a dated Colorado/PBF extract and document extract license/attribution.
- Next feasibility PR should build graph from local PBF, route at least two
  Census metro origins at two thresholds, validate mountain crossings against
  reference routes, emit spatial tiles/PNG comparisons and report CPU/memory/
  compression costs.

**Attribution:** © OpenStreetMap contributors, ODbL for acquired road data.
Don't commit a large OSM graph or generated network tiles to the app bundle.
