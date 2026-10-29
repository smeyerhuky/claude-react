"""Offline native-point inventory; never infer road or geographic coverage."""
import argparse
import hashlib
import json
from pathlib import Path

from metro_competitor_review_queue import DOMAINS, build as build_queue
from metro_scenario_checkpoint import REFERENCE, load_reference

ROOT=Path(__file__).resolve().parents[1]
TEMPLATE=r'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Metro competitor inventory — 26-source baseline</title>
<style>body{font:15px system-ui;color:#182235;background:#f5f7fa;margin:20px}h1{font-size:25px}.notice{background:#fff1cf;border-left:5px solid #a65d00;padding:12px}.panel{background:white;border:1px solid #d5dde7;border-radius:8px;padding:14px;margin:14px 0}.controls{display:flex;gap:18px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:5px}input,select,button{font:inherit;padding:6px}svg{width:100%;max-height:430px;background:#f7fafc}circle{cursor:pointer}circle:focus{stroke:black;stroke-width:3}.table{max-height:390px;overflow:auto}table{border-collapse:collapse;width:100%}td,th{padding:7px;text-align:left;border-bottom:1px solid #ddd}th{position:sticky;top:0;background:white}small,footer{font-size:12px;color:#45546a}footer{overflow-wrap:anywhere}#selected{font-weight:600}button{border:1px solid #b8c4d5;border-radius:4px;background:white;text-align:left}</style>
<h1>Metro competitor inventory — 26-source baseline</h1>
<p class="notice">Native Census representative points, not reviewed urban anchors or road access. A modeled identity has research costs at 18 sampled road nodes only. No point establishes geographic coverage, an approved connector or a global winner.</p>
<p id="inventory"></p><p>This inventory uses the frozen 26-source comparison. Select the separately versioned 31-source experiment for the expanded cost snapshot.</p><p>Investigation follows the competitor queue, not state completion. Queue rank uses straight-line distance to existing probes for scheduling only; it cannot exclude a competitor or bound a road cost.</p>
<div class="panel controls"><label>Investigation status<select id="status"><option value="all">All qualifying identities</option><option value="unknown">Unrepresented in frozen route comparison</option><option value="modeled">Included in frozen route comparison</option><option value="investigated">Unrepresented with retained lead scans (36)</option><option value="unscanned">Unrepresented without these lead scans (305)</option></select></label><label>Search name or CBSA<input id="search" type="search" placeholder="Example: Wichita or 48660"></label><label>Public CSV membership<select id="csv"><option value="all">All source qualifiers</option><option value="absent">Absent from public CSV</option></select></label></div>
<div class="panel"><p id="count" aria-live="polite"></p><p>Blue: included in frozen comparison. Amber: unrepresented. All points remain unapproved.</p><svg id="plot" viewBox="0 0 960 430" role="img" aria-label="Native Census metro representative point scatter plot, without geographic coverage regions"></svg><small>Longitude/latitude scatter without a basemap. Empty space has no ownership, road reachability or accessibility meaning.</small></div>
<div class="panel"><p id="selected" aria-live="polite">Select a point or metro row to inspect its identity.</p><ul id="observations"></ul><div class="table"><table><caption>Complete source inventory; filters do not change the parent map.</caption><thead><tr><th>Metro / CBSA</th><th>Research status</th><th>Retained lead investigation</th><th>Queue rank</th><th>Scheduling distance</th><th>Public CSV</th></tr></thead><tbody id="rows"></tbody></table></div></div><footer id="provenance"></footer>
<script>'use strict';
const data=__DATA__, $=id=>document.getElementById(id), ns='http://www.w3.org/2000/svg';let selected=null;
$('inventory').textContent=`${data.rows.length} qualifying identities · 26 included in frozen comparison · 341 unrepresented · 0 approved connectors. 36 unrepresented identities have retained native-point scans; all 341 remain outside the frozen route comparison. Eight source qualifiers absent from the public CSV are retained here.`;
$('provenance').textContent=`Frozen Census checkpoint SHA-256: ${data.checkpoint_sha256}. Domains SHA-256: ${data.domains_sha256}. Queue SHA-256: ${data.queue_sha256}. OSM snapshot: 2026-10-27T21:23:59Z. Retained lead reports: ${Object.entries(data.lead_report_sha256).map(([path,sha])=>path+' SHA-256 '+sha).join(' · ')}. No live routing or external requests.`;
const xs=data.rows.map(r=>r.point[0]),ys=data.rows.map(r=>r.point[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
function choose(row){selected=row.cbsa;$('observations').replaceChildren();
 for(const scan of row.scans){const li=document.createElement('li'),mapped=scan.mapped,supported=scan.supported;li.textContent=`${scan.extract}: nearest mapped ${mapped?mapped.highway+' way '+mapped.osm_way_id+', '+mapped.gap_m.toFixed(3)+' m, model-eligible '+mapped.model_drivable:'none within scan radius'}; nearest model-supported ${supported?'way '+supported.osm_way_id+', '+supported.gap_m.toFixed(3)+' m':'none within scan radius'}. Geometry gap only; access unapproved.`;$('observations').append(li);}
 if(row.triage){const li=document.createElement('li');li.textContent='AI investigation review: '+row.triage.next_action.replaceAll('_',' ')+'. '+row.triage.reason;$('observations').append(li);}
 if(row.review){const li=document.createElement('li');li.textContent='AI native-point review: '+row.review.decision.replaceAll('_',' ')+'; packet consistency does not approve access.';$('observations').append(li);}
$('selected').textContent=`${row.name} (${row.cbsa}) · Native point ${row.point.join(', ')} · ${row.modeled?'Included in frozen 26-source comparison':'Unrepresented competitor'} · Population ${row.population.toLocaleString()} · Access unapproved. ${row.rank?'Queue rank '+row.rank+' is scheduling only.':''}`;render();}
function render(){
 const query=$('search').value.trim().toLowerCase(),status=$('status').value,csv=$('csv').value;
 const rows=data.rows.filter(r=>(status==='all'||status==='modeled'&&r.modeled||status==='unknown'&&!r.modeled||status==='investigated'&&!r.modeled&&r.scans.length>0||status==='unscanned'&&!r.modeled&&r.scans.length===0)&&(csv==='all'||!r.in_public_csv)&&(!query||(r.name+' '+r.cbsa).toLowerCase().includes(query)));
 if(selected&&!rows.some(r=>r.cbsa===selected)){selected=null;$('selected').textContent='Select a point or metro row to inspect its identity.';$('observations').replaceChildren();}
 $('count').textContent=`Showing ${rows.length} of 367 qualifying identities.`;$('rows').replaceChildren();$('plot').replaceChildren();
 for(const row of rows){
  const tr=document.createElement('tr');tr.dataset.cbsa=row.cbsa;tr.dataset.modeled=String(row.modeled);tr.dataset.inPublicCsv=String(row.in_public_csv);
  const label=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=`${row.name} (${row.cbsa})`;button.addEventListener('click',()=>choose(row));label.append(button);tr.append(label);
  for(const value of [row.modeled?'Frozen comparison only':'Unrepresented',row.scans.length?row.scans.length+' extract scan(s); unapproved':row.modeled?'Frozen road lead; unapproved':'Not in these retained lead scans',row.rank??'—',row.distance_m===null?'—':(row.distance_m/1000).toFixed(1)+' km (scheduling only)',row.in_public_csv?'Included':'Absent; retained qualifier']){const td=document.createElement('td');td.textContent=value;tr.append(td);}$('rows').append(tr);
  const dot=document.createElementNS(ns,'circle');dot.dataset.cbsa=row.cbsa;dot.setAttribute('cx',20+(row.point[0]-xmin)/(xmax-xmin)*920);dot.setAttribute('cy',410-(row.point[1]-ymin)/(ymax-ymin)*390);dot.setAttribute('r',selected===row.cbsa?7:4);dot.setAttribute('fill',row.modeled?'#245f9e':'#b36b00');dot.setAttribute('stroke',selected===row.cbsa?'black':'white');dot.setAttribute('tabindex','0');dot.setAttribute('role','button');dot.setAttribute('aria-label',`${row.name} (${row.cbsa}), ${row.modeled?'frozen comparison':'unrepresented'}`);dot.addEventListener('click',()=>choose(row));dot.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose(row);}});const title=document.createElementNS(ns,'title');title.textContent=`${row.name} (${row.cbsa})`;dot.append(title);$('plot').append(dot);
 }
}
for(const id of ['status','csv'])$(id).addEventListener('change',render);$('search').addEventListener('input',render);render();
</script></html>'''


def lead_scans(domains):
    archive=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text())
    sources={s['filename']:s['sha256'] for s in archive['files']}
    manifest=json.loads((ROOT/'docs/research/missouri-arkansas-origin-evidence/manifest.json').read_text())
    expansion=json.loads((ROOT/'docs/research/competitor-frontier-expansion/manifest.json').read_text())
    records=manifest['records']+expansion['records']
    expected_reports={}
    for record in records:
        name=record['source']['name'];digest=record['source']['sha256']
        if name in sources and sources[name]!=digest:raise ValueError('Conflicting source identity')
        sources[name]=digest;expected_reports[record['report_path']]=record['report_sha256']
    paths=[('kansas','docs/research/kansas-texas-source-preflight/kansas-origins.json'),
           ('texas','docs/research/kansas-texas-source-preflight/texas-origins.json')]
    paths += [(r['state'],r['report_path']) for r in records]
    scans={};hashes={};csv_sha='ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8'
    for state,path in paths:
        raw=(ROOT/path).read_bytes();digest=hashlib.sha256(raw).hexdigest();hashes[path]=digest
        if path in expected_reports and digest!=expected_reports[path]:raise ValueError('Retained report bytes changed')
        report=json.loads(raw)
        if report['osm_sha256']!=sources[state+'.osm.pbf'] or report['metros_csv_sha256']!=csv_sha:raise ValueError('Retained source input changed')
        if any(report[flag] is not False for flag in ('access_verified','release_eligible','extract_coverage_certified')):raise ValueError('Research-only lead scans required')
        if report['scan_radius_m']!=25000:raise ValueError('Frozen scan scope changed')
        for row in report['metros']:
            if row['origin_lonlat']!=domains[row['cbsa']]['native_representative_lonlat']:raise ValueError('Native point changed')
            record=dict(extract=state,osm_sha256=report['osm_sha256'],mapped=row['nearest_mapped_highway'],supported=row['nearest_model_drivable_highway'])
            for candidate in (record['mapped'],record['supported']):
                if candidate is not None and candidate['access_verified'] is not False:raise ValueError('No connector approvals permitted')
            owners=scans.setdefault(row['cbsa'],{})
            if state in owners and owners[state]!=record:raise ValueError('Conflicting repeated extract observation')
            owners[state]=record
    return {cbsa:[owners[k] for k in sorted(owners)] for cbsa,owners in scans.items()},hashes


def build(output):
    baseline=load_reference();raw=DOMAINS.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=baseline['domains_sha256']:raise ValueError('Exact native-domain bytes required')
    domains=json.loads(raw)
    queue_path=ROOT/'docs/research/remaining-competitor-queue/queue.json';queue=json.loads(queue_path.read_bytes())
    expected=build_queue(baseline,domains)
    expected.update(domains_sha256=baseline['domains_sha256'],census_checkpoint_sha256=hashlib.sha256((REFERENCE/'baseline.json').read_bytes()).hexdigest())
    if queue!=expected:raise ValueError('Complete frozen competitor queue must reproduce')
    unknown={r['cbsa']:r for r in queue['queue']};modeled={s['cbsa'] for s in baseline['sources']}
    domain_index={d['cbsa']:d for d in domains['domains']}
    scans,scan_hashes=lead_scans(domain_index)
    if len(scans)!=36 or set(scans)&modeled or not all(r['cbsa'] in scans for r in queue['queue'][:10]):raise ValueError('Frozen lead-investigation accounting changed')
    triage=json.loads((ROOT/'docs/research/competitor-frontier-expansion/review.json').read_text())
    if triage['schema']!='metro-frontier-ai-triage-v1' or triage['access_verified'] is not False or triage['release_eligible'] is not False:raise ValueError('Research-only AI triage required')
    notes={r['cbsa']:r for r in triage['records']}
    expansion=json.loads((ROOT/'docs/research/competitor-frontier-expansion/manifest.json').read_text())
    if len(notes)!=22 or set(notes)!=set(expansion['new_identities']) or any(r['access_verified'] is not False or r['release_eligible'] is not False for r in notes.values()):raise ValueError('Complete unapproved AI triage required')
    rows=[]
    for d in domains['domains']:
        q=unknown.get(d['cbsa'])
        rows.append(dict(cbsa=d['cbsa'],name=d['name'],population=d['source_population'],point=d['native_representative_lonlat'],modeled=d['cbsa'] in modeled,in_public_csv=d['included_in_existing_csv'],rank=q['investigation_rank'] if q else None,distance_m=q['native_point_distance_m'] if q else None,scans=scans.get(d['cbsa'],[]),review=None,triage=notes.get(d['cbsa'])))
    for row in rows:
        path=ROOT/'docs/research/connector-reviews'/f"{row['cbsa']}-cross-border-census-lead.json"
        if path.exists():
            from connector_review_packet import validate
            packet=json.loads(path.read_text());validate(packet,ROOT)
            if packet['origin_policy']!='census-regression-v1' or packet['candidate']['native_origin_lonlat']!=row['point']:raise ValueError('Native review origin changed')
            row['review']=dict(decision=packet['decision'],sha256=hashlib.sha256(path.read_bytes()).hexdigest())
    rows.sort(key=lambda r:(r['rank'] or 100000,r['cbsa']))
    if len(rows)!=367 or sum(r['modeled'] for r in rows)!=26 or sum(not r['in_public_csv'] for r in rows)!=8:raise ValueError('Frozen inventory changed')
    data=dict(rows=rows,lead_report_sha256=scan_hashes,checkpoint_sha256=expected['census_checkpoint_sha256'],domains_sha256=baseline['domains_sha256'],queue_sha256=hashlib.sha256(queue_path.read_bytes()).hexdigest())
    html=TEMPLATE.replace('__DATA__',json.dumps(data,separators=(',',':'),allow_nan=False).replace('<','\\u003c'))
    Path(output).write_text(html,encoding='utf-8');return output

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);args=p.parse_args();print(build(args.output))
