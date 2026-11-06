"""Cost bounds under opaque controls; never a gate decision or admitted graph."""
from fractions import Fraction
import math
from road_guidance_way_permissions import evaluate
from road_reference_way_permissions import DEFAULTS
from road_reference_segment_costs import meters,policy
from road_turn_aware_probe import _positive_id,_cost
from road_maneuver_probe import compile_patterns,solve
from reference_via_node_compile import canonical_sha,need
from road_reference_scenario import load,digest

MAX_NODES=2000
MAX_ARCS=4000
MAX_WITNESS_ARCS=4000


def exact(value):return [str(value.numerator),str(value.denominator)]


def geometry_lower_bounds(way,nodes,*,default_policy,scenario=None):
    scenario=load() if scenario is None else scenario
    checked=evaluate(way,nodes,default_policy=default_policy,scenario=scenario)
    need(checked['node_record_ids_match_way_geometry'],'Complete original geometry and bounded raw tags required')
    points=way['nodes'];potential=[]
    for index,(a,b) in enumerate(zip(points,points[1:])):
        need(a[0]!=b[0],'Consecutive identical raw vertices require a separate contract')
        length=meters(a[1:],b[1:],policy()['earth_radius_m'])
        need(math.isfinite(length) and length>=0,'Finite nonnegative stored geometry lower bound required')
        for direction,start,end in (('forward',a,b),('backward',b,a)):
            potential.append(dict(id=f'possible-geometry:{way["id"]}:{index}:{direction}',way=way['id'],
                raw_segment_index=index,direction=direction,**{'from':start[0],'to':end[0]},
                length=length,travel_time=0.,bound_only=True,modeled_permission=None,
                raw_geometry=[list(start),list(end)],access_verified=False,release_eligible=False))
    return dict(schema='opaque-raw-way-geometry-lower-bounds-v1',scenario_sha256=digest(scenario),
        original_input_sha256=canonical_sha(dict(way=way,nodes=nodes)),strict_permission_status=checked['status'],
        strict_permission_reason=checked.get('reason'),potential_arcs=potential,
        ignores_direction_and_access_for_lower_bound=True,unknown_way_time_lower_bound_seconds=0,
        permission_claimed=False,actual_gate_state_evaluated=False,normal_graph_admitted=False,
        geographic_coverage_certified=False,access_verified=False,release_eligible=False,
        scope='Hypothetical raw adjacent geometry in BOTH directions, even where known tags might forbid travel; zero time creates no speed assumption. These are lower-bound possibilities, not permissions, navigation edges, an open-gate scenario or a graph admitted by the strict raw-input API.')


def _index(nodes,arcs):
    need(isinstance(nodes,list) and 1<=len(nodes)<=MAX_NODES and all(_positive_id(n) for n in nodes)
         and len(set(nodes))==len(nodes),'Bounded unique declared nodes required')
    need(isinstance(arcs,list) and len(arcs)<=MAX_ARCS,'Bounded explicit arc records required')
    ids=set(nodes);by={}
    for arc in arcs:
        need(isinstance(arc,dict) and isinstance(arc.get('id'),str) and 0<len(arc['id'])<=256 and arc['id'] not in by
             and _positive_id(arc.get('way')) and _positive_id(arc.get('from')) and _positive_id(arc.get('to'))
             and arc['from'] in ids and arc['to'] in ids,'Unique explicit arc identities and endpoints required')
        for metric in ('length','travel_time'):_cost(arc.get(metric))
        by[arc['id']]=arc
    return by


def validate_witness(nodes,known_arcs,maneuvers,source,target,path,metric):
    by=_index(nodes,known_arcs)
    need(_positive_id(source) and _positive_id(target) and source in nodes and target in nodes
         and metric in ('length','travel_time'),'Explicit supported witness query required')
    need(isinstance(path,list) and len(path)<=MAX_WITNESS_ARCS and all(isinstance(a,str) and a in by for a in path),
         'Witness must use only strict-supported arcs; never possible geometry')
    patterns=compile_patterns(maneuvers,by)
    current=source
    for index,aid in enumerate(path):
        arc=by[aid];need(arc['from']==current,'Witness arcs must be contiguous from the exact source')
        if index:
            previous=by[path[index-1]]
            need(not (previous['way']==arc['way'] and previous['from']==arc['to'] and previous['to']==arc['from']),
                 'Unchanged model disallows undeclared immediate same-way reversal')
        current=arc['to']
    need(current==target,'Witness must end at the exact target')
    for pattern in patterns:
        sequence=list(pattern['sequence'])
        if pattern['kind']=='no':
            need(not any(path[i:i+len(sequence)]==sequence for i in range(len(path)-len(sequence)+1)),
                 'Witness completes a prohibited maneuver')
        else:
            for i,aid in enumerate(path):
                if aid==sequence[0]:
                    length=min(len(sequence),len(path)-i)
                    need(path[i:i+length]==sequence[:length],'Witness violates an activated only-maneuver continuation')
    value=sum((_cost(by[aid][metric]) for aid in path),Fraction(0))
    return dict(source=source,target=target,metric=metric,strict_supported_path_sha256=canonical_sha(path),
        stored_cost_exact=exact(value),supported_arc_count=len(path),known_declared_maneuvers_respected=True,
        source_approach='unconstrained-declared-node-start',actual_access_verified=False,
        normal_graph_admitted=False,route_query_result_returned=False,release_eligible=False)


def bracket_cost(nodes,known_arcs,potential_arcs,maneuvers,source,target,witness_path,metric):
    known=_index(nodes,known_arcs);possible=_index(nodes,potential_arcs)
    need(len(known)+len(possible)<=MAX_ARCS and not (known.keys()&possible.keys()),'Distinct bounded known/potential arc namespaces required')
    need(all(a.get('bound_only') is True and a.get('modeled_permission') is None
             and a['id'].startswith('possible-geometry:') and _cost(a['travel_time'])==0 for a in potential_arcs),
         'Explicit bound-only geometry with zero-time lower bounds required')
    need(all(not a['id'].startswith('possible-geometry:') and not a.get('bound_only') for a in known_arcs),
         'Potential geometry cannot be relabeled as strict-supported witness arcs')
    # Every original supplied maneuver must refer to strict-supported arcs.
    # Unknown relation/member semantics reject the diagnostic, too.
    witness=validate_witness(nodes,known_arcs,maneuvers,source,target,witness_path,metric)
    lower=solve(nodes,known_arcs+potential_arcs,maneuvers,source,target,metric)
    need(lower['exact_stored_path_cost'] is not None,'A supported witness must remain reachable in the relaxed universe')
    lo=Fraction(*map(int,lower['exact_stored_path_cost']));hi=Fraction(*map(int,witness['stored_cost_exact']))
    need(lo<=hi,'Relaxed cost may not exceed its verified supported witness')
    used=[aid for aid in lower['arc_path'] if aid in possible]
    return dict(schema='opaque-control-stored-cost-bracket-v1',metric=metric,source=source,target=target,
        optimistic_lower_bound_exact=exact(lo),supported_witness_upper_bound_exact=exact(hi),gap_exact=exact(hi-lo),
        conditional_stored_cost_stable_within_supplied_universe=lo==hi,
        optimistic_walk_sha256=canonical_sha(lower),optimistic_walk_uses_possible_geometry=bool(used),
        possible_geometry_steps_in_optimistic_walk=used,supported_witness=witness,
        known_arcs=len(known),potential_geometry_arcs=len(possible),known_maneuvers=len(maneuvers),
        conditional_only=True,normal_graph_admitted=False,route_query_result_returned=False,
        actual_gate_state_evaluated=False,global_route_optimality_certified=False,geographic_coverage_certified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        completion_domain=[
            'Exactly this finite raw adjacent-geometry universe; no additional roads, attachments or connector edges.',
            'Known supported arcs, stored weights, active maneuver declarations, source/target, unconstrained start and same-way reversal policy stay unchanged.',
            'Opaque controls may remove potential arcs and add nonnegative costs; any included unknown-way distance is at least its stored geometry lower bound and time is nonnegative.',
            'No independent physical/legal access, lane/grade truth, external geography, reviewed anchor or release approval is implied.'],
        warning='Optimistic possibilities are lower bounds, not feasible routes or a decision that a gate is open/closed. An equal bracket proves stored-cost stability only across the stated finite-model completions. The strict raw-input graph may remain unsupported; no ordinary query result is returned.')
