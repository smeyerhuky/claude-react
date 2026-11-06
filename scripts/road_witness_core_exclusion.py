"""Bind a supported interior witness to conditional exact first-exit bounds.

Source enumeration and nonnegative outside continuation are explicit external
preconditions; this helper never scans a source or approves graph/access release.
"""
from fractions import Fraction
from road_core_exit_bounds import screen_first_exits,exact,need
from road_opaque_control_bounds import bracket_cost
from reference_via_node_compile import canonical_sha


def certify(nodes,known,potential,maneuvers,core_ids,source,target,witness_path,metric):
    bracket=bracket_cost(nodes,known,potential,maneuvers,source,target,witness_path,metric)
    upper=Fraction(*map(int,bracket['supported_witness_upper_bound_exact']))
    screen=screen_first_exits(nodes,known+potential,core_ids,source,target,metric=metric,incumbent_upper_bound=upper)
    core=set(core_ids);by={a['id']:a for a in known}
    need(all(by[aid]['from'] in core and by[aid]['to'] in core for aid in witness_path),
         'The validated supported witness must remain entirely inside the enumerated core')
    reachable=[r for r in screen['exits'] if r['first_exit_cost_lower_bound_exact'] is not None]
    minimum=min((Fraction(*map(int,r['first_exit_cost_lower_bound_exact'])) for r in reachable),default=None)
    exterior=screen['conditional_exterior_routes_cannot_improve']
    stable=exterior and bracket['conditional_stored_cost_stable_within_supplied_universe']
    return dict(schema='supported-interior-witness-conditional-core-exclusion-v1',metric=metric,source=source,target=target,
        arc_universe_sha256=canonical_sha(dict(nodes=nodes,known=known,potential=potential,maneuvers=maneuvers)),
        core_node_ids=sorted(core),interior_supported_witness=bracket['supported_witness'],finite_model_bracket=bracket,
        exact_first_exit_screen=screen,first_exit_count=len(screen['exits']),reachable_first_exit_count=len(reachable),
        unreachable_first_exit_count=len(screen['exits'])-len(reachable),
        may_compete_or_tie_count=sum(r['reason']=='may_compete_or_tie' for r in screen['exits']),
        minimum_reachable_first_exit_bound_exact=None if minimum is None else exact(minimum),
        minimum_first_exit_gap_exact=None if minimum is None else exact(minimum-upper),
        interior_witness_validated=True,conditional_exterior_walks_cannot_improve_or_tie=exterior,
        conditional_retained_cost_stable_with_nonnegative_exterior=stable,
        source_replay_verified_in_this_process=False,source_incidence_certified=False,
        exterior_continuation_nonnegativity_verified=False,conditional_only=True,
        normal_graph_admitted=False,route_query_result_returned=False,applied_exterior_route_exclusions=[],
        global_route_optimality_certified=False,geographic_coverage_certified=False,
        actual_access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        completion_domain=[
            'The caller must bind complete source enumeration of every modeled transition at every exact native core node; no new core/interior/connector attachment or changed core geometry is covered.',
            'Known supported permissions, stored weights, declared active maneuvers, audited inert member directions, vehicle/scenario, endpoints, unconstrained start and reversal policy remain unchanged.',
            'Opaque geometry is only a relaxation: both directions, stored distance lower bounds, zero time; completions may remove possibilities or add nonnegative costs without invalidating the supported interior witness.',
            'Outside the core, arbitrary continuation and reentry walks must have nonnegative costs and cannot introduce constraints that invalidate the fixed supported interior witness.',
            'Native-node model adjacency and declared road classes do not establish physical/grade/legal access, all-metro competition, geographic masks, an approved graph or public release.'],
        warning='Every outside walk must first cross an enumerated exit. The relaxed exact prefix plus first-exit cost strictly exceeds the supported interior witness when this conditional certificate holds; nonnegative exterior continuation cannot recover the gap. Ties remain competitive and unreachable exits remain explicit. This helper does not verify source completeness or external nonnegativity and returns no ordinary graph/query or access/release approval.')
