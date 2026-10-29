"""Local scheduling diagnostic over protected query views; no routing approval.

Counts alternate midpoint-cut interfaces without constructing a union matrix.
Original full-source budget preflight is still required for any chosen cut.
"""
import numpy as np
from road_partition_oracle import validate


def sweep(graphs,cuts):
    cuts=np.asarray(cuts,dtype=float)
    if len(graphs)!=2 or not 1<=len(cuts)<=256 or not np.all(np.isfinite(cuts)) or not np.all(np.diff(cuts)>0):
        raise ValueError('Two query views and ordered finite cuts required')
    if any('query_view_policy' not in g.report for g in graphs):raise ValueError('Protected views required')
    for graph in graphs:validate(graph)
    if graphs[0].report['query_protected_node_ids']!=graphs[1].report['query_protected_node_ids']:raise ValueError('Matching query scopes required')
    lows=[];highs=[]
    for g in graphs:
        low=np.full(len(g.osm_ids),len(cuts)+1,dtype=np.int16)
        high=np.full(len(g.osm_ids),-1,dtype=np.int16)
        # Bounded chunks avoid a second full-shard COO edge allocation.
        for start in range(0,len(g.osm_ids),100000):
            end=min(start+100000,len(g.osm_ids))
            left,right=g.length.indptr[start],g.length.indptr[end]
            rows=np.repeat(np.arange(start,end),np.diff(g.length.indptr[start:end+1]))
            cols=g.length.indices[left:right]
            bins=np.searchsorted(cuts,(g.longitude[rows]+g.longitude[cols])/2,side='right').astype(np.int16)
            for indices in (rows,cols):
                np.minimum.at(low,indices,bins);np.maximum.at(high,indices,bins)
        lows.append(low);highs.append(high)
    # Merge only identities present in both shards, never flatten road matrices.
    for j,node in enumerate(graphs[1].osm_ids):
        i=graphs[0].node_index.get(int(node))
        if i is not None:
            lows[0][i]=min(lows[0][i],lows[1][j]);highs[0][i]=max(highs[0][i],highs[1][j])
            lows[1][j]=len(cuts)+1;highs[1][j]=-1
    counts=np.zeros(len(cuts),dtype=np.int64)
    for low,high in zip(lows,highs):
        valid=(high>=0)&(low<high)
        delta=np.bincount(low[valid],minlength=len(cuts)+2)-np.bincount(high[valid],minlength=len(cuts)+2)
        counts+=np.cumsum(delta)[:len(cuts)]
    return {'protected_osm_node_ids':graphs[0].report['query_protected_node_ids'],
            'protected_node_set_sha256':graphs[0].report['query_protected_node_ids_sha256'],
            'arbitrary_new_endpoints_supported':False,'cuts':[{'longitude_cut':float(c),'query_shared_vertices':int(n)} for c,n in zip(cuts,counts)],
            'scope':'protected query node-state graph only; full-source cut budgets still required',
            'release_eligible':False,'access_certified':False}
