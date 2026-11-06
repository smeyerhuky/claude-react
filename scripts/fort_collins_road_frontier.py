"""Expand original-source incident-way enumeration to all 27 first-hop member nodes."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium
from reference_seed_incidence import ROOT, RAW, need

PARENT = ROOT/'docs/research/reference-seed-incidence/source-incidence.json'
MAX_WAYS = 100
MAX_NODES = 2000


def seed_ids():
    parent=json.loads(PARENT.read_text())
    seeds={int(nid) for nid in parent['complete_node_record_sha256']}
    need(len(seeds)==27 and all(nid>0 for nid in seeds),'Exact frozen first-hop member-node set required')
    return seeds


def extract(source):
    source=Path(source);identity=json.loads(RAW.read_text())['source'];seeds=seed_ids()
    def verify():
        need(source.stat().st_size==identity['size_bytes'],'Exact original Colorado source size required')
        with source.open('rb') as handle:
            need(hashlib.file_digest(handle,'sha256').hexdigest()==identity['sha256'],'Exact original Colorado source hash required')
    verify()
    class Ways(osmium.SimpleHandler):
        def __init__(self):
            super().__init__();self.rows={};self.nodes=set()
        def way(self,way):
            # Enumerate every incident source way, including non-highway ways.
            if not any(node.ref in seeds for node in way.nodes):return
            need(way.id not in self.rows and len(self.rows)<MAX_WAYS and 2<=len(way.nodes)<=1000
                 and all(node.location.valid() for node in way.nodes),'Complete incident-way budget/geometry failure; never truncate')
            self.nodes.update(node.ref for node in way.nodes)
            need(len(self.nodes)<=MAX_NODES,'Complete member-node budget exceeded')
            self.rows[way.id]=dict(id=way.id,version=way.version,timestamp=str(way.timestamp),tags=dict(way.tags),
                nodes=[[node.ref,node.location.lon,node.location.lat] for node in way.nodes])
    ways=Ways();ways.apply_file(str(source),locations=True,idx='flex_mem');verify()
    need(seeds<=ways.nodes,'Every frozen seed must occur in the original-source incident ways')
    class Context(osmium.SimpleHandler):
        def __init__(self):
            super().__init__();self.nodes={};self.relations={}
        def node(self,node):
            if node.id not in ways.nodes:return
            need(node.id not in self.nodes and node.location.valid(),'Complete unique raw member node required')
            self.nodes[node.id]=dict(id=node.id,version=node.version,timestamp=str(node.timestamp),
                lonlat=[node.location.lon,node.location.lat],tags=dict(node.tags))
        def relation(self,relation):
            tags=dict(relation.tags)
            control=tags.get('type')=='restriction' or any(key=='restriction' or key.startswith('restriction:') for key in tags)
            if not control or not any(m.type=='w' and m.ref in ways.rows for m in relation.members):return
            need(relation.id not in self.relations and len(self.relations)<100 and len(relation.members)<=32,
                 'Touching restriction-namespace budget exceeded; never truncate')
            self.relations[relation.id]=dict(id=relation.id,version=relation.version,timestamp=str(relation.timestamp),
                tags=tags,members=[dict(type=m.type,ref=m.ref,role=m.role) for m in relation.members])
    context=Context();context.apply_file(str(source));verify()
    need(set(context.nodes)==ways.nodes,'Every returned member vertex requires its full raw node record')
    for way in ways.rows.values():
        for nid,lon,lat in way['nodes']:
            need(context.nodes[nid]['lonlat']==[lon,lat],'Raw member/node geometry conflict')
    return dict(schema='fort-collins-road-frontier-source-v1',source=identity,
        parent_incidence_witness_sha256=hashlib.sha256(PARENT.read_bytes()).hexdigest(),seed_node_ids=sorted(seeds),
        all_source_way_ids_at_seed_nodes={str(nid):sorted(wid for wid,way in ways.rows.items()
            if any(row[0]==nid for row in way['nodes'])) for nid in sorted(seeds)},
        ways=sorted(ways.rows.values(),key=lambda row:row['id']),nodes=sorted(context.nodes.values(),key=lambda row:row['id']),
        restrictions=sorted(context.relations.values(),key=lambda row:row['id']),
        unenumerated_member_node_ids=sorted(ways.nodes-seeds),
        seed_incidence_enumerated_in_original_source=True,all_graph_node_incidence_enumerated=False,
        geographic_coverage_certified=False,exterior_closure_verified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='Every original-source way containing any of the 27 named first-hop member node IDs, without spatial/highway/access filtering. Full member geometry/nodes and touching type=restriction or restriction-namespace relations only. Further node incidence, other semantics, crossings without shared IDs, physical/grade/access truth and geographic/exterior closure are unverified.',
        attribution='OSM data copyright OpenStreetMap contributors, ODbL')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--osm',type=Path,required=True)
    parser.add_argument('--output',type=Path,required=True);args=parser.parse_args();result=extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seed_nodes=len(result['seed_node_ids']),incident_ways=len(result['ways']),complete_nodes=len(result['nodes']),
        touching_relations=len(result['restrictions']),unenumerated_nodes=len(result['unenumerated_member_node_ids']),access_verified=False))
