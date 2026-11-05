"""Render all twenty audited mixed-history query cases offline, without routing in JS."""
import argparse
import hashlib
import json
from pathlib import Path
from reference_mixed_graph_checkpoint import project,raw_inputs,REFERENCE
from road_reference_mixed_graph import compile_graph
from road_reference_way_permissions import DEFAULTS


def render():
    report=project();path=REFERENCE/'report.json'
    if report!=json.loads(path.read_text()):raise ValueError('Exact frozen mixed-graph report required')
    ways,nodes,relations=raw_inputs()
    compiled=compile_graph(ways,nodes,relations,default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
    cases=[]
    for rid in ('9680890','9680891'):
        for history,label in [('full_approach','Full prohibited approach'),('start_inside','Start inside the via road'),('end_at_prefix','End inside the sequence prefix')]:
            cases.append(dict(id=f'way:{rid}:{history}',label=f'{rid} — {label}',family='way',relation_id=int(rid),
                clock='2026-10-28T18:00:00Z · adopted Wednesday 12:00 MDT',
                rule_status='Static raw no_u_turn declaration; activation requires its complete approach history.',
                queries={metric:dict(result=report['via_way_history_queries'][f'{rid}:{history}:{metric}'],
                    scenario_sha256=report['scenario_sha256'],graph_sha256=report['graph_sha256']) for metric in ('length','travel_time')}))
    for scenario,label in [('adopted_reference','Adopted Wednesday noon'),('active_window_regression','Thursday 19:00 regression only')]:
        for direction in ('forward','reverse'):
            cases.append(dict(id=f'node:{scenario}:{direction}',label=f'20193102 — {label}, {direction}',family='node',relation_id=20193102,
                clock='2026-10-28T18:00:00Z · adopted Wednesday 12:00 MDT' if scenario=='adopted_reference' else '2026-10-30T01:00:00Z · Thursday 19:00 MDT regression only',
                rule_status='Raw conditional declaration inactive; this does not establish turn permission.' if scenario=='adopted_reference' else 'Raw conditional declaration active in this regression only.',
                queries={metric:report['preserved_kernel_queries'][f'{scenario}:{metric}:{direction}'] for metric in ('length','travel_time')}))
    data=dict(cases=cases,ways=ways,arcs=compiled['graph']['arcs'],
        declarations={str(row['active_pattern']['raw_relation_id']):row['declared_arc_sequence'] for row in compiled['graph']['relation_compilations'] if row['active_pattern'] is not None},
        report_sha256=hashlib.sha256(path.read_bytes()).hexdigest(),
        source_context_sha256=report['original_member_context_sha256'],old_raw_context_sha256=report['old_raw_context_sha256'])
    # The inactive node declaration is retained by its compiler even without an active pattern.
    data['declarations']['20193102']=next(row['declared_arc_sequence'] for row in compiled['graph']['relation_compilations'] if row['schema']=='reference-via-node-segment-compiler-v1')
    payload=json.dumps(data,sort_keys=True,separators=(',',':')).replace('<','\\u003c').replace('&','\\u0026')
    return TEMPLATE.replace('__MIXED_DATA__',payload)


TEMPLATE=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Mixed road maneuver histories</title><style>
body{font:14px/1.5 system-ui,sans-serif;color:#17232f;background:#f5f7f9;margin:0;padding:18px}main{max-width:1100px;margin:auto}h1{font-size:25px;margin:0}h2{font-size:19px}.notice{padding:14px;border-left:4px solid #aa6716;background:#fff3dc;margin:14px 0}.controls{display:flex;gap:16px;flex-wrap:wrap}label{display:grid;gap:4px;min-width:0;max-width:100%;flex:1 1 260px}select{font:inherit;padding:8px;border:1px solid #7c8d9d;border-radius:4px;background:white;min-width:0;width:100%;max-width:100%}select:focus-visible,summary:focus-visible{outline:3px solid #1967b3;outline-offset:2px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:14px;margin:16px 0}.card{background:white;border:1px solid #ccd5de;border-radius:7px;padding:14px}.cost{font-size:27px;font-weight:650}.muted{color:#526374}svg{display:block;width:100%;max-height:350px;background:#edf2f5;border:1px solid #ccd5de;border-radius:7px}.road{stroke:#7d8f9e;stroke-width:5;fill:none;stroke-linecap:round}.declaration{stroke:#be6810;stroke-width:10;stroke-dasharray:12 8;fill:none}.path{stroke:#086aab;stroke-width:5;fill:none;stroke-linecap:round}.node{fill:#fff;stroke:#17232f;stroke-width:2}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}table{border-collapse:collapse;width:100%;text-align:left}th,td{border-bottom:1px solid #dfe6ec;padding:7px}.scroll{overflow:auto}@media(max-width:550px){body{padding:10px}h1{font-size:21px}th,td{padding:6px}}
</style></head><body><main>
<h1>Mixed road maneuver histories</h1>
<p class="muted">Fort Collins raw-source cases · 7 supplied ways · 23 raw nodes · 22 weighted arcs · 3 supplied relations · offline</p>
<div class="notice"><strong>Zero connectors approved. No adopted anchors or geographic road coverage.</strong><br>These twenty declared-network results test approach history and fixed-scenario composition. They are not metro costs, global shortest paths, verified access or replacements for any older experiment.</div>
<div class="controls"><label for="case">Raw history case<select id="case"></select></label><label for="metric">Measure<select id="metric"><option value="length">Modeled road distance (m)</option><option value="travel_time">Modeled free-flow time (s)</option></select></label></div>
<section class="cards" aria-live="polite"><div class="card"><h2>Supplied-network result</h2><div id="cost" class="cost"></div><p id="explanation"></p><p id="nodes"></p></div><div class="card"><h2>Clock and raw declaration</h2><p id="clock"></p><p id="rule-status"></p><p id="sequence"></p></div></section>
<svg id="plot" viewBox="0 0 900 360" role="img" aria-label="Supplied member ways, declared maneuver sequence and selected path; surrounding roads omitted"></svg>
<p class="muted">Gray: supplied member ways in this case’s component. Orange dashed: raw declared sequence, whose applicability appears above. Blue: selected path. A/B: raw query start/end. The view focuses on the declaration and query; complete member ways can continue beyond the viewport. This local longitude/latitude diagram does not establish actual road disconnection, signs, turn geometry, grade/access or geographic ownership.</p>
<div class="card scroll"><h2>Selected directed raw segments</h2><table><thead><tr><th>Arc identity</th><th>Distance (m)</th><th>Time (s)</th></tr></thead><tbody id="rows"></tbody></table><p id="empty" hidden>No selected path in the supplied network.</p></div>
<div class="notice"><strong>A missing path does not prove no real-world route exists.</strong> Starting inside a via road or ending inside a sequence prefix follows the declared solver’s history semantics; it does not establish legal turn or entry permission. An inactive prohibition also supplies no permission. Unknown supplied controls reject the whole bundle; the separate unresolved Tenney Court bollard is never assumed open to claim geographic coverage.</div>
<details class="card"><summary>Model assumptions and exact evidence</summary><p>The adopted reference remains 2026-10-28T18:00:00Z (12:00 MDT). The Thursday-evening case is a regression only. Access is frozen for the whole route: solo ordinary private passenger car, no permits or HOV exemption, tolls allowed. Conditions may change before arrival.</p><p>Distances use a sphere of radius 6,371,000 m without elevation. Time uses static posted limits or explicit highway model defaults, excluding traffic, turn/intersection, acceleration and surface delays. A raw traffic-signal node does not supply a signal phase or waiting-time model. The node/way inputs, all supplied supported relations, scenario and costs are composed before a result can be returned.</p><p>All incident/exterior roads, other controls, physical/grade/access evidence, reviewed urban anchors, directed attachments, masks and release assets remain unverified. The public straight-line map, all 2,508 old Census costs and every older inspector view are unchanged.</p><pre id="identity"></pre></details>
<p class="muted">OSM data © OpenStreetMap contributors, ODbL.</p>
</main><script id="mixed-data" type="application/json">__MIXED_DATA__</script><script>
'use strict';
const data=JSON.parse(document.getElementById('mixed-data').textContent),byId=id=>document.getElementById(id),arcs=new Map(data.arcs.map(a=>[a.id,a]));
for(const item of data.cases){const option=document.createElement('option');option.value=item.id;option.textContent=item.label;byId('case').append(option);}
function svg(tag,attrs,parent){const el=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const[k,v]of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;}
function text(tag,value,parent){const el=document.createElement(tag);el.textContent=value;parent.append(el);return el;}
function draw(){const item=data.cases.find(c=>c.id===byId('case').value),metric=byId('metric').value,entry=item.queries[metric],answer=entry.result;
 byId('cost').textContent=answer.cost===null?'No path in supplied network':answer.cost.toFixed(3)+(metric==='length'?' m':' s');
 byId('explanation').textContent=answer.cost===null?'No complete path is available under these supplied roads and raw constraints. Surrounding roads and real-world access remain unverified.':'Finite modeled cost in the supplied network only, from an unconstrained raw-node start. No anchor or connector is adopted.';
 byId('nodes').textContent='Raw node '+answer.source+' → '+answer.target;byId('clock').textContent=item.clock;byId('rule-status').textContent=item.rule_status;
 const sequence=data.declarations[String(item.relation_id)];byId('sequence').textContent='Declared sequence: '+sequence.join(' → ');
 const ways=data.ways.filter(w=>item.family==='node'?[696728766,1475543490].includes(w.id):![696728766,1475543490].includes(w.id)),points=new Map();for(const way of ways)for(const p of way.nodes)points.set(p[0],p.slice(1));
 const focus=[...sequence,...answer.arc_path].flatMap(aid=>arcs.get(aid).raw_geometry.map(p=>p.slice(1))).concat([points.get(answer.source),points.get(answer.target)]);
 const xs=focus.map(p=>p[0]),ys=focus.map(p=>p[1]),cos=Math.cos((Math.min(...ys)+Math.max(...ys))/2*Math.PI/180),minX=Math.min(...xs)*cos,maxX=Math.max(...xs)*cos,minY=Math.min(...ys),maxY=Math.max(...ys),scale=Math.min(790/(maxX-minX),250/(maxY-minY));
 const xy=p=>[450+(p[0]*cos-(minX+maxX)/2)*scale,180-(p[1]-(minY+maxY)/2)*scale];
 const plot=byId('plot');plot.replaceChildren();for(const way of ways)svg('polyline',{points:way.nodes.map(p=>xy(p.slice(1)).join(',')).join(' '),class:'road'},plot);
 function arcLine(aid,cls){const a=arcs.get(aid);svg('polyline',{points:a.raw_geometry.map(p=>xy(p.slice(1)).join(',')).join(' '),class:cls,'data-arc-id':aid},plot);}
 for(const aid of sequence)arcLine(aid,'declaration');for(const aid of answer.arc_path)arcLine(aid,'path');
 for(const[nid,label]of[[answer.source,'A'],[answer.target,'B']]){const[x,y]=xy(points.get(nid));svg('circle',{cx:x,cy:y,r:8,class:'node'},plot);const el=svg('text',{x:x+10,y:y-12,'font-size':28,fill:'#17232f'},plot);el.textContent=label;}
 const rows=byId('rows');rows.replaceChildren();for(const aid of answer.arc_path){const a=arcs.get(aid),row=document.createElement('tr');row.dataset.arcId=aid;text('td',aid,row);text('td',a.length.toFixed(3),row);text('td',a.travel_time.toFixed(3),row);rows.append(row);}byId('empty').hidden=answer.arc_path.length>0;
 byId('identity').textContent='Frozen mixed report SHA-256: '+data.report_sha256+'\nScenario SHA-256: '+entry.scenario_sha256+'\nDeclared graph SHA-256: '+entry.graph_sha256+'\nStatic member context SHA-256: '+data.source_context_sha256+'\nEarlier raw context SHA-256: '+data.old_raw_context_sha256;
}
for(const id of['case','metric'])byId(id).addEventListener('change',draw);draw();
</script></body></html>
'''


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    result=render();args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(result)
