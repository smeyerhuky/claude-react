"""Offline, side-by-side graph-start sensitivity view; no release approval."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/denver-waypoint-hypothesis'
TEMPLATE = r'''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Denver road-start sensitivity</title>
<style>body{font:16px system-ui,sans-serif;max-width:1050px;margin:25px auto;padding:0 16px;background:#f5f7fa;color:#172033}h1{font-size:27px}.notice{padding:14px;background:#fff1cf;border-left:5px solid #ad6900}.panel{padding:18px;margin:18px 0;background:white;border:1px solid #d5dde7;border-radius:8px}.controls{display:flex;gap:20px;flex-wrap:wrap}label{display:flex;flex-direction:column;gap:6px}select{font:inherit;padding:8px}table{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}td,th{text-align:left;padding:9px;border-bottom:1px solid #e3e8ef}.bars{height:26px;min-width:120px}.bar{height:9px;margin:3px 0;min-width:0}small,footer{color:#4a5666;font-size:13px}footer{overflow-wrap:anywhere}.scroll{overflow-x:auto}</style>
<h1>Denver road-start sensitivity</h1>
<p class="notice">Research hypothesis only. Neither road start is an approved urban anchor. Reaching a road node does not grant permission to stop, park or enter the station pickup curb. Off-road connector costs are excluded.</p>
<p>Colorado-only graph; five fixed road-node probes. The preserved five-state Census experiment remains separate. No competitor winners or geographic regions are claimed.</p>
<div class="panel controls"><label>Metric<select id="metric"><option value="length">Road distance (km)</option><option value="travel_time">Modeled travel time (minutes)</option></select></label><label>Direction<select id="direction"><option value="metro-to-location">Denver road start to probe</option><option value="location-to-metro">Probe to Denver road start</option></select></label></div>
<div class="panel"><p>Blue: preserved Census road lead. Orange: proposed through-road graph start at 17th/Wynkoop. Bars use one common scale for the selected metric and direction.</p><div class="scroll"><table><thead><tr><th>Fixed road-node probe</th><th id="old-heading"></th><th id="new-heading"></th><th id="delta-heading"></th><th>Cost comparison</th></tr></thead><tbody id="rows"></tbody></table></div></div>
<p id="summary" aria-live="polite"></p><footer id="provenance"></footer>
<script>
'use strict';const data=__DATA__;const $=id=>document.getElementById(id);const oldId='preserved-census-denver-road-lead-v1';
function render(){const metric=$('metric').value,direction=$('direction').value,divisor=metric==='length'?1000:60,unit=metric==='length'?'km':'min';const rows=$('rows');rows.replaceChildren();
const chosen=data.report.cases.filter(c=>c.metric===metric&&c.orientation===direction);const max=Math.max(...chosen.map(c=>c.graph_only_cost??0),1);
for(const [id,title] of [['old-heading','Census road lead'],['new-heading','Through-road hypothesis'],['delta-heading','Hypothesis − Census']])$(id).textContent=`${title} (${unit})`;
for(const probe of data.report.probes){const old=chosen.find(c=>c.probe_cbsa===probe.cbsa&&c.scenario_id===oldId),next=chosen.find(c=>c.probe_cbsa===probe.cbsa&&c.scenario_id!==oldId);const row=document.createElement('tr');row.dataset.cbsa=probe.cbsa;
const values=[data.names[probe.cbsa],old.graph_only_cost===null?'Modeled unreachable':(old.graph_only_cost/divisor).toFixed(3),next.graph_only_cost===null?'Modeled unreachable':(next.graph_only_cost/divisor).toFixed(3),old.graph_only_cost===null||next.graph_only_cost===null?'Unknown':((next.graph_only_cost-old.graph_only_cost)/divisor).toFixed(3)];
for(const text of values){const cell=document.createElement('td');cell.textContent=text;row.append(cell);}const chart=document.createElement('td');chart.className='bars';for(const [record,color] of [[old,'#2266aa'],[next,'#be6515']]){const bar=document.createElement('div');bar.className='bar';bar.style.width=`${100*(record.graph_only_cost??0)/max}%`;bar.style.background=color;chart.append(bar);}row.append(chart);rows.append(row);}
$('summary').textContent='All values are graph-only model results. A shorter cost does not establish that a proposed anchor or entrance is legally or physically accessible.';
}
$('provenance').textContent=`Scenario: ${data.report.scenario_id}. Result SHA-256: ${data.report_sha256}. Display-name CSV SHA-256: ${data.csv_sha256}. Forty directed metric/scenario/probe cases; every finite path replayed. Turn restrictions, access, exterior completeness and geographic coverage remain unresolved.`;
for(const id of ['metric','direction'])$(id).addEventListener('change',render);render();
</script></html>'''


def build(output):
    manifest = json.loads((REFERENCE/'manifest.json').read_text())
    raw = (REFERENCE/'report.json').read_bytes()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != manifest['report_sha256']:
        raise ValueError('Research result bytes changed')
    report = json.loads(raw)
    if any(report.get(f) is not False for f in ('access_verified','release_eligible','anchor_adopted','connector_costs_included','road_coverage_certified')):
        raise ValueError('Research-only result required')
    if report.get('metric_units') != {'length':'meters','travel_time':'seconds'}:
        raise ValueError('Explicit meter/second metric bindings required')
    expected = {(s['scenario_id'],p['cbsa'],m,o) for s in report['scenarios'] for p in report['probes']
                for m in ('length','travel_time') for o in ('metro-to-location','location-to-metro')}
    keys = [(c['scenario_id'],c['probe_cbsa'],c['metric'],c['orientation']) for c in report['cases']]
    if len(expected) != 40 or len(keys) != 40 or set(keys) != expected:
        raise ValueError('All forty unique cases required')
    labels_raw = (ROOT/'public/data/metros-census-2025.csv').read_bytes()
    csv_digest = hashlib.sha256(labels_raw).hexdigest()
    if csv_digest != 'ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':
        raise ValueError('Display-name CSV changed')
    names = {r['cbsa']:r['name'] for r in csv.DictReader(io.StringIO(labels_raw.decode()))}
    data = {'report':report,'report_sha256':digest,'csv_sha256':csv_digest,
            'names':{p['cbsa']:names[p['cbsa']] for p in report['probes']}}
    payload = json.dumps(data,separators=(',',':'),allow_nan=False).replace('<','\\u003c')
    Path(output).write_text(TEMPLATE.replace('__DATA__',payload))


if __name__ == '__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True)
    build(p.parse_args().output)
