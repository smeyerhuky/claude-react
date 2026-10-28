"""Build an offline point-only explorer of the pinned Census routing experiment."""
import argparse
import csv
import io
import hashlib
import json
from pathlib import Path

from metro_scenario_checkpoint import REFERENCE, load_reference

TEMPLATE = r'''<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Metro road-node research explorer</title>
<style>
body{font:16px system-ui,sans-serif;margin:24px auto;max-width:1100px;padding:0 16px;color:#172033;background:#f5f7fa}h1{font-size:27px;margin-bottom:8px}.notice{border-left:5px solid #b36b00;padding:12px;background:#fff1cf}.panel{background:white;border:1px solid #d5dde7;border-radius:8px;padding:16px;margin:16px 0}.controls{display:flex;gap:16px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:5px}select{font:inherit;padding:7px}svg{width:100%;background:#f7fafc;border:1px solid #d5dde7}circle{cursor:pointer}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}th,td{text-align:left;padding:6px;border-bottom:1px solid #e2e8f0}small{color:#4a5666}#summary{font-weight:600}caption{text-align:left;padding:10px 0}footer{overflow-wrap:anywhere;font-size:13px;color:#4a5666}button{font:inherit}
</style>
<h1>Metro road-node research explorer</h1>
<p class="notice">Experimental Census-origin scenario. No approved urban anchors or connectors. Points show sampled road nodes only; no geographic regions or global winners are established.</p>
<p id="inventory"></p>
<div class="panel controls">
<label>Cost metric<select id="metric"><option value="length">Road distance (meters)</option><option value="travel_time">Modeled travel time (seconds)</option></select></label>
<label>Direction<select id="direction"><option value="location-to-metro">Probe to metro road lead</option><option value="metro-to-location">Metro road lead to probe</option></select></label>
<label>Sampled road node<select id="probe"></select></label>
</div>
<div class="panel"><p>Circles: sampled probes; triangles: unapproved metro road leads. Click a circle or use the node selector.</p>
<svg id="plot" viewBox="0 0 960 480" role="img" aria-label="Longitude and latitude scatter plot of sampled road nodes and unapproved metro road leads"></svg>
<small>Coordinate scatter plot without a basemap. Empty space has no ownership or accessibility meaning.</small></div>
<div class="panel"><p id="summary" aria-live="polite"></p><p id="location"></p>
<table><caption>Costs among the 26 modeled sources only; off-road connector costs are excluded.</caption><thead><tr><th>Metro (CBSA)</th><th>Metro road-lead node</th><th id="cost-heading">Cost</th><th>Model result</th></tr></thead><tbody id="rows"></tbody></table></div>
<footer id="provenance"></footer>
<script>
'use strict';
const data=__DATA__;
const identity=__IDENTITY__;
const $=id=>document.getElementById(id);
const ids=data.sources.map(s=>s.cbsa);
const label=id=>`${data.display_names[id]} (${id})`;
const probes=Object.keys(data.probe_coordinates_lonlat).sort();
const points=[...Object.values(data.probe_coordinates_lonlat),...data.sources.map(s=>s.node_lonlat)];
const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);
const bounds=[Math.min(...xs)-.3,Math.min(...ys)-.3,Math.max(...xs)+.3,Math.max(...ys)+.3];
const xy=p=>[45+870*(p[0]-bounds[0])/(bounds[2]-bounds[0]),435-390*(p[1]-bounds[1])/(bounds[3]-bounds[1])];
const colors=ids.map((_,i)=>`hsl(${i*360/ids.length} 65% 34%)`);
const el=(tag,attrs)=>{const e=document.createElementNS('http://www.w3.org/2000/svg',tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e;};
function costsFor(probe){return data.cases[[$('metric').value,$('direction').value,probe].join('|')];}
function minimum(costs){const entries=Object.entries(costs).filter(([,v])=>v.graph_only_cost!==null);if(!entries.length)return {value:null,ids:[]};const value=Math.min(...entries.map(([,v])=>v.graph_only_cost));return {value,ids:entries.filter(([,v])=>v.graph_only_cost===value).map(([id])=>id)};}
for(const probe of probes){const o=document.createElement('option');o.value=probe;o.textContent=probe;$('probe').append(o);}
$('inventory').textContent=`${data.sources.length} unapproved modeled sources; ${data.unrepresented_source_qualifying_cbsa_ids.length} qualifying competitors remain unknown; ${probes.length} sampled road nodes. This is not a coverage percentage.`;
$('provenance').textContent=`Scenario: ${data.scenario_id}. Frozen checkpoint SHA-256: ${identity}. Five dated OSM inputs and population-domain identity are bound by this checkpoint. The 72 unreachable cases concern the supplied model, not real-world inaccessibility. Display-name CSV SHA-256: ${data.display_names_csv_sha256}. No road-region release approval is present.`;
function render(){
 const plot=$('plot');plot.replaceChildren();
 for(let i=0;i<ids.length;i++){const source=data.sources[i],[x,y]=xy(source.node_lonlat);const marker=el('path',{d:`M ${x} ${y-6} L ${x-5} ${y+4} L ${x+5} ${y+4} Z`,fill:colors[i]});const title=el('title',{});title.textContent=`${label(source.cbsa)}, unapproved road lead ${source.node}`;marker.append(title);plot.append(marker);}
 for(const probe of probes){const best=minimum(costsFor(probe)),[x,y]=xy(data.probe_coordinates_lonlat[probe]);const circle=el('circle',{cx:x,cy:y,r:probe===$('probe').value?9:6,fill:best.ids.length?colors[ids.indexOf(best.ids[0])]:'#777',stroke:probe===$('probe').value?'#111':'white','stroke-width':2});const title=el('title',{});title.textContent=`Probe ${probe}; minimum among modeled sources: ${best.ids.map(label).join(', ')||'none'}`;circle.append(title);circle.addEventListener('click',()=>{$('probe').value=probe;render();});plot.append(circle);}
 const probe=$('probe').value,costs=costsFor(probe),best=minimum(costs),unit=data.metric_units[$('metric').value];
 $('summary').textContent=best.value===null?'No modeled source reaches this probe in this direction.':`Minimum stored cost among the 26 modeled sources: ${best.ids.map(label).join(', ')} — ${best.value.toLocaleString(undefined,{maximumFractionDigits:3})} ${unit}.`;
 $('location').textContent=`Probe ${probe}: longitude ${data.probe_coordinates_lonlat[probe][0]}, latitude ${data.probe_coordinates_lonlat[probe][1]}. Missing competitors prevent a global-nearest claim.`;
 $('cost-heading').textContent=`Graph-only cost (${unit})`;
 const rows=$('rows');rows.replaceChildren();
 const sorted=[...data.sources].sort((a,b)=>(costs[a.cbsa].graph_only_cost??Infinity)-(costs[b.cbsa].graph_only_cost??Infinity)||a.cbsa.localeCompare(b.cbsa));
 for(const source of sorted){const value=costs[source.cbsa].graph_only_cost;const row=document.createElement('tr');for(const text of [label(source.cbsa),String(source.node),value===null?'—':value.toLocaleString(undefined,{maximumFractionDigits:3}),value===null?'Modeled unreachable':best.ids.includes(source.cbsa)?'Minimum among modeled sources':'Finite modeled cost']){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}rows.append(row);}
}
for(const id of ['metric','direction','probe'])$(id).addEventListener('change',render);
render();
</script></html>
'''


def build(output):
    baseline = load_reference()
    raw = (REFERENCE / 'baseline.json').read_bytes()
    labels_raw = (REFERENCE.parents[2] / 'public/data/metros-census-2025.csv').read_bytes()
    labels_sha = hashlib.sha256(labels_raw).hexdigest()
    if labels_sha != 'ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':
        raise ValueError('Display-name CSV changed; review the frozen scenario compatibility')
    names = {row['cbsa']: row['name'] for row in csv.DictReader(io.StringIO(labels_raw.decode('utf-8')))}
    baseline['display_names'] = {source['cbsa']: names[source['cbsa']] for source in baseline['sources']}
    baseline['display_names_csv_sha256'] = labels_sha
    data = json.dumps(baseline, separators=(',', ':'), allow_nan=False).replace('<', '\\u003c')
    html = TEMPLATE.replace('__DATA__', data).replace('__IDENTITY__', json.dumps(hashlib.sha256(raw).hexdigest()))
    Path(output).write_text(html, encoding='utf-8')
    return output


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    print(build(args.output))
