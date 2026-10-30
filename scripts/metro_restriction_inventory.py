"""Bounded raw restriction-relation inventory from exact retained state snapshots.

This does not determine car applicability, compile turns or certify access/coverage.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import osmium

ROOT = Path(__file__).resolve().parents[1]
BASELINE = ROOT/'docs/research/census-33-source-checkpoint/baseline.json'
STATES = ('colorado', 'new-mexico', 'arizona', 'utah', 'oklahoma')
KINDS = {'no_left_turn', 'no_right_turn', 'no_straight_on', 'no_u_turn',
         'only_left_turn', 'only_right_turn', 'only_straight_on', 'only_u_turn'}
MAX_RELATIONS = 100_000
MAX_MEMBERS = 100
REFERENCE = ROOT/'docs/research/state-restriction-inventory'


def require(value, message):
    if not value: raise ValueError(message)


def flags(row):
    tags = row['tags']; members = row['members']
    return dict(via_way=any(m['role'] == 'via' and m['type'] == 'w' for m in members),
                conditional_key=any('conditional' in key for key in tags),
                exception_key='except' in tags,
                missing_generic_kind='restriction' not in tags,
                generic_kind_outside_via_node_probe='restriction' in tags and tags['restriction'] not in KINDS)


def summarize(rows):
    require(len(rows) <= MAX_RELATIONS, 'Restriction inventory budget exceeded')
    ids = [r['id'] for r in rows]
    require(len(ids) == len(set(ids)) and all(type(i) is int and i > 0 for i in ids), 'Unique positive relation IDs required')
    kinds = Counter(); counts = Counter(); samples = {}
    for row in sorted(rows, key=lambda r: r['id']):
        require(row['tags'].get('type') == 'restriction' and len(row['members']) <= MAX_MEMBERS,
                'Bounded explicit raw restriction relation required')
        kinds[row['tags'].get('restriction', '<missing>')] += 1
        for key, present in flags(row).items():
            if present:
                counts[key] += 1
                sample = samples.setdefault(key, [])
                if len(sample) < 3: sample.append(row)
    encoded = json.dumps(sorted(rows, key=lambda r: r['id']), sort_keys=True, separators=(',', ':')).encode()
    return dict(raw_restriction_relation_count=len(rows), generic_kind_counts=dict(sorted(kinds.items())),
                overlapping_flag_counts={k: counts[k] for k in flags(dict(tags={}, members=[]))},
                example_relations=samples, all_selected_relation_projection_sha256=hashlib.sha256(encoded).hexdigest(),
                sample_policy='First three ascending relation IDs per diagnostic flag; examples are not the complete relation inventory')


class Reader(osmium.SimpleHandler):
    def __init__(self):
        super().__init__(); self.rows = []

    def relation(self, relation):
        if relation.tags.get('type') != 'restriction': return
        require(len(self.rows) < MAX_RELATIONS and len(relation.members) <= MAX_MEMBERS,
                'Raw restriction input budget exceeded; do not truncate')
        self.rows.append(dict(id=relation.id, tags=dict(relation.tags),
                             members=[dict(type=m.type, ref=m.ref, role=m.role) for m in relation.members]))


def verify_source(path, identity):
    require(path.is_file() and path.stat().st_size == identity['size_bytes'], 'Exact original state source size required')
    with path.open('rb') as handle: digest = hashlib.file_digest(handle, 'sha256').hexdigest()
    require(digest == identity['sha256'], 'Exact original state source hash required')


def inventory(osm_dir):
    baseline_bytes = BASELINE.read_bytes(); baseline = json.loads(baseline_bytes)
    by_name = {s['name']: s for s in baseline['source_provenance']}
    results = []
    for state in STATES:
        name = state+'.osm.pbf'; identity = by_name[name]; path = osm_dir/name
        verify_source(path, identity)
        reader = Reader(); reader.apply_file(str(path))
        verify_source(path, identity)
        results.append(dict(state=state, source=identity, **summarize(reader.rows)))
    return dict(schema='raw-state-restriction-inventory-v1', states=results,
                baseline_sha256=hashlib.sha256(baseline_bytes).hexdigest(),
                selection='Every relation whose type tag equals restriction in each exact declared source; no highway or vehicle-mode filter',
                query_semantics='Raw overlapping syntax diagnostics only; not applicable-car turn counts or supported graph transitions',
                turn_support_certified=False, geographic_coverage_certified=False,
                access_verified=False, release_eligible=False,
                warning='Does not inventory node/way access tags, all temporal controls, missing relations or real-world restrictions. Counted relations may not apply to ordinary private cars. Via-node shape alone does not establish an unambiguous directed approach. Existing node-only routing and all costs remain unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--osm-dir', type=Path, required=True)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--compare', type=Path)
    args = parser.parse_args(); result = inventory(args.osm_dir)
    if args.output: args.output.write_text(json.dumps(result, sort_keys=True, indent=2)+'\n')
    if args.compare: require(json.loads(args.compare.read_text()) == result, 'Retained raw restriction inventory differs')
    print(json.dumps([dict(state=r['state'], raw_relations=r['raw_restriction_relation_count'],
                           **r['overlapping_flag_counts']) for r in result['states']], indent=2))
