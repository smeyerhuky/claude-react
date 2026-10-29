"""Rebuild the bounded original44-endpoint view for the33-source experiment."""
import json
from pathlib import Path
from cheyenne_graph_views import CODE,sha
from cheyenne_checkpoint import ROOT,REFERENCE,load_reference32
from colorado_adjacent_source_interfaces import HighwayReader,source_metadata,validate_sources
from colorado_exterior_parent_competition import SourceScan
from colorado_expanded_parent_competition import nearest_primitive_lead
from metro_scenario_checkpoint import FLAGS,require
from road_longitude_partition import LongitudePartitionBuilder
from road_query_leaf_core import prune
from road_query_view_cache import load,save

LAYOUT=ROOT/'docs/research/las-vegas-partition-layout/preflight.json'
NAMES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf','wyoming.osm.pbf','nevada.osm.pbf')


def prepare(paths,cache=None):
    baseline=load_reference32();reference=json.loads(LAYOUT.read_text());old={s['cbsa']:s for s in baseline['sources']};candidates={s['cbsa']:s for s in reference['candidate_sources']}
    require(len(old)==32 and set(candidates)==set(old)|{'29820'} and len(candidates)==33,'Exactly32 retained sources and Las Vegas required')
    require(reference['source_costs_computed']==0 and all(reference.get(f) is False for f in FLAGS),'Unapproved zero-cost preflight required')
    require(reference['retained32_checkpoint_sha256']==sha(REFERENCE/'baseline.json'),'Exact retained32-source checkpoint required')
    metadata=[source_metadata(p) for p in paths];validate_sources(metadata)
    manifest=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text());entries={r['filename']:r for r in manifest['files']}
    expected=[dict(name=n,sha256=entries[n]['sha256'],size_bytes=entries[n]['bytes'],replication_timestamp='2026-10-27T21:23:59Z') for n in NAMES]
    require(metadata==expected==reference['source_provenance'] and metadata[:7]==baseline['source_provenance'],'Exact ordered eight-source epoch required')
    domains_path=ROOT/'docs/research/utah-parent-reference/domains.json';require(sha(domains_path)==baseline['domains_sha256'],'Exact native domains required')
    domains={d['cbsa']:d for d in json.loads(domains_path.read_text())['domains']}
    endpoints=sorted({s['node'] for s in candidates.values()}|set(map(int,baseline['probe_coordinates_lonlat'])))
    require(len(endpoints)==44 and endpoints==reference['query_core_audit']['protected_osm_node_ids'],'Fresh protected44-endpoint scope required')
    binding=dict(source_provenance=metadata,protected_node_ids=endpoints,baseline_sha256=sha(REFERENCE/'baseline.json'),domains_sha256=baseline['domains_sha256'],graph_code_sha256={n:sha(ROOT/'scripts'/n) for n in CODE})
    if cache is not None and Path(cache).exists():
        views,context=load(cache,binding);print('[Session cache] exact original44 query views validated',flush=True)
    else:
        builder=LongitudePartitionBuilder(-107.4)
        for path in paths:
            HighwayReader(SourceScan(builder)).apply_file(str(path),locations=True,idx='sparse_mem_array')
            print('[Source]',path.name,[len(b.ids) for b in builder.builders],[len(b.u) for b in builder.builders],flush=True)
        graphs,assignment=builder.finish();del builder
        sources=[dict(s) for s in baseline['sources']];point=domains['29820']['native_representative_lonlat']
        sources.append(dict(cbsa='29820',native_origin_lonlat=point,**nearest_primitive_lead(graphs[0],point),lead_policy='unapproved-nearest-primitive-vertex-in-nevada-containing-shard',access_verified=False,connector_costs_included=False))
        full=[dict(g.report) for g in graphs];views,query=prune(graphs,endpoints);del graphs
        context=dict(schema='las-vegas-eight-state-query-preflight-v1',source_provenance=metadata,candidate_sources=sources,full_partition_graphs=full,partition_assignment_audit=assignment,query_core_audit=query,source_costs_computed=0,access_certified=False,release_eligible=False,complete_global_competition=False,road_coverage_certified=False,urban_anchor_adopted=False,ingestion_cut=-107.4)
        if cache is not None:save(views,cache,binding,context)
    for key in ('source_provenance','candidate_sources','full_partition_graphs','partition_assignment_audit','query_core_audit'):
        require(context[key]==reference[key],'Original44 source or graph inventory changed: '+key)
    sources=[]
    for candidate in context['candidate_sources']:
        s=dict(candidate)
        if s['cbsa'] in old:
            require(s==old[s['cbsa']],'Retained source record changed before query layout')
            s['retained32_reference_record']=dict(old[s['cbsa']])
        require(s['native_origin_lonlat']==domains[s['cbsa']]['native_representative_lonlat'] and s['access_verified'] is False and s['connector_costs_included'] is False,'Native point or unapproved access policy changed')
        require(any(s['node'] in g.node_index and s['node_lonlat']==[float(g.longitude[g.node_index[s['node']]]),float(g.latitude[g.node_index[s['node']]])] for g in views),'Source geometry missing')
        sources.append(s)
    for node,point in baseline['probe_coordinates_lonlat'].items():require(any(int(node) in g.node_index and point==[float(g.longitude[g.node_index[int(node)]]),float(g.latitude[g.node_index[int(node)]])] for g in views),'Inherited probe geometry changed')
    result={k:v for k,v in context.items() if k not in ('schema','candidate_sources','source_costs_computed')}
    result.update(sources=sources,domains_sha256=baseline['domains_sha256'],retained32_checkpoint_sha256=sha(REFERENCE/'baseline.json'),candidate_reference_sha256=sha(LAYOUT),full_model_union_nodes=sum(g['nodes'] for g in context['full_partition_graphs'])-context['query_core_audit']['original_shared_vertices'])
    return views,result,baseline
