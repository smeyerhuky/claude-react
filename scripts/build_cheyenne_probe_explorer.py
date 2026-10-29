"""Offline explorer of the separately reproduced32-source Cheyenne experiment."""
import argparse
import csv
import hashlib
import io
import json
from pathlib import Path
from build_metro_probe_explorer import TEMPLATE
from cheyenne_checkpoint import ROOT, REFERENCE, load_reference32


def build(output):
    data=load_reference32();raw=(REFERENCE/'baseline.json').read_bytes()
    labels=(ROOT/'public/data/metros-census-2025.csv').read_bytes();sha=hashlib.sha256(labels).hexdigest()
    if sha!='ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':raise ValueError('Exact original display-name CSV required')
    names={r['cbsa']:r['name'] for r in csv.DictReader(io.StringIO(labels.decode()))}
    data['display_names']={s['cbsa']:names[s['cbsa']] for s in data['sources']};data['display_names_csv_sha256']=sha
    if len(data['unrepresented_source_qualifying_cbsa_ids'])!=335:raise ValueError('Explicit32-source missing competitor accounting required')
    template=TEMPLATE
    replacements={
        '<title>Metro road-node research explorer</title>':'<title>Cheyenne seven-state Census road-node experiment</title>',
        '<h1>Metro road-node research explorer</h1>':'<h1>Cheyenne seven-state Census road-node experiment</h1>',
        'Costs among the 26 modeled sources only':'Costs among the 32 modeled sources only',
        'Minimum stored cost among the 26 modeled sources:':'Minimum stored cost among the 32 modeled sources:',
        'Five dated OSM inputs':'Seven dated OSM inputs',
        'The 72 unreachable cases':f"The {data['unreachable_queries']} unreachable cases",
    }
    for before,after in replacements.items():
        if template.count(before)!=1:raise ValueError('Shared template changed; review scenario labels')
        template=template.replace(before,after)
    notice='<p class="notice">This separate experiment adds Cheyenne to the 31-source snapshot using the same 18 probes. All 335 unrepresented competitors remain unknown. Query-only graph partitioning preserves native road vertices and costs within the existing resource limits. It does not review urban anchors or approve connectors, road regions or geographic coverage.</p>'
    template=template.replace('<p id="inventory"></p>','<p id="inventory"></p>'+notice)
    html=template.replace('__DATA__',json.dumps(data,separators=(',',':'),allow_nan=False).replace('<','\\u003c')).replace('__IDENTITY__',json.dumps(hashlib.sha256(raw).hexdigest()))
    Path(output).write_text(html,encoding='utf-8');return output


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);a=p.parse_args();print(build(a.output))
