"""Render the audited tiny declared network as an offline development explorer."""
import argparse
import hashlib
import json
from pathlib import Path
from reference_declared_graph_checkpoint import project, REFERENCE, RAW
from reference_segment_cost_checkpoint import REFERENCE as WEIGHTS


def render():
    report = project(); path = REFERENCE/'report.json'
    if report != json.loads(path.read_text()):
        raise ValueError('Exact frozen declared-graph report required')
    raw = json.loads(RAW.read_text()); ids = set(report['original_member_way_ids'])
    data = dict(report=report, weights=json.loads((WEIGHTS/'report.json').read_text()),
                report_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
                ways=[way for way in raw['ways'] if way['id'] in ids])
    payload = json.dumps(data,sort_keys=True,separators=(',',':')).replace('<','\\u003c').replace('&','\\u0026')
    return TEMPLATE.replace('__KERNEL_DATA__',payload)


TEMPLATE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Declared road-model kernel</title><style>
body{font:14px/1.5 system-ui,sans-serif;color:#17232f;background:#f5f7f9;margin:0;padding:18px}main{max-width:1050px;margin:auto}h1{font-size:25px;margin:0}h2{font-size:19px}.notice{padding:14px;border-left:4px solid #aa6716;background:#fff3dc;margin:14px 0}.controls{display:flex;gap:16px;flex-wrap:wrap}label{display:grid;gap:4px}select{font:inherit;padding:8px;border:1px solid #7c8d9d;border-radius:4px;background:white}select:focus-visible{outline:3px solid #1967b3;outline-offset:2px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:16px 0}.card{background:white;border:1px solid #ccd5de;border-radius:7px;padding:14px}.cost{font-size:27px;font-weight:650}.muted{color:#526374}svg{display:block;width:100%;max-height:330px;background:#edf2f5;border:1px solid #ccd5de;border-radius:7px}.road{stroke:#7d8f9e;stroke-width:5;fill:none;stroke-linecap:round}.path{stroke:#086aab;stroke-width:8;fill:none;stroke-linecap:round}.node{fill:#fff;stroke:#17232f;stroke-width:2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}table{border-collapse:collapse;width:100%;text-align:left}th,td{border-bottom:1px solid #dfe6ec;padding:7px}li{margin:5px 0}.scroll{overflow:auto}@media(max-width:550px){body{padding:10px}h1{font-size:21px}th,td{padding:6px}}
</style></head><body><main>
<h1>Declared road-model kernel</h1>
<p class="muted">Fort Collins raw-source regression · 2 ways · 8 nodes · 7 directed arcs · offline</p>
<div class="notice"><strong>Zero connectors approved. No adopted anchors or geographic road coverage.</strong><br>This tiny supplied network tests permissions, weights and timed turns together. Its costs are not metro distances, global shortest paths, certified access or replacement values for the older 33-source experiment.</div>
<div class="controls">
<label for="scenario">Clock case<select id="scenario"><option value="adopted_reference">Adopted reference — Wednesday noon MDT</option><option value="active_window_regression">Regression only — Thursday 19:00 MDT</option></select></label>
<label for="metric">Measure<select id="metric"><option value="length">Modeled road distance (m)</option><option value="travel_time">Modeled free-flow time (s)</option></select></label>
<label for="direction">Declared-node direction<select id="direction"><option value="forward">Incoming segment start → outgoing end</option><option value="reverse">Outgoing end → incoming segment start</option></select></label>
</div>
<section aria-live="polite" class="cards"><div class="card"><h2>Supplied-network result</h2><div id="cost" class="cost"></div><p id="explanation"></p></div><div class="card"><h2>Clock and scope</h2><p id="clock"></p><p id="nodes"></p><p>Source/target are raw road nodes. No metro, parking entrance, office door or connector is adopted.</p></div></section>
<svg id="plot" viewBox="0 0 900 320" role="img" aria-label="Only the two supplied raw ways and selected directed path; surrounding roads omitted"></svg>
<p class="muted">Gray: supplied raw ways. Blue: selected path in this network. A/B: current query start/end. Geometry is shown in a local longitude/latitude projection; it supplies no geographic regions, surrounding-road closure or access proof.</p>
<div class="card scroll"><h2>Selected raw directed segments</h2><table><thead><tr><th>Arc identity</th><th>Distance (m)</th><th>Time (s)</th><th>Speed basis</th></tr></thead><tbody id="rows"></tbody></table><p id="empty" hidden>No selected path in the supplied network.</p></div>
<div class="notice"><strong>Unknown controls stay unknown.</strong><p id="bollard"></p>Adding the complete Tenney Court bollard context rejects the whole bundle. It is not silently removed to produce a route. An inactive raw turn prohibition also does not establish permission to turn.</div>
<details class="card"><summary>Model assumptions and exact evidence</summary><p>The adopted instant is fixed at 2026-10-28T18:00:00Z (12:00 MDT). The Thursday case is a regression test. Access is frozen for the whole route; solo ordinary passenger car, no special permits or HOV exemption, tolls allowed. Conditions may change before arrival.</p><p>Distances use a sphere of radius 6,371,000 m without elevation. Time uses static posted limits or explicit highway defaults, with no traffic, turn/intersection, acceleration or surface delays. The incoming secondary_link uses the 30 km/h model default; the outgoing way uses raw 30 mph. Speeds are model inputs, not independently verified operating speeds.</p><p>Missing incident/exterior roads, other restrictions, zone geography, physical turn/grade/access evidence, reviewed anchors, masks and release assets remain unverified. All public release gates remain closed.</p><pre id="identity"></pre></details>
<p class="muted">OSM data © OpenStreetMap contributors, ODbL. The public straight-line map and every older inspector view remain unchanged.</p>
</main><script id="kernel-data" type="application/json">__KERNEL_DATA__</script><script>
'use strict';
const data=JSON.parse(document.getElementById('kernel-data').textContent), report=data.report, byId=id=>document.getElementById(id);
const points=new Map(),arcs=new Map();
for(const way of data.ways){for(const row of way.nodes)points.set(row[0],row.slice(1));for(let i=0;i<way.nodes.length-1;i++)arcs.set(`raw:${way.id}:${i}:forward`,{a:way.nodes[i],b:way.nodes[i+1],basis:way.tags.maxspeed?'Raw '+way.tags.maxspeed:'Declared highway model default'});}
const all=[...points.values()],xs=all.map(p=>p[0]),ys=all.map(p=>p[1]);
const centerY=(Math.min(...ys)+Math.max(...ys))/2,cos=Math.cos(centerY*Math.PI/180),minX=Math.min(...xs)*cos,maxX=Math.max(...xs)*cos,minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(800/(maxX-minX),220/(maxY-minY));
const xy=p=>[450+(p[0]*cos-(minX+maxX)/2)*scale,160-(p[1]-(minY+maxY)/2)*scale];
function svg(tag,attrs,parent){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;}
function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function draw(){const key=[byId('scenario').value,byId('metric').value,byId('direction').value].join(':'),entry=report.query_replays[key],result=entry.result,metric=byId('metric').value;
 byId('cost').textContent=result.cost===null?'No path in supplied network':result.cost.toFixed(3)+(metric==='length'?' m':' s');
 byId('explanation').textContent=result.cost===null?'A missing path here does not prove no real-world route exists.':'Finite modeled cost within the two supplied ways only; access and geographic completeness remain unverified.';
 byId('clock').textContent=byId('scenario').value==='adopted_reference'?'2026-10-28T18:00:00Z · adopted Wednesday noon MDT; raw conditional prohibition inactive.':'2026-10-30T01:00:00Z · Thursday 19:00 MDT regression only; raw conditional prohibition active.';
 byId('nodes').textContent='Raw node '+result.source+' → '+result.target;
 const plot=byId('plot');plot.replaceChildren();
 for(const way of data.ways)svg('polyline',{points:way.nodes.map(row=>xy(row.slice(1)).join(',')).join(' '),class:'road'},plot);
 for(const aid of result.arc_path){const arc=arcs.get(aid);svg('polyline',{points:[xy(arc.a.slice(1)),xy(arc.b.slice(1))].map(p=>p.join(',')).join(' '),class:'path'},plot);}
 for(const[nid,label]of[[result.source,'A'],[result.target,'B']]){const[x,y]=xy(points.get(nid));svg('circle',{cx:x,cy:y,r:7,class:'node'},plot);const node=svg('text',{x:x+10,y:y-12,'font-size':18,fill:'#17232f'},plot);node.textContent=label;}
 const rows=byId('rows');rows.replaceChildren();for(const aid of result.arc_path){const arc=arcs.get(aid),wayResult=Object.values(data.weights.selected_raw_way_results).flatMap(r=>r.arcs||[]).find(a=>a.id===aid),row=document.createElement('tr');row.dataset.arcId=aid;text('td',aid,row);text('td',wayResult.length.toFixed(3),row);text('td',wayResult.travel_time.toFixed(3),row);text('td',arc.basis,row);rows.append(row);}
 byId('empty').hidden=result.arc_path.length>0;
 byId('identity').textContent='Frozen graph report SHA-256: '+data.report_sha256+'\nScenario SHA-256: '+entry.scenario_sha256+'\nDeclared graph SHA-256: '+entry.graph_sha256+'\nRaw source context SHA-256: '+report.raw_context_sha256;
}
byId('bollard').textContent=report.unresolved_bollard_bundle.reason;
for(const id of['scenario','metric','direction'])byId(id).addEventListener('change',draw);
draw();
</script></body></html>
'''


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output',type=Path,required=True); args = parser.parse_args()
    html = render(); args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(html)
