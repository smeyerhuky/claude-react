"""Audit exact-source incidence witnesses without certifying geographic closure."""
import argparse
import copy
import hashlib
import json
from reference_seed_incidence import ROOT, RAW, PARENT, seed_context, sha, need
from reference_declared_graph_checkpoint import project as parent_project

REFERENCE = ROOT/'docs/research/reference-seed-incidence'
WITNESS = REFERENCE/'source-incidence.json'
FALSE_FLAGS = ('all_graph_node_incidence_enumerated','exterior_closure_verified',
    'geographic_coverage_certified','connector_costs_included','access_verified','anchors_adopted','release_eligible')


def file_sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def audit(witness):
    need(parent_project() == json.loads(PARENT.read_text()), 'Exact frozen declared-kernel parent required')
    raw, seeds = seed_context()
    ways = {row['id']:row for row in raw['ways'] if any(p[0] in seeds for p in row['nodes'])}
    wanted = {p[0] for way in ways.values() for p in way['nodes']}
    nodes = {row['id']:row for row in raw['nodes'] if row['id'] in wanted}
    relations = {row['id']:row for row in raw['restrictions']
                 if any(m['type'] == 'w' and m['ref'] in ways for m in row['members'])}
    need(isinstance(witness,dict) and witness.get('schema') == 'reference-seed-source-incidence-v1', 'Exact source-incidence witness schema required')
    need(set(witness) == set(FALSE_FLAGS) | {'schema','source_sha256','raw_context_sha256','kernel_report_sha256',
         'seed_node_ids','all_source_way_ids_at_seed_nodes','complete_way_record_sha256','complete_node_record_sha256',
         'touching_restriction_namespace_record_sha256','unenumerated_new_member_node_ids',
         'seed_incidence_enumerated_in_original_source','scope'}, 'Unexpected source-witness fields or claims')
    need(witness.get('source_sha256') == raw['source']['sha256'] and witness.get('raw_context_sha256') == file_sha(RAW)
         and witness.get('kernel_report_sha256') == file_sha(PARENT), 'Frozen source/parent identities must agree')
    need(witness.get('seed_node_ids') == sorted(seeds), 'Exact full seed-node set required')
    memberships = {str(nid):sorted(wid for wid,way in ways.items() if any(p[0] == nid for p in way['nodes'])) for nid in sorted(seeds)}
    need(witness.get('all_source_way_ids_at_seed_nodes') == memberships, 'Source-enumerated seed incidence differs from retained full raw records; never discard an added way')
    for key, rows in [('complete_way_record_sha256',ways),('complete_node_record_sha256',nodes),
                      ('touching_restriction_namespace_record_sha256',relations)]:
        need(witness.get(key) == {str(rid):sha(row) for rid,row in sorted(rows.items())}, 'Full raw way/node/relation hashes must match exactly: '+key)
    need(witness.get('unenumerated_new_member_node_ids') == sorted(wanted-seeds), 'Unenumerated outer member nodes cannot be hidden')
    need(witness.get('seed_incidence_enumerated_in_original_source') is True
         and all(witness.get(key) is False for key in FALSE_FLAGS), 'Only original-source seed incidence is enumerated; graph/access/release gates stay false')
    return dict(seed_nodes=len(seeds),source_incident_ways=len(ways),complete_member_nodes=len(nodes),
        touching_restriction_namespace_relations=len(relations),unenumerated_new_member_nodes=len(wanted-seeds),
        seed_incidence_enumerated_in_original_source=True,all_graph_node_incidence_enumerated=False,
        geographic_coverage_certified=False,access_verified=False,anchors_adopted=False,release_eligible=False)


def project(witness=None):
    witness = json.loads(WITNESS.read_text()) if witness is None else copy.deepcopy(witness)
    result = audit(witness)
    result.update(schema='reference-seed-incidence-checkpoint-v1',source_incidence_sha256=sha(witness),
        raw_context_sha256=file_sha(RAW),kernel_report_sha256=file_sha(PARENT),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in
            ('reference_seed_incidence.py','reference_seed_incidence_checkpoint.py')},
        warning='Enumeration proves original-PBF membership at eight named raw seed nodes only. Nineteen additional member nodes still lack incident-way enumeration; complete geographic graph, exterior paths, other semantics, physical/grade/access evidence, reviewed anchor sets and approvals remain absent. No new routes, costs, adopted anchors or public map changes.')
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--write',action='store_true'); args = parser.parse_args()
    result = project(); path = REFERENCE/'report.json'
    if args.write:
        path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text()) != result:
        raise ValueError('Frozen seed-incidence checkpoint differs')
    print({key:result[key] for key in ('seed_nodes','source_incident_ways','complete_member_nodes',
        'touching_restriction_namespace_relations','unenumerated_new_member_nodes','access_verified')})
