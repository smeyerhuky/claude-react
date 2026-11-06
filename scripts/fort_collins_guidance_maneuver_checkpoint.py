"""Audit ten declared controls and a focused two-way no-left-turn replay."""
import argparse
import copy
import json
from fort_collins_guidance_checkpoint import project as parent,REFERENCE as PARENT,file_sha
from fort_collins_control_checkpoint import CONTEXT,ROOT
from road_guidance_segments import weights
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from road_reference_segment_costs import project as historical_weights,POLICY_PATH
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from reference_via_node_compile import canonical_sha
from road_reference_scenario import load,digest
from road_maneuver_probe import solve

REFERENCE=ROOT/'docs/research/fort-collins-guidance-maneuvers'


def project():
    if parent()!=json.loads((PARENT/'report.json').read_text()):raise ValueError('Exact frozen static-guidance parent required')
    corpus=json.loads(CONTEXT.read_text());before=copy.deepcopy(corpus)
    ways={w['id']:w for w in corpus['ways']};nodes={n['id']:n for n in corpus['nodes']}
    projected={};supported=[];unknown=[];outside=[]
    for wid,way in sorted(ways.items()):
        ids={p[0] for p in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
        result=weights(way,local,default_policy=DEFAULTS);projected[wid]=result
        old=historical_weights(way,local,default_policy=DEFAULTS)
        if wid!=140486410:
            if result['status']!=old['status']:raise ValueError('Other weight classifications cannot change')
            if result['status']=='supported_segment_weights' and result['arcs']!=old['arcs']:raise ValueError('Other raw weights cannot change')
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        elif result['status']=='supported_segment_weights':supported.append(wid)
        else:unknown.append(wid)
    if len(supported)!=34 or len(outside)!=13 or unknown!=[815164359]:raise ValueError('Review changed source support')
    compiled={}
    for relation in corpus['control_relations']:
        ids={m['ref'] for m in relation['members'] if m['type']=='w'};localways=[ways[wid] for wid in sorted(ids)]
        nids={p[0] for w in localways for p in w['nodes']}
        via=[m['type'] for m in relation['members'] if m['role']=='via']
        compiler=node_rule if via==['n'] else way_rule
        result=compiler(relation,localways,[nodes[nid] for nid in sorted(nids)],default_policy=DEFAULTS,
            relation_zone='America/Denver' if relation['id']==20193102 else None)
        if not result['topology_compiled']:raise ValueError('Every retained declaration must compile individually: '+str(result.get('reason')))
        member_arcs={a['id'] for wid in ids for a in projected[wid]['arcs']}
        if not set(result['declared_arc_sequence'])<=member_arcs:raise ValueError('Every declared arc must have matching original-source weights')
        compiled[str(relation['id'])]=result
    lane=compiled['10475907'];expected=['raw:140486410:8:forward','raw:322900293:0:forward']
    if lane['declared_arc_sequence']!=expected or lane['active_pattern']['kind']!='no':raise ValueError('Retain the independent no-left-turn declaration')
    focused_ids=[140486410,322900293]
    arcs=[arc for wid in focused_ids for arc in projected[wid]['arcs']]
    nids=sorted({p[0] for wid in focused_ids for p in ways[wid]['nodes']})
    source=lane['transition'][0]['from'];target=lane['transition'][-1]['to'];replays={}
    for metric in ('length','travel_time'):
        negative=solve(nids,arcs,[],source,target,metric)
        restricted=solve(nids,arcs,[lane['active_pattern']],source,target,metric)
        if negative['arc_path']!=expected or restricted['cost'] is not None:raise ValueError('Independent no-left-turn must remove the declared two-way route')
        replays[metric]=dict(negative_control_with_restriction_intentionally_omitted=negative,
            complete_supplied_two_way_control_result=restricted)
    if corpus!=before:raise ValueError('Original records cannot be mutated')
    return dict(schema='fort-collins-guidance-maneuver-checkpoint-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),source_context_sha256=file_sha(CONTEXT),
        cost_policy_sha256=file_sha(POLICY_PATH),implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('road_guidance_segments.py','guidance_via_node_compile.py','fort_collins_guidance_maneuver_checkpoint.py',
             'road_guidance_way_permissions.py','road_static_lane_guidance.py','road_reference_segment_costs.py',
             'reference_via_way_compile.py','road_reference_turn_rules.py','road_maneuver_probe.py','road_turn_aware_probe.py')},
        supported_weight_way_ids=supported,supported_directed_weights=sum(len(projected[wid]['arcs']) for wid in supported),
        outside_declared_road_class_ids=outside,unsupported_model_road_ids=unknown,
        way_weight_projections={str(wid):value for wid,value in projected.items()},
        individual_restriction_compilations=compiled,focused_way_ids=focused_ids,
        focused_nodes=nids,focused_arcs=arcs,focused_query=dict(source=source,target=target),focused_replays=replays,
        full_corpus_graph=None,full_corpus_query_result=None,unknown_controls_omitted=False,
        lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,
        all_graph_node_incidence_enumerated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Ten individual declarations compile from complete members; this is not full-graph composition. Via-node declarations use the static-guidance profile; static via-way declarations retain the unchanged strict historical profile, which still rejects lane-bearing members. The focused two-way universe tests the independent no-left-turn control; its omitted-rule negative control is never a permitted route claim. NoData means only this supplied universe, not real geographic disconnection. The unknown bollard blocks any full-corpus graph. No physical lane connectivity/access, geographic closure, anchors or public release is certified.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen guidance-maneuver checkpoint differs')
    print(dict(supported_ways=len(result['supported_weight_way_ids']),directed_weights=result['supported_directed_weights'],
        compiled_declarations=len(result['individual_restriction_compilations']),unknown=result['unsupported_model_road_ids'],full_corpus_graph=None))
