"""Build a standalone offline source-work explorer; never shade road coverage."""
import argparse
import json
from pathlib import Path
from principal_city_source_work import ROOT, OUTPUT, build, require


def render(report):
    payload = json.dumps(report, sort_keys=True, separators=(',', ':')).replace('<', '\\u003c').replace('&', '\\u0026')
    return TEMPLATE.replace('__SOURCE_WORK_DATA__', payload)


TEMPLATE = r'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'">
<title>Principal-city source work inventory</title>
<style>
body{font:14px/1.45 system-ui,sans-serif;color:#17232f;background:#f5f7f9;margin:0;padding:20px}main{max-width:1200px;margin:auto}h1{font-size:25px;margin:0 0 8px}h2{font-size:18px}.notice{border-left:4px solid #b96a17;background:#fff4df;padding:12px 16px}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:18px 0}.stat{background:white;border:1px solid #ccd5de;border-radius:8px;padding:12px;flex:1;min-width:145px}.stat strong{font-size:25px;display:block}.filters{display:flex;gap:12px;flex-wrap:wrap;align-items:end}label{display:grid;gap:4px}select,input{font:inherit;border:1px solid #8090a0;border-radius:4px;padding:8px;background:white}input{width:min(330px,75vw)}.scroll{max-height:420px;overflow:auto;border:1px solid #ccd5de;background:white}table{border-collapse:collapse;width:100%;text-align:left}th,td{padding:9px 12px;border-bottom:1px solid #e2e7ed}th{position:sticky;top:0;background:#e8edf2}td button{border:0;background:transparent;text-decoration:underline;color:#135481;text-align:left;font:inherit;cursor:pointer;padding:3px}button:focus-visible,input:focus-visible,select:focus-visible{outline:3px solid #1967b3;outline-offset:2px}.muted{color:#526374}.details{background:white;border:1px solid #ccd5de;border-radius:8px;margin-top:18px;padding:16px}pre{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,monospace;background:#f1f4f7;padding:10px}#empty{padding:15px}li{margin:6px 0}@media(max-width:600px){body{padding:12px}th,td{padding:7px}.scope{display:none}}
</style></head><body><main>
<h1>Principal-city source work inventory</h1>
<p class="muted">Frozen evidence-accounting snapshot · 50 states, DC and Puerto Rico · no network requests</p>
<div class="notice"><strong>Zero connectors are approved. No reviewed anchor set is adopted.</strong><br>
Retained source context is not a verified vehicle entry. Every access review remains unresolved. This view supplies no road regions or route costs.</div>
<div class="stats" id="stats"></div>
<p id="scope">City states come from official principal-city membership, which can differ from the state containing a metro’s Census representative point. A city may require its own evidence even when another principal city shares its CBSA.</p>
<div class="filters"><label for="state">Principal-city state<select id="state"><option value="all">All 52 jurisdictions</option></select></label>
<label for="status">Source-work status<select id="status"><option value="all">All statuses</option><option value="context_retained">Context retained</option><option value="selected_publication_unavailable">Selected publication unavailable</option><option value="not_recorded_here">Not recorded here</option></select></label>
<label for="search">City, CBSA or city FIPS<input id="search" type="search" placeholder="e.g. Orem or 39340"></label></div>
<p id="count" aria-live="polite"></p>
<div class="scroll"><table><thead><tr><th>Principal city</th><th>State</th><th>CBSA</th><th>Source work</th><th class="scope">Access review</th></tr></thead><tbody id="rows"></tbody></table><p id="empty" hidden>No matching principal-city memberships.</p></div>
<section class="details" aria-labelledby="detail-title"><h2 id="detail-title">Inspect a city’s retained context</h2><div id="detail">Select a city above. A missing record is a gap in this inventory, not proof that no evidence exists.</div></section>
<p class="muted">Missing required anchors cannot be dropped to produce a metro winner. Exact vehicle entries, full connector costs, independent access evidence and a separate approver are still required. Geographic coverage and exterior routes remain separate release gates. The public straight-line map is unchanged.</p>
</main><script id="source-work-data" type="application/json">__SOURCE_WORK_DATA__</script>
<script>
'use strict';
const data=JSON.parse(document.getElementById('source-work-data').textContent);
const labels={context_retained:'Context retained',selected_publication_unavailable:'Selected publication unavailable',not_recorded_here:'Not recorded here'};
const byId=id=>document.getElementById(id);
function text(tag,value,parent,cls){const node=document.createElement(tag);node.textContent=value;if(cls)node.className=cls;parent.append(node);return node;}
for(const [label,value] of [['Principal-city memberships',data.membership_count],['Context retained',data.counts.context_retained],['Selected source unavailable',data.counts.selected_publication_unavailable],['Not recorded here',data.counts.not_recorded_here],['Approved anchors',data.approved_anchors]]){const card=document.createElement('div');card.className='stat';text('strong',String(value),card);text('span',label,card);byId('stats').append(card);}
for(const state of data.states){const option=document.createElement('option');option.value=state.state;option.textContent=state.state+' ('+state.memberships+')';byId('state').append(option);}
function inspect(row){byId('detail-title').textContent=row.city_name+' · '+row.state+' · CBSA '+row.cbsa;const panel=byId('detail');panel.replaceChildren();text('p','City FIPS '+row.principal_city_id+' · '+labels[row.status]+' · Access review unresolved',panel);text('p','No adopted anchor. No verified entry or approved connector.',panel);
 if(!row.source_path){text('p','No city source record is registered in this inventory. This does not mean no evidence exists. An existing Census road lead is not a reviewed urban anchor.',panel);return;}
 text('p','Source kind: '+row.source_kind+' · Retrieval: '+row.retrieval_method,panel);
 if(row.url){text('p','Primary publication URL (copy to inspect):',panel);text('pre',row.url,panel);}
 const list=document.createElement('ul');for(const item of row.observations)text('li',item,list);panel.append(list);
 text('p','Retained record and SHA-256:',panel);text('pre',row.source_path+'\n'+row.source_sha256,panel);
 const limits=document.createElement('ul');for(const item of row.limitations)text('li',item,limits);panel.append(limits);
}
function draw(){const state=byId('state').value,status=byId('status').value,query=byId('search').value.trim().toLowerCase();const selected=data.cities.filter(r=>(state==='all'||r.state===state)&&(status==='all'||r.status===status)&&(!query||[r.city_name,r.principal_city_id,r.cbsa].join(' ').toLowerCase().includes(query)));const rows=byId('rows');rows.replaceChildren();
 for(const row of selected){const tr=document.createElement('tr');tr.dataset.cityId=row.principal_city_id;tr.dataset.cbsa=row.cbsa;tr.dataset.state=row.state;tr.dataset.status=row.status;const td=document.createElement('td'),button=document.createElement('button');button.type='button';button.textContent=row.city_name;button.setAttribute('aria-label','Inspect '+row.city_name+' '+row.state+' '+row.principal_city_id);button.addEventListener('click',()=>inspect(row));td.append(button);tr.append(td);text('td',row.state,tr);text('td',row.cbsa,tr);text('td',labels[row.status],tr);text('td','Unresolved',tr,'scope');rows.append(tr);}
 byId('count').textContent='Showing '+selected.length+' of '+data.membership_count+' principal-city memberships. '+data.metro_count+' qualifying metros. Zero approved anchors.';byId('empty').hidden=selected.length!==0;
}
for(const id of ['state','status'])byId(id).addEventListener('change',draw);byId('search').addEventListener('input',draw);draw();
</script></body></html>
'''


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    report = build()
    require(json.loads((ROOT / OUTPUT).read_text()) == report, 'Frozen source-work report changed')
    args.output.write_text(render(report))
    print(dict(memberships=report['membership_count'], contexts=report['counts']['context_retained'], approved_anchors=0))
