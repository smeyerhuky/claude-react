#!/usr/bin/env python3
"""Self-contained, offline performance dashboard for verified Colorado routes."""
import json
import math
from pathlib import Path

PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Colorado Routing Performance</title>
<style>
:root{font-family:system-ui,sans-serif;background:#101827;color:#e8eef7}
body{margin:0 auto;padding:24px;max-width:1150px}p,small{color:#bac8db}
section{background:#1b293c;border-radius:12px;padding:18px;margin:16px 0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px}
strong{font-size:1.4rem}table{width:100%;border-collapse:collapse;font-variant-numeric:tabular-nums}
th,td{text-align:left;padding:10px;border-bottom:1px solid #40516a}
th{color:#bac8db} .scroll{overflow-x:auto}
select{padding:10px;border-radius:8px;background:#223047;color:white}
.bar{height:9px;background:#263c56;border-radius:6px;min-width:100px}
.fill{height:100%;background:#58b7ff;border-radius:6px}
</style></head><body>
<h1>Colorado Routing Performance</h1>
<p>Real OSM data · verified full/compressed cost equivalence · offline benchmark report</p>
<div class="grid" id="summary"></div>
<section><label>Route category <select id="category"><option value="all">All categories</option></select></label>
<div class="scroll"><table><thead><tr><th>Route</th><th>Metric</th><th>Full median</th><th>Compressed median</th><th>Speedup</th><th>Compressed latency</th><th>Cost delta</th></tr></thead><tbody id="rows"></tbody></table></div></section>
<section><h2>Method and limitations</h2><p id="method"></p>
<p>Samples are sequential and warm-cache; these measurements are not p95/p99, concurrent throughput, end-to-end build time, or peak memory. Node and edge counts are graph sizes, not memory usage. Small timing samples can vary with runner load.</p></section>
<script id="dataset" type="application/json">__DATA__</script><script>
"use strict";
const data=JSON.parse(document.getElementById("dataset").textContent);
const full=data.graph_sizes.full,small=data.graph_sizes.compressed;
const summary=document.getElementById("summary");
for(const [label,value] of [["Full nodes",full.nodes.toLocaleString()],["Compressed nodes",small.nodes.toLocaleString()],["Node reduction",((1-small.nodes/full.nodes)*100).toFixed(1)+"%"],["Full edges",full.edges.toLocaleString()],["Compressed edges",small.edges.toLocaleString()],["Edge reduction",((1-small.edges/full.edges)*100).toFixed(1)+"%"]]){
const box=document.createElement("section"),title=document.createElement("small"),number=document.createElement("strong");
title.textContent=label;number.textContent=value;box.append(title,document.createElement("br"),number);summary.append(box)}
document.getElementById("method").textContent=data.benchmark_method;
const category=document.getElementById("category");
[...new Set(data.trips.map(t=>t.category||"Other"))].forEach(c=>{const option=document.createElement("option");option.value=c;option.textContent=c;category.append(option)});
function render(){const tbody=document.getElementById("rows");tbody.replaceChildren();
for(const t of data.trips){if(category.value!=="all"&&(t.category||"Other")!==category.value)continue;
for(const metric of ["length","travel_time"]){const b=t.benchmark[metric],f=b.full.median_ms,c=b.compressed.median_ms;
const cells=[t.origin+" → "+t.destination,metric==="length"?"Distance":"Modeled time",f.toFixed(2)+" ms",c.toFixed(2)+" ms",(f/c).toFixed(2)+"×",null,t.cost_deltas[metric].toFixed(6)+(metric==="length"?" m":" s")];
const tr=document.createElement("tr");for(const cell of cells){const td=document.createElement("td");
if(cell===null){const bar=document.createElement("div"),fill=document.createElement("div");bar.className="bar";fill.className="fill";fill.style.width=Math.min(100,c/Math.max(f,c)*100).toFixed(1)+"%";bar.append(fill);td.append(bar)}else td.textContent=cell;tr.append(td)}tbody.append(tr)}}}
category.addEventListener("change",render);render();
</script></body></html>
"""


def render_dashboard(source: Path, destination: Path):
    data = json.loads(source.read_text(encoding="utf-8"))
    if data.get("status") != "pass" or not data.get("trips"):
        raise ValueError("Refusing unverified or empty benchmark")
    sizes = data.get("graph_sizes", {})
    for graph in ("full", "compressed"):
        if not all(isinstance(sizes.get(graph, {}).get(k), int) and sizes[graph][k] > 0
                   for k in ("nodes", "edges")):
            raise ValueError("Missing graph sizes")
    for trip in data["trips"]:
        for metric in ("length", "travel_time"):
            delta = trip.get("cost_deltas", {}).get(metric)
            if not isinstance(delta, (int, float)) or not math.isfinite(delta) or delta > 0.001 or delta < 0:
                raise ValueError("Missing or invalid cost equivalence")
            for graph in ("full", "compressed"):
                result = trip.get("benchmark", {}).get(metric, {}).get(graph, {})
                samples = result.get("samples_ms")
                median = result.get("median_ms")
                if (not isinstance(samples, list) or len(samples) != 3 or
                    not all(isinstance(x, (int, float)) and math.isfinite(x) and x > 0 for x in samples) or
                    not isinstance(median, (int, float)) or not math.isfinite(median) or median <= 0 or
                    abs(median - sorted(samples)[1]) > 1e-8):
                    raise ValueError("Invalid timing samples")
    payload = json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")
    destination.write_text(PAGE.replace("__DATA__", payload), encoding="utf-8")
