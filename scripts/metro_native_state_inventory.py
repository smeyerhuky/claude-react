"""Classify native Census points in native state polygons; no road/metro-area coverage claim."""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
from shapely.geometry import Point
from colorado_tiger2025_geography import _read_shapes

ROOT=Path(__file__).resolve().parents[1]
DOMAINS=ROOT/'docs/research/utah-parent-reference/domains.json'
STATE_SHA='59a220888a8d9be8117c4fcd38f542bd02d81abf0d198c78113595ad540dd957'
DOMAIN_SHA='d860aef0a6ac2e442590098ed98a7cd601fa63764d8d76ba63e444bebcc5a260'


def classify(domains, states):
    if domains.get('native_crs')!='EPSG:4269':raise ValueError('Matching native NAD83 CRS required')
    state_ids=[f['GEOID'] for f,g in states]
    if not 1<=len(states)<=60 or len(state_ids)!=len(set(state_ids)):raise ValueError('Bounded unique states required')
    if any(g.is_empty or not g.is_valid or g.geom_type not in ('Polygon','MultiPolygon') for f,g in states):raise ValueError('Invalid state geometry')
    entries=domains['domains'];ids=[r['cbsa'] for r in entries]
    if len(ids)!=len(set(ids)) or set(ids)!=set(domains['source_qualifying_cbsa_ids']):raise ValueError('Complete unique qualifying inventory required')
    rows=[]
    for r in sorted(entries,key=lambda r:r['cbsa']):
        p=r['native_representative_lonlat']
        if len(p)!=2 or any(type(v) not in (float,int) or not math.isfinite(v) for v in p) or not -180<=p[0]<=180 or not -90<=p[1]<=90:raise ValueError('Invalid native point')
        point=Point(p);matches=[{'geoid':f['GEOID'],'abbreviation':f['STUSPS'],'name':f['NAME']} for f,g in states if g.covers(point)]
        matches.sort(key=lambda f:f['geoid'])
        rows.append({'cbsa':r['cbsa'],'native_representative_lonlat':p,'point_states':matches,
                     'membership_status':'unique' if len(matches)==1 else 'boundary_multiple' if matches else 'unmatched',
                     'access_verified':False})
    counts=Counter(s['abbreviation'] for r in rows for s in r['point_states'])
    return {'schema':'metro-native-state-inventory-v1','native_crs':'EPSG:4269','coordinate_operation':'none; both Census inputs use native NAD83',
            'rows':rows,'qualifying_identities':len(rows),'state_membership_counts':dict(sorted(counts.items())),
            'unmatched_cbsa_ids':[r['cbsa'] for r in rows if not r['point_states']],
            'multiple_state_cbsa_ids':[r['cbsa'] for r in rows if len(r['point_states'])>1],
            'access_verified':False,'release_eligible':False,'geographic_coverage_certified':False,
            'warning':'Native representative point membership only, not CBSA extent, extract coverage, road access, complete competition or an adopted urban anchor. Border/missing matches remain explicit; no nearest-state fallback. No native-to-OSM datum alignment is asserted.'}


def reproduce(state_zip):
    raw=Path(state_zip).read_bytes();domains_raw=DOMAINS.read_bytes()
    if hashlib.sha256(raw).hexdigest()!=STATE_SHA or hashlib.sha256(domains_raw).hexdigest()!=DOMAIN_SHA:raise ValueError('Exact dated state/domain inputs required')
    result=classify(json.loads(domains_raw),list(_read_shapes(state_zip,60)))
    result.update(state_zip_sha256=STATE_SHA,domains_sha256=DOMAIN_SHA)
    return result


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--state-zip',type=Path,required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args()
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(reproduce(a.state_zip),indent=2,sort_keys=True)+'\n')
