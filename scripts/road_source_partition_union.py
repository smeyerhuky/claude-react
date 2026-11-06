"""Reconcile at most two complete bounded source captures without truncating raw records."""
import copy
import re
from road_source_incidence import need,MAX_WAYS,MAX_NODES,MAX_WAY_VERTICES,MAX_RELATIONS,MAX_RELATION_MEMBERS
from fort_collins_frontier_checkpoint import index
from road_guidance_way_permissions import evaluate
from road_reference_way_permissions import DEFAULTS,_tags
from reference_via_node_compile import canonical_sha

MAX_PARTITIONS=2
MAX_UNION_WAYS=MAX_PARTITIONS*MAX_WAYS
MAX_UNION_NODES=MAX_NODES
FALSE_FLAGS=('all_graph_node_incidence_enumerated','all_relation_semantics_evaluated','geographic_coverage_certified',
             'access_verified','anchors_adopted','connector_costs_included','release_eligible')
FIELDS=set('access_verified all_graph_node_incidence_enumerated all_relation_semantics_evaluated all_retained_way_and_node_members_present all_source_way_ids_at_seed_nodes anchors_adopted attribution bounds connector_costs_included control_relations geographic_coverage_certified incident_way_ids missing_touching_relation_member_way_ids missing_touching_relation_node_ids nodes referenced_relation_member_ids release_eligible requested_member_way_ids schema scope seed_node_ids source source_seed_incidence_enumerated unenumerated_member_node_ids ways'.split())
BOUNDS=dict(max_ways=MAX_WAYS,max_nodes=MAX_NODES,max_way_vertices=MAX_WAY_VERTICES,max_relations=MAX_RELATIONS,max_relation_members=MAX_RELATION_MEMBERS)


def ids(values,maximum):
    need(isinstance(values,list) and len(values)<=maximum and all(type(n) is int and n>0 for n in values)
         and values==sorted(set(values)),'Sorted unique bounded raw identities required')
    return set(values)


def missing(controls,ways,nodes):
    return dict(missing_touching_relation_member_way_ids=sorted({m['ref'] for r in controls.values() for m in r['members'] if m['type']=='w'}-set(ways)),
        missing_touching_relation_node_ids=sorted({m['ref'] for r in controls.values() for m in r['members'] if m['type']=='n'}-set(nodes)),
        referenced_relation_member_ids=sorted({m['ref'] for r in controls.values() for m in r['members'] if m['type']=='r'}))


def validate_part(part):
    need(isinstance(part,dict) and set(part)==FIELDS and part['schema']=='bounded-original-source-incidence-v1'
         and part['bounds']==BOUNDS,'Exact unchanged bounded original-source capture schema required')
    source=part['source']
    need(isinstance(source,dict) and set(source)=={'name','sha256','size_bytes'} and isinstance(source['name'],str)
         and 0<len(source['name'])<=128 and isinstance(source['sha256'],str) and re.fullmatch('[0-9a-f]{64}',source['sha256'])
         and type(source['size_bytes']) is int and source['size_bytes']>0,'Exact bounded original-source identity required')
    need(part['source_seed_incidence_enumerated'] is True and all(part[k] is False for k in FALSE_FLAGS),
         'Input source enumeration cannot claim broader semantic/geographic/access approval')
    seeds=ids(part['seed_node_ids'],MAX_NODES);extra=ids(part['requested_member_way_ids'],MAX_WAYS)
    need(seeds,'At least one original-source seed required')
    ways=index(part['ways'],{'id','nodes','tags'},MAX_WAYS);nodes=index(part['nodes'],{'id','lonlat','tags'},MAX_NODES)
    controls=index(part['control_relations'],{'id','members','tags'},MAX_RELATIONS)
    wanted=set()
    for way in ways.values():
        need(isinstance(way['nodes'],list) and 2<=len(way['nodes'])<=MAX_WAY_VERTICES,'Full bounded way geometry required')
        for row in way['nodes']:
            need(isinstance(row,list) and len(row)==3 and type(row[0]) is int and row[0]>0,'Raw vertex identities required')
            wanted.add(row[0])
    need(set(nodes)==wanted and seeds<=wanted and extra<=set(ways),'Every raw vertex, seed and explicit member requires complete records')
    for way in ways.values():
        local=[nodes[n] for n in sorted({p[0] for p in way['nodes']})]
        need(evaluate(way,local,default_policy=DEFAULTS)['node_record_ids_match_way_geometry'],
             'All raw geometry/tags must validate, including outside-class or unsupported controls')
    incidence={str(n):sorted(wid for wid,w in ways.items() if any(p[0]==n for p in w['nodes'])) for n in sorted(seeds)}
    incident=sorted({wid for rows in incidence.values() for wid in rows})
    need(part['all_source_way_ids_at_seed_nodes']==incidence and part['incident_way_ids']==incident
         and set(ways)==set(incident)|extra,'Exact incident/explicit member accounting required')
    need(part['unenumerated_member_node_ids']==sorted(wanted-seeds),'Every unenumerated outer node must remain explicit')
    for control in controls.values():
        _tags(control['tags'])
        need(isinstance(control['members'],list) and len(control['members'])<=MAX_RELATION_MEMBERS and all(
            isinstance(m,dict) and set(m)=={'type','ref','role'} and m['type'] in ('w','n','r')
            and type(m['ref']) is int and m['ref']>0 and isinstance(m['role'],str) and len(m['role'])<=128
            for m in control['members']),'Complete bounded raw control membership required')
        need(any(m['type']=='w' and m['ref'] in ways for m in control['members']),'Every retained control must touch a captured way')
    absent=missing(controls,ways,nodes)
    need(all(part[k]==v for k,v in absent.items()) and part['all_retained_way_and_node_members_present'] is (not any(absent.values())),
         'Actual missing and nested members must stay explicit')
    return seeds,ways,nodes,controls


def join_partitions(parts):
    need(isinstance(parts,list) and 1<=len(parts)<=MAX_PARTITIONS,'At most two independently bounded original-source partitions required')
    before=copy.deepcopy(parts);combined={'ways':{},'nodes':{},'control_relations':{}};seeds=set();summaries=[];validated=[]
    for part in parts:
        need(part.get('source')==parts[0].get('source'),'Partitions must have identical exact original-source identities')
        selected,ways,nodes,controls=validate_part(part);validated.append((part,selected,ways,controls));seeds|=selected
        for key,rows in (('ways',ways),('nodes',nodes),('control_relations',controls)):
            for rid,row in rows.items():
                need(rid not in combined[key] or combined[key][rid]==row,'Conflicting shared complete raw records cannot be merged')
                combined[key][rid]=row
        need(len(combined['ways'])<=MAX_UNION_WAYS and len(combined['nodes'])<=MAX_UNION_NODES
             and len(combined['control_relations'])<=MAX_RELATIONS,'Bounded partition-union budget exceeded; never truncate')
        summaries.append(dict(source_capture_sha256=canonical_sha(part),seed_node_ids=sorted(selected),
            source_ways=len(ways),complete_nodes=len(nodes),touching_controls=len(controls),original_capture_bounds=copy.deepcopy(BOUNDS)))
    ways=combined['ways'];nodes=combined['nodes'];controls=combined['control_relations']
    incidence={str(n):sorted(wid for wid,w in ways.items() if any(p[0]==n for p in w['nodes'])) for n in sorted(seeds)}
    for part,selected,localways,localcontrols in validated:
        for n in selected:need(incidence[str(n)]==part['all_source_way_ids_at_seed_nodes'][str(n)],'Union reveals omitted source incidence in a partition')
        for rid,control in controls.items():
            if any(m['type']=='w' and m['ref'] in localways for m in control['members']):
                need(rid in localcontrols,'Union reveals a touching control omitted from a partition')
    absent=missing(controls,ways,nodes);need(parts==before,'Original partition records cannot be mutated')
    return dict(schema='two-bounded-original-source-partition-union-v1',source=copy.deepcopy(parts[0]['source']),partitions=summaries,
        aggregate_bounds=dict(max_partitions=MAX_PARTITIONS,max_raw_ways=MAX_UNION_WAYS,max_nodes=MAX_UNION_NODES,max_controls=MAX_RELATIONS),
        seed_node_ids=sorted(seeds),all_source_way_ids_at_seed_nodes=incidence,
        ways=copy.deepcopy(sorted(ways.values(),key=lambda r:r['id'])),nodes=copy.deepcopy(sorted(nodes.values(),key=lambda r:r['id'])),
        control_relations=copy.deepcopy(sorted(controls.values(),key=lambda r:r['id'])),**absent,
        unenumerated_member_node_ids=sorted(set(nodes)-seeds),source_seed_incidence_enumerated=True,input_capture_reproduction_verified=False,
        all_retained_way_and_node_members_present=not any(absent.values()),all_graph_node_incidence_enumerated=False,
        all_relation_semantics_evaluated=False,geographic_coverage_certified=False,access_verified=False,
        anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='Reconciled source records only, inheriting the named-seed incidence assertions of the input captures. Each input must separately be reproduced against its exact original source; this helper does not scan that source. Original per-capture limits remain unchanged. A separate bounded union allows at most two captures/200 raw ways while retaining the 2000-node/100-control limits. This is not graph admission, complete geography, physical/legal access or connector/anchor approval.',
        attribution='OSM data copyright OpenStreetMap contributors, ODbL')
