"""Offline native-point inventory; never infer road or geographic coverage."""
import argparse
import hashlib
import json
from pathlib import Path

from metro_competitor_review_queue import DOMAINS, build as build_queue
from metro_scenario_checkpoint import REFERENCE, load_reference

ROOT=Path(__file__).resolve().parents[1]
TEMPLATE=r'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Metro competitor investigation inventory</title>
<style>body{font:15px system-ui;color:#182235;background:#f5f7fa;margin:20px}h1{font-size:25px}.notice{background:#fff1cf;border-left:5px solid #a65d00;padding:12px}.panel{background:white;border:1px solid #d5dde7;border-radius:8px;padding:14px;margin:14px 0}.controls{display:flex;gap:18px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:5px}input,select,button{font:inherit;padding:6px}svg{width:100%;max-height:430px;background:#f7fafc}circle{cursor:pointer}circle:focus{stroke:black;stroke-width:3}.table{max-height:390px;overflow:auto}table{border-collapse:collapse;width:100%}td,th{padding:7px;text-align:left;border-bottom:1px solid #ddd}th{position:sticky;top:0;background:white}small,footer{font-size:12px;color:#45546a}footer{overflow-wrap:anywhere}#selected{font-weight:600}button{border:1px solid #b8c4d5;border-radius:4px;background:white;text-align:left}</style>
<h1>Metro competitor investigation inventory</h1>
<p class="notice">Native Census representative points, not reviewed urban anchors or road access. A modeled identity has research costs at 18 sampled road nodes only. No point establishes geographic coverage, an approved connector or a global winner.</p>
<p id="inventory"></p><p>Investigation follows the competitor queue, not state completion. Queue rank uses straight-line distance to existing probes for scheduling only; it cannot exclude a competitor or bound a road cost.</p>
<div class="panel controls"><label>Investigation status<select id="status"><option value="all">All qualifying identities</option><option value="unknown">Unrepresented in frozen route comparison</option><option value="modeled">Included in frozen route comparison</option></select></label><label>Search name or CBSA<input id="search" type="search" placeholder="Example: Wichita or 48660"></label><label>Public CSV membership<select id="csv"><option value="all">All source qualifiers</option><option value="absent">Absent from public CSV</option></select></label></div>
<div class="panel"><p id="count" aria-live="polite"></p><p>Blue: included in frozen comparison. Amber: unrepresented. All points remain unapproved.</p><svg id="plot" viewBox="0 0 960 430" role="img" aria-label="Native Census metro representative point scatter plot, without geographic coverage regions"></svg><small>Longitude/latitude scatter without a basemap. Empty space has no ownership, road reachability or accessibility meaning.</small></div>
<div class="panel"><p id="selected" aria-live="polite">Select a point or metro row to inspect its identity.</p><div class="table"><table><caption>Complete source inventory; filters do not change the parent map.</caption><thead><tr><th>Metro / CBSA</th><th>Research status</th><th>Queue rank</th><th>Scheduling distance</th><th>Public CSV</th></tr></thead><tbody id="rows"></tbody></table></div></div><footer id="provenance"></footer>
<script>'use strict';
const data=__DATA__, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';let selected=null;
$('inventory').textContent=`${data.rows.length} qualifying identities · 26 included in frozen comparison · 341 unrepresented · 0 approved connectors. Eight source qualifiers absent from the public CSV are retained here.`;
$('provenance').textContent=`Frozen Census checkpoint SHA-256: ${data.checkpoint_sha256}. Domains SHA-256: ${data.domains_sha256}. Queue SHA-256: ${data.queue_sha256}. No live routing or external requests.`;
const xs=data.rows.map(r=>r.point[0]),ys=data.rows.map(r=>r.point[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
function choose(row){selected=row.cbsa;$('selected').textContent=`${row.name} (${row.cbsa}) · Native point ${row.point.join(', ')} · ${row.modeled?'Included in frozen 26-source comparison':'Unrepresented competitor'} · Population ${row.population.toLocaleString()} · Access unapproved. ${row.rank?'Queue rank '+row.rank+' is scheduling only.':''}`;render();}
function render(){
 const query=$('search').value.trim().toLowerCase(),status=$('status').value,csv=$('csv').value;
 const rows=data.rows.filter(r=>(status==='all'||(status==='modeled')===r.modeled)&&(csv==='all'||!r.in_public_csv)&&(!query||(r.name+' '+r.cbsa).toLowerCase().includes(query)));
 $('count').textContent=`Showing ${rows.length} of 367 qualifying identities.`;$('rows').replaceChildren();$('plot').replaceChildren();
 for(const row of rows){
  const tr=document.createElement('tr');tr.dataset.cbsa=row.cbsa;tr.dataset.modeled=String(row.modeled);tr.dataset.inPublicCsv=String(row.in_public_csv);
  const label=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=`${row.name} (${row.cbsa})`;button.addEventListener('click',()=>choose(row));label.append(button);tr.append(label);
  for(const value of [row.modeled?'Frozen comparison only':'Unrepresented',row.rank??'—',row.distance_m===null?'—':(row.distance_m/1000).toFixed(1)+' km (scheduling only)',row.in_public_csv?'Included':'Absent; retained qualifier']){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('rows').append(tr);
  const dot=document.createElementNS(ns,'circle');dot.dataset.cbsa=row.cbsa;dot.setAttribute('cx',20+(row.point[0]-xmin)/(xmax-xmin)*920);dot.setAttribute('cy',410-(row.point[1]-ymin)/(ymax-ymin)*390);dot.setAttribute('r',selected===row.cbsa?7:4);dot.setAttribute('fill',row.modeled?'#245f9e':'#b36b00');dot.setAttribute('stroke',selected===row.cbsa?'black':'white');dot.setAttribute('tabindex','0');dot.setAttribute('role','button');dot.setAttribute('aria-label',`${row.name} (${row.cbsa}), ${row.modeled?'frozen comparison':'unrepresented'}`);dot.addEventListener('click',()=>choose(row));dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(row);}});const title=document.createElementNS(ns,'title');title.textContent=`${row.name} (${row.cbsa})`;dot.append(title);$('plot').append(dot);
 }
}
for(const id of ['status','csv'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);render();
</script></html>'''


def build(output):
    baseline=load_reference();raw=DOMAINS.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=baseline['domains_sha256']:raise ValueError('Exact native-domain bytes required')
    domains=json.loads(raw)
    queue_path=ROOT/'docs/research/remaining-competitor-queue/queue.json';queue=json.loads(queue_path.read_bytes())
    expected=build_queue(baseline,domains)
    expected.update(domains_sha256=baseline['domains_sha256'],census_checkpoint_sha256=hashlib.sha256((REFERENCE/'baseline.json').read_bytes()).hexdigest())
    if queue!=expected:raise ValueError('Complete frozen competitor queue must reproduce')
    unknown={r['cbsa']:r for r in queue['queue']};modeled={s['cbsa'] for s in baseline['sources']}
    rows=[]
    for d in domains['domains']:
        q=unknown.get(d['cbsa'])
        rows.append(dict(cbsa=d['cbsa'],name=d['name'],population=d['source_population'],point=d['native_representative_lonlat'],modeled=d['cbsa'] in modeled,in_public_csv=d['included_in_existing_csv'],rank=q['investigation_rank'] if q else None,distance_m=q['native_point_distance_m'] if q else None))
    rows.sort(key=lambda r:(r['rank'] or 100000,r['cbsa']))
    if len(rows)!=367 or sum(r['modeled'] for r in rows)!=26 or sum(not r['in_public_csv'] for r in rows)!=8:raise ValueError('Frozen inventory changed')
    data=dict(rows=rows,checkpoint_sha256=expected['census_checkpoint_sha256'],domains_sha256=baseline['domains_sha256'],queue_sha256=hashlib.sha256(queue_path.read_bytes()).hexdigest())
    html=TEMPLATE.replace('__DATA__',json.dumps(data,separators=(',',':'),allow_nan=False).replace('<','\\u003c'))
    Path(output).write_text(html,encoding='utf-8');return output

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);args=p.parse_args();print(build(args.output))
