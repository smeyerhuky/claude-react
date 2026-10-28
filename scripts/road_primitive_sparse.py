"""Research-only directed primitive OSM CSR graphs, with explicit zero arcs.

Metric-specific minimum, never sum, combines parallel arcs for shortest paths.
Parallel reduction assumes node-state routing without edge-specific turn
penalties. Revisit the representation before adding turn restrictions.
This is not a source-coverage, legal-access or turn-restriction certificate.
"""
from array import array
from dataclasses import dataclass
import math

import numpy as np
from scipy.sparse import csr_array

from colorado_raw_boundary_interfaces import fingerprint
from stream_osm_roads import SPEED_KPH, direction_flags, drivable, meters
from types import SimpleNamespace


@dataclass
class PrimitiveSparseGraph:
    node_index: dict
    osm_ids: np.ndarray
    longitude: np.ndarray
    latitude: np.ndarray
    length: csr_array
    travel_time: csr_array
    report: dict


class PrimitiveSparseBuilder:
    def __init__(self, *, max_nodes=10000000, max_arcs=25000000):
        if (type(max_nodes) is not int or not 1 <= max_nodes <= 15000000 or
                type(max_arcs) is not int or not 1 <= max_arcs <= 40000000):
            raise ValueError("Explicit bounded primitive graph resources required")
        if array('I').itemsize != 4 or array('Q').itemsize != 8 or array('d').itemsize != 8:
            raise ValueError("Need 32-bit dense indices, 64-bit OSM IDs and binary64 costs")
        self.max_nodes,self.max_arcs=max_nodes,max_arcs
        self.node_index,self.fingerprints={},{}
        self.ids,self.lon,self.lat=array('Q'),array('d'),array('d')
        self.u,self.v=array('I'),array('I')
        self.length,self.time=array('d'),array('d')
        self.failed=self.finished=False
        self.overlaps=self.ways=self.unsupported=self.zero_arcs=0

    def _node(self, point):
        node,x,y=point
        if node > 2**63-1:
            raise ValueError("OSM node ID outside supported signed 64-bit range")
        index=self.node_index.get(node)
        if index is not None:
            if (self.lon[index],self.lat[index]) != (x,y):
                raise ValueError("Source node coordinates disagree across ways")
            return index
        if len(self.ids) >= self.max_nodes:
            raise ValueError("Primitive node resource limit exceeded")
        index=len(self.ids)
        self.node_index[node]=index
        self.ids.append(node);self.lon.append(x);self.lat.append(y)
        return index

    def _arc(self, u, v, length, time):
        if len(self.u) >= self.max_arcs:
            raise ValueError("Primitive arc resource limit exceeded")
        if not all(math.isfinite(x) and x >= 0 for x in (length,time)):
            raise ValueError("Finite nonnegative explicit primitive costs required")
        self.u.append(u);self.v.append(v)
        self.length.append(length);self.time.append(time)
        self.zero_arcs += length == 0

    def add(self, way, tags, points):
        try:
            if self.failed or self.finished:
                raise ValueError("Cannot mutate failed or finished source scan")
            digest=fingerprint(way,tags,points)
            old=self.fingerprints.get(way)
            if old is not None:
                if old != digest:raise ValueError("Overlapping source way disagrees")
                self.overlaps+=1
                return
            if len(self.fingerprints) >= 5000000:
                raise ValueError("Highway fingerprint resource limit exceeded")
            self.fingerprints[way]=digest
            if not drivable(SimpleNamespace(tags=tags)):return
            directions=direction_flags(tags)
            if directions is None:
                self.unsupported+=1
                return
            speed=SPEED_KPH[tags["highway"]]
            posted=tags.get("maxspeed","").strip().lower()
            part=posted.split(" ")[0] if posted else ""
            if part.isdecimal():speed=max(5,min(140,int(part)*(1.609344 if "mph" in posted else 1)))
            for a,b in zip(points,points[1:]):
                u,v=self._node(a),self._node(b)
                length=meters(a[1:],b[1:])
                time=length/(speed*1000/3600)
                if directions[0]:self._arc(u,v,length,time)
                if directions[1]:self._arc(v,u,length,time)
            self.ways+=1
        except Exception:
            self.failed=True
            raise

    def finish(self):
        return self._materialize(close=True)

    def snapshot(self):
        """Freeze an independent prefix graph while allowing further sources."""
        return self._materialize(close=False)

    def _materialize(self, *, close):
        if self.failed or self.finished or not self.u:
            raise ValueError("Cannot finish failed, empty or finished source scan")
        self.finished=close
        nodes,arcs=len(self.ids),len(self.u)
        u=np.frombuffer(self.u,dtype=np.uint32)
        v=np.frombuffer(self.v,dtype=np.uint32)
        order=np.lexsort((v,u))
        ordered_u,ordered_v=u[order],v[order]
        starts=np.concatenate((np.array([0],dtype=np.int64),
            np.flatnonzero((ordered_u[1:]!=ordered_u[:-1]) | (ordered_v[1:]!=ordered_v[:-1]))+1))
        rows=ordered_u[starts]
        indices=ordered_v[starts].astype(np.int32)
        lengths=np.minimum.reduceat(np.frombuffer(self.length,dtype=np.float64)[order],starts)
        times=np.minimum.reduceat(np.frombuffer(self.time,dtype=np.float64)[order],starts)
        indptr=np.zeros(nodes+1,dtype=np.int32)
        indptr[1:]=np.cumsum(np.bincount(rows,minlength=nodes),dtype=np.int32)
        # Construct CSR directly: COO->CSR would SUM duplicate edges. Never
        # eliminate stored zeros: they can connect distinct coincident OSM IDs.
        length=csr_array((lengths,indices,indptr),shape=(nodes,nodes),copy=False)
        travel_time=csr_array((times,indices,indptr),shape=(nodes,nodes),copy=False)
        report={"routing_model":"static-passenger-car-v2:directed-primitive-sparse-reference",
                "release_eligible":False,"access_certified":False,"complete_global_competition":False,
                "road_coverage_certified":False,"turn_restrictions_modeled":False,
                "nodes":nodes,"directed_primitive_arcs":arcs,"unique_directed_pairs":int(length.nnz),
                "zero_length_primitive_arcs_retained":self.zero_arcs,
                "modeled_ways":self.ways,"exact_duplicate_highway_ways":self.overlaps,
                "unsupported_direction_ways":self.unsupported,
                "parallel_cost_policy":"per-metric minimum, not summation; explicit zero arcs retained",
                "resource_limits":{"nodes":self.max_nodes,"arcs":self.max_arcs}}
        ids=np.frombuffer(self.ids,dtype=np.uint64)
        lon=np.frombuffer(self.lon,dtype=np.float64)
        lat=np.frombuffer(self.lat,dtype=np.float64)
        result=PrimitiveSparseGraph(self.node_index if close else self.node_index.copy(),
            ids if close else ids.copy(),lon if close else lon.copy(),lat if close else lat.copy(),length,travel_time,report)
        if close:
            self.fingerprints.clear()
            del self.u,self.v,self.length,self.time
        return result
