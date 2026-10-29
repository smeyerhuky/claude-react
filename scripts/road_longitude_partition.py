"""Assign every eligible primitive segment once; preserve the full model union.

Original way fingerprints are audited globally. Contiguous same-owner runs use
internal synthetic way IDs only to reuse the unchanged primitive weight builder.
No synthetic node, interpolated boundary point or cross-run chord is introduced.
"""
import math

from colorado_raw_boundary_interfaces import fingerprint, supported
from road_primitive_sparse import PrimitiveSparseBuilder
from road_source_fingerprint_store import DiskFingerprintStore


class LongitudePartitionBuilder:
    def __init__(self, longitude_cut, *, max_nodes=15000000, max_arcs=40000000, max_raw_ways=10000000):
        if type(longitude_cut) not in (int,float) or not math.isfinite(longitude_cut) or not -180<longitude_cut<180:
            raise ValueError('Finite interior longitude cut required')
        if type(max_raw_ways) is not int or not 1<=max_raw_ways<=10000000:
            raise ValueError('Bounded aggregate original-way audit required')
        self.cut=float(longitude_cut)
        self.builders=[PrimitiveSparseBuilder(max_nodes=max_nodes,max_arcs=max_arcs) for _ in range(2)]
        self.raw_fingerprints=DiskFingerprintStore(max_records=max_raw_ways);self.max_raw_ways=max_raw_ways
        self.duplicates=self.segments=self.runs=0
        self.failed=self.finished=False

    def add(self, way, tags, points):
        try:
            if self.failed or self.finished:raise ValueError('Cannot resume failed/finished partition scan')
            raw=fingerprint(way,tags,points)
            if not self.raw_fingerprints.register(way,raw):
                self.duplicates+=1;return
            if not supported(tags):return
            owner=None;run=[];run_index=0
            def emit(which,shape,index):
                if index>=2**20:raise ValueError('Contiguous-run identity budget exceeded')
                # Injective in (original way, run index). Never exposed as an OSM way ID.
                internal=(way<<20)|index
                self.builders[which].add(internal,tags,shape)
                self.runs+=1
            for a,b in zip(points,points[1:]):
                which=0 if (a[1]+b[1])/2<self.cut else 1
                if owner is None:owner=which;run=[a,b]
                elif owner==which:run.append(b)
                else:
                    emit(owner,run,run_index);run_index+=1
                    owner=which;run=[a,b]
                self.segments+=1
            if run:emit(owner,run,run_index)
        except Exception:
            self.failed=True
            self.raw_fingerprints.close()
            raise

    def finish(self):
        if self.failed or self.finished:raise ValueError('Cannot finish failed/finished partition scan')
        try:
            graphs=tuple(builder.finish() for builder in self.builders)
            self.raw_fingerprints.close()
            self.finished=True
        except Exception:
            self.failed=True
            self.raw_fingerprints.close()
            raise
        audit={'partition_policy':'primitive-segment-midpoint-longitude-v1','longitude_cut':self.cut,
               'ownership_rule':'west iff mean endpoint longitude < cut; east otherwise',
               'original_raw_highways_fingerprinted':self.raw_fingerprints.count,
               'original_fingerprint_record_limit':self.max_raw_ways,
               'original_fingerprint_database_byte_limit':1000000000,
               'original_fingerprint_cache_mib_limit':64,
               'original_fingerprint_database_bytes':self.raw_fingerprints.final_size_bytes,
               'duplicate_original_highways_verified':self.duplicates,
               'eligible_primitive_segments_assigned_once':self.segments,'contiguous_runs':self.runs,
               'internal_way_identity':'(original OSM way ID << 20) | contiguous run index; not an OSM way ID',
               'builder_way_counts_mean':'contiguous runs, not original raw ways',
               'new_boundary_nodes_created':0,'source_segments_omitted':0,
               'release_eligible':False,'access_certified':False}
        self.raw_fingerprints.close()
        return graphs,audit
