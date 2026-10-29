"""Query many metros against one protected probe with native target batches.

The cost(u,probe,G) equals cost(probe,u,G.T). Native solves keep their
32-target limit and share one caller-supplied budget of at most512 calls.
"""
from road_boundary_label_oracle import BoundaryLabelOracle
POLICY='single-probe-transposed-target-batches-v1'


def solve(oracle,sources,probe,metric,direction,*,max_oracles=512):
    sources=list(sources)
    if (not isinstance(oracle,BoundaryLabelOracle) or not 1<=len(sources)<=64
            or len(set(sources))!=len(sources) or type(probe) is not int
            or any(type(n) is not int or not 0<n<=2**63-1 for n in [*sources,probe])
            or metric not in ('length','travel_time') or direction not in ('metro-to-location','location-to-metro')
            or type(max_oracles) is not int or not 1<=max_oracles<=512):raise ValueError('Bounded valid protected-probe request required')
    endpoints=set([*sources,probe])
    if len(endpoints)>64:raise ValueError('Original64-endpoint budget exceeded')
    if oracle.protected is not None and not endpoints<=oracle.protected:raise ValueError('New endpoints require fresh graph views')
    if any(not any(n in g.node_index for g in oracle.graphs) for n in endpoints):raise ValueError('Missing query endpoint')
    native_reverse=direction=='metro-to-location';runs=[];results=[];calls=0
    for start in range(0,len(sources),32):
        group=sources[start:start+32];remaining=max_oracles-calls
        if remaining<1:raise ValueError('Shared native oracle budget exhausted before final target group')
        run=oracle.solve([probe],group,metric,reverse=native_reverse,max_oracles=remaining)
        used=run['local_dijkstra_calls']
        if (run['converged'] is not True or run['dense_overlay_constructed'] is not False or type(used) is not int
                or not 1<=used<=remaining or used!=run['propagation_dijkstra_calls']+run['replay_dijkstra_calls']):raise ValueError('Native target group exceeded shared propagation/replay budget')
        index=len(runs);calls+=used;runs.append(dict(run,native_target_ids=group))
        for row in run['results']:
            if row['source']!=probe or row['target'] not in group:raise ValueError('Unexpected native transposed result')
            results.append(dict(source=row['target'],target=probe,cost=row['cost'],exact_stored_path_cost=row['exact_stored_path_cost'],segments=row['segments'],native_batch_index=index,native_source=probe,native_target=row['target']))
    if len(results)!=len(sources) or {r['source'] for r in results}!=set(sources):raise ValueError('Complete unique requested cost inventory required')
    return dict(solver_policy=POLICY,requested_direction=direction,metric=metric,probe=probe,native_reverse=native_reverse,
                native_runs=runs,results=results,local_dijkstra_calls=calls,native_target_batch_limit=32,protected_endpoint_limit=64,
                shared_local_dijkstra_limit=max_oracles,finite_queries_replayed=sum(r['finite_queries_replayed'] for r in runs),
                converged=True,partial_results_returned=False,access_certified=False,release_eligible=False,complete_global_competition=False,
                warning='Transposition changes no graph, endpoint, connector, anchor or coverage approval. Native legs retain their explicit solver orientation.')
