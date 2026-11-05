"""Freeze supported raw segment weights without emitting a route or adopting access."""
import argparse
import hashlib
import json
from road_reference_scenario import ROOT, digest, load
from road_reference_way_permissions import DEFAULTS
from road_reference_segment_costs import project as weights, POLICY_PATH, policy, sha
from reference_via_node_checkpoint import project as turn_project, REFERENCE as TURN_REFERENCE

REFERENCE = ROOT / 'docs/research/reference-segment-costs'
RAW = ROOT / 'docs/research/fort-collins-entry-context/raw-osm-context.json'
SELECTED = (696728762, 696728763, 696728766, 815164359, 1475543490)


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def project():
    parent_path = TURN_REFERENCE / 'report.json'
    parent = turn_project()
    if parent != json.loads(parent_path.read_text()):
        raise ValueError('Exact frozen turn compiler checkpoint required')
    raw = json.loads(RAW.read_text()); results = {}
    for wid in SELECTED:
        way = next(w for w in raw['ways'] if w['id'] == wid)
        ids = {row[0] for row in way['nodes']}
        nodes = [n for n in raw['nodes'] if n['id'] in ids]
        result = weights(way, nodes, default_policy=DEFAULTS)
        expected = 'unsupported' if wid == 815164359 else 'supported_segment_weights'
        if result['status'] != expected:
            raise ValueError('Review changed supported source-weight scope')
        results[str(wid)] = result
    by_arc = {arc['id']: arc for result in results.values() for arc in result['arcs'] or []}
    selected = parent['reference_compilation']['declared_arc_sequence']
    if not set(selected) <= set(by_arc):
        raise ValueError('Exact declared maneuver segments must retain compatible weighted identities')
    return dict(schema='reference-segment-cost-checkpoint-v1', raw_context_sha256=file_sha(RAW),
        directed_turn_report_sha256=file_sha(parent_path), scenario_sha256=digest(load()),
        cost_policy_file_sha256=file_sha(POLICY_PATH), cost_policy_sha256=sha(policy()),
        implementation_sha256={name: file_sha(ROOT / 'scripts' / name) for name in
            ('road_reference_segment_costs.py', 'reference_segment_cost_checkpoint.py',
             'road_reference_segment_permissions.py', 'road_reference_way_permissions.py',
             'road_reference_conditionals.py', 'road_reference_scenario.py')},
        selected_raw_way_results=results, weighted_directed_segments=len(by_arc),
        declared_turn_weighted_arc_ids=selected, route_cost_emitted=False,
        complete_geographic_graph_constructed=False, global_speed_ceiling_certified=False,
        access_verified=False, anchors_adopted=False, release_eligible=False,
        warning='Bounded segment weights only. Supplied numeric speed limits and explicit highway model defaults are not traffic estimates or independently verified operating speeds. No route, anchor/connector cost, approval, exterior closure or geographic layer is emitted. Unsupported bollard context remains unsupported.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write', action='store_true'); args = parser.parse_args()
    result = project(); path = REFERENCE / 'report.json'
    if args.write:
        path.write_text(json.dumps(result, indent=2, sort_keys=True) + '\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Frozen reference segment-cost checkpoint differs')
    print(dict(weighted_directed_segments=result['weighted_directed_segments'],
        unsupported_raw_way=815164359, compatible_turn_segments=result['declared_turn_weighted_arc_ids'],
        route_cost_emitted=False, access_verified=False))
