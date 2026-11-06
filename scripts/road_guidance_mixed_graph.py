"""Compose every supplied original control before emitting a declared model graph."""
from road_reference_scenario import load,validate,digest
from road_reference_way_permissions import DEFAULTS
from road_guidance_segments import weights
from road_reference_segment_costs import policy
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule,MAX_VIA_WAYS
from reference_via_node_compile import metadata,need,canonical_sha
from road_maneuver_probe import compile_patterns,solve

MAX_WAYS=100
MAX_NODES=2000
MAX_RELATIONS=100
MAX_ARCS=4000


def compile_graph(ways,nodes,relations,*,default_policy,scenario=None,feature_zones=None,relation_zones=None):
    scenario=load() if scenario is None else scenario;validate(scenario)
    need(default_policy==DEFAULTS,'Explicit supported road-default policy required')
    result=dict(schema='static-guidance-declared-mixed-graph-v1',status='unsupported',graph=None,
        scenario_sha256=digest(scenario),input_sha256=None,declared_graph_compiled=False,
        complete_geographic_graph_constructed=False,all_incident_ways_accounted=False,
        other_relations_accounted=False,lane_indications_used_as_restrictions=False,
        lane_connectivity_evaluated=False,geographic_timezone_assignment_verified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='Only the complete supplied raw-way/node/control universe. Via-node controls use the static-guidance profile; static via-way controls use the stricter unchanged historical profile. Unknown supplied controls reject the entire bundle. No incident/exterior closure, physical access or geographic graph certification.')
    try:
        need(isinstance(ways,list) and 1<=len(ways)<=MAX_WAYS,'Bounded complete raw way list required')
        need(isinstance(nodes,list) and 1<=len(nodes)<=MAX_NODES,'Bounded complete raw node list required')
        need(isinstance(relations,list) and len(relations)<=MAX_RELATIONS,'Bounded complete supplied control list required')
        by_way={};wanted=set()
        for way in ways:
            metadata(way,{'id','nodes','tags'})
            need(way['id'] not in by_way and isinstance(way['nodes'],list) and 2<=len(way['nodes'])<=1000,'Unique bounded complete raw ways required')
            for row in way['nodes']:
                need(isinstance(row,list) and len(row)==3 and type(row[0]) is int and row[0]>0,'Raw vertex identities required')
                wanted.add(row[0])
            need(len(wanted)<=MAX_NODES,'Declared graph node budget exceeded')
            by_way[way['id']]=way
        by_node={}
        for node in nodes:
            metadata(node,{'id','lonlat','tags'})
            need(node['id'] in wanted and node['id'] not in by_node,'Foreign or duplicate raw node')
            by_node[node['id']]=node
        need(set(by_node)==wanted,'Missing complete member-node records')
        zones={} if feature_zones is None else feature_zones;rzones={} if relation_zones is None else relation_zones
        need(isinstance(zones,dict) and set(zones)<={*(f'way:{wid}' for wid in by_way),*(f'node:{nid}' for nid in wanted)},'Only declared feature zones allowed')
        need(isinstance(rzones,dict),'Explicit relation-zone dictionary required')
        arcs=[];by_arc={};projections={}
        for wid,way in by_way.items():
            ids={row[0] for row in way['nodes']};keys={f'way:{wid}',*(f'node:{nid}' for nid in ids)}
            value=weights(way,[by_node[nid] for nid in sorted(ids)],default_policy=default_policy,scenario=scenario,
                feature_zones={key:zones[key] for key in zones if key in keys})
            need(value['status']=='supported_segment_weights',f'Unsupported supplied raw way {wid}: {value.get("reason")}')
            projections[str(wid)]=canonical_sha(value)
            for arc in value['arcs']:
                need(arc['id'] not in by_arc and len(arcs)<MAX_ARCS,'Duplicate arc or arc budget exceeded')
                by_arc[arc['id']]=arc;arcs.append(arc)
        rids=set();compiled=[];patterns=[]
        for relation in relations:
            metadata(relation,{'id','tags','members'});rid=relation['id'];members=relation['members']
            need(rid not in rids,'Duplicate supplied raw control');rids.add(rid)
            need(isinstance(members,list) and 3<=len(members)<=MAX_VIA_WAYS+2 and all(
                isinstance(m,dict) and set(m)=={'type','ref','role'} and type(m['ref']) is int and m['ref']>0
                for m in members),'Complete bounded control membership required')
            via=[m['type'] for m in members if m['role']=='via']
            if via==['n']:compiler=node_rule
            else:
                need(via and all(kind=='w' for kind in via),'Mixed or missing via-member types unsupported');compiler=way_rule
            ids={m['ref'] for m in members if m['type']=='w'}
            need(ids<=set(by_way),'Control member way outside supplied universe')
            selected=[way for wid,way in by_way.items() if wid in ids]
            nids={p[0] for way in selected for p in way['nodes']};keys={*(f'way:{wid}' for wid in ids),*(f'node:{nid}' for nid in nids)}
            value=compiler(relation,selected,[by_node[nid] for nid in sorted(nids)],default_policy=default_policy,
                scenario=scenario,relation_zone=rzones.get(str(rid)),feature_zones={key:zones[key] for key in zones if key in keys})
            need(value['topology_compiled'],f'Unsupported supplied raw control {rid}: {value.get("reason")}')
            need(value['scenario_sha256']==digest(scenario) and set(value['declared_arc_sequence'])<=set(by_arc),
                'Every control must match the scenario and weighted raw arc universe')
            compiled.append(value)
            if value['active_pattern'] is not None:patterns.append(value['active_pattern'])
        need(set(rzones)<={str(rid) for rid in rids},'Only supplied control zones allowed')
        compile_patterns(patterns,by_arc)
        graph=dict(nodes=sorted(wanted),arcs=arcs,maneuvers=patterns,relation_compilations=compiled,
            supplied_raw_relation_ids=[r['id'] for r in relations],way_projection_sha256=projections,
            scenario_sha256=digest(scenario),cost_policy_sha256=canonical_sha(policy()),
            default_policy=default_policy,same_way_reversals='disallowed',source_approach='unconstrained-declared-node-start',
            lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,
            access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False)
        result.update(status='compiled_declared_guidance_graph',graph=graph,declared_graph_compiled=True,
            input_sha256=canonical_sha(dict(ways=ways,nodes=nodes,relations=relations,scenario_sha256=digest(scenario),
                feature_zones=zones,relation_zones=rzones,default_policy=default_policy)),graph_sha256=canonical_sha(graph))
    except (ValueError,TypeError) as error:result['reason']=str(error)
    return result


def query(ways,nodes,relations,source,target,metric='length',**kwargs):
    compiled=compile_graph(ways,nodes,relations,**kwargs)
    result=dict(schema='static-guidance-declared-mixed-query-v1',status='unsupported',compilation=compiled,
        result=None,route_cost_emitted=False,access_verified=False,geographic_coverage_certified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False)
    if compiled['graph'] is None:result['reason']=compiled['reason'];return result
    graph=compiled['graph']
    try:
        answer=solve(graph['nodes'],graph['arcs'],graph['maneuvers'],source,target,metric)
        result.update(status='solved_declared_guidance_graph',result=answer,route_cost_emitted=answer['cost'] is not None)
    except (ValueError,TypeError) as error:result['reason']=str(error)
    return result
