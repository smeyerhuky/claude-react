"""Bounded original-source incidence plus explicitly requested raw member ways."""
import hashlib
from pathlib import Path
import re
import osmium

MAX_WAYS=100
MAX_NODES=2000
MAX_WAY_VERTICES=1000
MAX_RELATIONS=100
MAX_RELATION_MEMBERS=32


def need(value,reason):
    if not value:raise ValueError(reason)


def identities(values,maximum):
    need(isinstance(values,(list,tuple)) and len(values)<=maximum
         and all(type(value) is int and value>0 for value in values)
         and len(set(values))==len(values),'Bounded unique positive raw identities required')
    return set(values)


def extract(source,*,source_identity,seed_node_ids,additional_way_ids=()):
    source=Path(source)
    need(isinstance(source_identity,dict) and set(source_identity)=={'name','sha256','size_bytes'}
         and isinstance(source_identity['name'],str) and 0<len(source_identity['name'])<=128
         and isinstance(source_identity['sha256'],str) and re.fullmatch('[0-9a-f]{64}',source_identity['sha256'])
         and type(source_identity['size_bytes']) is int and source_identity['size_bytes']>0,'Explicit exact original-source identity required')
    seeds=identities(seed_node_ids,MAX_NODES);extra=identities(additional_way_ids,MAX_WAYS)
    need(seeds,'At least one explicit raw seed node required')
    def verify():
        need(source.stat().st_size==source_identity['size_bytes'],'Original source size mismatch')
        with source.open('rb') as handle:
            need(hashlib.file_digest(handle,'sha256').hexdigest()==source_identity['sha256'],'Original source SHA mismatch')
    verify()
    class Ways(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.rows={};self.nodes=set();self.incident=set()
        def way(self,way):
            incident=any(node.ref in seeds for node in way.nodes)
            if not incident and way.id not in extra:return
            need(way.id not in self.rows and len(self.rows)<MAX_WAYS and 2<=len(way.nodes)<=MAX_WAY_VERTICES
                 and all(node.location.valid() for node in way.nodes),'Complete raw way identity/geometry budget failed; never truncate')
            self.nodes.update(node.ref for node in way.nodes)
            need(len(self.nodes)<=MAX_NODES,'Complete raw member-node budget exceeded')
            if incident:self.incident.add(way.id)
            self.rows[way.id]=dict(id=way.id,version=way.version,timestamp=str(way.timestamp),tags=dict(way.tags),
                nodes=[[node.ref,node.location.lon,node.location.lat] for node in way.nodes])
    ways=Ways();ways.apply_file(str(source),locations=True,idx='flex_mem');verify()
    need(extra<=set(ways.rows) and seeds<=ways.nodes,'Every seed and explicitly requested way must exist in the original source')
    class Context(osmium.SimpleHandler):
        def __init__(self):super().__init__();self.nodes={};self.relations={}
        def node(self,node):
            if node.id not in ways.nodes:return
            need(node.id not in self.nodes and node.location.valid(),'Unique complete raw member node required')
            self.nodes[node.id]=dict(id=node.id,version=node.version,timestamp=str(node.timestamp),
                lonlat=[node.location.lon,node.location.lat],tags=dict(node.tags))
        def relation(self,relation):
            tags=dict(relation.tags)
            control=tags.get('type') in ('restriction','connectivity') or any(
                key in ('restriction','connectivity') or key.startswith(('restriction:','connectivity:')) for key in tags)
            if not control or not any(member.type=='w' and member.ref in ways.rows for member in relation.members):return
            need(relation.id not in self.relations and len(self.relations)<MAX_RELATIONS and len(relation.members)<=MAX_RELATION_MEMBERS,
                 'Touching restriction namespace budget exceeded; never truncate')
            self.relations[relation.id]=dict(id=relation.id,version=relation.version,timestamp=str(relation.timestamp),tags=tags,
                members=[dict(type=member.type,ref=member.ref,role=member.role) for member in relation.members])
    context=Context();context.apply_file(str(source));verify()
    need(set(context.nodes)==ways.nodes,'Every selected raw vertex requires its complete node record')
    for way in ways.rows.values():
        for nid,lon,lat in way['nodes']:need(context.nodes[nid]['lonlat']==[lon,lat],'Raw way/node geometry mismatch')
    referenced={m['ref'] for r in context.relations.values() for m in r['members'] if m['type']=='w'}
    referenced_nodes={m['ref'] for r in context.relations.values() for m in r['members'] if m['type']=='n'}
    referenced_relations={m['ref'] for r in context.relations.values() for m in r['members'] if m['type']=='r'}
    missing_ways=sorted(referenced-set(ways.rows));missing_nodes=sorted(referenced_nodes-set(context.nodes))
    return dict(schema='bounded-original-source-incidence-v1',source=dict(source_identity),seed_node_ids=sorted(seeds),
        requested_member_way_ids=sorted(extra),incident_way_ids=sorted(ways.incident),
        all_source_way_ids_at_seed_nodes={str(nid):sorted(wid for wid,way in ways.rows.items() if any(p[0]==nid for p in way['nodes'])) for nid in sorted(seeds)},
        ways=sorted(ways.rows.values(),key=lambda row:row['id']),nodes=sorted(context.nodes.values(),key=lambda row:row['id']),
        control_relations=sorted(context.relations.values(),key=lambda row:row['id']),
        missing_touching_relation_member_way_ids=missing_ways,missing_touching_relation_node_ids=missing_nodes,
        referenced_relation_member_ids=sorted(referenced_relations),
        unenumerated_member_node_ids=sorted(ways.nodes-seeds),
        bounds=dict(max_ways=MAX_WAYS,max_nodes=MAX_NODES,max_way_vertices=MAX_WAY_VERTICES,
                    max_relations=MAX_RELATIONS,max_relation_members=MAX_RELATION_MEMBERS),
        source_seed_incidence_enumerated=True,all_graph_node_incidence_enumerated=False,
        all_retained_way_and_node_members_present=not missing_ways and not missing_nodes and not referenced_relations,
        all_relation_semantics_evaluated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='All original-source ways at the named raw seed IDs, without spatial/highway/access filtering, plus explicitly named member ways. Every returned member node and all touching restriction/connectivity types or namespaces are retained. Requested members do not imply further incidence/relationship closure or evaluated control semantics; missing members and unenumerated nodes remain explicit.',
        attribution='OSM data copyright OpenStreetMap contributors, ODbL')
