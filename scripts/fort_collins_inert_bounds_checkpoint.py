"""Bind all expanded declarations before computing conditional opaque cost bounds."""
import argparse
import json
from fort_collins_opaque_source_checkpoint import project as parent,REFERENCE as PARENT
from fort_collins_competitive_checkpoint import REFERENCE as WITNESS
from fort_collins_guidance_checkpoint import file_sha
from fort_collins_partition_checkpoint import RELATION_ZONES
from road_reference_scenario import ROOT,load,digest
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_posted_speed_weights import weights
from road_opaque_control_bounds import geometry_lower_bounds,bracket_cost
from road_inert_no_prohibition import audit
from guidance_via_node_compile import compile_relation as node_rule
from reference_via_way_compile import compile_relation as way_rule
from reference_via_node_compile import canonical_sha,need

REFERENCE=ROOT/'docs/research/fort-collins-inert-prohibition-bounds'


def account_declarations(union,individual,known,potential):
    ways={w['id']:w for w in union['ways']};nodes={n['id']:n for n in union['nodes']};by_arc={a['id']:a for a in known}
    need(len(individual)==len(union['control_relations']) and set(individual)=={str(r['id']) for r in union['control_relations']},'Every original declaration must be accounted exactly once')
    patterns=[];accounting={}
    for r in union['control_relations']:
        rid=str(r['id']);old=individual[rid]
        memberways=[ways[wid] for wid in sorted({m['ref'] for m in r['members'] if m['type']=='w'})]
        wanted={p[0] for w in memberways for p in w['nodes']};local=[nodes[n] for n in sorted(wanted)]
        compiler=node_rule if [m['type'] for m in r['members'] if m['role']=='via']==['n'] else way_rule
        need(old==compiler(r,memberways,local,default_policy=DEFAULTS,relation_zone=RELATION_ZONES.get(rid)),
             'Every retained compilation must bind the unchanged original declaration and complete members')
        if old['topology_compiled']:
            need(set(old['declared_arc_sequence'])<=set(by_arc),'Compiled declaration requires strict-supported member arcs')
            accounting[rid]=dict(kind='compiled_declaration',compilation_sha256=canonical_sha(old),active=old['active_pattern'] is not None)
            if old['active_pattern'] is not None:patterns.append(old['active_pattern'])
        else:
            value=audit(r,memberways,local,default_policy=DEFAULTS,relation_zone=RELATION_ZONES.get(rid))
            need(value['status']=='inert_declared_no_prohibition','Unsupported declaration cannot disappear from bounds: '+str(value.get('reason')))
            need(not any(a['way'] in {w['id'] for w in memberways} for a in potential),
                 'Hypothetical geometry cannot reintroduce any audited member direction')
            for transition in value['required_raw_transitions']:
                if transition['id'] in value['oneway_denied_arc_ids']:
                    need(transition['id'] not in by_arc and not any(a['way']==transition['way'] and a['from']==transition['from'] and a['to']==transition['to'] for a in known),
                         'One-way-denied transition must be absent, including equivalent differently named arcs')
            accounting[rid]=dict(kind='oneway_inert_no_prohibition',original_strict_compilation=old,audit=value)
    return patterns,accounting


def project():
    baseline=parent();need(baseline==json.loads((PARENT/'report.json').read_text()),'Exact frozen expanded unsupported parent required')
    union=baseline['reconciled_source'];by_node={n['id']:n for n in union['nodes']};known=[];possible=[];catalogues={};ids=set()
    for w in union['ways']:
        if w['tags'].get('highway') not in HIGHWAYS:continue
        wanted={p[0] for p in w['nodes']};ids|=wanted;local=[by_node[n] for n in sorted(wanted)];value=weights(w,local,default_policy=DEFAULTS)
        if value['arcs'] is not None:known.extend(value['arcs'])
        else:
            catalogue=geometry_lower_bounds(w,local,default_policy=DEFAULTS);catalogues[str(w['id'])]=catalogue;possible.extend(catalogue['potential_arcs'])
    need(len(known)==743 and len(possible)==32 and set(catalogues)=={'201855578','1216151141'},'Retain both complete unknown ways as hypothetical geometry only')
    patterns,accounting=account_declarations(union,baseline['individual_restriction_compilations'],known,possible)
    need(len(accounting)==15 and len(patterns)==13 and accounting['11978581']['kind']=='oneway_inert_no_prohibition','Every original control, including inactive and inert declarations, must remain bound')
    witness=json.loads((WITNESS/'report.json').read_text());brackets={}
    for metric,q in witness['query_replays'].items():
        result=bracket_cost(sorted(ids),known,possible,patterns,q['source'],q['target'],q['arc_path'],metric)
        need(result['supported_witness_upper_bound_exact']==q['exact_stored_path_cost'] and result['conditional_stored_cost_stable_within_supplied_universe']
             and not result['optimistic_walk_uses_possible_geometry'],'Review changed conditional stored costs')
        brackets[metric]=result
    return dict(schema='expanded-opaque-cost-bounds-with-inert-no-prohibition-v1',scenario_sha256=digest(load()),
        parent_report_sha256=file_sha(PARENT/'report.json'),witness_report_sha256=file_sha(WITNESS/'report.json'),source_context_sha256=canonical_sha(union),
        implementation_sha256={name:file_sha(ROOT/'scripts'/name) for name in ('road_inert_no_prohibition.py','fort_collins_inert_bounds_checkpoint.py',
            'road_opaque_control_bounds.py','road_guidance_segments.py','road_guidance_way_permissions.py','road_reference_turn_rules.py','road_maneuver_probe.py','road_posted_speed_weights.py')},
        declaration_accounting=accounting,retained_declarations=15,active_compiled_patterns=13,inactive_compiled_declarations=1,inert_no_prohibitions=1,
        known_supported_arcs=743,possible_geometry_arcs=32,opaque_way_geometry_catalogues=catalogues,metric_brackets=brackets,
        strict_parent_compilation=baseline['full_candidate_compilation'],strict_parent_queries=baseline['full_candidate_queries'],
        unknown_raw_way_context=baseline['unsupported_model_roads'],source_seed_nodes=247,unenumerated_outer_source_nodes=552,
        inertness_precondition='All audited member permissions, raw directions, scenario and geometry remain unchanged; no potential or new geometry may reintroduce a denied member transition.',
        original_declarations_or_tags_changed=False,old_strict_compiler_replaced=False,unknown_controls_omitted=False,
        gate_state_assumed=False,whole_way_turn_permission_assumed=False,normal_graph_admitted=False,route_query_result_returned=False,
        applied_exterior_route_exclusions=[],global_route_optimality_certified=False,geographic_coverage_certified=False,
        actual_access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        warning='A separate audited NO-prohibition is inert only because a required raw member direction is already one-way denied. ONLY rules cannot be discharged this way. All 15 declarations are retained. Equal exact brackets hold only within this finite unchanged-permission completion domain; unknown gate/whole-way turn geometry remains hypothetical in both directions with zero time. Strict graph/query rejection, external geography, independent access/anchor review and public release gates remain intact.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--write',action='store_true');args=parser.parse_args();result=project();path=REFERENCE/'report.json'
    if args.write:path.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    elif json.loads(path.read_text())!=result:raise ValueError('Frozen inert-prohibition bounds differ')
    print(dict(retained_declarations=15,active=13,inactive=1,inert_no=1,cost_stability={m:r['conditional_stored_cost_stable_within_supplied_universe'] for m,r in result['metric_brackets'].items()},normal_graph_admitted=False,access_verified=False))
