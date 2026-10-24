#!/usr/bin/env python3
"""Compare contracted OSM routing costs with a full-geometry reference graph."""
import argparse
import json
import math
import random
import time
from pathlib import Path

import networkx as nx
from stream_osm_roads import JunctionIndex, RoadHandler, load_pbf

def full_graph(path):
    index = JunctionIndex()
    index.apply_file(str(path))
    # Every drivable geometry node is retained in the reference graph.
    handler = RoadHandler(set(index.counts), max_nodes=5000000)
    handler.apply_file(str(path), locations=True, idx="sparse_mem_array")
    return handler.graph

def compare(reference, contracted, samples, seed):
    shared = sorted(set(reference) & set(contracted))
    if not shared:
        raise RuntimeError("No common graph nodes")
    rng = random.Random(seed)
    origins = rng.sample(shared, min(samples, len(shared)))
    failures = []
    totals = {"origins":len(origins),"compared_pairs":0,"reachability_mismatches":0,
              "cost_mismatches":0,"max_distance_delta_m":0.0,"max_time_delta_s":0.0}
    for metric, tolerance, key in (("length",0.001,"max_distance_delta_m"),
                                    ("travel_time",0.001,"max_time_delta_s")):
        for origin in origins:
            a = nx.single_source_dijkstra_path_length(reference, origin, weight=metric)
            b = nx.single_source_dijkstra_path_length(contracted, origin, weight=metric)
            for target in shared:
                av, bv = a.get(target), b.get(target)
                totals["compared_pairs"] += 1
                if (av is None) != (bv is None):
                    totals["reachability_mismatches"] += 1
                    if len(failures)<100: failures.append({"metric":metric,"origin":origin,"target":target,
                        "kind":"reachability","reference":av,"contracted":bv})
                elif av is not None:
                    delta = abs(av-bv)
                    totals[key] = max(totals[key],delta)
                    if not math.isfinite(delta) or delta > tolerance:
                        totals["cost_mismatches"] += 1
                        if len(failures)<100: failures.append({"metric":metric,"origin":origin,"target":target,
                            "kind":"cost","reference":av,"contracted":bv,"delta":delta})
    return totals, failures

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--osm",type=Path,required=True)
    p.add_argument("--output-dir",type=Path,default=Path("road-validation"))
    p.add_argument("--samples",type=int,default=12)
    p.add_argument("--seed",type=int,default=20261023)
    args=p.parse_args()
    if args.samples<1: p.error("--samples must be positive")
    args.output_dir.mkdir(parents=True,exist_ok=True)
    start=time.monotonic()
    print("Loading compressed graph",flush=True)
    contracted,_=load_pbf(args.osm)
    print("Loading uncompressed reference graph",flush=True)
    reference=full_graph(args.osm)
    print("Comparing paths",flush=True)
    totals,failures=compare(reference,contracted,args.samples,args.seed)
    report={"status":"pass" if not (totals["reachability_mismatches"] or totals["cost_mismatches"]) else "fail",
        "reference_nodes":reference.number_of_nodes(),"reference_edges":reference.number_of_edges(),
        "compressed_nodes":contracted.number_of_nodes(),"compressed_edges":contracted.number_of_edges(),
        "seed":args.seed,"tolerance_m":0.001,"tolerance_s":0.001,
        "elapsed_seconds":round(time.monotonic()-start,2),**totals,"examples":failures}
    (args.output_dir/"equivalence.json").write_text(json.dumps(report,indent=2)+"\n")
    print(json.dumps(report,indent=2),flush=True)
    if report["status"]!="pass": raise SystemExit(1)

if __name__=="__main__":
    main()
