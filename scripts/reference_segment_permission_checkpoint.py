"""Bind exact segment projections to the audited complete-node parent checkpoint."""
import argparse
import hashlib
import json
from pathlib import Path
from reference_way_permission_checkpoint import project as parent_project, REFERENCE as PARENT, ROOT
from road_reference_segment_permissions import project as segments
from road_reference_way_permissions import DEFAULTS

REFERENCE = ROOT / 'docs/research/reference-segment-permissions'


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project():
    parent = parent_project()
    if json.loads((PARENT / 'report.json').read_text()) != parent:
        raise ValueError('Exact audited complete-node parent checkpoint required')
    records = []
    for state in ('colorado', 'arizona'):
        context = json.loads((PARENT / (state + '-context.json')).read_text())
        for row in parent['states'][state]['results']:
            way = next(w for w in context['ways'] if w['id'] == row['way_id'])
            nodes = [n for n in context['nodes'] if n['id'] in row['supplied_node_ids']]
            projection = segments(way, nodes, default_policy=DEFAULTS,
                                  feature_zones=row['declared_feature_zones'])
            if state == 'colorado':
                if (projection['status'] != 'supported_segment_projection'
                        or projection['eligible_directed_segments'] != 1
                        or projection['denied_directed_segments'] != 1):
                    raise ValueError('Declared Colorado single-segment direction changed')
            elif projection['status'] != 'unsupported' or projection['segments'] is not None:
                raise ValueError('Unsupported Arizona controls must not emit any segment permissions')
            records.append(dict(state=state, way_id=way['id'], projection=projection))
    return dict(schema='reference-segment-permission-checkpoint-v1',
                complete_node_parent_report_sha256=sha(PARENT / 'report.json'),
                parent_context_sha256={s: parent['states'][s]['context_sha256'] for s in parent['states']},
                scenario_sha256=parent['scenario_sha256'],
                implementation_sha256={name: sha(ROOT / 'scripts' / name) for name in
                    ('road_reference_segment_permissions.py', 'reference_segment_permission_checkpoint.py')},
                results=records, eligible_directed_segments=3, denied_directed_segments=3,
                unsupported_whole_way_contexts=4, route_cost_emitted=False,
                access_verified=False, anchors_adopted=False, geographic_coverage_certified=False,
                release_eligible=False,
                warning='Exact adjacent raw-segment permission regression, not routing/turn legality, real-world access, independently reviewed anchors, source coverage or adoption of the fixed scenario by legacy costs.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    result = project()
    path = REFERENCE / 'report.json'
    if args.write:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Retained raw-segment permission checkpoint differs')
    print(json.dumps({k: result[k] for k in ('eligible_directed_segments', 'denied_directed_segments',
                                           'unsupported_whole_way_contexts', 'route_cost_emitted', 'access_verified')}))
