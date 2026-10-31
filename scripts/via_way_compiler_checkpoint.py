"""Replay one strict raw via-way chain and one rejected conditional member-way case."""
import argparse
import hashlib
import json
from pathlib import Path
from road_via_way_compile import compile_relation,UnsupportedViaWay
from road_maneuver_probe import solve
from tucson_turn_probe import graph
from via_way_raw_context import BASELINE

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/raw-via-way-compiler'


def project(reference=REFERENCE):
    reference=Path(reference)
    contexts={state:json.loads((reference/(state+'-context.json')).read_text()) for state in ('colorado','arizona')}
    sources={s['name']:s for s in json.loads(BASELINE.read_text())['source_provenance']}
    for state,context in contexts.items():
        if (context['schema']!='declared-via-way-raw-context-v1'
                or context['source']!=sources[state+'.osm.pbf']
                or any(context.get(k) is not False for k in ('access_verified','anchor_adopted','release_eligible'))):
            raise ValueError('Exact unadopted raw source identity/context required')
    positive=contexts['colorado'];nodes,arcs=graph(positive)
    pattern=compile_relation(positive['restrictions'][0],positive['ways'],arcs)
    expected=['800937106:0:0','186839303:0:0','800937105:0:0']
    if pattern['arc_sequence']!=expected:raise ValueError('Declared raw via-way pattern changed')
    by_id={a['id']:a for a in arcs};source=by_id[expected[0]]['from'];target=by_id[expected[-1]]['to']
    comparisons=[]
    for metric in ('length','travel_time'):
        for u,v in ((source,target),(target,source)):
            with_rule=solve(nodes,arcs,[pattern],u,v,metric);without_rule=solve(nodes,arcs,[],u,v,metric)
            comparisons.append(dict(metric=metric,source=u,target=v,with_declared_rule=with_rule,without_rule=without_rule))
    if comparisons[0]['with_declared_rule']['cost'] is not None or comparisons[0]['without_rule']['cost'] is None:
        raise ValueError('Expected declared-chain prohibition differs')
    negative=contexts['arizona'];_,negative_arcs=graph(negative)
    try:compile_relation(negative['restrictions'][0],negative['ways'],negative_arcs)
    except UnsupportedViaWay as error:reason=str(error)
    else:raise ValueError('Unmodeled conditional member way must reject rather than emit a path')
    if reason!='Conditional member-way controls require a separately reviewed temporal profile':
        raise ValueError('Review changed conditional member-way rejection')
    return dict(schema='raw-via-way-compiler-checkpoint-v1',
                context_sha256={s:hashlib.sha256((reference/(s+'-context.json')).read_bytes()).hexdigest() for s in contexts},
                positive=dict(relation_id=2516794,compiled_pattern=pattern,nodes=len(nodes),arcs=len(arcs),comparisons=comparisons),
                negative=dict(relation_id=2451750,rejected=True,reason=reason,route_cost_emitted=False),
                access_verified=False,anchors_adopted=False,geographic_coverage_certified=False,release_eligible=False,
                warning='Raw-source topology regression only; not independently audited real-world routing truth. Colorado chain NoData is local declared-graph exclusion, never real-world inaccessibility. No connectors or anchors included.')


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--write',action='store_true');a=p.parse_args();result=project()
    path=REFERENCE/'report.json'
    if a.write:path.write_text(json.dumps(result,sort_keys=True,indent=2)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Retained raw via-way checkpoint differs')
    print(json.dumps(dict(positive_relation_id=2516794,negative_relation_id=2451750,
                          negative_reason=result['negative']['reason'],release_eligible=False),indent=2))
