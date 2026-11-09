"""Original-source regional witness experiment; never full-world route admission."""
import argparse
from collections import Counter, defaultdict
from fractions import Fraction
import hashlib
from importlib.metadata import version
import json
from pathlib import Path
import sys

from road_posted_speed_weights import weights
from road_reference_way_permissions import DEFAULTS
from road_reference_scenario import load, SCENARIO
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from road_maneuver_subset_projection import project_to_arc_subset
from road_maneuver_probe import solve
from stream_osm_roads import meters
from colorado_principal_city_domains import candidate_city_check
from reference_via_node_compile import canonical_sha, need

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT/'docs/research/northern-urban-paths/report.json'
BOUNDS = [-105.20, 40.34, -104.60, 40.67]
CLASSES = {'motorway','motorway_link','trunk','trunk_link','primary','primary_link','secondary','secondary_link'}
CASES = [
    ('fort-college','0827425','North College Avenue','US 287',[-105.0773,40.5903]),
    ('loveland-lincoln','0846465','North Lincoln Avenue','US 287',[-105.0739,40.3970]),
    ('loveland-cleveland','0846465','North Cleveland Avenue','US 287',[-105.0756,40.3970]),
    ('greeley-ninth','0832155','9th Street','US 34 Business',[-104.6877,40.4220]),
    ('greeley-tenth','0832155','10th Street','US 34 Business',[-104.6877,40.4210]),
]


def digest(path):
    with Path(path).open('rb') as handle: return hashlib.file_digest(handle,'sha256').hexdigest()


def identity():
    return next(s for s in json.loads((ROOT/'docs/research/metro-graph-bundle-input-contract/bundle.json').read_bytes())['osm_sources']
                if s['name']=='colorado.osm.pbf')


def verify_original(source):
    expected=identity();source=Path(source)
    need(source.stat().st_size==expected['size_bytes'] and digest(source)==expected['sha256'],
         'Exact complete frozen Colorado PBF required')


def extract(source):
    """Three bounded full passes. Whole selected ways and every touching control."""
    import osmium
    verify_original(source)
    class Scout(osmium.SimpleHandler):
        def __init__(self):
            super().__init__();self.inside=set();self.travel=set();self.relations=[]
        def node(self,n):
            if n.location.valid() and BOUNDS[0]<=n.location.lon<=BOUNDS[2] and BOUNDS[1]<=n.location.lat<=BOUNDS[3]:
                need(len(self.inside)<3_000_000,'In-window node budget exceeded')
                self.inside.add(n.id)
        def way(self,w):
            if w.tags.get('highway') in CLASSES and any(n.ref in self.inside for n in w.nodes):
                need(w.id not in self.travel and len(self.travel)<10_000,'Travel-way budget/identity invalid')
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
    need(len(wanted)<=12_000,'Whole context-way budget exceeded')
    class Ways(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.ways={};self.ids=set()
        def way(self,w):
            if w.id in wanted:
                need(w.id not in self.ways and 2<=len(w.nodes)<=2000,'Whole raw way missing/duplicate/over budget')
                refs=[n.ref for n in w.nodes];self.ids.update(refs)
                need(len(self.ids)<=50_000,'Member-node budget exceeded')
                self.ways[w.id]=dict(id=w.id,node_ids=refs,tags=dict(w.tags))
    ways=Ways();ways.apply_file(str(source),locations=False)
    need(set(ways.ways)==wanted,'Complete restriction-member ways required')
    class Nodes(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.nodes={}
        def node(self,n):
            if n.id in ways.ids:
                need(n.id not in self.nodes and n.location.valid(),'Complete unique raw member-node geometry required')
                self.nodes[n.id]=dict(id=n.id,lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags))
    nodes=Nodes();nodes.apply_file(str(source),locations=False)
    need(set(nodes.nodes)==ways.ids,'Complete raw member nodes required')
    for w in ways.ways.values():w['nodes']=[[i,*nodes.nodes[i]['lonlat']] for i in w.pop('node_ids')]
    verify_original(source)
    return dict(source_identity=identity(),bounds=BOUNDS,travel_way_ids=sorted(scout.travel),
                ways=list(ways.ways.values()),nodes=list(nodes.nodes.values()),control_relations=relations,
                missing_way_ids=[],missing_node_ids=[])


def zones(ways,nodes):
    # Explicit research assignment, not a certified geographic timezone join.
    return {**{f'way:{w["id"]}':'America/Denver' for w in ways},
            **{f'node:{n["id"]}':'America/Denver' for n in nodes}}


def build(raw):
    need(raw['source_identity']==identity() and raw['bounds']==BOUNDS
         and not raw['missing_way_ids'] and not raw['missing_node_ids'],'Complete exact-source context required')
    scenario=load();by_way={w['id']:w for w in raw['ways']};by_node={n['id']:n for n in raw['nodes']}
    need(len(by_way)==len(raw['ways'])<=12_000 and len(by_node)==len(raw['nodes'])<=50_000,'Unique bounded raw context required')
    travel=set(raw['travel_way_ids']);need(travel<=by_way.keys(),'Missing travel ways')
    known={};unsupported={};arcs=[]
    for w in raw['ways']:
        nodes=[by_node[i] for i in sorted({p[0] for p in w['nodes']})]
        result=weights(w,nodes,default_policy=DEFAULTS,scenario=scenario,feature_zones=zones([w],nodes))
        if result['status']=='supported_segment_weights':known[w['id']]=result;arcs.extend(result['arcs'])
        else:unsupported[w['id']]=result['reason']
    travel={i for i in travel if i in known and known[i]['arcs']}
    compiled=[];failed=[];quarantined=set()
    for r in raw['control_relations']:
        ids={m['ref'] for m in r['members'] if m['type']=='w'};ways=[by_way[i] for i in sorted(ids)]
        nodes=[by_node[i] for i in sorted({p[0] for w in ways for p in w['nodes']})]
        compiler=node_rule if [m['type'] for m in r['members'] if m['role']=='via']==['n'] else way_rule
        result=compiler(r,ways,nodes,default_policy=DEFAULTS,scenario=scenario,relation_zone='America/Denver',feature_zones=zones(ways,nodes))
        if result['topology_compiled'] and ids<=known.keys():compiled.append(dict(raw=r,result=result,ways=ids))
        else:
            failed.append(dict(id=r['id'],reason=result.get('reason') or 'context weight unavailable',ways=sorted(ids)))
            quarantined.update(ids)
    travel-=quarantined
    active=[x['result']['active_pattern'] for x in compiled if x['ways']&travel and x['result']['active_pattern'] is not None]
    projection=project_to_arc_subset(arcs,active,{a['id'] for a in arcs if a['way'] in travel})
    selected=[a for a in arcs if a['way'] in travel];node_ids=sorted({a[k] for a in selected for k in ('from','to')})
    return dict(nodes=node_ids,arcs=selected,maneuvers=projection['projected_maneuvers'],
        by_way={k:v for k,v in by_way.items() if k in travel},by_node={k:v for k,v in by_node.items() if k in node_ids},
        unsupported_ways=unsupported,failed_relations=failed,quarantined_way_ids=sorted(quarantined),projection=projection,
        original_active_maneuvers=active,compiled_relation_count=len(compiled),context_arc_count=len(arcs))


def candidates(graph):
    result=[]
    for label,city,name,ref,context in CASES:
        possibilities=[]
        for w in graph['by_way'].values():
            if w['tags'].get('name')!=name or ref not in w['tags'].get('ref','').split(';'):continue
            for row in w['nodes'][1:-1]:
                if row[0] not in graph['by_node'] or graph['by_node'][row[0]]['tags']:continue
                gap=meters(context,row[1:])
                if gap<=750:possibilities.append((gap,row[0],w['id'],row[1:]))
        need(possibilities,'No bounded interior native candidate: '+label)
        gap,nid,wid,lonlat=min(possibilities)
        need(candidate_city_check(city,lonlat)['covered_by_supplied_city_polygon'],'Candidate outside retained city polygon')
        result.append(dict(id=label,city=city,node=nid,way=wid,lonlat=lonlat,context_displacement_m=gap,
                           context_displacement_is_connector=False,anchor_adopted=False))
    return result


def verify_witness(answer,graph):
    """Independent complete-path language and exact-cost check, without solver state."""
    need(answer['converged'] is True and answer['partial_results_returned'] is False,'Incomplete solver result')
    path=answer['arc_path']
    if answer['cost'] is None:
        need(not path and answer['exact_stored_path_cost'] is None,'Unknown result contains a witness')
        return
    arcs={a['id']:a for a in graph['arcs']};previous=None;node=answer['source'];cost=Fraction(0)
    for aid in path:
        need(aid in arcs and arcs[aid]['from']==node,'Witness arc missing or discontinuous')
        arc=arcs[aid]
        need(previous is None or not (previous['way']==arc['way'] and previous['from']==arc['to']),'Undeclared immediate same-way reversal')
        node=arc['to'];cost+=Fraction(arc[answer['metric']]);previous=arc
    need(node==answer['target'] and [str(cost.numerator),str(cost.denominator)]==answer['exact_stored_path_cost']
         and float(cost)==answer['cost'],'Witness endpoint/exact stored cost differs')
    starts={}
    for index,aid in enumerate(path):starts.setdefault(aid,[]).append(index)
    for rule in graph['original_active_maneuvers']:
        seq=rule['arc_sequence']
        for start in starts.get(seq[0],[]):
            actual=path[start:start+len(seq)]
            if rule['kind']=='no':need(actual!=seq,'Original complete NO violated')
            else:need(actual==seq[:len(actual)],'Original ONLY continuation violated')


def report(raw,graph):
    proposals=candidates(graph);queries=[]
    adjacency=defaultdict(set)
    for arc in graph['arcs']:
        adjacency[arc['from']].add(arc['to']);adjacency[arc['to']].add(arc['from'])
    components=[]
    for proposal in proposals:
        seen={proposal['node']};pending=[proposal['node']]
        while pending:
            node=pending.pop()
            for other in adjacency[node]-seen:seen.add(other);pending.append(other)
        components.append(dict(candidate=proposal['id'],weak_component_nodes=len(seen),
                               candidates_in_component=[p['id'] for p in proposals if p['node'] in seen],
                               physical_or_legal_connectivity_verified=False))
    for source in proposals:
        for target in proposals:
            if source==target:continue
            for metric in ('length','travel_time'):
                answer=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source['node'],target['node'],metric)
                verify_witness(answer,graph)
                answer.pop('state_trace')  # Reconstructed during replay; keep compact ordered raw arc IDs.
                queries.append(dict(source=source['id'],target=target['id'],metric=metric,
                    status='supported-subset-witness' if answer['cost'] is not None else 'unresolved-subset-no-witness',result=answer))
    source_files={str(Path(m.__file__).resolve().relative_to(ROOT)):digest(m.__file__) for m in list(sys.modules.values())
                  if getattr(m,'__file__',None) and Path(m.__file__).resolve().parent==ROOT/'scripts'
                  and Path(m.__file__).suffix=='.py' and not Path(m.__file__).name.startswith('test_')}
    source_files[str(Path(__file__).relative_to(ROOT))]=digest(__file__)
    return dict(schema='northern-urban-native-path-research-v1',source_identity=identity(),
        attribution='© OpenStreetMap contributors, https://www.openstreetmap.org/copyright (ODbL)',
        bounds=BOUNDS,travel_highway_classes=sorted(CLASSES),scenario_sha256=digest(SCENARIO),
        dependencies={k:version(k) for k in ('osmium','tzdata','networkx')},implementation_sha256=source_files,
        retained_input_sha256={str(p.relative_to(ROOT)):digest(p) for p in (
            ROOT/'docs/research/metro-graph-bundle-input-contract/bundle.json',
            ROOT/'docs/research/colorado-principal-city-domains/manifest.json',
            ROOT/'docs/research/colorado-principal-city-domains/cities.geojson',
            ROOT/'docs/research/principal-city-inventory/report.json')},
        raw_context_sha256=canonical_sha(raw),weighted_subset_sha256=canonical_sha(dict(nodes=graph['nodes'],arcs=graph['arcs'],maneuvers=graph['maneuvers'])),
        projection_sha256=canonical_sha(graph['projection']),
        counts=dict(selected_source_ways=len(raw['travel_way_ids']),context_ways=len(raw['ways']),context_nodes=len(raw['nodes']),
                    touching_controls=len(raw['control_relations']),supported_context_ways=len(raw['ways'])-len(graph['unsupported_ways']),
                    unsupported_context_ways=len(graph['unsupported_ways']),compiled_controls=graph['compiled_relation_count'],
                    failed_controls=len(graph['failed_relations']),quarantined_context_way_ids=len(graph['quarantined_way_ids']),
                    retained_travel_ways=len(graph['by_way']),retained_nodes=len(graph['nodes']),retained_arcs=len(graph['arcs']),
                    context_arcs=graph['context_arc_count'],projected_maneuvers=len(graph['maneuvers']),
                    queries=len(queries),finite_witnesses=sum(q['result']['cost'] is not None for q in queries),
                    unresolved=sum(q['result']['cost'] is None for q in queries)),
        unsupported_way_reason_counts=dict(sorted(Counter(graph['unsupported_ways'].values()).items())),
        failed_controls=graph['failed_relations'],quarantined_way_ids=graph['quarantined_way_ids'],candidates=proposals,queries=queries,
        weak_component_diagnostics=components,
        timezone_assignment='Declared America/Denver for all contextual features; geographic timezone join not certified',
        endpoint_policy='Unadopted native road-node hypotheses with unconstrained starts; terminal may stop inside ONLY prefix',
        scope='Finite costs are witnesses within a deliberately incomplete supported subset. Missing paths remain unknown, never real-world unreachable or modeled NoData. No uniform destination/window incumbent bound follows.',
        access_verified=False,geographic_coverage_certified=False,anchors_adopted=False,connectors_approved=0,release_eligible=False)


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm',required=True,type=Path)
    parser.add_argument('--write',action='store_true',help='Explicitly replace the derived retained report')
    args=parser.parse_args()
    raw=extract(args.osm);actual=report(raw,build(raw))
    if args.write:
        OUTPUT.parent.mkdir(parents=True,exist_ok=True);OUTPUT.write_text(json.dumps(actual,sort_keys=True,indent=2)+'\n')
    else:need(actual==json.loads(OUTPUT.read_bytes()),'Fresh original-source replay differs from retained checkpoint')
    print(json.dumps(actual['counts'],sort_keys=True))


if __name__=='__main__':main()
