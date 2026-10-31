"""Check principal-city source-work accounting without approving any anchor."""
import hashlib
import json
import re
from datetime import date
from pathlib import Path
from urllib.parse import urlsplit

ROOT=Path(__file__).resolve().parents[1]
PRINCIPAL=Path('docs/research/principal-city-inventory/report.json')
FOLDER=Path('docs/research/colorado-principal-city-sources')
PRIOR={'0807850':'boulder','0816000':'colorado-springs','0827425':'fort-collins',
       '0831660':'grand-junction','0832155':'greeley','0862000':'pueblo'}
NEW={'0804000':('aurora','www.auroragov.org'),'0809280':('broomfield','www.broomfield.org'),
     '0812815':('centennial','www.centennialco.gov'),'0816495':('commerce','www.c3gov.com'),
     '0846465':('loveland','www.lovgov.org')}
KINDS={'municipal_parking_guidance','municipal_construction_advisory',
       'municipal_facility_location','municipal_building_entry_notice'}


def require(value,message):
    if not value:raise ValueError(message)


def check(root=ROOT):
    root=Path(root).resolve();folder=root/FOLDER
    manifest=json.loads((folder/'manifest.json').read_text());raw=(root/PRINCIPAL).read_bytes()
    require(manifest['schema']=='principal-city-source-screen-v1' and manifest['state']=='CO'
            and hashlib.sha256(raw).hexdigest()==manifest['principal_inventory_sha256'],
            'Exact official principal-city inventory and declared state required')
    principal=json.loads(raw);state=next(r for r in principal['states'] if r['state']=='CO')
    expected={r['principal_city_id']:r for r in state['principal_city_memberships']}
    records=manifest['records'];ids=[r['principal_city_id'] for r in records]
    require(len(ids)==len(set(ids))==len(expected) and set(ids)==set(expected),
            'Complete unique principal-city work accounting required; CBSA is not a city key')
    require(all(manifest.get(k) is False for k in ('access_verified','anchors_adopted','geographic_coverage_certified','release_eligible')),
            'Source-work accounting cannot certify anchors or coverage')
    counts={s:0 for s in ('prior_retained_context','retained_publication_observation','selected_publication_unavailable')}
    kinds={}
    for row in records:
        city=expected[row['principal_city_id']];cid=row['principal_city_id']
        require(row['cbsa']==city['cbsa'] and row['city_name']==city['name'],
                'Exact CBSA and official principal-city identity required')
        require(row['entry_review_status']=='needs_evidence'
                and all(row.get(k) is False for k in ('anchor_adopted','access_verified','release_eligible')),
                'Publication or prior context is not connector approval')
        path=(root/row['source_path']).resolve()
        require(path.is_relative_to(root) and path.is_file(),'Retained source must remain inside repository')
        data=path.read_bytes();require(hashlib.sha256(data).hexdigest()==row['source_sha256'],'Retained source changed')
        source=json.loads(data);status=row['source_status'];require(status in counts,'Explicit source-work status required')
        require(source['access_verified'] is False and source['release_eligible'] is False,'Source cannot self-certify access')
        if status=='prior_retained_context':
            if cid=='0820000':
                require(row['source_path']=='docs/research/connector-reviews/denver-union-station-proposal.json'
                        and source['cbsa']=='19740' and source['schema']=='ai-connector-review-v1',
                        'Retained Denver proposal identity required')
            else:
                require(cid in PRIOR and row['source_path']=='docs/research/colorado-anchor-source-batch/'+PRIOR[cid]+'.json'
                        and source['id']==PRIOR[cid],'Prior context belongs to another principal city')
        else:
            require(cid in NEW and row['source_path']==str(FOLDER/(NEW[cid][0]+'.json')),'New source must remain in city batch')
            url=urlsplit(source['url'])
            require(url.scheme=='https' and url.hostname==NEW[cid][1] and not url.username and not url.password,
                    'Exact official publisher identity required')
            require(source['schema']=='principal-city-publication-observation-v1'
                    and source['cbsa']==row['cbsa'] and source['principal_city_id']==cid and source['city_name']==city['name']
                    and source['publication_status']==status and source['entry_review_status']=='needs_evidence'
                    and source['anchor_adopted'] is False and source['limitations'] and source['retention'],
                    'Inspectable identity-bound observation, not an adopted anchor')
            require(isinstance(source['response_sha256'],str) and re.fullmatch('[a-f0-9]{64}',source['response_sha256'])
                    and type(source['response_bytes']) is int and source['response_bytes']>0,
                    'Explicit captured response identity required')
            date.fromisoformat(source['capture_date_utc'])
            require(isinstance(source['observations'],list) and isinstance(source['limitations'],list),
                    'Structured observations and limitations required')
            require(len(source['selected_quote'].split())<=25,'Retain only a short literal quote')
            if status=='retained_publication_observation':
                require(source['http_status']==200 and source['source_kind'] in KINDS
                        and source['observations'] and source['selected_quote'],'Retrieved publication context required')
                kinds[cid]=source['source_kind']
            else:
                require(type(source['http_status']) is int and source['http_status']!=200
                        and not source['observations'] and not source['selected_quote'] and source['source_kind'] is None,
                        'Failed retrieval cannot become verified publication or facility evidence')
        counts[status]+=1
    return dict(state='CO',principal_city_memberships=len(expected),source_work_status_counts=counts,
                new_source_context_kinds=kinds,new_anchors_adopted=0,new_connectors_approved=0,
                access_verified=False,release_eligible=False,
                warning=f"Complete work accounting only; {counts['selected_publication_unavailable']} selected publications unavailable. No reviewed anchor set or vehicle connector approved.")


if __name__=='__main__':print(json.dumps(check(),indent=2))
