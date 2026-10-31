"""Retain bounded Civic Center garage/street context from the exact original PBF."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium

ROOT = Path(__file__).resolve().parents[1]
BOUNDS = [-105.0795, 40.5874, -105.0776, 40.5892]
GARAGE_WAY = 54882910


def extract(source):
    source = Path(source)
    identity = next(s for s in json.loads((ROOT / 'docs/research/census-33-source-checkpoint/baseline.json').read_text())['source_provenance']
                    if s['name'] == 'colorado.osm.pbf')
    def verify():
        if source.stat().st_size != identity['size_bytes']:
            raise ValueError('Exact original Colorado source size required')
        with source.open('rb') as handle:
            if hashlib.file_digest(handle, 'sha256').hexdigest() != identity['sha256']:
                raise ValueError('Exact original Colorado source hash required')
    def inside(x, y):
        return BOUNDS[0] <= x <= BOUNDS[2] and BOUNDS[1] <= y <= BOUNDS[3]
    verify()
    class Ways(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.rows = {}; self.references = 0
        def way(self, way):
            if way.id != GARAGE_WAY and not way.tags.get('highway'):
                return
            if not any(n.location.valid() and inside(n.location.lon, n.location.lat) for n in way.nodes):
                return
            if (way.id in self.rows or not 2 <= len(way.nodes) <= 1000
                    or any(not n.location.valid() for n in way.nodes)):
                raise ValueError('Missing, duplicate or budget-exceeding complete raw way geometry')
            self.references += len(way.nodes)
            if len(self.rows) >= 1000 or self.references > 20000:
                raise ValueError('Bounded local context exceeded; never truncate')
            self.rows[way.id] = dict(id=way.id, version=way.version, timestamp=str(way.timestamp),
                tags=dict(way.tags), nodes=[[n.ref, n.location.lon, n.location.lat] for n in way.nodes])
    ways = Ways(); ways.apply_file(str(source), locations=True, idx='flex_mem')
    if GARAGE_WAY not in ways.rows:
        raise ValueError('Named raw garage footprint missing')
    wanted = {row[0] for way in ways.rows.values() for row in way['nodes']}
    class NodesAndRelations(osmium.SimpleHandler):
        def __init__(self):
            super().__init__(); self.nodes = {}; self.local = {}; self.relations = {}
        def node(self, node):
            member = node.id in wanted
            local = node.location.valid() and inside(node.location.lon, node.location.lat) and len(node.tags) > 0
            if not member and not local:
                return
            if not node.location.valid():
                raise ValueError('Complete raw member-node location required')
            target = self.nodes if member else self.local
            if node.id in target or (not member and len(self.local) >= 1000):
                raise ValueError('Duplicate node or local tagged-node budget exceeded')
            target[node.id] = dict(id=node.id, version=node.version, timestamp=str(node.timestamp),
                lonlat=[node.location.lon, node.location.lat], tags=dict(node.tags))
        def relation(self, relation):
            if relation.tags.get('type') != 'restriction' or not any(m.type == 'w' and m.ref in ways.rows for m in relation.members):
                return
            if relation.id in self.relations or len(self.relations) >= 100 or len(relation.members) > 32:
                raise ValueError('Restriction context duplicate or budget exceeded')
            self.relations[relation.id] = dict(id=relation.id, version=relation.version, timestamp=str(relation.timestamp),
                tags=dict(relation.tags), members=[dict(type=m.type, ref=m.ref, role=m.role) for m in relation.members])
    reader = NodesAndRelations(); reader.apply_file(str(source)); verify()
    if set(reader.nodes) != wanted:
        raise ValueError('Every selected way vertex must have a complete raw node record')
    for way in ways.rows.values():
        for nid, lon, lat in way['nodes']:
            if reader.nodes[nid]['lonlat'] != [lon, lat]:
                raise ValueError('Raw node and selected-way geometry mismatch')
    return dict(schema='fort-collins-unadopted-raw-context-v1', source=identity,
        bounds_lonlat=BOUNDS, garage_footprint_way=GARAGE_WAY,
        ways=sorted(ways.rows.values(), key=lambda x: x['id']),
        nodes=sorted(reader.nodes.values(), key=lambda x: x['id']),
        nearby_tagged_nodes=sorted(reader.local.values(), key=lambda x: x['id']),
        restrictions=sorted(reader.relations.values(), key=lambda x: x['id']),
        selection='All highway ways with a vertex in the declared investigation envelope, plus the named garage footprint; complete geometry and every member-node raw tag record. Additional tagged local nodes and restrictions touching selected ways are context only. Crossing ways with no local vertex, complete incident-way sets and exterior closure are not established.',
        attribution='OSM data copyright OpenStreetMap contributors, ODbL',
        anchor_adopted=False, connector_costs_included=False, access_verified=False,
        datum_alignment_verified=False, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = extract(args.osm)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    print({k: len(result[k]) for k in ('ways', 'nodes', 'nearby_tagged_nodes', 'restrictions')})
