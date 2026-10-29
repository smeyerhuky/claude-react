"""Offline inspector for the separately frozen 31-source Census regression."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path

from build_metro_probe_explorer import TEMPLATE
from six_state_checkpoint import ROOT, REFERENCE, load_reference


def build(output):
    data=load_reference();raw=(REFERENCE/'baseline.json').read_bytes()
    labels=(ROOT/'public/data/metros-census-2025.csv').read_bytes()
    sha=hashlib.sha256(labels).hexdigest()
    if sha!='ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':raise ValueError('Exact original display-name CSV required')
    names={row['cbsa']:row['name'] for row in csv.DictReader(io.StringIO(labels.decode()))}
    data['display_names']={s['cbsa']:names[s['cbsa']] for s in data['sources']};data['display_names_csv_sha256']=sha
    if len(data['sources'])!=31 or len(data['unrepresented_source_qualifying_cbsa_ids'])!=336 or data['unreachable_queries']!=144:raise ValueError('Explicit frozen six-state counts required')
    negative=json.loads((ROOT/'docs/research/wichita-model-lead-negative.json').read_text())
    wichita=next(s for s in data['sources'] if s['cbsa']=='48620')
    if negative['source']!=wichita or negative['weak_component_node_count']!=6 or negative['source_provenance']!=data['source_provenance'] or negative['access_verified'] is not False:raise ValueError('Model-negative note must bind the same unapproved lead and exact inputs')
    template=TEMPLATE
    replacements={
      '<title>Metro road-node research explorer</title>':'<title>Six-state Census road-node experiment</title>',
      '<h1>Metro road-node research explorer</h1>':'<h1>Six-state Census road-node experiment</h1>',
      'Costs among the 26 modeled sources only':'Costs among the 31 modeled sources only',
      'Minimum stored cost among the 26 modeled sources:':'Minimum stored cost among the 31 modeled sources:',
      'Five dated OSM inputs':'Six dated OSM inputs',
      'The 72 unreachable cases':'The 144 unreachable cases',
    }
    for before,after in replacements.items():
        if template.count(before)!=1:raise ValueError('Shared template changed; review scenario-specific labels')
        template=template.replace(before,after)
    notice='<p class="notice">The 18 probes are inherited from the earlier experiment. Their sampled winners do not bound other locations or the 336 unrepresented competitors. Wichita’s selected vertex is in a six-node modeled component; Tucson’s retained vertex is also unsupported. These are unapproved research starts, not reviewed urban anchors or real-world inaccessibility findings.</p>'
    template=template.replace('<p id="inventory"></p>','<p id="inventory"></p>'+notice)
    html=template.replace('__DATA__',json.dumps(data,separators=(',',':'),allow_nan=False).replace('<','\\u003c')).replace('__IDENTITY__',json.dumps(hashlib.sha256(raw).hexdigest()))
    Path(output).write_text(html,encoding='utf-8');return output

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);args=p.parse_args();print(build(args.output))
