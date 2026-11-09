"""Export only frozen witness arcs from the exact PBF; no graph/access admission."""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path
import re

import northern_urban_path_checkpoint as parent
from northern_local_detour_checkpoint import OUTPUT as REPORT
from road_posted_speed_weights import weights
from road_reference_segment_costs import POLICY_PATH, meters, policy
from road_reference_scenario import load
from road_reference_way_permissions import DEFAULTS
from reference_via_node_compile import need

ROOT=Path(__file__).resolve().parents[1]
OUTPUT=ROOT/'docs/research/northern-detour-explorer'
ARC=re.compile(r'raw:([1-9][0-9]*):([0-9]+):(forward|backward)\Z')


def encoded(value):return (json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False)+'\n').encode()


def report():
    result=json.loads(REPORT.read_bytes())
    need(result['counts']['queries']==40 and result['counts']['finite_witnesses']==40
         and result['counts']['unresolved']==0 and not result['release_eligible']
         and result['connectors_approved']==0 and not result['anchors_adopted'],'Exact research-only detour report required')
    for name,expected in {**result['implementation_sha256'],**result['retained_input_sha256']}.items():
        need(parent.digest(ROOT/name)==expected,'Frozen implementation/input binding changed: '+name)
    need(parent.digest(parent.SCENARIO)==result['scenario_sha256'],'Frozen scenario changed')
    return result


def wanted_arcs(frozen):
    result={a for q in frozen['queries'] for a in q['result']['arc_path']}
    need(0<len(result)<=20_000 and all(ARC.fullmatch(a) for a in result),'Bounded explicit raw witness arc identities required')
    return result


def validate(data,frozen):
    need(data['schema']=='northern-detour-witness-geometry-v1'
         and data['report_sha256']==parent.digest(REPORT) and data['source_identity']==frozen['source_identity']
         and data['scenario_sha256']==frozen['scenario_sha256']
         and data['segment_policy_sha256']==parent.digest(POLICY_PATH)
         and data['extractor_sha256']==parent.digest(__file__),'Exact geometry input/code/source bindings required')
    need(all(data[k] is False for k in ('access_verified','geographic_coverage_certified','anchors_adopted','release_eligible'))
         and data['connectors_approved']==0,'Research-only asset required')
    arcs=data['arcs'];nodes=data['nodes'];ways=data['ways']
    need(set(arcs)==wanted_arcs(frozen) and len(nodes)<=20_000 and len(ways)<=1500,'Exact bounded witness-only data required')
    used_nodes=set();used_ways=set()
    for aid,arc in arcs.items():
        match=ARC.fullmatch(aid)
        need(arc['way']==int(match[1]) and arc['raw_segment_index']==int(match[2]) and arc['direction']==match[3],
             'Raw arc identity/index/direction mismatch')
        need(str(arc['from']) in nodes and str(arc['to']) in nodes,'Missing native endpoint geometry')
        used_nodes.update((str(arc['from']),str(arc['to'])));used_ways.add(str(arc['way']))
        for metric in ('length','travel_time'):
            value=arc[metric]
            need(type(value) in (int,float) and value>0 and value<float('inf'),'Finite positive stored arc costs required')
    need(set(nodes)==used_nodes and set(ways)==used_ways,'No unused raw regional geometry may be exported')
    for position in nodes.values():
        need(isinstance(position,list) and len(position)==2 and all(type(v) in (int,float) for v in position)
             and -180<=position[0]<=180 and -90<=position[1]<=90,'Valid numeric native coordinates required')
    radius=policy()['earth_radius_m']
    for arc in arcs.values():
        a,b=nodes[str(arc['from'])],nodes[str(arc['to'])]
        if arc['direction']=='backward':a,b=b,a
        need(meters(a,b,radius)==arc['length'],'Native arc geometry differs from stored segment length')
        speed=arc['speed_mps_fraction']
        need(isinstance(speed,list) and len(speed)==2 and all(type(v) is int and v>0 for v in speed),
             'Exact positive source/model speed fraction required')
        need(float(Fraction(arc['length'])/Fraction(*speed))==arc['travel_time'],
             'Stored segment time differs from native length and declared speed')
    candidates={c['id']:c for c in frozen['candidates']}
    for c in candidates.values():need(nodes[str(c['node'])]==c['lonlat'],'Frozen candidate position changed')
    for q in frozen['queries']:
        answer=q['result'];previous=None;node=candidates[q['source']]['node'];cost=Fraction(0)
        for aid in answer['arc_path']:
            arc=arcs[aid];need(arc['from']==node,'Discontinuous witness geometry')
            need(previous is None or not(previous['way']==arc['way'] and previous['from']==arc['to']),
                 'Undeclared immediate reversal')
            node=arc['to'];cost+=Fraction(arc[q['metric']]);previous=arc
        need(node==candidates[q['target']]['node'] and float(cost)==answer['cost']
             and [str(cost.numerator),str(cost.denominator)]==answer['exact_stored_path_cost'],
             'Frozen path endpoint or exact stored cost changed')
    return data


def extract(source):
    import osmium
    frozen=report();wanted=wanted_arcs(frozen);way_ids={int(ARC.fullmatch(a)[1]) for a in wanted}
    need(len(way_ids)<=1500,'Witness whole-way budget exceeded')
    parent.verify_original(source)
    class Ways(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.ways={};self.nodes=set()
        def way(self,w):
            if w.id in way_ids:
                need(w.id not in self.ways and 2<=len(w.nodes)<=1000 and all(n.location.valid() for n in w.nodes),
                     'Complete unique bounded witness way geometry required')
                rows=[[n.ref,n.location.lon,n.location.lat] for n in w.nodes];self.nodes.update(n[0] for n in rows)
                need(len(self.nodes)<=20_000,'Whole witness-member node budget exceeded')
                self.ways[w.id]=dict(id=w.id,nodes=rows,tags=dict(w.tags))
    ways=Ways();ways.apply_file(str(source),locations=True,idx='flex_mem')
    need(set(ways.ways)==way_ids,'Missing complete witness ways')
    class Nodes(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.nodes={}
        def node(self,n):
            if n.id in ways.nodes:
                need(n.id not in self.nodes and n.location.valid(),'Complete unique raw witness-node tags required')
                self.nodes[n.id]=dict(id=n.id,lonlat=[n.location.lon,n.location.lat],tags=dict(n.tags))
    nodes=Nodes();nodes.apply_file(str(source),locations=False)
    need(set(nodes.nodes)==ways.nodes,'Missing whole-way node controls')
    arcs={};names={}
    for w in ways.ways.values():
        local=[nodes.nodes[i] for i in sorted({n[0] for n in w['nodes']})]
        need(all(nodes.nodes[n[0]]['lonlat']==n[1:] for n in w['nodes']),'Native geometry disagrees across passes')
        result=weights(w,local,default_policy=DEFAULTS,scenario=load(),feature_zones=parent.zones([w],local))
        need(result['status']=='supported_segment_weights','Frozen witness way is no longer supported')
        for a in result['arcs']:
            if a['id'] in wanted:
                need(a['id'] not in arcs,'Duplicate witness arc')
                arcs[a['id']]={k:a[k] for k in ('way','from','to','raw_segment_index','direction','length','travel_time','speed_basis','speed_mps_fraction')}
        names[str(w['id'])]=dict(name=w['tags'].get('name','Unnamed road'),ref=w['tags'].get('ref',''),highway=w['tags']['highway'])
    used={a[k] for a in arcs.values() for k in ('from','to')}
    data=dict(schema='northern-detour-witness-geometry-v1',report_sha256=parent.digest(REPORT),source_identity=frozen['source_identity'],
        scenario_sha256=frozen['scenario_sha256'],segment_policy_sha256=parent.digest(POLICY_PATH),extractor_sha256=parent.digest(__file__),
        arcs=arcs,nodes={str(n):nodes.nodes[n]['lonlat'] for n in used},ways=names,
        access_verified=False,geographic_coverage_certified=False,anchors_adopted=False,connectors_approved=0,release_eligible=False)
    parent.verify_original(source)
    validate(data,frozen)
    content=encoded(data)
    manifest=encoded(dict(schema='northern-detour-geometry-manifest-v1',geometry_sha256=hashlib.sha256(content).hexdigest(),
        report_sha256=data['report_sha256'],extractor_sha256=data['extractor_sha256'],source_identity=data['source_identity'],
        queries=40,witness_ways=len(names),witness_arcs=len(arcs),witness_nodes=len(used),release_eligible=False))
    return {'geometry.json':content,'manifest.json':manifest}


def load_geometry():
    manifest=json.loads((OUTPUT/'manifest.json').read_bytes());raw=(OUTPUT/'geometry.json').read_bytes()
    need(manifest['schema']=='northern-detour-geometry-manifest-v1' and manifest['release_eligible'] is False
         and hashlib.sha256(raw).hexdigest()==manifest['geometry_sha256'],'Exact frozen geometry digest required')
    data=validate(json.loads(raw),report())
    need(manifest==dict(schema='northern-detour-geometry-manifest-v1',geometry_sha256=hashlib.sha256(raw).hexdigest(),
        report_sha256=data['report_sha256'],extractor_sha256=data['extractor_sha256'],source_identity=data['source_identity'],queries=40,
        witness_ways=len(data['ways']),witness_arcs=len(data['arcs']),witness_nodes=len(data['nodes']),release_eligible=False),
        'Complete witness-geometry manifest differs')
    return data,manifest


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',required=True,type=Path);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    actual=extract(args.osm)
    if args.write:
        OUTPUT.mkdir(parents=True,exist_ok=True)
        for name,content in actual.items():(OUTPUT/name).write_bytes(content)
    else:need(all((OUTPUT/name).read_bytes()==content for name,content in actual.items()),'Fresh source geometry replay differs')
    print(json.dumps({k:v for k,v in json.loads(actual['manifest.json']).items() if k!='source_identity'},sort_keys=True))
