#!/usr/bin/env python3
"""Bounded road-node allocations; NOT production geographic shading."""
import argparse
import csv
import hashlib
import json
import math
from pathlib import Path

from road_spike import assign
from stream_osm_roads import load_pbf, meters


def read_metros(path):
    with path.open(newline="", encoding="utf-8") as f:
        return [{"cbsa": r["cbsa"], "name": r["name"],
                 "population": int(r["population"]), "lon": float(r["longitude"]),
                 "lat": float(r["latitude"])} for r in csv.DictReader(f)]


def snap_candidates(graph, metros, max_snap_m=25000):
    """Never remove a candidate merely because its center lies outside the bbox."""
    from scipy.spatial import cKDTree
    nodes = list(graph.nodes(data=True))
    if not nodes:
        raise ValueError("Empty graph")
    lat = sum(a["y"] for _, a in nodes) / len(nodes)
    coslat = math.cos(math.radians(lat))
    tree = cKDTree([(a["x"] * coslat, a["y"]) for _, a in nodes])
    selected, rejected = [], []
    for m in metros:
        _, i = tree.query((m["lon"] * coslat, m["lat"]))
        node, a = nodes[int(i)]
        error = meters((m["lon"], m["lat"]), (a["x"], a["y"]))
        if error <= max_snap_m:
            selected.append({**m, "node": node, "snap_m": round(error, 1)})
        else:
            rejected.append({"cbsa": m["cbsa"], "snap_m": round(error, 1)})
    return selected, rejected


def allocate_thresholds(graph, snapped, thresholds):
    out = {}
    for threshold in thresholds:
        sources = [m for m in snapped if m["population"] >= threshold]
        if not sources:
            raise ValueError(f"No qualifying accessible metros at {threshold}")
        metrics = {}
        for key, weight, units in (("distance", "length", "meters"),
                                   ("time", "travel_time", "seconds")):
            winners = assign(graph, sources, weight, None)
            metrics[key] = {"units": units, "winners": winners,
                            "reachable_nodes": len(winners),
                            "unreachable_nodes": graph.number_of_nodes() - len(winners)}
        d, t = metrics["distance"]["winners"], metrics["time"]["winners"]
        out[str(threshold)] = {
            "sources": [{"cbsa": m["cbsa"], "name": m["name"],
                         "population": m["population"], "node": str(m["node"]),
                         "snap_m": m["snap_m"]} for m in sources],
            "both_reachable_nodes": len(d.keys() & t.keys()),
            "metric_disagreements": sum(d[n]["cbsa"] != t[n]["cbsa"] for n in d.keys() & t.keys()),
            **metrics}
    return out


def preview(graph, result, path, sample_limit=90000):
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    nodes = list(graph.nodes(data=True))
    nodes = nodes[::max(1, math.ceil(len(nodes) / sample_limit))]
    sources = result["sources"]
    palette = {c: i for i, c in enumerate(sorted(s["cbsa"] for s in sources))}
    fig, axes = plt.subplots(1, 3, figsize=(18, 7), sharex=True, sharey=True)
    for ax, title, wins in zip(axes, ["Straight-line reference", "Road distance", "Drive time"],
                               [None, result["distance"]["winners"], result["time"]["winners"]]):
        x, y, colors = [], [], []
        for node, p in nodes:
            if wins is None:
                source = min(sources, key=lambda s: meters((p["x"], p["y"]),
                    (graph.nodes[int(s["node"])]["x"], graph.nodes[int(s["node"])]["y"])))
                cbsa = source["cbsa"]
            else:
                item = wins.get(str(node))
                if item is None:
                    continue
                cbsa = item["cbsa"]
            x.append(p["x"]); y.append(p["y"]); colors.append(palette[cbsa])
        ax.scatter(x, y, c=colors, cmap="tab20", s=.45, linewidths=0, rasterized=True,
                   vmin=0, vmax=max(1, len(palette)-1))
        ax.set_title(title)
        ax.set_xlabel("Longitude")
    axes[0].set_ylabel("Latitude")
    fig.suptitle("Experimental OSM road nodes — NOT contiguous polygons or certified boundary coverage")
    fig.tight_layout()
    fig.savefig(path, dpi=120)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--osm", required=True, type=Path)
    ap.add_argument("--metros", type=Path, default=Path("public/data/metros-census-2025.csv"))
    ap.add_argument("--output-dir", type=Path, default=Path("colorado-metro-winners"))
    ap.add_argument("--thresholds", type=int, nargs="+", default=[100000, 250000])
    ap.add_argument("--max-snap-m", type=float, default=25000)
    args = ap.parse_args()
    if any(x < 0 for x in args.thresholds) or args.max_snap_m <= 0:
        ap.error("Invalid threshold or snap distance")
    graph, ways = load_pbf(args.osm)
    snapped, rejected = snap_candidates(graph, read_metros(args.metros), args.max_snap_m)
    results = allocate_thresholds(graph, snapped, sorted(set(args.thresholds)))
    args.output_dir.mkdir(parents=True, exist_ok=True)
    with args.osm.open("rb") as f:
        road_hash = hashlib.file_digest(f, "sha256").hexdigest()
    with args.metros.open("rb") as f:
        metro_hash = hashlib.file_digest(f, "sha256").hexdigest()
    manifest = {"status": "experimental", "direction": "location-to-metro",
                "osm_sha256": road_hash, "metros_sha256": metro_hash,
                "data": "2025 Census CBSA representative points",
                "road_profile": "static imputed speeds, simplified access, no turn penalties or traffic",
                "graph_nodes": graph.number_of_nodes(), "graph_edges": graph.number_of_edges(),
                "road_ways": ways, "max_snap_m": args.max_snap_m,
                "candidate_count": len(snapped), "rejected_metro_snaps": rejected,
                "coverage_warning": "Clipped road graph: exterior routes and unsnapped metros may change winners; road nodes are not geographic coverage.",
                "summaries": {}}
    for threshold, result in results.items():
        path = args.output_dir / f"threshold-{threshold}.json"
        path.write_text(json.dumps(result, separators=(",", ":")) + "\n")
        preview(graph, result, args.output_dir / f"threshold-{threshold}.png")
        manifest["summaries"][threshold] = {
            "source_count": len(result["sources"]),
            "distance_reachable": result["distance"]["reachable_nodes"],
            "time_reachable": result["time"]["reachable_nodes"],
            "metric_disagreements": result["metric_disagreements"],
            "json_bytes": path.stat().st_size}
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    main()
