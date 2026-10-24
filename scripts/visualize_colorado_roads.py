#!/usr/bin/env python3
"""Generate real-OSM Colorado corridor comparison evidence, not production tiles."""
import argparse
import csv
import hashlib
import json
import math
import time
from pathlib import Path

from road_spike import assign
from stream_osm_roads import load_pbf

def progress(message):
    print(f'[{time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())}] {message}', flush=True)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--osm", type=Path, required=True)
    p.add_argument("--metros", type=Path, default=Path("public/data/metros-census-2025.csv"))
    p.add_argument("--output-dir", type=Path, default=Path("road-proof"))
    p.add_argument("--threshold", type=int, default=100000)
    args = p.parse_args()
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import networkx as nx
    from scipy.spatial import cKDTree
    start = time.monotonic()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    # graph_from_xml honors highway/oneway tags and retains disconnected roads.
    progress(f'Streaming PBF road ways ({args.osm.stat().st_size / 1024**2:.1f} MiB)')
    graph, way_count = load_pbf(args.osm)
    progress(f'Built directed graph from {way_count:,} ways: {graph.number_of_nodes():,} nodes, {graph.number_of_edges():,} edges')
    if graph.number_of_nodes() < 2:
        raise SystemExit('No routable road nodes found in bounded PBF')
    bbox = [min(d["x"] for _,d in graph.nodes(data=True)),
            min(d["y"] for _,d in graph.nodes(data=True)),
            max(d["x"] for _,d in graph.nodes(data=True)),
            max(d["y"] for _,d in graph.nodes(data=True))]
    with args.metros.open(newline="", encoding="utf-8") as handle:
        metros = [{ "cbsa":r["cbsa"],"name":r["name"],"population":int(r["population"]),
                    "lat":float(r["latitude"]),"lon":float(r["longitude"])}
                  for r in csv.DictReader(handle) if int(r["population"]) >= args.threshold]
    metros = [m for m in metros if bbox[0]<=m["lon"]<=bbox[2] and bbox[1]<=m["lat"]<=bbox[3]]
    graph_points = list(graph.nodes(data=True))
    xy = [(attr["x"] * math.cos(math.radians(attr["y"])), attr["y"]) for _,attr in graph_points]
    index = cKDTree(xy)
    for m in metros:
        _, nearest = index.query((m["lon"] * math.cos(math.radians(m["lat"])),m["lat"]))
        m["node"] = graph_points[int(nearest)][0]
    if len(metros) < 2:
        raise SystemExit(f"Need ≥2 qualifying origins in bbox {bbox}; found {len(metros)}. Lower --threshold or enlarge corridor.")
    progress(f'Computing shortest-road-distance winners for {len(metros)} qualifying metros')
    road_distance = assign(graph,metros,"length",nx)
    progress(f'Distance allocation complete: {len(road_distance):,} reachable nodes')
    progress('Computing modeled driving-time winners')
    drive_time = assign(graph,metros,"travel_time",nx)
    progress(f'Time allocation complete: {len(drive_time):,} reachable nodes')
    names = {m["cbsa"]:m["name"].split(",")[0] for m in metros}
    colors = plt.get_cmap("tab10")
    order = sorted(names)
    points = list(graph.nodes(data=True))
    winners = {}
    for metric, result in (("distance",road_distance),("time",drive_time)):
        counts = {cbsa:0 for cbsa in order}
        for item in result.values():
            counts[item["cbsa"]] += 1
        winners[metric] = counts
    progress('Rendering 3-panel comparison image')
    fig,axes=plt.subplots(1,3,figsize=(18,8),sharex=True,sharey=True)
    for ax,metric,result in zip(axes,("straight","distance","time"),(None,road_distance,drive_time)):
        x,y,c=[],[],[]
        for n,attrs in points:
            if result is None:
                choice=min(metros,key=lambda m:(attrs["x"]-m["lon"])**2*math.cos(math.radians(attrs["y"]))**2+(attrs["y"]-m["lat"])**2)["cbsa"]
            else:
                winner=result.get(str(n))
                if winner is None: continue
                choice=winner["cbsa"]
            x.append(attrs["x"]);y.append(attrs["y"]);c.append(order.index(choice))
        ax.scatter(x,y,c=c,cmap="tab10",vmin=0,vmax=9,s=0.3,rasterized=True,linewidths=0)
        ax.scatter([m["lon"] for m in metros],[m["lat"] for m in metros],s=32,edgecolors="black",facecolors="white")
        ax.set_title({"straight":"Straight-line (reference)","distance":"Shortest drivable road length","time":"Fastest modeled free-flow time"}[metric])
        ax.set_xlabel("Longitude")
    axes[0].set_ylabel("Latitude")
    fig.suptitle(f"EXPERIMENTAL OSM road-node nearest qualifying metro, population ≥{args.threshold:,}\nNot raster shading, no turn delays or live traffic")
    fig.text(0.5,0.01,"© OpenStreetMap contributors · Census Vintage 2025 centers · static OSM road snapshot",ha="center",fontsize=9)
    fig.tight_layout(rect=(0,0.035,1,0.94))
    fig.savefig(args.output_dir/"road-node-comparison.png",dpi=150)
    progress('Comparison PNG saved')
    plt.close(fig)
    both=set(road_distance)&set(drive_time)
    divergence=sum(road_distance[n]["cbsa"]!=drive_time[n]["cbsa"] for n in both)
    manifest={
        "experimental":True,"osm_sha256":hashlib.sha256(args.osm.read_bytes()).hexdigest(),
        "bbox":bbox,"nodes":graph.number_of_nodes(),"edges":graph.number_of_edges(),
        "metros":metros,"threshold":args.threshold,"metric_units":{"distance":"meters","time":"seconds"},
        "direction":"location-to-metro","road_reachable_nodes":len(both),
        "metric_disagreements":divergence,"winner_counts":winners,
        "seconds_elapsed":round(time.monotonic()-start,1),
        "model_limitations":["static imputed speeds","no turn penalties","road-node sampling only","OSM extract boundary truncation"]
    }
    (args.output_dir/"manifest.json").write_text(json.dumps(manifest,indent=2)+"\n")
    print(json.dumps({k:v for k,v in manifest.items() if k!="metros"},indent=2))

if __name__=="__main__":
    main()
