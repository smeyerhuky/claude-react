"""Compare bounded Tucson declared-graph paths with/without one raw OSM turn rule."""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path
from road_turn_aware_probe import solve
from stream_osm_roads import SPEED_KPH, direction_flags, meters
from metro_scenario_checkpoint import require

ROOT = Path(__file__).resolve().parents[1]
REFERENCE = ROOT/'docs/research/tucson-urban-entry-context'


def graph(context):
    nodes = set(); arcs = []
    for way in context['ways']:
        tags = way['tags']
        if tags.get('highway') not in SPEED_KPH or any(tags.get(k) in ('no', 'private') for k in ('access', 'motor_vehicle', 'motorcar')):
            continue
        directions = direction_flags(tags)
        require(directions is not None, 'Unsupported static road direction in local context')
        speed = SPEED_KPH[tags['highway']]
        posted = tags.get('maxspeed', '').strip().lower(); part = posted.split(' ')[0] if posted else ''
        if part.isdecimal(): speed = max(5, min(140, int(part)*(1.609344 if 'mph' in posted else 1)))
        for index, (a, b) in enumerate(zip(way['nodes'], way['nodes'][1:])):
            length = meters(a[1:], b[1:]); time = length/(speed/3.6)
            for forward, allowed in enumerate(directions):
                if not allowed: continue
                u, v = (a[0], b[0]) if forward == 0 else (b[0], a[0])
                nodes.update((u, v)); arcs.append(dict(id=f"{way['id']}:{index}:{forward}", way=way['id'],
                                                     **{'from': u, 'to': v}, length=length, travel_time=time))
    return sorted(nodes), arcs


def project(context):
    require(context['source_sha256'] == '77dc176e64538b08fb837f5c3515bea3956c2d9a037089aa6a958b405aba76a9'
            and context['access_verified'] is False and context['anchor_adopted'] is False,
            'Exact unadopted original-source context required')
    nodes, arcs = graph(context)
    # Retained raw relation 18843106 forbids this unique 6th Avenue approach
    # onto the named Pennington segment. Endpoints are road nodes only.
    rules = context['restrictions']; require(len(rules) == 1 and rules[0]['id'] == 18843106, 'Review changed local restriction inventory')
    incoming = [a for a in arcs if a['way'] == 236722007 and a['to'] == 175311383]
    outgoing = [a for a in arcs if a['way'] == 34617543 and a['from'] == 175311383]
    require(len(incoming) == len(outgoing) == 1, 'Unique declared approach and departure required')
    source, target = incoming[0]['from'], outgoing[0]['to']; comparisons = []
    for metric in ('length', 'travel_time'):
        for u, v in ((source, target), (target, source)):
            with_turns = solve(nodes, arcs, rules, u, v, metric)
            without_turns = solve(nodes, arcs, [], u, v, metric)
            for result in (with_turns, without_turns):
                if result['cost'] is not None:
                    by_id = {a['id']: a for a in arcs}
                    exact = sum((Fraction(by_id[aid][metric]) for aid in result['arc_path']), Fraction(0))
                    require(exact == Fraction(*map(int, result['exact_stored_path_cost'])), 'Stored raw arc replay differs')
            require(with_turns['cost'] is None or without_turns['cost'] is not None, 'Restriction cannot introduce a route')
            if with_turns['cost'] is not None:
                require(Fraction(*map(int, with_turns['exact_stored_path_cost'])) >= Fraction(*map(int, without_turns['exact_stored_path_cost'])), 'A restriction cannot reduce the exact declared-graph optimum')
            comparisons.append(dict(metric=metric, source=u, target=v, with_declared_turn_rule=with_turns,
                                    without_turn_rule=without_turns, prohibited_arc_pair=[incoming[0]['id'], outgoing[0]['id']]))
    return dict(schema='tucson-local-turn-probe-v1', nodes=len(nodes), directed_arcs=len(arcs), comparisons=comparisons,
                metric_units=dict(length='meters', travel_time='seconds'),
                scope='Declared bounded local context only; no exterior closure or geographic optimum claim',
                road_eligibility='Inherited static-passenger-car-v2 research predicate and speed rules; not physical/legal certification',
                anchor_adopted=False, connector_costs_included=False, access_certified=False, release_eligible=False,
                warning='Municipal point is not a chosen graph endpoint. This probe does not fix or replace the retained Census-origin scenario or establish a vehicle route to a garage. Initial road-node approach is unconstrained.')


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__); p.add_argument('--output', type=Path); p.add_argument('--compare', type=Path)
    a = p.parse_args(); result = project(json.loads((REFERENCE/'osm-context.json').read_text()))
    if a.compare: require(json.loads(a.compare.read_text()) == result, 'Retained local turn probe differs')
    if a.output: a.output.write_text(json.dumps(result, sort_keys=True, indent=2)+'\n')
    print(json.dumps([{k: c[k] for k in ('source','target','metric')} | dict(with_turn_rule=c['with_declared_turn_rule']['cost'], without_turn_rule=c['without_turn_rule']['cost']) for c in result['comparisons']], indent=2))
