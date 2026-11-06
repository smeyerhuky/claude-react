"""Audit the expanded source frontier and preserve its blocked road-model preflight."""
import argparse
import hashlib
import json
from fort_collins_road_frontier import ROOT,RAW,PARENT,seed_ids,MAX_WAYS,MAX_NODES
from reference_seed_incidence_checkpoint import project as seed_project,REFERENCE as SEED_REFERENCE
from reference_via_way_checkpoint import project as member_project,CONTEXT as MEMBER_CONTEXT,REFERENCE as MEMBER_REFERENCE
from reference_via_node_compile import metadata,canonical_sha,compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from road_reference_way_permissions import DEFAULTS,HIGHWAYS,evaluate
from road_reference_segment_costs import project as weights
from road_reference_mixed_graph import compile_graph
from road_reference_scenario import load,digest

REFERENCE=ROOT/'docs/research/fort-collins-road-frontier'
CONTEXT=REFERENCE/'source-context.json'
FALSE_FLAGS=('all_graph_node_incidence_enumerated','geographic_coverage_certified','exterior_closure_verified',
             'access_verified','anchors_adopted','connector_costs_included','release_eligible')


def need(value,reason):
    if not value:raise ValueError(reason)


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def index(rows,fields,maximum):
    need(isinstance(rows,list) and 1<=len(rows)<=maximum,'Bounded complete raw record list required')
    result={}
    for row in rows:
        metadata(row,fields)
        need(row['id'] not in result,'Duplicate raw record identity')
        result[row['id']]=row
    return result


def agree(target,rows):
    for rid,row in rows.items():
        need(rid not in target or target[rid]==row,'Conflicting full raw records across exact-source contexts')
        target[rid]=row


def project(frontier=None,member_context=None):
    parent_path=SEED_REFERENCE/'report.json';member_path=MEMBER_REFERENCE/'report.json'
    need(seed_project()==json.loads(parent_path.read_text()),'Exact frozen first-hop source report required')
    need(member_project()==json.loads(member_path.read_text()),'Exact frozen complete via-way member report required')
    frontier=json.loads(CONTEXT.read_text()) if frontier is None else frontier
    member_context=json.loads(MEMBER_CONTEXT.read_text()) if member_context is None else member_context
    need(member_project(member_context)==json.loads(member_path.read_text()),'Complete via-way members must retain their frozen record/permission bindings')
    expected_keys={'schema','source','parent_incidence_witness_sha256','seed_node_ids','all_source_way_ids_at_seed_nodes',
        'ways','nodes','restrictions','unenumerated_member_node_ids','seed_incidence_enumerated_in_original_source',
        'scope','attribution',*FALSE_FLAGS}
    need(isinstance(frontier,dict) and set(frontier)==expected_keys and frontier['schema']=='fort-collins-road-frontier-source-v1',
         'Exact frontier schema without extra claims required')
    old=json.loads(RAW.read_text());parent=json.loads(PARENT.read_text());seeds=seed_ids()
    need(frontier['source']==old['source']==member_context['source'] and frontier['parent_incidence_witness_sha256']==file_sha(PARENT),
         'Same exact original source and frozen seed witness required')
    need(frontier['seed_node_ids']==sorted(seeds) and frontier['seed_incidence_enumerated_in_original_source'] is True
         and all(frontier[key] is False for key in FALSE_FLAGS),'Only original-source incidence at the 27 seeds is enumerated')
    ways=index(frontier['ways'],{'id','tags','nodes'},MAX_WAYS)
    nodes=index(frontier['nodes'],{'id','tags','lonlat'},MAX_NODES)
    relations=index(frontier['restrictions'],{'id','tags','members'},100)
    need(len(ways)==27 and len(nodes)==94 and set(relations)=={9680890,9680891,20193102},'Review changed bounded source frontier')
    wanted=set()
    for way in ways.values():
        need(isinstance(way['nodes'],list) and 2<=len(way['nodes'])<=1000,'Bounded complete member geometry required')
        for row in way['nodes']:
            need(isinstance(row,list) and len(row)==3 and type(row[0]) is int and row[0]>0,'Raw member vertex required')
            wanted.add(row[0])
    need(set(nodes)==wanted and seeds<=wanted,'Every member vertex needs one complete node record')
    expected_memberships={str(nid):sorted(wid for wid,way in ways.items() if any(row[0]==nid for row in way['nodes'])) for nid in sorted(seeds)}
    need(frontier['all_source_way_ids_at_seed_nodes']==expected_memberships,'No incident way membership may be omitted, invented or reassigned')
    need(frontier['unenumerated_member_node_ids']==sorted(wanted-seeds),'Outer incidence gaps must remain explicit')
    for nid,sha in parent['complete_node_record_sha256'].items():
        need(canonical_sha(nodes[int(nid)])==sha,'Every first-hop member-node record must remain exact')
    for nid,members in parent['all_source_way_ids_at_seed_nodes'].items():
        need(expected_memberships[nid]==members,'The earlier eight-node incidence enumeration must be preserved')
    for key,current in [('ways',ways),('nodes',nodes),('restrictions',relations)]:
        for row in old[key]:
            need(row['id'] not in current or current[row['id']]==row,'Existing retained raw records cannot be rewritten')
    # Join complete external restriction members without altering the 27-seed enumeration.
    agree(ways,index(member_context['ways'],{'id','tags','nodes'},MAX_WAYS))
    agree(nodes,index(member_context['nodes'],{'id','tags','lonlat'},MAX_NODES))
    agree(relations,index(member_context['restrictions'],{'id','tags','members'},100))
    need(len(ways)==29 and len(nodes)==106,'Review changed full member-context union')
    classifications={};roads=[];supported=[];outside=[];unknown=[];weighted_arcs=0
    for wid,way in sorted(ways.items()):
        ids={row[0] for row in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
        raw_check=evaluate(way,local,default_policy=DEFAULTS)
        need(raw_check['node_record_ids_match_way_geometry'],'Complete full-record geometry/tags must validate even outside the modeled road classes')
        value=weights(way,local,default_policy=DEFAULTS)
        in_model=way['tags'].get('highway') in HIGHWAYS
        if in_model:
            roads.append(way)
            if value['status']=='supported_segment_weights':supported.append(wid);weighted_arcs+=len(value['arcs'])
            else:unknown.append(wid)
        else:outside.append(wid)
        classifications[str(wid)]=dict(highway=way['tags'].get('highway'),in_declared_road_classes=in_model,
            projection_status=value['status'],reason=value.get('reason'),weight_projection_sha256=canonical_sha(value))
    need(len(supported)==20 and len(outside)==8 and unknown==[815164359] and weighted_arcs==103,
         'Review changed supported/unsupported source scope; never hide an unresolved road control')
    compiled_controls={};missing=set()
    for rid,relation in sorted(relations.items()):
        ids={m['ref'] for m in relation['members'] if m['type']=='w'};missing|=ids-set(ways)
        need(not missing,'Every supplied restriction member way needs complete original raw context')
        selected=[ways[wid] for wid in sorted(ids)];nids={p[0] for way in selected for p in way['nodes']}
        via=[m['type'] for m in relation['members'] if m['role']=='via'];compiler=node_rule if via==['n'] else way_rule
        row=compiler(relation,selected,[nodes[nid] for nid in sorted(nids)],default_policy=DEFAULTS,
                     relation_zone='America/Denver' if rid==20193102 else None)
        need(row['topology_compiled'],'Every retained supplied restriction must compile independently from full members')
        compiled_controls[str(rid)]=dict(schema=row['schema'],input_sha256=row['input_sha256'],
            declared_arc_sequence=row['declared_arc_sequence'],active_pattern=row['active_pattern'])
    road_nodes={p[0] for way in roads for p in way['nodes']}
    preflight=compile_graph(roads,[nodes[nid] for nid in sorted(road_nodes)],list(relations.values()),
        default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
    need(preflight['status']=='unsupported' and preflight['graph'] is None and not preflight['declared_graph_compiled']
         and '815164359' in preflight['reason'] and 'Physical barrier' in preflight['reason'],
         'The entire candidate must remain blocked by the unresolved supplied car-road context')
    return dict(schema='fort-collins-road-frontier-checkpoint-v1',scenario_sha256=digest(load()),
        frontier_context_sha256=canonical_sha(frontier),member_context_sha256=canonical_sha(member_context),
        seed_report_sha256=file_sha(parent_path),member_report_sha256=file_sha(member_path),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('fort_collins_road_frontier.py','fort_collins_frontier_checkpoint.py','road_reference_mixed_graph.py',
             'road_reference_declared_graph.py','reference_via_way_compile.py','reference_via_node_compile.py',
             'road_reference_turn_rules.py','road_reference_segment_costs.py','road_reference_segment_permissions.py',
             'road_reference_way_permissions.py','road_reference_conditionals.py','road_reference_scenario.py')},
        enumerated_seed_nodes=27,incident_ways=27,incident_member_nodes=94,unenumerated_incident_member_nodes=67,
        complete_union_ways=len(ways),complete_union_nodes=len(nodes),unenumerated_union_node_ids=sorted(set(nodes)-seeds),
        complete_union_record_sha256={key:{str(rid):canonical_sha(row) for rid,row in sorted(records.items())}
            for key,records in [('ways',ways),('nodes',nodes),('restrictions',relations)]},
        supported_weight_way_ids=supported,supported_directed_weights=weighted_arcs,
        outside_declared_road_class_ids=outside,unknown_model_road_ids=unknown,classifications=classifications,
        supplied_relation_compilations=compiled_controls,missing_supplied_relation_member_way_ids=sorted(missing),
        road_model_preflight=preflight,graph_returned=False,query_result=None,route_cost_emitted=False,
        all_graph_node_incidence_enumerated=False,geographic_coverage_certified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='Original-source incidence is enumerated at only 27 named seeds. The full member union adds 79 nodes whose incidence remains unenumerated. Outside-model classes are not proof of real-world car exclusion. Supported weights and compiled declarations do not approve access or prove global reachability/optimality. The unresolved car-road bollard blocks the whole candidate; no partial graph, route, connector cost or public region is returned.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args()
    result=project();path=REFERENCE/'report.json'
    if args.write:
        path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen source-frontier checkpoint differs')
    print(dict(seed_nodes=27,incident_ways=27,incident_nodes=94,union_ways=29,union_nodes=106,
        unsupported_model_roads=result['unknown_model_road_ids'],unenumerated_union_nodes=len(result['unenumerated_union_node_ids']),
        graph_returned=False,access_verified=False))
