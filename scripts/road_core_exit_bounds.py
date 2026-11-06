"""Conditional first-exit prefix bounds for a declared directed core, never coverage approval."""
import heapq
from fractions import Fraction
from metro_competition_bounds import number

MAX_NODES=2000
MAX_ARCS=4000


def need(value,reason):
    if not value:raise ValueError(reason)


def exact(value):return [str(value.numerator),str(value.denominator)]


def screen_first_exits(nodes,arcs,core_ids,source,target,*,metric,incumbent_upper_bound,margin=0):
    need(isinstance(nodes,(list,tuple)) and 1<=len(nodes)<=MAX_NODES
         and all(type(n) is int and n>0 for n in nodes) and len(set(nodes))==len(nodes),'Bounded unique positive node IDs required')
    universe=set(nodes)
    need(isinstance(core_ids,(list,tuple)) and 1<=len(core_ids)<=MAX_NODES and all(type(n) is int and n>0 for n in core_ids)
         and len(set(core_ids))==len(core_ids) and set(core_ids)<=universe,'Explicit unique core node IDs required')
    core=set(core_ids)
    need(type(source) is int and type(target) is int and source in core and target in core,'Both exact query endpoints must belong to the core')
    need(metric in ('length','travel_time'),'Explicit supported metric required')
    upper=number(incumbent_upper_bound);slack=number(margin)
    need(upper>=0 and slack>=0,'Nonnegative full incumbent bound and margin required')
    need(isinstance(arcs,(list,tuple)) and len(arcs)<=MAX_ARCS,'Bounded declared arc list required')
    by_id={};adjacency={nid:[] for nid in core};costs={}
    for arc in arcs:
        need(isinstance(arc,dict) and isinstance(arc.get('id'),str) and 0<len(arc['id'])<=256
             and arc['id'] not in by_id and type(arc.get('from')) is int and type(arc.get('to')) is int
             and arc['from'] in universe and arc['to'] in universe,'Unique bounded arc identity and known directed endpoints required')
        cost=number(arc.get(metric));need(cost>=0,'Every supplied cost must be finite and nonnegative')
        by_id[arc['id']]=arc;costs[arc['id']]=cost
        if arc['from'] in core and arc['to'] in core:adjacency[arc['from']].append(arc)
    # Ignoring maneuver/reversal constraints EXPANDS the prefix search. Its
    # exact stored-weight distances are lower bounds, not feasible full routes.
    distances={source:Fraction(0)};queue=[(Fraction(0),source)]
    while queue:
        distance,node=heapq.heappop(queue)
        if distances[node]!=distance:continue
        for arc in adjacency[node]:
            end=arc['to'];candidate=distance+costs[arc['id']]
            if end not in distances or candidate<distances[end]:
                distances[end]=candidate;heapq.heappush(queue,(candidate,end))
    rows=[]
    for aid,arc in sorted(by_id.items()):
        if arc['from'] not in core or arc['to'] in core:continue
        prefix=distances.get(arc['from']);lower=None if prefix is None else prefix+costs[aid]
        dominated=lower is not None and lower>upper+slack
        rows.append(dict(arc_id=aid,from_node=arc['from'],to_node=arc['to'],
            prefix_lower_bound_exact=None if prefix is None else exact(prefix),
            first_exit_arc_cost_exact=exact(costs[aid]),first_exit_cost_lower_bound_exact=None if lower is None else exact(lower),
            reason='unreachable_in_prefix_relaxation' if prefix is None else 'strictly_exceeds_incumbent' if dominated else 'may_compete_or_tie',
            conditional_dominated=dominated))
    reachable=[row for row in rows if row['first_exit_cost_lower_bound_exact'] is not None]
    return dict(schema='conditional-first-exit-prefix-bound-v1',metric=metric,source=source,target=target,
        core_node_ids=sorted(core),incumbent_upper_bound_exact=exact(upper),margin_exact=exact(slack),
        prefix_relaxation='exact stored weights; ignores all maneuver/reversal constraints',
        exits=rows,reachable_first_exits=len(reachable),
        conditional_exterior_routes_cannot_improve=all(row['conditional_dominated'] for row in reachable),
        conditional_only=True,applied_exterior_route_exclusions=[],
        source_incidence_certified=False,incumbent_feasibility_certified=False,
        geographic_coverage_certified=False,access_verified=False,release_eligible=False,
        preconditions_not_certified=[
            'Every possible model transition leaving the exact core is enumerated with unchanged endpoints, permissions and weights; no new attachment/interior/connector edges may touch the core.',
            'The supplied full incumbent is feasible with exactly these endpoints, direction, metric, approach history, fixed scenario and model policies.',
            'All exterior continuation costs and additional penalties are nonnegative; the model and temporal/vehicle policies remain unchanged.',
            'Raw source interpretation, physical/grade/access truth, all metro competitors, geographic masks and independent release approvals remain separate.'])
