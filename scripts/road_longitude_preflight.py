"""Bounded one-pass candidate-cut inventory; no graph matrix or access approval."""
from array import array
import bisect
import math

import numpy as np

from colorado_raw_boundary_interfaces import fingerprint, supported
from road_source_fingerprint_store import DiskFingerprintStore
from stream_osm_roads import direction_flags


class LongitudeCutSweep:
    def __init__(self, cuts, *, max_node_records=30000000, max_raw_arcs=80000000, max_raw_ways=10000000):
        if (not 1<=len(cuts)<=256 or any(type(x) not in (int,float) or not math.isfinite(x) or not -180<x<180 for x in cuts)
                or list(cuts)!=sorted(set(cuts))):
            raise ValueError('At most 256 finite ordered distinct interior cuts required')
        if type(max_node_records) is not int or not 1<=max_node_records<=30000000:
            raise ValueError('Bounded aggregate two-shard node inventory required')
        if type(max_raw_arcs) is not int or not 1<=max_raw_arcs<=80000000:
            raise ValueError('Bounded aggregate two-shard raw-arc inventory required')
        self.cuts=list(cuts);self.index={};self.lo=array('H');self.hi=array('H')
        if self.lo.itemsize!=2:raise ValueError('16-bit cut inventory required')
        self.seen=DiskFingerprintStore(max_records=max_raw_ways)
        self.arc_hist=[0]*(len(cuts)+1);self.raw_arcs=0;self.duplicates=0
        self.max_nodes=max_node_records;self.max_arcs=max_raw_arcs
        self.failed=self.finished=False

    def add(self,way,tags,points):
        try:
            if self.failed or self.finished:raise ValueError('Cannot resume failed/finished cut sweep')
            if not self.seen.register(way,fingerprint(way,tags,points)):
                self.duplicates+=1;return
            if not supported(tags):return
            multiplicity=sum(direction_flags(tags))
            for a,b in zip(points,points[1:]):
                cutoff=bisect.bisect_right(self.cuts,(a[1]+b[1])/2)
                self.arc_hist[cutoff]+=multiplicity;self.raw_arcs+=multiplicity
                if self.raw_arcs>self.max_arcs:raise ValueError('Aggregate raw-arc sweep budget exceeded')
                for node in (a[0],b[0]):
                    if node>2**63-1:raise ValueError('Node exceeds signed-64-bit identity range')
                    index=self.index.get(node)
                    if index is None:
                        if len(self.index)>=self.max_nodes:raise ValueError('Aggregate node sweep budget exceeded')
                        self.index[node]=len(self.lo);self.lo.append(cutoff);self.hi.append(cutoff)
                    else:
                        if cutoff<self.lo[index]:self.lo[index]=cutoff
                        if cutoff>self.hi[index]:self.hi[index]=cutoff
        except Exception:
            self.failed=True;self.seen.close();raise

    def finish(self):
        if self.failed or self.finished:raise ValueError('Cannot finish failed/finished cut sweep')
        lo=np.cumsum(np.bincount(np.frombuffer(self.lo,dtype=np.uint16),minlength=len(self.cuts)+1))
        hi=np.cumsum(np.bincount(np.frombuffer(self.hi,dtype=np.uint16),minlength=len(self.cuts)+1))
        arcs=np.cumsum(self.arc_hist);total=len(self.index);rows=[]
        for i,cut in enumerate(self.cuts):
            west,east=int(lo[i]),total-int(hi[i]);wa,ea=int(arcs[i]),self.raw_arcs-int(arcs[i])
            shared=west+east-total
            rows.append({'longitude_cut':cut,'partition_nodes':[west,east],'partition_raw_arcs':[wa,ea],
                         'shared_node_count':shared,'node_arc_budgets_pass':0<min(west,east) and max(west,east)<=15000000 and max(wa,ea)<=40000000,
                         'interface_cardinality_bound_pass':shared<=128})
        feasible=[r for r in rows if r['node_arc_budgets_pass'] and r['interface_cardinality_bound_pass']]
        feasible.sort(key=lambda r:(r['shared_node_count'],abs(r['partition_nodes'][0]-r['partition_nodes'][1]),r['longitude_cut']))
        self.seen.close();self.finished=True
        return {'cuts':rows,'selected_candidate':feasible[0] if feasible else None,
                'union_modeled_nodes':total,'raw_directed_arcs':self.raw_arcs,
                'raw_fingerprint_records':self.seen.count,'duplicate_raw_highways_verified':self.duplicates,
                'fingerprint_database_bytes':self.seen.final_size_bytes,
                'release_eligible':False,'access_certified':False}
