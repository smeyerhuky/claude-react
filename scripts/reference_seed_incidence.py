"""Enumerate exact-source ways incident to the frozen kernel's eight seed nodes."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium

ROOT = Path(__file__).resolve().parents[1]
RAW = ROOT/'docs/research/fort-collins-entry-context/raw-osm-context.json'
PARENT = ROOT/'docs/research/reference-declared-graph/report.json'


def need(value, reason):
    if not value:
        raise ValueError(reason)


def sha(value):
    return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()


def seed_context():
    raw = json.loads(RAW.read_text()); parent = json.loads(PARENT.read_text())
    need(hashlib.sha256(RAW.read_bytes()).hexdigest() == parent['raw_context_sha256'], 'Exact frozen raw source context required')
    member_ids = set(parent['original_member_way_ids'])
    seeds = {row[0] for way in raw['ways'] if way['id'] in member_ids for row in way['nodes']}
    need(len(member_ids) == 2 and len(seeds) == 8, 'Review changed frozen member/seed scope')
    return raw, seeds


def extract(source):
    source = Path(source); raw, seeds = seed_context(); identity = raw['source']
    def verify():
        need(source.stat().st_size == identity['size_bytes'], 'Exact original Colorado source size required')
        with source.open('rb') as handle:
            need(hashlib.file_digest(handle,'sha256').hexdigest() == identity['sha256'], 'Exact original Colorado source hash required')
    verify()
    class Ways(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.rows = {}; self.refs = set()
        def way(self, way):
            # Enumerate ALL ways touching a seed, including non-highway ways.
            # A box, access filter or model-class filter cannot conceal one.
            if not any(node.ref in seeds for node in way.nodes):
                return
            need(way.id not in self.rows and len(self.rows) < 100 and 2 <= len(way.nodes) <= 1000
                 and all(n.location.valid() for n in way.nodes), 'Incident-way geometry/identity budget exceeded; never truncate')
            self.refs.update(n.ref for n in way.nodes)
            need(len(self.refs) <= 2000, 'Complete incident member-node budget exceeded')
            self.rows[way.id] = dict(id=way.id,version=way.version,timestamp=str(way.timestamp),
                tags=dict(way.tags),nodes=[[n.ref,n.location.lon,n.location.lat] for n in way.nodes])
    ways = Ways(); ways.apply_file(str(source),locations=True,idx='flex_mem'); verify()
    need(seeds <= ways.refs, 'Every frozen seed must occur in the enumerated original-source ways')
    class Context(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.nodes = {}; self.relations = {}
        def node(self, node):
            if node.id not in ways.refs:
                return
            need(node.id not in self.nodes and node.location.valid(), 'Complete member-node identity/geometry required')
            self.nodes[node.id] = dict(id=node.id,version=node.version,timestamp=str(node.timestamp),
                lonlat=[node.location.lon,node.location.lat],tags=dict(node.tags))
        def relation(self, relation):
            tags = dict(relation.tags)
            control = tags.get('type') == 'restriction' or any(k == 'restriction' or k.startswith('restriction:') for k in tags)
            if not control or not any(m.type == 'w' and m.ref in ways.rows for m in relation.members):
                return
            need(relation.id not in self.relations and len(self.relations) < 100 and len(relation.members) <= 32,
                 'Touching restriction-namespace budget exceeded; never truncate')
            self.relations[relation.id] = dict(id=relation.id,version=relation.version,timestamp=str(relation.timestamp),
                tags=tags,members=[dict(type=m.type,ref=m.ref,role=m.role) for m in relation.members])
    context = Context(); context.apply_file(str(source)); verify()
    need(set(context.nodes) == ways.refs, 'Every incident member vertex requires its complete raw node')
    for way in ways.rows.values():
        for nid, lon, lat in way['nodes']:
            need(context.nodes[nid]['lonlat'] == [lon,lat], 'Raw node/member-way geometry mismatch')
    return dict(schema='reference-seed-source-incidence-v1',source_sha256=identity['sha256'],
        raw_context_sha256=hashlib.sha256(RAW.read_bytes()).hexdigest(),
        kernel_report_sha256=hashlib.sha256(PARENT.read_bytes()).hexdigest(),seed_node_ids=sorted(seeds),
        all_source_way_ids_at_seed_nodes={str(nid):sorted(wid for wid,way in ways.rows.items()
            if any(row[0] == nid for row in way['nodes'])) for nid in sorted(seeds)},
        complete_way_record_sha256={str(wid):sha(way) for wid,way in sorted(ways.rows.items())},
        complete_node_record_sha256={str(nid):sha(node) for nid,node in sorted(context.nodes.items())},
        touching_restriction_namespace_record_sha256={str(rid):sha(row) for rid,row in sorted(context.relations.items())},
        unenumerated_new_member_node_ids=sorted(ways.refs-seeds),
        seed_incidence_enumerated_in_original_source=True, all_graph_node_incidence_enumerated=False,
        exterior_closure_verified=False, geographic_coverage_certified=False,
        connector_costs_included=False, access_verified=False, anchors_adopted=False, release_eligible=False,
        scope='All original-PBF way memberships at the eight named seed IDs only, without geographic/highway/access filtering. Every returned member way/node record and touching type=restriction or restriction-namespace relation is hashed in full. Other member-node incidence, crossing roads without a shared seed ID, untagged/other relation semantics, real-world connectivity, grade/access and exterior closure are not established.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm',type=Path,required=True); parser.add_argument('--output',type=Path,required=True)
    args = parser.parse_args(); result = extract(args.osm)
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(dict(seed_nodes=len(result['seed_node_ids']),incident_ways=len(result['complete_way_record_sha256']),
        complete_member_nodes=len(result['complete_node_record_sha256']),
        touching_restriction_namespace_relations=len(result['touching_restriction_namespace_record_sha256']),
        unenumerated_new_nodes=len(result['unenumerated_new_member_node_ids']),access_verified=False))
