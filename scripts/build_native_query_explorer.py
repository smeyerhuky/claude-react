"""Render frozen directional native-node evidence offline, with no browser routing."""
import argparse
from fractions import Fraction
import json
from pathlib import Path
from fort_collins_bidirectional_checkpoint import project,REFERENCE,PARENT,WITNESS
from fort_collins_bounded_frontier import diagnostic_inputs
from fort_collins_guidance_checkpoint import file_sha
from reference_via_node_compile import canonical_sha,need


def payload():
    report=project();need(report==json.loads((REFERENCE/'report.json').read_text()),'Exact frozen bidirectional report required')
    parent=json.loads((PARENT/'report.json').read_text());u=parent['reconciled_source']
    need(canonical_sha(u)==report['source_context_sha256'],'Exact retained source geometry required')
    _,known,_,unknown,roads,_=diagnostic_inputs(u);by={a['id']:a for a in known};queries={};used=set()
    original=json.loads((WITNESS/'report.json').read_text())['query_replays']
    for direction,metrics in report['conditional_query_matrix'].items():
        for metric,c in metrics.items():
            path=original[metric]['arc_path'] if direction=='forward' else report['reverse_supported_walk_proposals'][metric]['arc_path']
            expected=c['interior_supported_witness']['stored_cost_exact']
            need(all(a in by for a in path) and canonical_sha(path)==c['interior_supported_witness']['strict_supported_path_sha256'],
                 'Only the exact supported witness may be drawn; never hypothetical geometry')
            cost=sum((Fraction(by[a][metric]) for a in path),Fraction(0))
            need([str(cost.numerator),str(cost.denominator)]==expected,'Displayed path must replay its exact directional metric cost')
            exits=c['exact_first_exit_screen']['exits'];used.update(path);used.update(e['arc_id'] for e in exits)
            need(all(e['arc_id'] in by for e in exits),'This view requires supported first-exit segments')
            gap=c['minimum_first_exit_gap_exact']
            queries[f'{direction}:{metric}']=dict(direction=direction,metric=metric,source=c['source'],target=c['target'],path=path,
                cost=float(cost),cost_exact=expected,first_exit_gap=float(Fraction(*map(int,gap))),first_exit_gap_exact=gap,
                reachable_exits=c['reachable_first_exit_count'],unreachable_exits=c['unreachable_first_exit_count'],exits=exits,
                conditional_exterior_exclusion=c['conditional_retained_cost_stable_with_nonnegative_exterior'],
                completion_domain=c['completion_domain'],access_verified=False,release_eligible=False)
    points={n['id']:[n['id'],*n['lonlat']] for n in u['nodes']};forward=report['named_directions']['forward']
    return dict(schema='native-core-directional-inspector-v1',queries=queries,
        roads=[dict(id=w['id'],name=w['tags'].get('name','Unnamed model way'),geometry=w['nodes'],unknown=str(w['id']) in unknown) for w in roads],
        arcs={aid:by[aid] for aid in sorted(used)},core_points=[points[n] for n in u['seed_node_ids']],
        fixed_endpoints=dict(A=points[forward['source']],B=points[forward['target']]),gate=points[8917794983],
        scenario_sha256=report['scenario_sha256'],report_sha256=file_sha(REFERENCE/'report.json'),
        source_context_sha256=report['source_context_sha256'],source_identity=report['source_identity'],
        source_seed_nodes=294,model_ways=107,retained_controls=15,uninspected_outer_nodes=603,
        strict_way_budget=100,strict_status='unsupported',source_approach=report['source_approach'],
        fixed_departure_utc='2026-10-28T18:00:00Z',normal_graph_admitted=False,access_verified=False,
        approved_connectors=0,adopted_anchors=0,release_eligible=False)


def render():
    data=json.dumps(payload(),sort_keys=True,separators=(',',':')).replace('<','\\u003c').replace('&','\\u0026')
    return TEMPLATE.replace('__NATIVE_QUERY_DATA__',data)


TEMPLATE=r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Fort Collins native directional bounds</title><style>
*{box-sizing:border-box}body{margin:0;background:#f2f5f6;color:#18333a;font:14px/1.5 system-ui,sans-serif}main{max-width:1120px;margin:auto;padding:20px}header{background:#153f46;color:#fff;padding:20px;border-radius:10px}h1{font-size:25px;margin:4px 0}h2{font-size:17px;margin:0 0 8px}.eyebrow{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#bbd8d8}.notice{background:#fff0d5;border:1px solid #d3a25a;border-radius:8px;padding:14px;margin:16px 0}.controls{display:flex;gap:16px;flex-wrap:wrap;margin:16px 0}label{display:grid;gap:5px;flex:1 1 240px}select,button{font:inherit;padding:9px;border:1px solid #8a9ca0;border-radius:5px;background:white;color:#18333a}select:focus-visible,button:focus-visible,summary:focus-visible{outline:3px solid #1b70b0;outline-offset:2px}.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin:16px 0}.card{background:#fff;border:1px solid #ccd8da;border-radius:8px;padding:15px}.value{font-size:29px;font-weight:700;color:#155a73}.muted{color:#506970}.small{font-size:12px}.map-wrap{background:white;border:1px solid #ccd8da;border-radius:8px;overflow:hidden}svg{display:block;width:100%;height:auto;max-height:460px}.road{fill:none;stroke:#a3b1b5;stroke-width:1.8}.unknown{stroke:#b47716;stroke-width:3;stroke-dasharray:7 5}.core-node{fill:#4e8c87;opacity:.5}.exit{fill:none;stroke:#c3862b;stroke-width:3;opacity:.8}.witness{fill:none;stroke:#146eab;stroke-width:5;stroke-linecap:round}.endpoint{fill:#fff;stroke:#18333a;stroke-width:2}.endpoint-label{font:bold 16px system-ui;fill:#18333a;paint-order:stroke;stroke:#fff;stroke-width:4}.gate{fill:#fff0d5;stroke:#a5650f;stroke-width:2}.legend{padding:10px 14px;margin:0}.scroll{overflow:auto}table{width:100%;border-collapse:collapse;text-align:left}th,td{padding:8px;border-bottom:1px solid #dce4e6;vertical-align:top}tr[aria-current="true"]{background:#e6f1f6}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace}details{margin:14px 0}summary{cursor:pointer;font-weight:650}ul{padding-left:20px}.check{display:flex;align-items:center;gap:8px;flex:none}.check input{width:17px;height:17px}@media(max-width:600px){main{padding:10px}header{padding:15px}h1{font-size:21px}.value{font-size:24px}th,td{padding:6px}}
</style></head><body><main>
<header><div class="eyebrow">Frozen native-node model · offline evidence</div><h1>Fort Collins directional query bounds</h1><p>Inspect each direction separately. These four model witnesses use a fixed 294-node source core.</p></header>
<div class="notice"><strong>Research only. Zero connectors approved. No adopted anchors.</strong><br>Vehicle access is unverified. The 107-way strict graph is unsupported at its 100-way budget. Public road-tab release remains blocked.</div>
<div class="controls"><label for="direction">Native query direction<select id="direction"><option value="forward">Forward · A → B</option><option value="reverse">Reverse · B → A</option></select></label><label for="metric">Measure<select id="metric"><option value="length">Modeled distance (m)</option><option value="travel_time">Modeled free-flow time (s)</option></select></label></div>
<section class="cards" aria-live="polite"><div class="card"><h2>Supported model witness</h2><div class="value" id="cost"></div><p id="endpoints"></p><p class="muted small">Rounded display. Exact stored-weight fractions appear below.</p></div><div class="card"><h2>Smallest first-exit margin</h2><div class="value" id="margin"></div><p id="exit-summary"></p><p class="muted small">Exact comparison; a tie would block exclusion.</p></div><div class="card"><h2>Validation scope</h2><p>294 inspected native nodes · 107 model ways · 15 retained declarations.</p><p>603 outer source nodes remain uninspected.</p><p class="muted small">Unconstrained native starts. Connector approach history is unmodeled.</p></div></section>
<div class="map-wrap"><svg id="plot" viewBox="0 0 900 450" role="img" aria-label="Retained native model geometry, inspected nodes, unknown ways and selected directed witness"></svg><p class="legend small">Gray: retained model ways. Teal dots: inspected native nodes. Amber dashed: unknown gate or whole-way turn controls. Blue arrows: selected supported witness. A/B identify fixed native endpoints.</p></div>
<p class="muted small" id="viewport-note"></p><p class="muted small">Local longitude/latitude diagram. It does not establish physical joins, grade, entry permission or geographic ownership.</p><div class="controls"><label class="check"><input id="focus-path" type="checkbox" checked>Focus on selected witness</label><label class="check"><input id="show-exits" type="checkbox">Show the 47 first-exit segments</label></div>
<section class="card scroll"><h2>Four independent direction/metric checks</h2><table><thead><tr><th>Direction</th><th>Distance witness</th><th>Time witness</th><th>Scope</th></tr></thead><tbody id="comparison-rows"></tbody></table><p class="muted small">Forward distance/time witnesses differ. Both reverse witnesses use the same three supported arcs. Costs are never transposed between directions.</p></section>
<details class="card" open><summary>Selected supported segments</summary><div class="scroll"><table><thead><tr><th>Directed raw arc</th><th>Way</th><th>Distance (m)</th><th>Time (s)</th></tr></thead><tbody id="rows"></tbody></table></div></details>
<details class="card"><summary>First-exit lower bounds</summary><p>A reachable exit must exceed the supported interior witness before outside continuation is added. One unreachable exit remains explicit.</p><div class="scroll"><table><thead><tr><th>Exit arc</th><th>Exact lower bound</th><th>Screen result</th></tr></thead><tbody id="exits"></tbody></table></div></details>
<details class="card"><summary>Fixed scenario and conditional claim</summary><p>Reference departure: 2026-10-28T18:00:00Z, Wednesday noon MDT. Access is frozen for the whole modeled trip: solo ordinary private passenger car, no permits or HOV exemption, tolls allowed. Time uses static posted limits or declared defaults, with no traffic or waiting model and no arrival-time reevaluation. Dimensions remain unspecified.</p><ul id="domain"></ul><p>Source replay is required; the offline view performs no routing or live source verification. Gate operation and the whole-way mandatory-turn interpretation remain unknown. Independent access review and a different release approver (#137), coverage/competitor/mask checks (#138) and public assets/UI release (#139) remain required.</p></details>
<details class="card"><summary>Exact costs and source fingerprints</summary><pre id="identity"></pre></details>
<p class="muted small">OSM data © OpenStreetMap contributors, ODbL. This single-pair model experiment completes no city, metro or state. Older inspectors and all 2,508 Census costs remain separate and unchanged.</p>
</main><script id="native-bounds-data" type="application/json">__NATIVE_QUERY_DATA__</script><script>
const data=JSON.parse(document.getElementById('native-bounds-data').textContent),$=id=>document.getElementById(id),ns='http://www.w3.org/2000/svg';
const el=(tag,attrs={})=>{const n=document.createElementNS(ns,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;};
const text=(parent,tag,value)=>{const n=document.createElement(tag);n.textContent=value;parent.appendChild(n);return n;};
const number=(value,unit)=>`${value.toFixed(6)} ${unit}`;
let position;
const draw=(points,cls)=>el('polyline',{points:points.map(p=>position(p).join(',')).join(' '),class:cls});
for(const direction of ['forward','reverse']){const row=$('comparison-rows').insertRow();row.dataset.direction=direction;text(row,'td',direction==='forward'?'Forward · A → B':'Reverse · B → A');text(row,'td',number(data.queries[direction+':length'].cost,'m'));text(row,'td',number(data.queries[direction+':travel_time'].cost,'s'));text(row,'td','Conditional native model');}
function update(){
 const direction=$('direction').value,metric=$('metric').value,q=data.queries[direction+':'+metric],unit=metric==='length'?'m':'s';
 const focused=$('focus-path').checked,points=focused?q.path.flatMap(a=>data.arcs[a].raw_geometry):data.roads.flatMap(w=>w.geometry),padding=focused ? 0.00035 : 0;
 const minX=Math.min(...points.map(p=>p[1]))-padding,maxX=Math.max(...points.map(p=>p[1]))+padding,minY=Math.min(...points.map(p=>p[2]))-padding,maxY=Math.max(...points.map(p=>p[2]))+padding,scale=Math.min(830/(maxX-minX),380/(maxY-minY));
 const offsetX=(900-(maxX-minX)*scale)/2,offsetY=(450-(maxY-minY)*scale)/2;position=p=>[offsetX+(p[1]-minX)*scale,450-offsetY-(p[2]-minY)*scale];
 $('viewport-note').textContent=focused?'Focused witness neighborhood. Complete retained ways and some inspected nodes continue beyond this viewport.':'Full retained model geometry. Inspected nodes are only the selected core; surrounding source incidence remains incomplete.';
 $('cost').textContent=number(q.cost,unit);$('margin').textContent=number(q.first_exit_gap,unit);$('endpoints').textContent=`Native ${q.source} → ${q.target}`;$('exit-summary').textContent=`${q.reachable_exits} reachable exits strictly exceed this witness; ${q.unreachable_exits} unreachable exit retained.`;
 for(const row of $('comparison-rows').rows)row.setAttribute('aria-current',String(row.dataset.direction===direction));
 const svg=$('plot');svg.replaceChildren();const defs=el('defs'),marker=el('marker',{id:'arrow',viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:7,markerHeight:7,markerUnits:'userSpaceOnUse',orient:'auto-start-reverse'});marker.appendChild(el('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#146eab'}));defs.appendChild(marker);svg.appendChild(defs);
 for(const w of data.roads){const line=draw(w.geometry,'road'+(w.unknown?' unknown':''));const title=el('title');title.textContent=`${w.name} · way ${w.id}${w.unknown?' · control unknown':''}`;line.appendChild(title);svg.appendChild(line);}
 for(const p of data.core_points){const[x,y]=position(p);svg.appendChild(el('circle',{cx:x,cy:y,r:1.8,class:'core-node'}));}
 if($('show-exits').checked)for(const e of q.exits)svg.appendChild(draw(data.arcs[e.arc_id].raw_geometry,'exit'));
 for(const aid of q.path){const geometry=data.arcs[aid].raw_geometry,line=draw(geometry,'witness'),a=position(geometry[0]),b=position(geometry[geometry.length-1]);if(Math.hypot(a[0]-b[0],a[1]-b[1])>12)line.setAttribute('marker-end','url(#arrow)');svg.appendChild(line);}
 const[gx,gy]=position(data.gate);svg.appendChild(el('rect',{x:gx-4,y:gy-4,width:8,height:8,class:'gate'}));
 for(const[name,p]of Object.entries(data.fixed_endpoints)){const[x,y]=position(p);svg.appendChild(el('circle',{cx:x,cy:y,r:5,class:'endpoint'}));const label=el('text',{x:x+(name==='A'?-15:10),y:y+(name==='A'?-10:18),class:'endpoint-label'});label.textContent=name;svg.appendChild(label);}
 $('rows').replaceChildren();for(const aid of q.path){const a=data.arcs[aid],row=$('rows').insertRow();text(row,'td',aid);text(row,'td',a.way);text(row,'td',a.length.toFixed(6));text(row,'td',a.travel_time.toFixed(6));}
 $('exits').replaceChildren();for(const e of q.exits){const row=$('exits').insertRow();text(row,'td',e.arc_id);text(row,'td',e.first_exit_cost_lower_bound_exact?e.first_exit_cost_lower_bound_exact.join(' / '):'Unreachable in prefix relaxation');text(row,'td',e.reason);}
 $('domain').replaceChildren();for(const condition of q.completion_domain)text($('domain'),'li',condition);
 $('identity').textContent=JSON.stringify({query:direction+':'+metric,source:q.source,target:q.target,cost_exact:q.cost_exact,minimum_first_exit_gap_exact:q.first_exit_gap_exact,report_sha256:data.report_sha256,source_context_sha256:data.source_context_sha256,source_identity:data.source_identity,scenario_sha256:data.scenario_sha256,strict_status:data.strict_status,strict_way_budget:data.strict_way_budget,normal_graph_admitted:false,access_verified:false,approved_connectors:0,adopted_anchors:0,release_eligible:false},null,2);
}
for(const id of ['direction','metric','focus-path'])$(id).addEventListener('change',update);$('show-exits').addEventListener('change',()=>{if($('show-exits').checked)$('focus-path').checked=false;update();});update();
</script></body></html>
'''


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path,required=True);args=parser.parse_args()
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(render())
