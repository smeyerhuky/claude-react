"""Bounded extra-street witnesses; no access approval or geographic closure."""
import argparse
import hashlib
import json
from pathlib import Path

import northern_urban_path_checkpoint as parent
from reference_via_node_compile import need, canonical_sha

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs/research/northern-local-detours/report.json'
URBAN_BOXES=[[-105.13,40.51,-105.00,40.65],[-105.14,40.35,-104.99,40.46],[-104.84,40.35,-104.61,40.48]]
GREELEY_CORE=[-104.71,40.41,-104.68,40.44]
EXTRA_CLASSES={'tertiary','tertiary_link'}
LOCAL_CLASSES={'residential','unclassified','living_street'}


def inside(lonlat,box):
    return box[0]<=lonlat[0]<=box[2] and box[1]<=lonlat[1]<=box[3]


def select_travel(highway,refs,main_ids,urban_ids,local_ids):
    return (highway in parent.CLASSES and bool(main_ids.intersection(refs))
            or highway in EXTRA_CLASSES and bool(urban_ids.intersection(refs))
            or highway in LOCAL_CLASSES and bool(local_ids.intersection(refs)))


def extract(source):
    import osmium
    parent.verify_original(source)
    class Scout(osmium.SimpleHandler):
        def __init__(self):
            super().__init__();self.main=set();self.urban=set();self.local=set();self.travel=set();self.relations=[]
        def node(self,n):
            if not n.location.valid():return
            p=[n.location.lon,n.location.lat]
            if inside(p,parent.BOUNDS):
                need(len(self.main)<3_000_000,'Regional node budget exceeded')
                self.main.add(n.id)
                if any(inside(p,b) for b in URBAN_BOXES):self.urban.add(n.id)
                if inside(p,GREELEY_CORE):self.local.add(n.id)
        def way(self,w):
            if select_travel(w.tags.get('highway'),{n.ref for n in w.nodes},self.main,self.urban,self.local):
                need(w.id not in self.travel and len(self.travel)<10_000,'Unique bounded travel ways required')
                self.travel.add(w.id)
        def relation(self,r):
            tags=dict(r.tags)
            if tags.get('type') in {'restriction','connectivity'} or any(k.startswith('restriction') for k in tags):
                need(len(self.relations)<20_000 and len(r.members)<=100,'Control budget exceeded')
                self.relations.append(dict(id=r.id,tags=tags,members=[dict(type=m.type,ref=m.ref,role=m.role) for m in r.members]))
    scout=Scout();scout.apply_file(str(source),locations=False)
    relations=[r for r in scout.relations if any(m['type']=='w' and m['ref'] in scout.travel for m in r['members'])]
    need(len(relations)<=2000 and len({r['id'] for r in relations})==len(relations),'Unique bounded touching controls required')
    wanted=scout.travel|{m['ref'] for r in relations for m in r['members'] if m['type']=='w'}
    need(len(wanted)<=12_000,'Context-way budget exceeded')
    class Ways(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.ways={};self.ids=set()
        def way(self,w):
            if w.id in wanted:
                need(w.id not in self.ways and 2<=len(w.nodes)<=2000,'Complete unique bounded whole-way geometry required')
                refs=[n.ref for n in w.nodes];self.ids.update(refs)
                need(len(self.ids)<=50_000,'Member-node budget exceeded; no truncation')
                self.ways[w.id]=dict(id=w.id,node_ids=refs,tags=dict(w.tags))
    ways=Ways();ways.apply_file(str(source),locations=False)
    need(set(ways.ways)==wanted,'Missing complete control-member way')
    class Nodes(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.nodes={}
        def node(self,n):
            if n.id in ways.ids:
                need(n.id not in self.nodes and n.location.valid(),'Complete unique raw member-node location required')
                self.nodes[n.id]=dict(id=n.id,lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags))
    nodes=Nodes();nodes.apply_file(str(source),locations=False)
    need(set(nodes.nodes)==ways.ids,'Missing complete raw member-node data')
    for w in ways.ways.values():w['nodes']=[[i,*nodes.nodes[i]['lonlat']] for i in w.pop('node_ids')]
    parent.verify_original(source)
    return dict(source_identity=parent.identity(),bounds=parent.BOUNDS,travel_way_ids=sorted(scout.travel),
                ways=list(ways.ways.values()),nodes=list(nodes.nodes.values()),control_relations=relations,
                missing_way_ids=[],missing_node_ids=[])


def parent_context(raw):
    ways={w['id']:w for w in raw['ways']}
    travel={w['id'] for w in raw['ways'] if w['id'] in set(raw['travel_way_ids']) and w['tags'].get('highway') in parent.CLASSES}
    relations=[r for r in raw['control_relations'] if any(m['type']=='w' and m['ref'] in travel for m in r['members'])]
    wanted=travel|{m['ref'] for r in relations for m in r['members'] if m['type']=='w'}
    ids={p[0] for i in wanted for p in ways[i]['nodes']}
    return dict(raw,travel_way_ids=sorted(travel),ways=[w for w in raw['ways'] if w['id'] in wanted],
                nodes=[n for n in raw['nodes'] if n['id'] in ids],control_relations=relations)


def compare_parent(raw,graph,report):
    frozen=json.loads(parent.OUTPUT.read_bytes());old_raw=parent_context(raw)
    need(canonical_sha(old_raw)==frozen['raw_context_sha256'],'Expanded extraction does not reproduce exact parent source selection')
    old=parent.build(old_raw)
    need(canonical_sha(dict(nodes=old['nodes'],arcs=old['arcs'],maneuvers=old['maneuvers']))==frozen['weighted_subset_sha256'],
         'Parent weighted graph differs')
    current={a['id']:a for a in graph['arcs']}
    need(all(current.get(a['id'])==a for a in old['arcs']),'Previously retained travel arc changed or disappeared')
    need(report['candidates']==frozen['candidates'],'Candidate endpoint hypothesis changed')
    by_query={(q['source'],q['target'],q['metric']):q for q in report['queries']}
    old_finite=0;new_finite=0;improved=0
    for previous in frozen['queries']:
        q=by_query[(previous['source'],previous['target'],previous['metric'])]
        if previous['result']['cost'] is None:
            new_finite+=q['result']['cost'] is not None
        else:
            parent.verify_witness(previous['result'],graph);old_finite+=1
            need(q['result']['cost'] is not None,'Existing finite query lost')
            from fractions import Fraction
            before=Fraction(*map(int,previous['result']['exact_stored_path_cost']))
            after=Fraction(*map(int,q['result']['exact_stored_path_cost']))
            need(after<=before,'Expanded search worsened a retained feasible witness')
            improved+=after<before
    return dict(parent_report_sha256=parent.digest(parent.OUTPUT),all_parent_raw_records_reproduced=True,
                all_parent_travel_arcs_unchanged=True,all_parent_finite_witnesses_revalidated=True,
                original_finite_queries=old_finite,newly_finite_queries=new_finite,strictly_improved_parent_queries=improved,
                endpoint_hypotheses_unchanged=True)


def report(raw):
    graph=parent.build(raw);result=parent.report(raw,graph)
    result.update(schema='northern-local-detour-native-witnesses-v1',
        travel_highway_classes=sorted(parent.CLASSES|EXTRA_CLASSES|LOCAL_CLASSES),
        selection_policy=dict(major_classes=sorted(parent.CLASSES),major_bounds=parent.BOUNDS,
                              tertiary_classes=sorted(EXTRA_CLASSES),tertiary_boxes=URBAN_BOXES,
                              local_classes=sorted(LOCAL_CLASSES),local_bounds=GREELEY_CORE,
                              whole_ways_selected_by_any_native_member_in_closed_box=True,
                              service_roads_selected_for_travel=False),
        parent_comparison=compare_parent(raw,graph,result))
    return result


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm',required=True,type=Path);parser.add_argument('--write',action='store_true')
    args=parser.parse_args();actual=report(extract(args.osm))
    if args.write:
        OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_text(json.dumps(actual,sort_keys=True,indent=2)+'\n')
    else:need(actual==json.loads(OUTPUT.read_bytes()),'Fresh original-source detour replay differs')
    print(json.dumps(dict(counts=actual['counts'],comparison=actual['parent_comparison']),sort_keys=True))


if __name__=='__main__':main()
