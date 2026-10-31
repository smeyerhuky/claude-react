"""Replay exact raw-way permission projections without emitting routing costs."""
import argparse
import hashlib
import json
from pathlib import Path
from road_reference_way_permissions import evaluate, DEFAULTS
from road_reference_scenario import load, digest

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT / 'docs/research/reference-way-permissions'
CODE = ('road_reference_way_permissions.py', 'reference_way_node_context.py',
        'reference_way_permission_checkpoint.py', 'via_way_raw_context.py',
        'road_reference_conditionals.py', 'road_reference_scenario.py')


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project(reference=REFERENCE):
    reference = Path(reference)
    baseline = ROOT / 'docs/research/census-33-source-checkpoint/baseline.json'
    sources = {s['name']: s for s in json.loads(baseline.read_text())['source_provenance']}
    scenario = load()
    states = {}
    for state in ('colorado', 'arizona'):
        path = reference / (state + '-context.json')
        context = json.loads(path.read_text())
        original = ROOT / f'docs/research/raw-via-way-compiler/{state}-context.json'
        previous = json.loads(original.read_text())
        if (context.get('schema') != 'complete-member-node-context-v1'
                or context['source'] != sources[state + '.osm.pbf']
                or any(context.get(k) is not False for k in ('access_verified', 'anchor_adopted', 'release_eligible'))
                or context['ways'] != previous['ways'] or context['restrictions'] != previous['restrictions']):
            raise ValueError('Exact original unadopted source and member-way/restriction records required')
        all_ids = {row[0] for way in context['ways'] for row in way['nodes']}
        if (len(context['nodes']) != len(all_ids) or {n['id'] for n in context['nodes']} != all_ids):
            raise ValueError('Exactly one complete node record for every raw member-way vertex required')
        results = []
        for way in context['ways']:
            ids = {row[0] for row in way['nodes']}
            nodes = [n for n in context['nodes'] if n['id'] in ids]
            # Only this retained Arizona way has a relevant weekly condition.
            # This is an explicit test declaration, never verified geographic assignment.
            zones = {f'way:{way["id"]}': 'America/Phoenix'} if way['id'] == 437327483 else {}
            result = evaluate(way, nodes, default_policy=DEFAULTS, scenario=scenario, feature_zones=zones)
            expected_status = 'supported_tag_projection' if state == 'colorado' else 'unsupported'
            if result['status'] != expected_status or result['eligible_directions'] != (['forward'] if state == 'colorado' else []):
                raise ValueError('Review changed bounded raw-way projection; no automatic approval')
            results.append(dict(way_id=way['id'], supplied_node_ids=sorted(ids),
                                declared_feature_zones=zones, projection=result))
        states[state] = dict(source=context['source'], context_sha256=sha(path),
                             original_member_context_sha256=sha(original),
                             complete_vertex_nodes=len(all_ids), results=results)
    return dict(schema='reference-way-permission-checkpoint-v1', scenario_sha256=digest(scenario),
                baseline_sha256=sha(baseline),
                implementation_sha256={name: sha(ROOT / 'scripts' / name) for name in CODE},
                default_policy=DEFAULTS, states=states,
                supported_way_projections=3, unsupported_way_projections=4,
                route_cost_emitted=False, access_verified=False, anchors_adopted=False,
                geographic_coverage_certified=False, release_eligible=False,
                warning='Raw-tag permission composition only. Whole-way traversal is distinct from partial-way reachability. No lane/turn/speed routing, full incident-way context, geographic timezone proof, connector approval or real-world access claim. Original static graph costs remain unevaluated under the fixed-time scenario.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true')
    args = parser.parse_args()
    result = project()
    path = REFERENCE / 'report.json'
    if args.write:
        path.write_text(json.dumps(result, sort_keys=True, indent=2) + '\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Retained permission checkpoint differs')
    print(json.dumps({k: result[k] for k in ('supported_way_projections', 'unsupported_way_projections',
                                           'route_cost_emitted', 'access_verified', 'release_eligible')}))
