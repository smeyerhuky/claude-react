"""Conditional full-route connector budgets; never applied source exclusions.

If G is an exact cost of a known graph path and a feasible connector pair costs
at most B, that incumbent costs at most G+B. A competing source with admissible
full-route lower bound L cannot win when B < L-G-margin. Equality stays open.
Neither feasible connectors nor admissibility are established by this helper.
"""
from metro_competition_bounds import distance_lower_bound, number, point


def connector_budget_frontier(eligible_ids, domains, destination, *, metric,
                              graph_path_cost, connector_budgets, margin=0,
                              speed_ceiling_kph=None):
    ids=list(eligible_ids)
    if not ids or any(not isinstance(i,str) or not i for i in ids) or len(ids)!=len(set(ids)):
        raise ValueError("Complete unique eligible source inventory required")
    if set(domains)-set(ids):
        raise ValueError("Origin domain outside eligible inventory")
    point(destination)
    graph,slack=number(graph_path_cost),number(margin)
    budgets=list(map(number,connector_budgets))
    if min(graph,slack)<0 or not budgets or min(budgets)<0 or len(budgets)!=len(set(budgets)):
        raise ValueError("Nonnegative graph cost, margin and distinct budgets required")
    if metric not in ("length","travel_time"):
        raise ValueError("Unsupported metric")
    speed=None if speed_ceiling_kph is None else number(speed_ceiling_kph)*1000/3600
    if speed is not None and speed<=0:
        raise ValueError("Positive global speed ceiling required")
    def encoded(value):return [str(value.numerator),str(value.denominator)]
    rows=[]
    for cbsa in sorted(ids):
        domain=domains.get(cbsa)
        lower=None
        reason="unknown_origin_domain"
        if domain is not None:
            if not isinstance(domain.get("evidence_reference"),str) or not domain["evidence_reference"].strip():
                raise ValueError("Origin domain evidence reference required")
            distance=distance_lower_bound(domain["center_lonlat"],destination,domain["radius_m"])
            if metric=="travel_time" and speed is None:
                reason="unknown_global_speed_ceiling"
            else:
                lower=distance if metric=="length" else distance/speed
                reason="conditional_connector_budget_threshold"
        threshold=None if lower is None else lower-graph-slack
        rows.append({"cbsa":cbsa,"reason":reason,
                     "lower_bound_exact":None if lower is None else encoded(lower),
                     "connector_budget_strict_upper_threshold_exact":None if threshold is None else encoded(threshold)})
    cases=[]
    for budget in sorted(budgets):
        may_compete=[];conditional=[]
        for row in rows:
            value=row["connector_budget_strict_upper_threshold_exact"]
            threshold=None if value is None else number(value[0])/number(value[1])
            (conditional if threshold is not None and budget<threshold else may_compete).append(row["cbsa"])
        cases.append({"total_connector_cost_upper_bound_assumption_exact":encoded(budget),
                      "conditional_bound_exceeds_full_incumbent_ids":conditional,
                      "retained_or_unknown_ids":may_compete})
    return {"conditional_only":True,"release_eligible":False,"access_certified":False,
            "complete_global_competition":False,"applied_source_exclusions":[],
            "metric":metric,"units":"meters" if metric=="length" else "seconds",
            "graph_path_cost_exact":encoded(graph),"margin_exact":encoded(slack),
            "sources":rows,"budget_cases":cases,
            "preconditions_not_certified":[
                "known path is feasible under the same origin scenario, metric and orientation",
                "independently valid directed source and destination connectors with TOTAL cost <= assumed budget",
                "complete eligible origin domains, coordinate/datum compatibility and full-route geometric cost domination",
                "for travel_time, a global speed ceiling including exterior roads and connectors",
                "physical/legal access, turns, source geography and road coverage"]}
