"""Account for a declared NO rule whose required raw direction is already denied.

This separate diagnostic never turns an unsupported strict graph into a graph.
It cannot discharge an ONLY rule or unknown member permission semantics.
"""
from guidance_via_node_compile import metadata,canonical_sha,need
from road_guidance_segments import project as segments
from road_reference_turn_rules import resolve
from road_reference_scenario import load,validate,digest
from road_reference_way_permissions import DEFAULTS
from road_turn_aware_probe import _positive_id


def audit(relation,ways,nodes,*,default_policy,scenario=None,relation_zone=None,feature_zones=None):
    scenario=load() if scenario is None else scenario;validate(scenario)
    need(default_policy==DEFAULTS,'Explicit supported direction-model policy required')
    selection=resolve(relation,zone=relation_zone,scenario=scenario)
    result=dict(schema='oneway-inert-no-prohibition-audit-v1',status='unsupported',selection=selection,
        scenario_sha256=digest(scenario),input_sha256=None,required_raw_transitions=None,oneway_denied_arc_ids=None,
        prohibition_inert_under_unchanged_member_directions=False,active_pattern=None,
        raw_relation_retained=True,strict_compiler_replaced=False,normal_graph_admitted=False,
        physical_or_legal_access_verified=False,anchors_adopted=False,release_eligible=False,
        scope='Only a currently applicable declared NO prohibition with complete endpoint topology and supported member permissions, where at least one required raw direction is already denied by the one-way model. No ONLY rules, unknown gate semantics, new geometry or permission changes are covered.')
    try:
        need(selection['status']=='resolved_relation_applicability' and selection['applies'] is True
             and isinstance(selection['selected_raw_value'],str) and selection['selected_raw_value'].startswith('no_'),
             'Applicable explicitly resolved NO prohibition required; never ONLY, inactive, exempt or unknown rules')
        roles={m['role']:m['ref'] for m in relation['members']}
        need(isinstance(ways,list) and len(ways)==2 and roles['from']!=roles['to'],'Two distinct complete member ways required')
        by_way={};wanted=set()
        for way in ways:
            metadata(way,{'id','nodes','tags'})
            need(way['id'] not in by_way and isinstance(way['nodes'],list) and 2<=len(way['nodes'])<=1000,'Unique bounded complete ways required')
            for p in way['nodes']:need(isinstance(p,list) and len(p)==3 and _positive_id(p[0]),'Explicit raw vertex triples required')
            wanted.update(p[0] for p in way['nodes']);by_way[way['id']]=way
        need(set(by_way)=={roles['from'],roles['to']},'Exact original member-way identities required')
        need(isinstance(nodes,list) and len(nodes)==len(wanted)<=2000,'Full bounded member-node context required')
        by_node={}
        for node in nodes:
            metadata(node,{'id','lonlat','tags'})
            need(node['id'] in wanted and node['id'] not in by_node,'Missing, duplicate or foreign node record')
            by_node[node['id']]=node
        need(set(by_node)==wanted,'Complete member-node records required')
        zones={} if feature_zones is None else feature_zones
        allowed={*(f'way:{wid}' for wid in by_way),*(f'node:{nid}' for nid in wanted)}
        need(isinstance(zones,dict) and set(zones)<=allowed,'Only explicit zones for supplied features allowed')
        projected={}
        for wid,w in by_way.items():
            ids={p[0] for p in w['nodes']};keys={f'way:{wid}',*(f'node:{n}' for n in ids)}
            value=segments(w,[by_node[n] for n in sorted(ids)],default_policy=default_policy,scenario=scenario,
                feature_zones={k:zones[k] for k in zones if k in keys})
            need(value['status']=='supported_segment_projection','Every complete member permission must be supported: '+str(value.get('reason')))
            projected[wid]=value
        transitions=[];denied=[];via=roles['via']
        for role in ('from','to'):
            wid=roles[role];points=by_way[wid]['nodes'];positions=[i for i,p in enumerate(points) if p[0]==via]
            need(len(positions)==1 and positions[0] in (0,len(points)-1),'One unambiguous raw endpoint per member required')
            start=positions[0]==0;index=0 if start else len(points)-2
            direction=('backward' if start else 'forward') if role=='from' else ('forward' if start else 'backward')
            permission=projected[wid]['segments'][index]['directions'][direction]
            aid=f'raw:{wid}:{index}:{direction}'
            transitions.append(dict(role=role,id=aid,way=wid,raw_segment_index=index,direction=direction,
                **{'from':permission['from_node'],'to':permission['to_node']},permission_projection=permission))
            if permission['oneway_allows'] is False:
                need(permission['modeled_permitted'] is False,'A one-way-denied raw direction cannot be permitted')
                denied.append(aid)
        need(transitions[0]['to']==via==transitions[1]['from'],'Exact original endpoint continuity required')
        need(denied,'At least one required raw direction must be explicitly one-way denied')
        result.update(status='inert_declared_no_prohibition',prohibition_inert_under_unchanged_member_directions=True,
            input_sha256=canonical_sha(dict(relation=relation,ways=ways,nodes=nodes,default_policy=default_policy,
                scenario=scenario,relation_zone=relation_zone,feature_zones=zones)),
            required_raw_transitions=transitions,oneway_denied_arc_ids=denied,
            member_permission_projection_sha256={str(wid):canonical_sha(v) for wid,v in projected.items()})
    except (ValueError,TypeError) as error:result['reason']=str(error)
    return result
