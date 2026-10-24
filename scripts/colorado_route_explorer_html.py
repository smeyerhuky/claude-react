#!/usr/bin/env python3
"""Build a self-contained, offline interactive SVG route explorer from verified JSON."""
import html
import json
from pathlib import Path

PAGE = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Colorado Route Explorer · OSM experiment</title>
<style>
:root{font-family:system-ui,sans-serif;color:#e8eef7;background:#101827}
body{margin:0;padding:24px;max-width:1150px;margin-inline:auto}
h1{margin-bottom:6px}p{color:#b6c3d4} .controls{display:flex;gap:14px;flex-wrap:wrap;margin:22px 0}
label{display:grid;gap:6px;font-weight:600}select{padding:10px;border-radius:8px;background:#223047;color:white;border:1px solid #607089}
main{display:grid;grid-template-columns:minmax(0,3fr) minmax(240px,1fr);gap:16px}
svg{background:#17273c;border:1px solid #42526a;border-radius:12px;width:100%;height:auto;touch-action:none}
path{fill:none;stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}
aside{background:#1a283b;padding:18px;border-radius:12px}dl{display:grid;grid-template-columns:1fr auto;gap:10px}
dt{color:#b6c3d4}dd{margin:0;font-variant-numeric:tabular-nums}
small{color:#b6c3d4}.legend{display:flex;gap:16px;flex-wrap:wrap;margin:12px 0}
.swatch{display:inline-block;width:20px;height:4px;vertical-align:middle;margin-right:6px}
@media(max-width:760px){main{grid-template-columns:1fr}}
</style></head><body>
<h1>Colorado Route Explorer</h1><p>Real OSM road geometry · offline experimental visualization · no live traffic or turn restrictions</p>
<div class="controls"><label>Region<select id="region"><option value="all">All regions</option></select></label><label>Trip<select id="trip"></select></label><label>Route display<select id="metric">
<option value="both">Compare both</option><option value="length">Shortest distance</option><option value="travel_time">Fastest modeled time</option></select></label></div>
<main><div><svg id="map" viewBox="0 0 900 620" role="img" aria-label="Geographic road route comparison">
<path id="short" stroke="#58b7ff"></path><path id="fast" stroke="#ffab59"></path>
<circle id="origin" r="6" fill="#fff"></circle><circle id="destination" r="6" fill="#fff"></circle></svg>
<div class="legend"><span><i class="swatch" style="background:#58b7ff"></i>Shortest</span>
<span><i class="swatch" style="background:#ffab59"></i>Fastest modeled time</span></div>
<small>Diagram uses longitude/latitude coordinates (locally aspect-corrected), not a street basemap. Zoom with mouse wheel; drag to pan. Double-click to reset.</small></div>
<aside><h2 id="heading"></h2><dl id="details"></dl><p id="status"></p></aside></main>
<script id="dataset" type="application/json">__DATA__</script>
<script>
"use strict";
const data=JSON.parse(document.getElementById("dataset").textContent);
const trips=data.trips, tripSelect=document.getElementById("trip"),regionSelect=document.getElementById("region"),metricSelect=document.getElementById("metric");
const svg=document.getElementById("map"),short=document.getElementById("short"),fast=document.getElementById("fast");
const regions=[...new Set(trips.map(t=>t.category||"Other"))];
regions.forEach(name=>{const o=document.createElement("option");o.value=name;o.textContent=name;regionSelect.append(o)});
function populateTrips(){const previous=tripSelect.value;tripSelect.replaceChildren();trips.forEach((t,i)=>{if(regionSelect.value!=="all"&&(t.category||"Other")!==regionSelect.value)return;const o=document.createElement("option");o.value=String(i);o.textContent=t.origin+" → "+t.destination;tripSelect.append(o)});if([...tripSelect.options].some(o=>o.value===previous))tripSelect.value=previous;}
let base=[0,0,900,620],view=base.slice(),drag=null;
function setView(v){view=v;svg.setAttribute("viewBox",v.join(" "))}
function render(){
const t=trips[Number(tripSelect.value)||0],m=metricSelect.value;
const points=[...t.geometry.length,...t.geometry.travel_time];
const minX=Math.min(...points.map(p=>p[0])),maxX=Math.max(...points.map(p=>p[0]));
const minY=Math.min(...points.map(p=>p[1])),maxY=Math.max(...points.map(p=>p[1]));
const lat=(minY+maxY)/2,scale=Math.cos(lat*Math.PI/180),dx=Math.max((maxX-minX)*scale,0.001),dy=Math.max(maxY-minY,0.001);
const factor=Math.min(820/dx,540/dy),cx=(minX+maxX)/2,cy=(minY+maxY)/2;
const project=p=>[450+(p[0]-cx)*scale*factor,310-(p[1]-cy)*factor];
const d=arr=>arr.map((p,i)=>{const q=project(p);return(i?"L":"M")+q[0].toFixed(2)+" "+q[1].toFixed(2)}).join(" ");
short.setAttribute("d",d(t.geometry.length));fast.setAttribute("d",d(t.geometry.travel_time));
short.style.display=m==="travel_time"?"none":"";fast.style.display=m==="length"?"none":"";
const a=project(t.geometry.length[0]),b=project(t.geometry.length.at(-1));
for(const [id,p] of [["origin",a],["destination",b]]){const el=document.getElementById(id);el.setAttribute("cx",p[0]);el.setAttribute("cy",p[1])}
document.getElementById("heading").textContent=t.origin+" → "+t.destination;
const rows=[["Region",t.category||"Other"],["Shortest distance",(t.reference.length.distance_m/1000).toFixed(1)+" km"],
["Shortest modeled duration",(t.reference.length.travel_time_s/60).toFixed(1)+" min"],
["Fastest modeled duration",(t.reference.travel_time.travel_time_s/60).toFixed(1)+" min"],
["Fastest-route distance",(t.reference.travel_time.distance_m/1000).toFixed(1)+" km"],
["Origin snap",t.origin_snap_m.toFixed(0)+" m"],["Destination snap",t.destination_snap_m.toFixed(0)+" m"],
["Max distance-cost difference",t.cost_deltas.length.toFixed(6)+" m"],
["Max time-cost difference",t.cost_deltas.travel_time.toFixed(6)+" s"]];
const details=document.getElementById("details");details.replaceChildren();
for(const [key,val] of rows){const dt=document.createElement("dt"),dd=document.createElement("dd");dt.textContent=key;dd.textContent=val;details.append(dt,dd)}
document.getElementById("status").textContent="Compressed graph equivalence: "+data.status.toUpperCase();
setView(base.slice())
}
regionSelect.addEventListener("change",()=>{populateTrips();render()});tripSelect.addEventListener("change",render);metricSelect.addEventListener("change",render);
svg.addEventListener("wheel",e=>{e.preventDefault();const rect=svg.getBoundingClientRect(),u=(e.clientX-rect.left)/rect.width,v=(e.clientY-rect.top)/rect.height;
const f=e.deltaY>0?1.2:1/1.2,w=view[2]*f,h=view[3]*f;setView([view[0]+view[2]*u-w*u,view[1]+view[3]*v-h*v,w,h])},{passive:false});
svg.addEventListener("pointerdown",e=>{drag=[e.clientX,e.clientY,...view];svg.setPointerCapture(e.pointerId)});
svg.addEventListener("pointermove",e=>{if(!drag)return;const rect=svg.getBoundingClientRect();setView([drag[2]-(e.clientX-drag[0])*drag[4]/rect.width,drag[3]-(e.clientY-drag[1])*drag[5]/rect.height,drag[4],drag[5]])});
svg.addEventListener("pointerup",()=>drag=null);svg.addEventListener("pointercancel",()=>drag=null);
svg.addEventListener("dblclick",()=>setView(base.slice()));
populateTrips();render();
</script></body></html>
"""


def render_html(source: Path, destination: Path):
    data = json.loads(source.read_text())
    if data.get("status") != "pass" or not data.get("trips"):
        raise ValueError("Refusing to render unverified or empty routes")
    for trip in data["trips"]:
        for metric in ("length", "travel_time"):
            points = trip.get("geometry", {}).get(metric)
            if not points or len(points) < 2:
                raise ValueError(f"Missing full route geometry for {metric}")
    payload = json.dumps(data, separators=(",", ":")).replace("<", "\\u003c")
    destination.write_text(PAGE.replace("__DATA__", payload), encoding="utf-8")


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    render_html(args.source, args.destination)
