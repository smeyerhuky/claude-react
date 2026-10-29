"""Reproduce selected per-extract native-point leads, without access approval."""
import argparse
import hashlib
import json
from pathlib import Path

from colorado_adjacent_source_interfaces import source_metadata
from colorado_metro_winners import read_metros
from colorado_origin_source_investigation import OriginInvestigation
from metro_scenario_checkpoint import load_reference

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/missouri-arkansas-origin-evidence'


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--state',choices=('missouri','arkansas','kansas','oklahoma'),required=True)
    p.add_argument('--osm',type=Path,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    manifest=json.loads((REFERENCE/'manifest.json').read_text());record=next(r for r in manifest['records'] if r['state']==args.state)
    if manifest['release_eligible'] is not False or manifest['access_verified'] is not False:raise ValueError('Research-only manifest required')
    metadata=source_metadata(args.osm)
    if metadata!=record['source'] or metadata['replication_timestamp']!='2026-10-27T21:23:59Z':raise ValueError('Exact dated source bytes and epoch required')
    csv=ROOT/'public/data/metros-census-2025.csv';csv_sha=hashlib.sha256(csv.read_bytes()).hexdigest()
    if csv_sha!=manifest['metros_csv_sha256']:raise ValueError('Exact native-point CSV required')
    baseline=load_reference();domains_path=ROOT/'docs/research/utah-parent-reference/domains.json'
    if hashlib.sha256(domains_path.read_bytes()).hexdigest()!=baseline['domains_sha256']:raise ValueError('Exact qualifying domains required')
    domains={d['cbsa']:d for d in json.loads(domains_path.read_text())['domains']}
    ids=record['cbsa_ids'];metros=[m for m in read_metros(csv) if m['cbsa'] in ids]
    if len(ids)!=len(set(ids)) or {m['cbsa'] for m in metros}!=set(ids):raise ValueError('Exact selected source identities required')
    for m in metros:
        if [m['lon'],m['lat']]!=domains[m['cbsa']]['native_representative_lonlat']:raise ValueError('Native source point changed')
    scanner=OriginInvestigation(metros,25000.0)
    scanner.apply_file(str(args.osm),locations=True,idx='sparse_mem_array')
    result=scanner.report();sha=hashlib.sha256()
    with args.osm.open('rb') as handle:
        while block:=handle.read(8*1024*1024):sha.update(block)
    if sha.hexdigest()!=metadata['sha256']:raise ValueError('Source changed during scan')
    result.update(osm_sha256=sha.hexdigest(),metros_csv_sha256=csv_sha)
    path=(ROOT/record['report_path']).resolve()
    if not path.is_relative_to(REFERENCE) or hashlib.sha256(path.read_bytes()).hexdigest()!=record['report_sha256']:raise ValueError('Pinned report identity changed')
    if result!=json.loads(path.read_text()):raise ValueError('Selected raw-origin scan changed')
    if result['access_verified'] is not False or result['release_eligible'] is not False or result['extract_coverage_certified'] is not False:raise ValueError('No approval or coverage certification permitted')
    serialized=json.dumps(result,indent=2,sort_keys=True)+'\n'
    if hashlib.sha256(serialized.encode()).hexdigest()!=record['report_sha256']:raise ValueError('Reproduced report serialization changed')
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(serialized)
    print(json.dumps({'state':args.state,'native_points_reproduced':len(metros),'access_verified':False,'release_eligible':False}))

if __name__=='__main__':main()
