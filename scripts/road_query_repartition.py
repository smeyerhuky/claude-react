"""Reassign existing protected-view native pairs, never a full road union matrix.

The source ingestion layout and its full-resource proof remain unchanged. This
second layout operates only on the already proven query view and cannot add new
query endpoints. Every input weighted pair is assigned once without changing a
native identity, coordinate, direction or cost.
"""
import math
import numpy as np
from road_partition_oracle import validate
from road_primitive_sparse import PrimitiveSparseBuilder


def repartition(graphs,cut,*,max_nodes=15000000,max_arcs=40000000):
    if len(graphs)!=2 or type(cut) not in (int,float) or not math.isfinite(cut) or not -180<cut<180:raise ValueError('Two protected query views and a finite cut required')
    for g in graphs:
        validate(g)
        if 'query_view_policy' not in g.report:raise ValueError('Protected views required')
    protected=graphs[0].report['query_protected_node_ids']
    if protected!=graphs[1].report['query_protected_node_ids']:raise ValueError('Matching protected scope required')
    builders=[PrimitiveSparseBuilder(max_nodes=max_nodes,max_arcs=max_arcs) for _ in [0,1]]
    mappings=[];node_masks=[];assigned=0;input_arcs=sum(g.length.nnz for g in graphs)
    for g in graphs:
        masks=np.zeros(len(g.osm_ids),dtype=np.uint8)
        for start in range(0,len(g.osm_ids),100000):
            end=min(start+100000,len(g.osm_ids));left,right=g.length.indptr[start],g.length.indptr[end]
            if right-left>2000000:raise ValueError('Repartition scratch arc budget exceeded')
            rows=np.repeat(np.arange(start,end),np.diff(g.length.indptr[start:end+1]));cols=g.length.indices[left:right]
            flags=np.where((g.longitude[rows]+g.longitude[cols])/2<cut,1,2).astype(np.uint8)
            np.bitwise_or.at(masks,rows,flags);np.bitwise_or.at(masks,cols,flags)
        node_masks.append(masks)
    shared=[]
    for j,node in enumerate(graphs[1].osm_ids):
        i=graphs[0].node_index.get(int(node))
        if i is not None:
            if graphs[0].longitude[i]!=graphs[1].longitude[j] or graphs[0].latitude[i]!=graphs[1].latitude[j]:raise ValueError('Shared native geometry mismatch')
            shared.append((i,j))
            if len(shared)>100000:raise ValueError('Shared query-audit inventory budget exceeded')
            mask=node_masks[0][i]|node_masks[1][j];node_masks[0][i]=mask;node_masks[1][j]=mask
    for g,masks in zip(graphs,node_masks):
        # Assign globally isolated vertices exactly once, without extra portals.
        empty=masks==0;masks[empty]=np.where(g.longitude[empty]<cut,1,2)
        maps=[np.full(len(g.osm_ids),-1,dtype=np.int32) for _ in [0,1]]
        for owner,builder in enumerate(builders):
            for i in np.flatnonzero(masks&(1<<owner)):
                maps[owner][i]=builder._node((int(g.osm_ids[i]),float(g.longitude[i]),float(g.latitude[i])))
        mappings.append(maps)
    for k,g in enumerate(graphs):
        for start in range(0,len(g.osm_ids),100000):
            end=min(start+100000,len(g.osm_ids));left,right=g.length.indptr[start],g.length.indptr[end]
            if right-left>2000000:raise ValueError('Repartition scratch arc budget exceeded')
            rows=np.repeat(np.arange(start,end),np.diff(g.length.indptr[start:end+1]));cols=g.length.indices[left:right]
            owners=((g.longitude[rows]+g.longitude[cols])/2>=cut)
            for owner,builder in enumerate(builders):
                selected=owners==bool(owner);u=mappings[k][owner][rows[selected]];v=mappings[k][owner][cols[selected]]
                if np.any(u<0) or np.any(v<0):raise ValueError('Native-pair reassignment lacks endpoint ownership')
                ids=np.frombuffer(builder.ids,dtype=np.uint64)
                if not np.array_equal(ids[u],g.osm_ids[rows[selected]]) or not np.array_equal(ids[v],g.osm_ids[cols[selected]]):raise ValueError('Emitted pair changed a native identity')
                count=len(u)
                if len(builder.u)+count>max_arcs:raise ValueError('Original per-shard arc budget exceeded')
                lengths=g.length.data[left:right][selected];times=g.travel_time.data[left:right][selected]
                builder.u.frombytes(u.astype(np.uint32).tobytes());builder.v.frombytes(v.astype(np.uint32).tobytes())
                builder.length.frombytes(lengths.astype(np.float64).tobytes());builder.time.frombytes(times.astype(np.float64).tobytes())
                builder.zero_arcs+=int(np.count_nonzero(lengths==0));assigned+=count
    if assigned!=input_arcs or any(not b.u for b in builders):raise ValueError('Complete nonempty two-shard pair assignment required')
    result=[]
    for builder in builders:
        g=builder.finish();g.report.update(query_view_policy=graphs[0].report['query_view_policy'],
                    query_protected_node_ids=protected,query_protected_node_ids_sha256=graphs[0].report['query_protected_node_ids_sha256'],
                    arbitrary_new_endpoints_supported=False,query_repartition_policy='native-weighted-pair-midpoint-v1',
                    query_repartition_longitude_cut=cut,modeled_way_count_scope='No original ways reingested; protected native weighted pairs only')
        validate(g);result.append(g)
    old_shared=len(shared)
    new_shared=sum(int(n) in result[0].node_index for n in result[1].osm_ids)
    if sum(len(g.osm_ids) for g in graphs)-old_shared!=sum(len(g.osm_ids) for g in result)-new_shared:raise ValueError('Native vertex inventory changed')
    return tuple(result),dict(policy='protected-native-weighted-pair-repartition-v1',query_cut=cut,
                protected_node_ids=protected,protected_node_set_sha256=graphs[0].report['query_protected_node_ids_sha256'],
                input_query_nodes=[len(g.osm_ids) for g in graphs],output_query_nodes=[len(g.osm_ids) for g in result],
                input_pair_entries=input_arcs,assigned_pair_entries=assigned,output_unique_pairs=[g.length.nnz for g in result],
                input_shared_vertices=old_shared,output_shared_vertices=new_shared,
                native_vertices_omitted=0,new_native_vertices_created=0,coordinate_changes=0,
                full_source_repartition_constructed=False,flattened_weighted_union_constructed=False,
                arbitrary_new_endpoints_supported=False,release_eligible=False,access_certified=False)
