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


def winner_change_report(results, lower, upper):
    """Measure actual per-node winner changes across two threshold levels.

    Unreachable/missing assignments are accounted separately, never counted
    as destination changes. Compare both metrics independently.
    """
    a, b = results[str(lower)], results[str(upper)]
    report = {}
    for metric in ("distance", "time"):
        wa, wb = a[metric]["winners"], b[metric]["winners"]
        common = wa.keys() & wb.keys()
        changed = [n for n in common if wa[n]["cbsa"] != wb[n]["cbsa"]]
        report[metric] = {
            "comparable_nodes": len(common),
            "changed_winner_nodes": len(changed),
            "only_lower_reachable": len(wa.keys() - wb.keys()),
            "only_upper_reachable": len(wb.keys() - wa.keys()),
            "sample_changed_nodes": changed[:10],
        }
    return report


def boundary_proximity(graph, radius_m=3000):
    """Road vertices near the extracted graph's bbox edges (risk indicator only).

    This is NOT certification of route closure or nearest global destinations.
    """
    attrs = [data for _, data in graph.nodes(data=True)]
    if not attrs:
        return {"radius_m": radius_m, "near_edge_nodes": 0, "graph_nodes": 0}
    west = min(a["x"] for a in attrs)
    east = max(a["x"] for a in attrs)
    south = min(a["y"] for a in attrs)
    north = max(a["y"] for a in attrs)
    near = 0
    for a in attrs:
        lon, lat = a["x"], a["y"]
        if min(meters((lon, lat), (west, lat)),
               meters((lon, lat), (east, lat)),
               meters((lon, lat), (lon, south)),
               meters((lon, lat), (lon, north))) <= radius_m:
            near += 1
    return {"radius_m": radius_m, "near_edge_nodes": near,
            "graph_nodes": len(attrs), "interpretation":
            "bbox edge proximity only; paths can leave extract from interior nodes"}


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
    ap.add_argument("--thresholds", type=int, nargs="+", default=[100000, 250000, 400000])
    ap.add_argument("--max-snap-m", type=float, default=25000)
    ap.add_argument("--coverage-tiles", action="store_true",
                    help="Generate experimental road-proximity transparent tiles")
    ap.add_argument("--require-threshold-difference", action="store_true",
                    help="Fail when minimum and maximum thresholds produce no changed winners")
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
    low, high = min(results, key=int), max(results, key=int)
    changes = winner_change_report(results, low, high)
    manifest["threshold_winner_changes"] = {"lower": int(low), "upper": int(high), **changes}
    manifest["boundary_proximity"] = boundary_proximity(graph)
    manifest["excluded_qualifying_candidates"] = {
        str(t): [m for m in rejected if next(
            (c["population"] for c in read_metros(args.metros) if c["cbsa"] == m["cbsa"]), 0) >= t]
        for t in sorted(set(args.thresholds))}
    if args.require_threshold_difference and not any(
            changes[k]["changed_winner_nodes"] > 0 for k in ("distance", "time")):
        raise SystemExit("No observed winner changes across lowest/highest thresholds")
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
    if args.coverage_tiles:
        from colorado_coverage_tiles import write_tiles
        tiles = write_tiles(graph, results, args.output_dir / "coverage-tiles")
        manifest["coverage_tiles"] = {
            "status": tiles["status"],
            "datasets": {key: {"covered_fraction": value["covered_fraction"],
                               "no_data_pixels": value["no_data_pixels"]}
                         for key, value in tiles["datasets"].items()},
            "note": "Nearest road vertex, not independently routed geographic samples; water/land masks absent; boundary closure unverified."}
    (args.output_dir / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n")
    print(json.dumps(manifest, indent=2), flush=True)


if __name__ == "__main__":
    main()
