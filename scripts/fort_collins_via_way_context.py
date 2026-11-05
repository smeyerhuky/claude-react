"""Capture complete original-source members/nodes for two named via-way controls."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium
from reference_seed_incidence import ROOT, RAW, need

CASES = {9680890: (186582632, 134584349, 290286621),
         9680891: (290286621, 6172542, 134584350)}


def extract(source):
    source = Path(source); identity = json.loads(RAW.read_text())['source']
    wanted_ways = {wid for members in CASES.values() for wid in members}
    def verify():
        need(source.stat().st_size == identity['size_bytes'], 'Exact original Colorado source size required')
        with source.open('rb') as handle:
            need(hashlib.file_digest(handle,'sha256').hexdigest() == identity['sha256'], 'Exact original Colorado source hash required')
    verify()
    class WaysAndRelations(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.ways = {}; self.relations = {}; self.nodes = set()
        def way(self, way):
            if way.id not in wanted_ways:
                return
            need(way.id not in self.ways and 2 <= len(way.nodes) <= 1000 and all(n.location.valid() for n in way.nodes),
                 'Complete unique bounded raw member-way geometry required')
            self.nodes.update(n.ref for n in way.nodes)
            need(len(self.nodes) <= 2000, 'Complete member-node budget exceeded; never truncate')
            self.ways[way.id] = dict(id=way.id,version=way.version,timestamp=str(way.timestamp),
                tags=dict(way.tags),nodes=[[n.ref,n.location.lon,n.location.lat] for n in way.nodes])
        def relation(self, relation):
            if relation.id not in CASES:
                return
            need(relation.id not in self.relations and len(relation.members) == 3, 'Exact unique complete named relation required')
            self.relations[relation.id] = dict(id=relation.id,version=relation.version,timestamp=str(relation.timestamp),
                tags=dict(relation.tags),members=[dict(type=m.type,ref=m.ref,role=m.role) for m in relation.members])
    reader = WaysAndRelations(); reader.apply_file(str(source),locations=True,idx='flex_mem'); verify()
    need(set(reader.ways) == wanted_ways and set(reader.relations) == set(CASES), 'Every named relation and member way required')
    for rid, chain in CASES.items():
        expected = [dict(type='w',ref=wid,role=role) for wid,role in zip(chain,('from','via','to'))]
        need(reader.relations[rid]['members'] == expected, 'Review changed named raw relation membership/order')
    class Nodes(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.rows = {}
        def node(self, node):
            if node.id not in reader.nodes:
                return
            need(node.id not in self.rows and node.location.valid(), 'Complete unique member-node geometry required')
            self.rows[node.id] = dict(id=node.id,version=node.version,timestamp=str(node.timestamp),
                lonlat=[node.location.lon,node.location.lat],tags=dict(node.tags))
    nodes = Nodes(); nodes.apply_file(str(source)); verify()
    need(set(nodes.rows) == reader.nodes, 'Every distinct raw member vertex needs its full node record')
    for way in reader.ways.values():
        for nid, lon, lat in way['nodes']:
            need(nodes.rows[nid]['lonlat'] == [lon,lat], 'Raw member/node coordinates disagree')
    return dict(schema='fort-collins-via-way-member-context-v1',source=identity,
        ways=sorted(reader.ways.values(),key=lambda row:row['id']),
        nodes=sorted(nodes.rows.values(),key=lambda row:row['id']),
        restrictions=sorted(reader.relations.values(),key=lambda row:row['id']),
        scope='Only the five complete member ways and every raw member vertex of two named source relations. No incident-road enumeration, neighborhood/exterior closure, physical turn geometry, grade/access approval, graph weights or route costs.',
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        attribution='OSM data copyright OpenStreetMap contributors, ODbL')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm',type=Path,required=True); parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args(); result = extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(ways=len(result['ways']),complete_member_nodes=len(result['nodes']),
               restrictions=len(result['restrictions']),access_verified=False))
