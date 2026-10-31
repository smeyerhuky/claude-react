"""Retain all node tags for exact member ways, never a geographic access proof."""
import argparse
import hashlib
import json
from pathlib import Path
import osmium
from via_way_raw_context import extract as extract_members

MAX_NODES = 10000


def extract(state, source):
    source = Path(source)
    base = extract_members(state, source)
    wanted = {row[0] for way in base['ways'] for row in way['nodes']}
    if len(wanted) > MAX_NODES:
        raise ValueError('Complete member-node context budget exceeded')

    class Reader(osmium.SimpleHandler):
        def __init__(self):
            super().__init__()
            self.nodes = {}

        def node(self, node):
            if node.id not in wanted:
                return
            if node.id in self.nodes or not node.location.valid():
                raise ValueError('Duplicate or missing raw member-node geometry')
            self.nodes[node.id] = dict(id=node.id, version=node.version, timestamp=str(node.timestamp),
                                      lonlat=[node.location.lon, node.location.lat], tags=dict(node.tags))

    reader = Reader()
    reader.apply_file(str(source))
    if set(reader.nodes) != wanted:
        raise ValueError('Every raw member-way vertex needs its complete node record')
    for way in base['ways']:
        for nid, lon, lat in way['nodes']:
            if reader.nodes[nid]['lonlat'] != [lon, lat]:
                raise ValueError('Raw node and way geometry disagree')
    with source.open('rb') as handle:
        if (source.stat().st_size != base['source']['size_bytes']
                or hashlib.file_digest(handle, 'sha256').hexdigest() != base['source']['sha256']):
            raise ValueError('Original source changed during node extraction')
    return dict(schema='complete-member-node-context-v1', source=base['source'],
                ways=base['ways'], nodes=sorted(reader.nodes.values(), key=lambda n: n['id']),
                restrictions=base['restrictions'],
                scope='Exact named member ways and EVERY vertex node with complete raw tags; no nearby ways, full incident-way set or geographic/exterior closure.',
                attribution='OSM data copyright OpenStreetMap contributors, ODbL',
                access_verified=False, anchor_adopted=False, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--state', choices=['colorado', 'arizona'], required=True)
    parser.add_argument('--osm', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    args = parser.parse_args()
    result = extract(args.state, args.osm)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    print(dict(state=args.state, ways=len(result['ways']), complete_vertex_nodes=len(result['nodes']), access_verified=False))
