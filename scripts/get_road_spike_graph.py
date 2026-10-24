#!/usr/bin/env python3
"""Small, explicitly bounded OSM data acquisition. Not for nationwide API use.

Usage:
  python scripts/get_road_spike_graph.py --bbox -105.45 38.5 -104.3 40.5 \
     --output local-data/front-range.graphml

OSMnx/Overpass can be slow or refuse large requests. Prefer a local PBF extract
for regional/national pipelines; do NOT run as normal pull-request CI.
"""
import argparse
from pathlib import Path

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--bbox", nargs=4, type=float, required=True,
                        metavar=("WEST","SOUTH","EAST","NORTH"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    west,south,east,north = args.bbox
    if not (-110 < west < east < -100 and 36 < south < north < 42):
        parser.error("This research script is scoped to Colorado bounds")
    if (east-west)*(north-south) > 0.05:
        parser.error("Bounding box too large for responsible shared Overpass use. Use a local OSM PBF for a larger corridor.")
    import osmnx as ox
    graph = ox.graph_from_bbox((west,south,east,north), network_type="drive", retain_all=True)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    ox.save_graphml(graph, args.output)
    print(f"Saved {len(graph.nodes)} nodes, {len(graph.edges)} directed edges to {args.output}")
    print("© OpenStreetMap contributors; ODbL. Record download timestamp and source with exported outputs.")

if __name__ == "__main__":
    main()
