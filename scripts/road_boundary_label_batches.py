"""Partition source queries without increasing native oracle or total call limits.

Every inner solve keeps its 32-source limit. All inner solves, including native
replays, share one 512-call budget. An exhausted final batch returns no partial
combined report. Newly added endpoints still require fresh protected graph views.
"""
from road_boundary_label_oracle import BoundaryLabelOracle

POLICY='shared-budget-source-batches-v1'


def solve(oracle,sources,targets,metric,*,reverse=False,keep_paths=False,max_oracles=512,progress=None):
    sources=list(sources);targets=list(targets)
    if (not isinstance(oracle,BoundaryLabelOracle) or metric not in ('length','travel_time')
            or type(reverse) is not bool or type(keep_paths) is not bool
            or type(max_oracles) is not int or not 1<=max_oracles<=512
            or not 1<=len(sources)<=64 or not 1<=len(targets)<=32
            or len(set(sources))!=len(sources) or len(set(targets))!=len(targets)
            or any(type(n) is not int or not 0<n<=2**63-1 for n in sources+targets)
            or (progress is not None and not callable(progress))):
        raise ValueError('Bounded source batches and original oracle limits required')
    endpoints=set(sources+targets)
    if len(endpoints)>64:raise ValueError('Original 64-endpoint scope budget exceeded')
    if oracle.protected is not None and not endpoints<=oracle.protected:raise ValueError('New endpoints require freshly derived query views')
    if any(not any(n in g.node_index for g in oracle.graphs) for n in endpoints):raise ValueError('Missing query endpoint')
    batches=[];results=[];calls=0
    for start in range(0,len(sources),32):
        group=sources[start:start+32];index=len(batches);remaining=max_oracles-calls
        if remaining<1:raise ValueError('Shared native Dijkstra budget exhausted before final source batch')
        notify=None if progress is None else lambda event:progress(dict(event,batch_index=index))
        run=oracle.solve(group,targets,metric,reverse=reverse,keep_paths=keep_paths,max_oracles=remaining,progress=notify)
        if run['converged'] is not True or run['dense_overlay_constructed'] is not False:
            raise ValueError('Each native batch must converge without a dense overlay')
        used=run['local_dijkstra_calls']
        if type(used) is not int or not 1<=used<=remaining or used!=run['propagation_dijkstra_calls']+run['replay_dijkstra_calls']:
            raise ValueError('Native batch exceeded the shared propagation/replay budget')
        calls+=used;batches.append(dict(run,batch_source_ids=group))
        results.extend(dict(row,batch_index=index) for row in run['results'])
    if {(r['source'],r['target']) for r in results}!={(s,t) for s in sources for t in targets} or len(results)!=len(sources)*len(targets):
        raise ValueError('Complete unique source/target results required')
    return dict(solver_policy=POLICY,batches=batches,results=results,local_dijkstra_calls=calls,
                propagation_dijkstra_calls=sum(b['propagation_dijkstra_calls'] for b in batches),
                replay_dijkstra_calls=sum(b['replay_dijkstra_calls'] for b in batches),
                source_batch_limit=32,shared_local_dijkstra_limit=max_oracles,protected_endpoint_limit=64,
                finite_queries_replayed=sum(b['finite_queries_replayed'] for b in batches),
                converged=all(b['converged'] is True for b in batches),partial_results_returned=False,
                release_eligible=False,access_certified=False,road_coverage_certified=False,complete_global_competition=False,
                warning='Source batching changes no endpoint, graph, boundary limit, connector or coverage approval. Native replay legs remain scoped to each batch.')
