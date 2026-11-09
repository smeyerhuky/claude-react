"""Render frozen northern native witnesses offline; no browser route calculation."""
import argparse
import json
from pathlib import Path
from northern_detour_geometry import load_geometry, report
from northern_urban_path_checkpoint import OUTPUT as PARENT

LABELS={'fort-college':'Fort Collins · North College Avenue','loveland-lincoln':'Loveland · North Lincoln Avenue',
        'loveland-cleveland':'Loveland · North Cleveland Avenue','greeley-ninth':'Greeley · 9th Street','greeley-tenth':'Greeley · 10th Street'}


def payload():
    geometry,manifest=load_geometry();frozen=report();old=json.loads(PARENT.read_bytes())
    before={(q['source'],q['target'],q['metric']):q['result']['cost'] for q in old['queries']}
    return dict(schema='northern-detour-offline-explorer-v1',geometry=geometry,manifest=manifest,labels=LABELS,
        candidates=frozen['candidates'],queries=[dict(source=q['source'],target=q['target'],metric=q['metric'],
            cost=q['result']['cost'],cost_exact=q['result']['exact_stored_path_cost'],path=q['result']['arc_path'],
            parent_cost=before[q['source'],q['target'],q['metric']]) for q in frozen['queries']],
        counts=frozen['counts'],comparison=frozen['parent_comparison'],scenario_utc='2026-10-28T18:00:00Z')


def render_data(data):
    content=json.dumps(data,sort_keys=True,separators=(',',':'),allow_nan=False).replace('<','\\u003c').replace('&','\\u0026')
    return TEMPLATE.replace('__DETOUR_DATA__',content)


def render():return render_data(payload())


TEMPLATE=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Northern Colorado road witnesses</title><style>
*{box-sizing:border-box}body{margin:0;background:#f1f5f6;color:#16333b;font:14px/1.5 system-ui,sans-serif}main{max-width:1160px;padding:20px;margin:auto}header{padding:22px;border-radius:12px;background:#133e48;color:white}.eyebrow{font-size:12px;text-transform:uppercase;letter-spacing:.1em;color:#c1dedf}h1{font-size:26px;margin:5px 0}h2{font-size:17px;margin:0 0 8px}p{margin:8px 0}.muted{color:#506a73}.small{font-size:12px}.scope{border-left:4px solid #b67b18;background:#fff6e3;border-radius:6px;padding:12px 16px;margin:16px 0}.controls{display:flex;align-items:end;gap:12px;flex-wrap:wrap;margin:16px 0}label{display:grid;gap:5px;flex:1 1 220px}select,button{font:inherit;padding:9px;border:1px solid #8fa5ac;border-radius:6px;background:white;color:#16333b}button{cursor:pointer}button:disabled{opacity:.45;cursor:default}button:hover:enabled{background:#e9f2f4}select{width:100%;min-width:0}select:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #2667a2;outline-offset:2px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:12px;margin:16px 0}.card{background:white;border:1px solid #ccdadd;border-radius:9px;padding:15px;min-width:0}.value{font-size:30px;font-weight:750;color:#ac306e}.return-value{color:#087983}.map-wrap{border:1px solid #ccdadd;border-radius:9px;background:white;overflow:hidden}svg{display:block;width:100%;height:auto;max-height:510px}.context{fill:none;stroke:#b5c4c9;stroke-width:1;opacity:.5}.selected{fill:none;stroke:#bc367b;stroke-width:3.5;stroke-linejoin:round;stroke-linecap:round}.return{fill:none;stroke:#087f88;stroke-width:2.5;stroke-dasharray:6 4}.endpoint{fill:white;stroke:#1e414d;stroke-width:2}.endpoint-text{fill:#16333b;stroke:white;paint-order:stroke;stroke-width:4;font:bold 15px system-ui}.legend{padding:10px 14px}.check{display:flex;align-items:center;gap:8px;flex:none}.check input{width:17px;height:17px}.scroll{overflow:auto}table{width:100%;min-width:740px;border-collapse:collapse;text-align:left}th,td{border-bottom:1px solid #dde7e9;padding:8px;vertical-align:top}tr[aria-current="true"]{background:#e7f2f4}td button{font-size:12px;padding:5px 8px;white-space:nowrap}details{margin:16px 0}summary{cursor:pointer;font-weight:650}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}.pager{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.badge{display:inline-block;padding:3px 8px;background:#e3f1ef;border-radius:12px;font-size:12px}.cost-source{font-size:12px;color:#506a73}a{color:#126889}@media(max-width:600px){main{padding:10px}header{padding:15px}h1{font-size:22px}.value{font-size:25px}th,td{padding:6px}.controls>button{width:100%}}
</style></head><body><main>
<header><div class="eyebrow">Northern Colorado · frozen road-model witnesses</div><h1>Inspect the supported detours</h1><p>Fort Collins, Loveland and Greeley · 20 directed pairs · 40 finite metric results.</p></header>
<div class="scope"><strong>Research endpoints; no adopted anchors. Zero connectors approved.</strong><p>These witnesses use a deliberately incomplete supported road subset. They do not establish vehicle access, geographic coverage, globally shortest routes or isochrones. The public straight-line map and older Census experiments are unchanged.</p></div>
<div class="controls"><label for="source">From<select id="source"></select></label><button id="swap" type="button">Swap direction</button><label for="target">To<select id="target"></select></label><label for="metric">Measure<select id="metric"><option value="length">Modeled road distance</option><option value="travel_time">Modeled free-flow time</option></select></label></div>
<section class="cards" aria-live="polite"><div class="card"><h2>Selected direction</h2><div id="cost" class="value"></div><p id="selected-label"></p><p id="raw-cost" class="cost-source"></p><span id="improvement" class="badge"></span></div><div class="card"><h2>Return direction</h2><div id="return-cost" class="value return-value"></div><p id="return-label"></p><p class="muted small">Separate source-to-target search. Costs and streets may differ.</p></div><div class="card"><h2>What changed</h2><p>28 newly finite metric results. All 12 previously finite results improved.</p><p class="muted small">Same five native endpoint hypotheses. Unsupported lane controls remain excluded; no permissions were relaxed.</p></div></section>
<div class="controls"><label for="extent">Map extent<select id="extent"><option value="route">Selected and return witnesses</option><option value="greeley">Greeley streets</option><option value="all">All retained witnesses</option></select></label><label class="check"><input id="show-return" type="checkbox" checked>Compare return path</label><label class="check"><input id="show-context" type="checkbox" checked>Other retained witness segments</label></div>
<div class="map-wrap"><svg id="plot" viewBox="0 0 960 510" role="img" aria-label="Selected directed native road witness"></svg><p class="legend small">Magenta: selected direction. Teal dashed: return. Gray: other retained witness segments. A/B: unadopted native endpoints. Geometry comes from the frozen original OSM extract; no basemap or routing requests.</p></div><p id="viewport-note" class="muted small"></p>
<details class="card" open><summary>All 20 directed pairs</summary><div class="scroll" tabindex="0" role="region" aria-label="Scrollable witness table"><table><thead><tr><th>From → to</th><th>Distance</th><th>Modeled time</th><th>Compared with major roads</th><th>Inspect</th></tr></thead><tbody id="matrix"></tbody></table></div></details>
<details class="card"><summary>Selected road segments</summary><p class="muted small">Original directed adjacent-node segments, in route order. Speeds use source limits or declared highway defaults; times exclude intersection delays and traffic.</p><div class="pager"><button id="previous" type="button">Previous segments</button><span id="range"></span><button id="next" type="button">Next segments</button></div><div class="scroll" tabindex="0" role="region" aria-label="Scrollable witness table"><table><thead><tr><th>Raw arc</th><th>Road</th><th>Direction</th><th>Meters</th><th>Seconds</th><th>Speed basis</th></tr></thead><tbody id="segments"></tbody></table></div></details>
<details class="card"><summary>Fixed model assumptions</summary><p>Reference departure: 2026-10-28T18:00:00Z (Wednesday, 12:00 MDT). Solo ordinary private passenger car; no permits or HOV exemption; tolls allowed. Vehicle dimensions are unspecified, so unknown clearance controls remain unsupported.</p><p>Conditions are frozen for the entire route. Times use static posted limits or declared defaults, with no traffic, waiting or arrival-time access reevaluation. America/Denver is a declared research timezone assignment. Conditions may change before arrival.</p><p>Starts are unconstrained native road nodes; connector approach histories and costs are excluded. A route may end inside an ONLY prefix under the retained solver policy. Context-point displacement is not connector cost. Forty finite results among five hypotheses do not supply a uniform destination-window bound or a complete metro anchor set.</p></details>
<details class="card"><summary>Exact costs and source evidence</summary><pre id="evidence"></pre></details>
<p class="muted small">Offline frozen snapshot; no browser routing or live source verification. OSM data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>, ODbL. This experiment completes no city, metro or state.</p>
</main><script type="application/json" id="detour-data">__DETOUR_DATA__</script><script>
const data=JSON.parse(document.getElementById('detour-data').textContent),$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg',g=data.geometry;
const candidates=Object.fromEntries(data.candidates.map(c=>[c.id,c])),queries=Object.fromEntries(data.queries.map(q=>[[q.source,q.target,q.metric].join(':'),q]));
const query=(s,t,m)=>queries[[s,t,m].join(':')],text=(parent,tag,value)=>{const n=document.createElement(tag);n.textContent=value;parent.appendChild(n);return n;};
const el=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const format=(q)=>q.metric==='length'?`${(q.cost/1000).toFixed(2)} km`:`${(q.cost/60).toFixed(1)} min`;
const positions=q=>[g.nodes[g.arcs[q.path[0]].from],...q.path.map(id=>g.nodes[g.arcs[id].to])];
let offset=0;
for(const id of ['source','target'])for(const c of data.candidates){const o=document.createElement('option');o.value=c.id;o.textContent=data.labels[c.id];$(id).appendChild(o);}
$('source').value='fort-college';$('target').value='greeley-tenth';
for(const s of data.candidates)for(const t of data.candidates){if(s.id===t.id)continue;const row=$('matrix').insertRow();row.dataset.source=s.id;row.dataset.target=t.id;
 text(row,'td',`${data.labels[s.id]} → ${data.labels[t.id]}`);text(row,'td',format(query(s.id,t.id,'length')));text(row,'td',format(query(s.id,t.id,'travel_time')));
 text(row,'td',query(s.id,t.id,'length').parent_cost===null?'New modeled witnesses':'Both measures improved');const button=text(text(row,'td',''),'button','Inspect pair');button.type='button';button.setAttribute('aria-label',`Inspect ${s.id} to ${t.id}`);button.onclick=()=>{$('source').value=s.id;$('target').value=t.id;offset=0;update();};}
function draw(q,r){
 const p=positions(q),showReturn=$('show-return').checked,returnPoints=positions(r),extent=$('extent').value;
 const viewport=extent==='greeley'?[[-104.71,40.41],[-104.68,40.44]]:extent==='all'?Object.values(g.nodes):[...p,...(showReturn?returnPoints:[])];
 let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;for(const point of viewport){minX=Math.min(minX,point[0]);maxX=Math.max(maxX,point[0]);minY=Math.min(minY,point[1]);maxY=Math.max(maxY,point[1]);}
 const width=matchMedia('(max-width:600px)').matches?540:960;
 const cos=Math.cos((minY+maxY)/2*Math.PI/180),dx=Math.max((maxX-minX)*cos,.0005),dy=Math.max(maxY-minY,.0005),scale=Math.min((width-100)/dx,410/dy);
 const project=p=>[width/2+(p[0]-(minX+maxX)/2)*cos*scale,255-(p[1]-(minY+maxY)/2)*scale];
 const svg=$('plot');svg.setAttribute('viewBox',`0 0 ${width} 510`);svg.replaceChildren();svg.setAttribute('aria-label',`${data.labels[q.source]} to ${data.labels[q.target]}, ${format(q)}, native road geometry`);
 const defs=el('defs'),marker=el('marker',{id:'arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:5,markerHeight:5,orient:'auto-start-reverse'});marker.appendChild(el('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#bc367b'}));defs.appendChild(marker);svg.appendChild(defs);
 if($('show-context').checked){const segments=Object.values(g.arcs).map(a=>{const p=project(g.nodes[a.from]),q=project(g.nodes[a.to]);return`M${p[0]},${p[1]}L${q[0]},${q[1]}`;}).join('');svg.appendChild(el('path',{class:'context',d:segments}));}
 if(showReturn)svg.appendChild(el('polyline',{class:'return',points:returnPoints.map(p=>project(p).join(',')).join(' ')}));
 const line=el('polyline',{class:'selected',points:p.map(p=>project(p).join(',')).join(' '),'marker-end':'url(#arrow)'});line.dataset.arcCount=q.path.length;svg.appendChild(line);
 for(const[id,label]of[[q.source,'A'],[q.target,'B']]){const point=project(candidates[id].lonlat);svg.appendChild(el('circle',{class:'endpoint',cx:point[0],cy:point[1],r:6}));const n=el('text',{class:'endpoint-text',x:point[0]+9,y:point[1]-9});n.textContent=label;svg.appendChild(n);}
 $('viewport-note').textContent=(extent==='greeley'?'Greeley detail: the regional witness continues beyond this window.':extent==='all'?'All retained witness segments; this is not the full supported graph.':'Fit to the selected witness'+(showReturn?' and its return.':'.'))+' Native longitude/latitude diagram; physical joins, grade and access remain unverified.';
}
function update(){
 const s=$('source').value,t=$('target').value,m=$('metric').value,q=query(s,t,m),r=query(t,s,m);
 for(const option of $('target').options)option.disabled=option.value===s;
 $('cost').textContent=format(q);$('raw-cost').textContent=q.cost.toFixed(6)+(m==='length'?' m':' s');$('selected-label').textContent=`A: ${data.labels[s]} → B: ${data.labels[t]}`;
 $('return-cost').textContent=format(r);$('return-label').textContent=`${data.labels[t]} → ${data.labels[s]}`;
 $('improvement').textContent=q.parent_cost===null?'New supported-subset witness':`Improved from ${format({...q,cost:q.parent_cost})}`;
 for(const row of $('matrix').rows)row.setAttribute('aria-current',String(row.dataset.source===s&&row.dataset.target===t));
 draw(q,r);$('segments').replaceChildren();const end=Math.min(offset+25,q.path.length);
 for(const aid of q.path.slice(offset,end)){const a=g.arcs[aid],w=g.ways[a.way],row=$('segments').insertRow();row.dataset.arc=aid;
 text(row,'td',aid);text(row,'td',`${w.name}${w.ref?' · '+w.ref:''}`);text(row,'td',a.direction==='forward'?'Along original way':'Against original way');text(row,'td',a.length.toFixed(6));text(row,'td',a.travel_time.toFixed(6));text(row,'td',a.speed_basis==='explicit_raw_limit'?'Source speed limit':'Declared highway default');}
 $('range').textContent=`${offset+1}–${end} of ${q.path.length} segments`;$('previous').disabled=offset===0;$('next').disabled=end===q.path.length;
 $('evidence').textContent=JSON.stringify({source:s,target:t,metric:m,cost_exact:q.cost_exact,arc_count:q.path.length,source_node:candidates[s].node,target_node:candidates[t].node,report_sha256:g.report_sha256,geometry_sha256:data.manifest.geometry_sha256,source_identity:g.source_identity,scenario_sha256:g.scenario_sha256,access_verified:false,geographic_coverage_certified:false,anchors_adopted:false,connectors_approved:0,release_eligible:false},null,2);
}
$('source').onchange=()=>{if($('source').value===$('target').value)$('target').value=data.candidates.find(c=>c.id!==$('source').value).id;offset=0;update();};
for(const id of ['target','metric'])$(id).onchange=()=>{offset=0;update();};
for(const id of ['extent','show-return','show-context'])$(id).onchange=update;
$('swap').onclick=()=>{const s=$('source').value;$('source').value=$('target').value;$('target').value=s;offset=0;update();};
window.addEventListener('resize',update);
$('previous').onclick=()=>{offset=Math.max(0,offset-25);update();};$('next').onclick=()=>{offset+=25;update();};update();
</script></body></html>
'''

if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',required=True,type=Path);args=parser.parse_args()
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(render())
