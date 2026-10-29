"""Bounded two-shard label exchange; no dense port closure or access approval.

Each local pass computes shortest paths from finite boundary labels via one
solver-only super-source. Strict label improvements propagate until a complete
sweep changes no boundary label. Budget exhaustion raises; it never returns a
partially converged answer. Every finite composed query is replayed on native
stored arcs, without the super-source or its initial-label edges.
"""
from fractions import Fraction
import hashlib
import math

import numpy as np
from scipy.sparse import csr_array
from scipy.sparse.csgraph import dijkstra

from colorado_sparse_parent_oracle import trace_path
from road_partition_oracle import close, validate

POLICY='two-shard-boundary-label-fixed-point-v1'


class BoundaryLabelOracle:
    def __init__(self, first, second, *, max_boundary_vertices=192):
        if type(max_boundary_vertices) is not int or not 1<=max_boundary_vertices<=192:
            raise ValueError('Explicit bounded boundary-label vector required')
        for graph in (first,second):validate(graph)
        scopes=[g.report.get('query_protected_node_ids') for g in (first,second)]
        if any(s is not None for s in scopes) and scopes[0]!=scopes[1]:raise ValueError('Matching query scopes required')
        self.protected=None if scopes[0] is None else set(scopes[0])
        shared=sorted(int(node) for node in second.osm_ids if int(node) in first.node_index)
        if len(shared)>max_boundary_vertices:raise ValueError('Boundary-label vector budget exceeded; never truncate')
        for node in shared:
            a,b=first.node_index[node],second.node_index[node]
            if first.longitude[a]!=second.longitude[b] or first.latitude[a]!=second.latitude[b]:raise ValueError('Shared node geometry disagreement')
        self.graphs=(first,second);self.boundary=shared
        self.audit=dict(solver_policy=POLICY,shared_vertices=len(shared),boundary_vertex_count=len(shared),
                        boundary_vertex_limit=max_boundary_vertices,dense_port_closure_constructed=False,
                        dense_overlay_constructed=False,flattened_road_union_constructed=False,
                        conceptual_union_nodes=len(first.osm_ids)+len(second.osm_ids)-len(shared))

    def solve(self,sources,targets,metric,*,reverse=False,keep_paths=False,max_oracles=512,progress=None):
        if (metric not in ('length','travel_time') or type(reverse) is not bool or type(keep_paths) is not bool
                or not 1<=len(sources)<=32 or not 1<=len(targets)<=32
                or any(type(n) is not int or not 0<n<=2**63-1 for n in [*sources,*targets])
                or len(set(sources))!=len(sources) or len(set(targets))!=len(targets)
                or type(max_oracles) is not int or not 1<=max_oracles<=512
                or (progress is not None and not callable(progress))):raise ValueError('Bounded valid query batch required')
        endpoints=set([*sources,*targets])
        if self.protected is not None and not endpoints<=self.protected:raise ValueError('New endpoints require freshly derived query views')
        if any(not any(node in g.node_index for g in self.graphs) for node in endpoints):raise ValueError('Missing query endpoint')
        matrices=[getattr(g,metric).T.tocsr() if reverse else getattr(g,metric) for g in self.graphs]
        calls=0;trace_steps=0;cached_skips=0;results=[];required={};expected={};rounds=[];segments_total=0
        def call(matrix,source):
            nonlocal calls
            if calls>=max_oracles:raise ValueError('Local Dijkstra budget exhausted before convergence/replay')
            calls+=1
            return dijkstra(matrix,directed=True,indices=source,return_predecessors=True)
        working_nodes=[0,0];working_arcs=[0,0]
        boundary_lookup={node:i for i,node in enumerate(self.boundary)}
        for source in sources:
            boundary_values=np.full(len(self.boundary),np.inf)
            boundary_refs=[None]*len(self.boundary)
            # Each reference is a valid prefix walk from this original source.
            records=[None]
            if source in boundary_lookup:
                j=boundary_lookup[source];boundary_values[j]=0.;boundary_refs[j]=0
            target_values={node:(0. if node==source else math.inf) for node in targets}
            target_refs={node:(0 if node==source else None) for node in targets}
            auxiliary=[]
            for k,g in enumerate(self.graphs):
                seed_nodes=sorted(set(self.boundary)|({source} if source in g.node_index else set()),key=g.node_index.__getitem__)
                if len(seed_nodes)>192:raise ValueError('Auxiliary seed-row budget exceeded')
                n=len(g.osm_ids);m=matrices[k]
                if n+1>g.report['resource_limits']['nodes'] or m.nnz+len(seed_nodes)>g.report['resource_limits']['arcs']:raise ValueError('Working shard including auxiliary row exceeds original node/arc caps')
                working_nodes[k]=max(working_nodes[k],n+1);working_arcs[k]=max(working_arcs[k],m.nnz+len(seed_nodes))
                indices=np.asarray([g.node_index[node] for node in seed_nodes],dtype=np.int32)
                data=np.concatenate((m.data,np.full(len(seed_nodes),np.inf)))
                matrix=csr_array((data,np.concatenate((m.indices,indices)),np.concatenate((m.indptr,np.asarray([m.nnz+len(seed_nodes)],dtype=np.int32)))),shape=(n+1,n+1))
                auxiliary.append((matrix,seed_nodes,indices))
            sweeps=0;last_initial=[None,None]
            while True:
                sweeps+=1;changed=False
                for k,g in enumerate(self.graphs):
                    matrix,seed_nodes,seed_indices=auxiliary[k]
                    initial=[];prefix_refs={}
                    for node,index in zip(seed_nodes,seed_indices):
                        j=boundary_lookup.get(node)
                        value=boundary_values[j] if j is not None else math.inf
                        ref=boundary_refs[j] if j is not None else None
                        if node==source:value,ref=0.,0
                        initial.append(value);prefix_refs[int(index)]=(float(value),ref)
                    if not any(math.isfinite(float(v)) for v in initial):continue
                    initial=np.asarray(initial,dtype=np.float64)
                    if last_initial[k] is not None and np.array_equal(initial,last_initial[k]):
                        cached_skips+=1;continue  # same deterministic local closure was already applied
                    last_initial[k]=initial.copy()
                    matrix.data[-len(seed_nodes):]=initial
                    labels,pred=call(matrix,len(g.osm_ids))
                    roots={};phase_records={}
                    def seed_root(index):
                        nonlocal trace_steps
                        trail=[];current=index
                        while current not in roots:
                            trace_steps+=1
                            if trace_steps>64000000 or len(trail)>len(g.osm_ids):raise ValueError('Predecessor tracing budget exceeded')
                            if not 0<=current<len(g.osm_ids):raise ValueError('Invalid auxiliary predecessor')
                            parent=int(pred[current]);trail.append(current)
                            if parent==len(g.osm_ids):
                                root=current;break
                            current=parent
                        else:root=roots[current]
                        for item in trail:
                            if len(roots)<1000000:roots[item]=root
                        return root
                    def reference(node,value):
                        index=g.node_index[node]
                        if index in phase_records:return phase_records[index]
                        root=seed_root(index);initial_value,parent_ref=prefix_refs[root]
                        if parent_ref is None or not math.isfinite(initial_value):raise ValueError('Auxiliary path lacks valid initial prefix')
                        local_cost=value-initial_value
                        if not math.isfinite(local_cost) or local_cost<0:raise ValueError('Invalid native leg cost')
                        if len(records)>=200000:raise ValueError('Boundary history budget exceeded')
                        records.append((k,int(g.osm_ids[root]),node,local_cost,parent_ref))
                        phase_records[index]=len(records)-1;return len(records)-1
                    for j,node in enumerate(self.boundary):
                        value=float(labels[g.node_index[node]])
                        if math.isnan(value) or value<0:raise ValueError('Invalid boundary label')
                        if value<boundary_values[j]:
                            boundary_refs[j]=reference(node,value);boundary_values[j]=value;changed=True
                    for node in targets:
                        if node not in g.node_index:continue
                        value=float(labels[g.node_index[node]])
                        if math.isnan(value) or value<0:raise ValueError('Invalid target label')
                        if value<target_values[node]:target_refs[node]=reference(node,value);target_values[node]=value
                    del labels,pred
                if not changed:break
            rounds.append(dict(source=source,complete_sweeps=sweeps,converged=True))
            if progress is not None:progress(dict(source=source,complete_sweeps=sweeps,local_dijkstra_calls_so_far=calls))
            for target in targets:
                value=target_values[target];legs=[];ref=target_refs[target]
                if math.isfinite(value):
                    if ref is None:raise ValueError('Finite target lacks a prefix history')
                    while ref:
                        k,start,end,cost,parent=records[ref]
                        if not 0<=parent<ref:raise ValueError('Cyclic boundary history')
                        key=(k,start,end);legs.append(key)
                        required.setdefault((k,start),set()).add(end);expected.setdefault(key,[]).append(cost)
                        ref=parent;segments_total+=1
                        if segments_total>200000:raise ValueError('Composed segment budget exceeded')
                    legs.reverse();current=source
                    for _,start,end in legs:
                        if start!=current:raise ValueError('Composed native legs do not join')
                        current=end
                    if current!=target:raise ValueError('Composed target identity mismatch')
                results.append(dict(source=source,target=target,cost=value if math.isfinite(value) else None,segments=legs))
            del auxiliary,records
        propagation_calls=calls;replayed={};raw_nodes=0
        for (k,source),destinations in sorted(required.items()):
            g=self.graphs[k];matrix=matrices[k]
            labels,pred=call(matrix,g.node_index[source])
            for target in sorted(destinations):
                key=(k,source,target);path,total=trace_path(matrix,pred,g.node_index[source],g.node_index[target])
                raw_nodes+=len(path)
                if raw_nodes>64000000:raise ValueError('Native replay-node budget exceeded')
                value=float(labels[g.node_index[target]])
                if not close(total,value) or any(not close(total,cost) for cost in expected[key]):raise ValueError('Native replay disagrees with boundary prefix leg')
                raw=np.asarray(g.osm_ids[path],dtype='<u8')
                leg=dict(shard=k,**{'from':source,'to':target},exact_stored_path_cost=[str(total.numerator),str(total.denominator)],
                         raw_node_count=len(raw),solver_path_sha256=hashlib.sha256(raw.tobytes()).hexdigest(),
                         actual_directed_path_sha256=hashlib.sha256((raw[::-1] if reverse else raw).tobytes()).hexdigest(),
                         solver_path_orientation='reversed_model_graph' if reverse else 'model_graph')
                if keep_paths:leg['solver_node_path']=list(map(int,raw))
                replayed[key]=leg
            del labels,pred
        finite=0
        for row in results:
            if row['cost'] is None:row['exact_stored_path_cost']=None;continue
            total=sum((Fraction(*map(int,replayed[key]['exact_stored_path_cost'])) for key in row['segments']),Fraction(0))
            if not close(total,row['cost']):raise ValueError('Composed native replay disagrees with fixed-point cost')
            row['exact_stored_path_cost']=[str(total.numerator),str(total.denominator)];finite+=1
        return dict(solver_policy=POLICY,release_eligible=False,access_certified=False,road_coverage_certified=False,complete_global_competition=False,
                    metric=metric,reverse=reverse,results=results,legs=list(replayed.values()),finite_queries_replayed=finite,
                    local_dijkstra_calls=calls,propagation_dijkstra_calls=propagation_calls,replay_dijkstra_calls=calls-propagation_calls,
                    fixed_point_sweeps=rounds,converged=True,working_shard_nodes=working_nodes,working_shard_arcs=working_arcs,dense_overlay_constructed=False,auxiliary_nodes_per_shard=1,
                    native_predecessor_steps=trace_steps,native_replay_nodes=raw_nodes,cached_unchanged_local_passes=cached_skips,
                    warning='Exact graph-only node-state query model; no connectors, turns/grade, datum alignment or geographic/exterior closure certified.')
