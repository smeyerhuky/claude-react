"""Rank every still-unknown competitor for investigation, never exclusion."""
import argparse
import hashlib
import json
import math
from pathlib import Path

from denver_anchor_evidence import haversine
from metro_scenario_checkpoint import REFERENCE, load_reference

DOMAINS = Path(__file__).resolve().parents[1]/'docs/research/utah-parent-reference/domains.json'


def build(baseline, domains):
    if baseline.get('release_eligible') is not False or baseline.get('access_certified') is not False:
        raise ValueError('Research-only baseline required')
    eligible = baseline['source_qualifying_cbsa_ids']
    modeled = {s['cbsa'] for s in baseline['sources']}
    unknown = baseline['unrepresented_source_qualifying_cbsa_ids']
    if (len(modeled) != len(baseline['sources']) or len(eligible) != len(set(eligible)) or len(unknown) != len(set(unknown)) or
            modeled & set(unknown) or modeled | set(unknown) != set(eligible)):
        raise ValueError('Complete disjoint competitor accounting required')
    if domains['source_qualifying_cbsa_ids'] != eligible:
        raise ValueError('Qualifying identity inventory changed')
    domain_ids = [d['cbsa'] for d in domains['domains']]
    if len(set(domain_ids)) != len(domain_ids) or set(domain_ids) != set(eligible):
        raise ValueError('Every qualifying domain identity required once')
    def point_valid(point):
        return (isinstance(point,list) and len(point)==2 and all(type(x) in (int,float) and math.isfinite(x) for x in point)
                and abs(point[0])<=180 and abs(point[1])<=90)
    if not baseline['probe_coordinates_lonlat'] or not all(point_valid(p) for p in baseline['probe_coordinates_lonlat'].values()):
        raise ValueError('Finite geographic probes required')
    records = {d['cbsa']: d for d in domains['domains']}
    rows = []
    probes = baseline['probe_coordinates_lonlat']
    for cbsa in unknown:
        d = records[cbsa]
        if not point_valid(d['native_representative_lonlat']):
            raise ValueError('Finite native Census point required')
        nearest = min(((haversine(d['native_representative_lonlat'],point),node) for node,point in probes.items()))
        rows.append({'cbsa':cbsa, 'name':d['name'], 'source_population':d['source_population'],
                     'native_representative_lonlat':d['native_representative_lonlat'],
                     'included_in_public_csv':d['included_in_existing_csv'],
                     'nearest_existing_probe_node':nearest[1], 'native_point_distance_m':nearest[0],
                     'status':'unknown_competitor', 'access_verified':False})
    rows.sort(key=lambda r:(r['native_point_distance_m'],r['cbsa']))
    for rank,row in enumerate(rows,1):row['investigation_rank']=rank
    return {'schema':'remaining-metro-competitor-investigation-queue-v1',
            'qualifying_identities':len(eligible),'modeled_source_identities':len(modeled),
            'unknown_competitors':len(rows),'applied_exclusions':[], 'queue':rows,
            'priority_method':'Increasing spherical native-Census-point distance to the nearest retained road-node probe; CBSA ID breaks ties.',
            'access_certified':False,'release_eligible':False,'geographic_coverage_certified':False,
            'warning':'Scheduling heuristic only, not a routing lower bound, irrelevant-competitor proof, urban-anchor choice or state completion. Every listed identity remains unknown. Large CBSA domains and exterior road routes can change investigation priority.'}


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    baseline=load_reference();raw=DOMAINS.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=baseline['domains_sha256']:
        raise ValueError('Exact Census population/domain bytes required')
    result=build(baseline,json.loads(raw))
    result.update(domains_sha256=baseline['domains_sha256'],
                  census_checkpoint_sha256=hashlib.sha256((REFERENCE/'baseline.json').read_bytes()).hexdigest())
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'unknown_competitors':len(result['queue']),'next_ten':result['queue'][:10]},indent=2))


if __name__=='__main__':main()
