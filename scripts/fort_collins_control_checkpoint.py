"""Audit complete retained control members while keeping lane/barrier semantics unresolved."""
import argparse
import hashlib
import json
from road_source_incidence import MAX_WAYS,MAX_NODES,need
from fort_collins_control_corpus import ROOT,RAW,ADDITIONAL_WAYS,SEED_REFERENCE,MEMBER_CONTEXT
from fort_collins_frontier_checkpoint import project as frontier_project,REFERENCE as FRONTIER_REFERENCE,CONTEXT as FRONTIER_CONTEXT,index
from reference_seed_incidence_checkpoint import project as seed_project
from reference_via_way_checkpoint import project as member_project,REFERENCE as MEMBER_REFERENCE
from reference_via_node_compile import canonical_sha,compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from road_reference_way_permissions import DEFAULTS,HIGHWAYS,evaluate
from road_reference_segment_costs import project as weights
from road_reference_mixed_graph import compile_graph
from road_reference_scenario import load,digest

REFERENCE=ROOT/'docs/research/fort-collins-control-corpus'
CONTEXT=REFERENCE/'source-context.json'
CONTROL_IDS={2512694,2569447,9677656,9677657,9677658,9680890,9680891,10475907,13135778,20193102}
FALSE_FLAGS=('all_graph_node_incidence_enumerated','all_relation_semantics_evaluated','geographic_coverage_certified',
             'access_verified','anchors_adopted','connector_costs_included','release_eligible')


def file_sha(path):return hashlib.sha256(path.read_bytes()).hexdigest()


def project(corpus=None):
    need(frontier_project()==json.loads((FRONTIER_REFERENCE/'report.json').read_text()),'Exact frozen 27-seed frontier required')
    need(seed_project()==json.loads((SEED_REFERENCE/'report.json').read_text()),'Exact frozen first-hop parent required')
    need(member_project()==json.loads((MEMBER_REFERENCE/'report.json').read_text()),'Exact frozen via-way member parent required')
    corpus=json.loads(CONTEXT.read_text()) if corpus is None else corpus
    expected={'schema','source','seed_node_ids','requested_member_way_ids','incident_way_ids','all_source_way_ids_at_seed_nodes',
              'ways','nodes','control_relations','missing_touching_relation_member_way_ids','missing_touching_relation_node_ids',
              'referenced_relation_member_ids','unenumerated_member_node_ids','bounds','source_seed_incidence_enumerated',
              'all_retained_way_and_node_members_present','scope','attribution',*FALSE_FLAGS}
    need(isinstance(corpus,dict) and set(corpus)==expected and corpus['schema']=='bounded-original-source-incidence-v1','Exact bounded control corpus schema required')
    identity=json.loads(RAW.read_text())['source']
    need(corpus['source']=={key:identity[key] for key in ('name','sha256','size_bytes')},'Exact original source identity required')
    need(corpus['source_seed_incidence_enumerated'] is True and corpus['all_retained_way_and_node_members_present'] is True
         and all(corpus[key] is False for key in FALSE_FLAGS),'Only source incidence and structural member presence are established')
    need(corpus['bounds']==dict(max_ways=100,max_nodes=2000,max_way_vertices=1000,max_relations=100,max_relation_members=32),'Original bounded source budgets required')
    first=json.loads((SEED_REFERENCE/'source-incidence.json').read_text());member=json.loads(MEMBER_CONTEXT.read_text())
    seeds={int(nid) for nid in first['complete_node_record_sha256']}|{n['id'] for n in member['nodes']}
    need(len(seeds)==40 and corpus['seed_node_ids']==sorted(seeds) and corpus['requested_member_way_ids']==sorted(ADDITIONAL_WAYS),'Exact seed union and six requested member ways required')
    ways=index(corpus['ways'],{'id','tags','nodes'},MAX_WAYS);nodes=index(corpus['nodes'],{'id','tags','lonlat'},MAX_NODES)
    controls=index(corpus['control_relations'],{'id','tags','members'},100)
    need(len(ways)==48 and len(nodes)==175 and set(controls)==CONTROL_IDS,'Review changed complete control-corpus scope')
    wanted=set();incidence={str(nid):[] for nid in sorted(seeds)}
    for wid,way in sorted(ways.items()):
        need(isinstance(way['nodes'],list) and 2<=len(way['nodes'])<=1000,'Complete bounded member geometry required')
        ids=set()
        for row in way['nodes']:
            need(isinstance(row,list) and len(row)==3 and type(row[0]) is int and row[0]>0,'Explicit raw member vertex required')
            ids.add(row[0]);wanted.add(row[0])
        for nid in ids&seeds:incidence[str(nid)].append(wid)
    incident=sorted({wid for rows in incidence.values() for wid in rows})
    need(len(incident)==42 and corpus['incident_way_ids']==incident and corpus['all_source_way_ids_at_seed_nodes']==incidence,'All seed-incident ways must remain explicit and consistent')
    need(set(ways)-set(incident)==set(ADDITIONAL_WAYS) and set(nodes)==wanted and seeds<=wanted,'No incident or requested member context may be substituted')
    need(corpus['unenumerated_member_node_ids']==sorted(wanted-seeds),'Every unenumerated outer node must be retained')
    for old in (json.loads(FRONTIER_CONTEXT.read_text()),member):
        for key,current in [('ways',ways),('nodes',nodes),('restrictions',controls)]:
            for row in old[key]:need(row['id'] in current and current[row['id']]==row,'Earlier full raw records must remain exact')
        if 'all_source_way_ids_at_seed_nodes' in old:
            for nid,rows in old['all_source_way_ids_at_seed_nodes'].items():need(incidence[nid]==rows,'Earlier source incidence cannot change')
    missing_ways={m['ref'] for r in controls.values() for m in r['members'] if m['type']=='w'}-set(ways)
    missing_nodes={m['ref'] for r in controls.values() for m in r['members'] if m['type']=='n'}-set(nodes)
    need(not missing_ways and not missing_nodes and corpus['missing_touching_relation_member_way_ids']==[]
         and corpus['missing_touching_relation_node_ids']==[] and corpus['referenced_relation_member_ids']==[],
         'All retained way/node member identities must actually be present')
    classifications={};roads=[];supported=[];outside=[];unknown=[];directed=0
    for wid,way in sorted(ways.items()):
        ids={p[0] for p in way['nodes']};local=[nodes[nid] for nid in sorted(ids)]
        check=evaluate(way,local,default_policy=DEFAULTS)
        need(check['node_record_ids_match_way_geometry'],'Every raw way/node geometry and tag dictionary must validate')
        value=weights(way,local,default_policy=DEFAULTS)
        if way['tags'].get('highway') not in HIGHWAYS:outside.append(wid)
        else:
            roads.append(way)
            if value['status']=='supported_segment_weights':supported.append(wid);directed+=len(value['arcs'])
            else:unknown.append(wid)
        classifications[str(wid)]=dict(status=value['status'],reason=value.get('reason'),projection_sha256=canonical_sha(value))
    need(len(supported)==33 and len(outside)==13 and unknown==[140486410,815164359] and directed==151,'Review changed road-control support; never hide lane/barrier context')
    results={}
    for rid,control in sorted(controls.items()):
        need(control['tags'].get('type')=='restriction','Unknown retained control semantics cannot be treated as restrictions')
        ids={m['ref'] for m in control['members'] if m['type']=='w'};selected=[ways[wid] for wid in sorted(ids)]
        nids={p[0] for way in selected for p in way['nodes']};via=[m['type'] for m in control['members'] if m['role']=='via']
        compiler=node_rule if via==['n'] else way_rule
        result=compiler(control,selected,[nodes[nid] for nid in sorted(nids)],default_policy=DEFAULTS,
                        relation_zone='America/Denver' if rid==20193102 else None)
        if rid==10475907:need(result['status']=='unsupported' and result['declared_arc_sequence'] is None and 'Lane context' in result['reason'],'Lane-bearing member stays unsupported by the historical profile')
        else:need(result['topology_compiled'],'Every other retained declaration must compile from full members')
        results[str(rid)]=result
    rnodes={p[0] for way in roads for p in way['nodes']}
    preflight=compile_graph(roads,[nodes[nid] for nid in sorted(rnodes)],list(controls.values()),default_policy=DEFAULTS,relation_zones={'20193102':'America/Denver'})
    need(preflight['status']=='unsupported' and preflight['graph'] is None,'Unknown controls must block the whole candidate')
    return dict(schema='fort-collins-control-corpus-checkpoint-v1',scenario_sha256=digest(load()),source_context_sha256=canonical_sha(corpus),
        frontier_report_sha256=file_sha(FRONTIER_REFERENCE/'report.json'),member_report_sha256=file_sha(MEMBER_REFERENCE/'report.json'),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('road_source_incidence.py','fort_collins_control_corpus.py','fort_collins_control_checkpoint.py',
             'road_reference_mixed_graph.py','reference_via_node_compile.py','reference_via_way_compile.py',
             'road_reference_way_permissions.py','road_reference_segment_permissions.py','road_reference_segment_costs.py')},
        seeds=40,incident_ways=42,complete_member_ways=48,complete_member_nodes=175,retained_restrictions=10,
        retained_connectivity_relations=0,all_retained_way_and_node_members_present=True,
        missing_way_members=[],missing_node_members=[],unenumerated_member_nodes=len(wanted-seeds),
        supported_weight_way_ids=supported,supported_directed_weights=directed,outside_declared_road_class_ids=outside,
        unsupported_model_road_ids=unknown,classifications=classifications,individual_restriction_compilations=results,
        historical_road_model_preflight=preflight,graph_returned=False,query_result=None,route_cost_emitted=False,
        all_relation_semantics_evaluated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='All retained raw member identities are present, not all control semantics or geographic closure. Original-source enumeration covers only the 40 named seeds; 135 outer nodes remain unenumerated. Zero captured connectivity records is not a physical connectivity certificate. The historical road profile keeps the lane-bearing road and bollard unsupported, and returns no graph or route. No anchors/connectors are approved and no public-map behavior changes.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args();result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen complete-control corpus differs')
    print({key:result[key] for key in ('seeds','incident_ways','complete_member_ways','complete_member_nodes',
        'retained_restrictions','retained_connectivity_relations','unsupported_model_road_ids','graph_returned','access_verified')})
