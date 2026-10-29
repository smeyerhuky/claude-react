"""Query-scoped pruning of unqueried components and non-query undirected leaves.

With nonnegative node-state arc weights, deleting an undirected leaf that is not
an endpoint cannot raise a shortest-path cost between protected endpoints. The
original shard graphs remain intact; returned views are locked to that query set.
"""
from array import array
import hashlib
import json

import numpy as np
from scipy.sparse import csr_array
from scipy.sparse.csgraph import connected_components

from road_partition_oracle import validate
from road_primitive_sparse import PrimitiveSparseGraph

POLICY='query-protected-undirected-leaf-core-v1'


def prune(graphs, protected):
    if len(graphs)!=2 or not 1<=len(protected)<=64 or any(type(n) is not int or not 0<n<=2**63-1 for n in protected) or len(set(protected))!=len(protected):
        raise ValueError('Two shards and at most 64 unique protected endpoints required')
    for g in graphs:
        validate(g)
        if 'query_view_policy' in g.report:raise ValueError('Fresh full shards required; never reuse a pruned view for new endpoints')
    a,b=graphs;n=[len(g.osm_ids) for g in graphs]
    old=np.fromiter((a.node_index.get(int(node),-1) for node in b.osm_ids),dtype=np.int32,count=n[1])
    shared=np.flatnonzero(old>=0)
    if len(shared)>100000:raise ValueError('Shared-vertex query-audit budget exceeded')
    if not np.array_equal(a.longitude[old[shared]],b.longitude[shared]) or not np.array_equal(a.latitude[old[shared]],b.latitude[shared]):
        raise ValueError('Shared node geometry disagreement')
    inverse={int(old[j]):int(j) for j in shared}
    guarded=[np.zeros(size,dtype=bool) for size in n]
    for node in protected:
        found=False
        for k,g in enumerate(graphs):
            if node in g.node_index:guarded[k][g.node_index[node]]=True;found=True
        if not found:raise ValueError('Missing protected endpoint')
    # Structural ones retain genuine zero-weight arcs. Never eliminate zeros on
    # the weighted road matrices; structural diagonals are ignored as neighbors.
    undirected=[];degrees=[];labels=[];counts=[]
    for g in graphs:
        structure=csr_array((np.ones(g.length.nnz,dtype=np.uint8),g.length.indices,g.length.indptr),shape=g.length.shape)
        u=structure.maximum(structure.T).tocsr()
        if u.nnz>40000000:raise ValueError('Structural scratch-shard arc budget exceeded')
        undirected.append(u)
        degrees.append(np.diff(u.indptr).astype(np.int32)-(u.diagonal()!=0).astype(np.int32))
        count,label=connected_components(u,directed=False,return_labels=True)
        counts.append(count);labels.append(label)
    parent=np.arange(sum(counts),dtype=np.int32)
    def root(i):
        while parent[i]!=i:
            parent[i]=parent[parent[i]];i=int(parent[i])
        return i
    for j in shared:
        x,y=root(int(labels[0][old[j]])),root(counts[0]+int(labels[1][j]))
        if x!=y:parent[y]=x
    query_roots=set()
    for k in range(2):
        offset=0 if k==0 else counts[0]
        query_roots.update(root(offset+int(labels[k][i])) for i in np.flatnonzero(guarded[k]))
    removed=[]
    for k in range(2):
        offset=0 if k==0 else counts[0]
        roots=np.fromiter((root(offset+i) for i in range(counts[k])),dtype=np.int32,count=counts[k])
        keep_component=np.isin(roots,list(query_roots))
        removed.append(~keep_component[labels[k]])
    del parent,labels
    # Canonical shared vertices use shard 0. Shared rows may contain duplicate
    # structural edges in both original shards: degree must count neighbors once.
    def code(k,i):return int(old[i]) if k==1 and old[i]>=0 else (i if k==0 else n[0]+i)
    for west,east in inverse.items():
        neighbors=set()
        for k,i in ((0,west),(1,east)):
            u=undirected[k]
            neighbors.update(code(k,int(j)) for j in u.indices[u.indptr[i]:u.indptr[i+1]] if code(k,int(j))!=west)
        degrees[0][west]=len(neighbors)
        if removed[0][west]!=removed[1][east]:raise ValueError('Shared component membership mismatch')
    initial_removed=int(removed[0].sum()+removed[1].sum()-removed[0][old[shared]].sum())
    scheduled=[np.zeros(size,dtype=bool) for size in n]
    queue=array('I')
    if queue.itemsize!=4:raise ValueError('32-bit query queue required')
    def enqueue(k,i):
        if k==1 and old[i]>=0:k,i=0,int(old[i])
        if not removed[k][i] and not guarded[k][i] and not scheduled[k][i] and degrees[k][i]<=1:
            if len(queue)>=30000000:raise ValueError('Bounded two-shard query queue exceeded')
            scheduled[k][i]=True;queue.append(i if k==0 else n[0]+i)
    for k in range(2):
        candidates=np.flatnonzero((degrees[k]<=1)&~removed[k]&~guarded[k])
        for i in candidates:
            if k==0 or old[i]<0:enqueue(k,int(i))
    cursor=0;leaves=0
    while cursor<len(queue):
        value=queue[cursor];cursor+=1
        k,i=(0,value) if value<n[0] else (1,value-n[0])
        if removed[k][i] or guarded[k][i] or degrees[k][i]>1:raise ValueError('Invalid leaf-pruning state')
        locations=[(k,i)]
        if k==0 and i in inverse:locations.append((1,inverse[i]))
        for s,j in locations:removed[s][j]=True
        neighbors=set()
        for s,j in locations:
            u=undirected[s]
            for target in u.indices[u.indptr[j]:u.indptr[j+1]]:
                encoded=code(s,int(target));owner,index=(0,encoded) if encoded<n[0] else (1,encoded-n[0])
                if not removed[owner][index]:neighbors.add(encoded)
        if len(neighbors)>1:raise ValueError('Leaf has multiple surviving global neighbors')
        for encoded in neighbors:
            owner,index=(0,encoded) if encoded<n[0] else (1,encoded-n[0])
            degrees[owner][index]-=1
            if degrees[owner][index]<0:raise ValueError('Negative surviving degree')
            enqueue(owner,index)
        leaves+=1
    for k in range(2):
        if np.any(removed[k]&guarded[k]):raise ValueError('Protected endpoint removed')
    ids=sorted(protected);identity=hashlib.sha256(json.dumps(ids,separators=(',',':')).encode()).hexdigest()
    # Drop zero-incident ownership entries from each query view. Retaining a
    # globally surviving vertex in an empty owner would create a fake port.
    node_keep=[]
    for k,g in enumerate(graphs):
        coo=g.length.tocoo(copy=False)
        keep=~removed[k][coo.row]&~removed[k][coo.col]
        active=np.zeros(n[k],dtype=bool)
        active[coo.row[keep]]=True;active[coo.col[keep]]=True
        node_keep.append(active)
    for node in ids:
        if not any(node in g.node_index and node_keep[k][g.node_index[node]] for k,g in enumerate(graphs)):
            for k,g in enumerate(graphs):
                if node in g.node_index:
                    node_keep[k][g.node_index[node]]=True;break
    views=[]
    for k,g in enumerate(graphs):
        coo=g.length.tocoo(copy=False)
        keep=~removed[k][coo.row]&~removed[k][coo.col]
        kept_nodes=np.flatnonzero(node_keep[k]);size=len(kept_nodes)
        remap=np.full(n[k],-1,dtype=np.int32);remap[kept_nodes]=np.arange(size,dtype=np.int32)
        rows=remap[coo.row[keep]];indices=remap[g.length.indices[keep]]
        if np.any(rows<0) or np.any(indices<0):raise ValueError('Query compaction lost an incident node')
        indptr=np.zeros(size+1,dtype=np.int32)
        indptr[1:]=np.cumsum(np.bincount(rows,minlength=size),dtype=np.int64)
        matrices=[csr_array((getattr(g,metric).data[keep],indices,indptr),shape=(size,size)) for metric in ('length','travel_time')]
        osm_ids=g.osm_ids[kept_nodes]
        index={int(node):i for i,node in enumerate(osm_ids)}
        report=dict(g.report,nodes=size,unique_directed_pairs=int(matrices[0].nnz),query_view_policy=POLICY,
                    query_protected_node_ids=ids,query_protected_node_ids_sha256=identity,
                    raw_arc_count_scope='original full shard before parallel reduction and query pruning',
                    original_unique_directed_pairs=g.report['unique_directed_pairs'],original_full_shard_nodes=n[k],
                    node_inventory_scope='query-active nodes plus globally isolated protected endpoints')
        views.append(PrimitiveSparseGraph(index,osm_ids,g.longitude[kept_nodes],g.latitude[kept_nodes],*matrices,report))
    audit={'policy':POLICY,'protected_osm_node_ids':ids,'protected_node_set_sha256':identity,
           'removed_unqueried_component_nodes':initial_removed,'removed_nonquery_leaf_nodes':leaves,
           'original_shared_vertices':len(shared),'globally_surviving_shared_vertices':int((~removed[0][old[shared]]).sum()),
           'surviving_shared_vertices':int((node_keep[0][old[shared]]&node_keep[1][shared]).sum()),
           'removed_node_entries_per_shard':[int(mask.sum()) for mask in removed],
           'original_directed_pairs':[g.length.nnz for g in graphs],
           'query_view_nodes':[len(g.osm_ids) for g in views],
           'retained_directed_pairs':[g.length.nnz for g in views],
           'arbitrary_new_endpoints_supported':False,'release_eligible':False,'access_certified':False}
    return tuple(views),audit
