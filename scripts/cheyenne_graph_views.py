"""Prepare exactly43 protected nodes from seven resource-bounded original sources."""
import hashlib
import json
from pathlib import Path
from colorado_adjacent_source_interfaces import HighwayReader,source_metadata,validate_sources
from colorado_exterior_parent_competition import SourceScan
from colorado_expanded_parent_competition import nearest_primitive_lead
from road_longitude_partition import LongitudePartitionBuilder
from road_query_leaf_core import prune
from road_partition_oracle import validate
from six_state_checkpoint import REFERENCE,load_reference
from metro_scenario_checkpoint import FLAGS,require

ROOT=Path(__file__).resolve().parents[1]
NAMES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf','wyoming.osm.pbf')
CANDIDATES=ROOT/'docs/research/cheyenne-partition-layouts/initial-negative.json'
CODE=('road_primitive_sparse.py','stream_osm_roads.py','road_longitude_partition.py','road_query_leaf_core.py','colorado_adjacent_source_interfaces.py','colorado_raw_boundary_interfaces.py','road_source_fingerprint_store.py','colorado_exterior_parent_competition.py','colorado_expanded_parent_competition.py')


def sha(path):
    with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()


def prepare(paths,cache=None):
    baseline=load_reference();archive=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text());files={r['filename']:r for r in archive['files']}
    metadata=[source_metadata(p) for p in paths];validate_sources(metadata)
    expected=[dict(name=n,sha256=files[n]['sha256'],size_bytes=files[n]['bytes'],replication_timestamp='2026-10-27T21:23:59Z') for n in NAMES]
    require(metadata==expected and metadata[:6]==baseline['source_provenance'],'Exact ordered seven-source epoch required')
    domains_raw=(ROOT/'docs/research/utah-parent-reference/domains.json').read_bytes();require(hashlib.sha256(domains_raw).hexdigest()==baseline['domains_sha256'],'Exact native domains required')
    domains={r['cbsa']:r for r in json.loads(domains_raw)['domains']};old={s['cbsa']:s for s in baseline['sources']};reference=json.loads(CANDIDATES.read_text());candidates={s['cbsa']:s for s in reference['candidate_sources']}
    require(len(old)==31 and set(candidates)==set(old)|{'16940'} and len(candidates)==32,'Exact32-candidate research scope required')
    require(reference['source_provenance']==metadata and reference['source_costs_computed']==0 and all(reference.get(f) is False for f in FLAGS),'Unapproved source-bound candidate reference required')
    endpoints=sorted({s['node'] for s in candidates.values()}|set(map(int,baseline['probe_coordinates_lonlat'])))
    require(len(endpoints)==43 and endpoints==reference['query_core_audit']['protected_osm_node_ids'],'Exact protected43-endpoint scope required')
    binding=dict(source_provenance=metadata,candidate_reference_sha256=sha(CANDIDATES),retained_checkpoint_sha256=sha(REFERENCE/'baseline.json'),domains_sha256=baseline['domains_sha256'],ingestion_cut=-107.4,protected_node_ids=endpoints,graph_code_sha256={n:sha(ROOT/'scripts'/n) for n in CODE})
    if cache is not None and Path(cache).exists():
        from road_query_view_cache import load
        graphs,context=load(cache,binding);print('[Session cache] validated original query views',flush=True)
    else:
        splitter=LongitudePartitionBuilder(-107.4)
        for p in paths:
            HighwayReader(SourceScan(splitter)).apply_file(str(p),locations=True,idx='sparse_mem_array')
            print('[Source]',p.name,[len(b.ids) for b in splitter.builders],[len(b.u) for b in splitter.builders],flush=True)
        graphs,assignment=splitter.finish();del splitter
        full=[dict(g.report) for g in graphs];sources=[]
        for cbsa in sorted(candidates):
            point=domains[cbsa]['native_representative_lonlat']
            if cbsa in old:s=dict(old[cbsa]);s['retained_reference_record']=dict(old[cbsa])
            else:
                s=dict(cbsa=cbsa,native_origin_lonlat=point,**nearest_primitive_lead(graphs[1],point),lead_policy='unapproved-nearest-primitive-vertex-in-declared-wyoming-containing-shard',access_verified=False,connector_costs_included=False)
                require(all(s[k]==candidates[cbsa][k] for k in ['node','node_lonlat','native_origin_lonlat','diagnostic_gap_m']),'Cheyenne original road lead changed')
            s['source_membership_shards']=[i for i,g in enumerate(graphs) if s['node'] in g.node_index];s['source_shard']=s['source_membership_shards'][0];sources.append(s)
        graphs,query=prune(graphs,endpoints)
        for s in sources:s['query_view_membership_shards']=[i for i,g in enumerate(graphs) if s['node'] in g.node_index]
        context=dict(source_provenance=metadata,sources=sources,full_partition_graphs=full,partition_assignment_audit=assignment,query_core_audit=query,full_model_union_nodes=sum(r['nodes'] for r in full)-query['original_shared_vertices'],ingestion_cut=-107.4,candidate_reference_sha256=sha(CANDIDATES),retained_checkpoint_sha256=sha(REFERENCE/'baseline.json'),domains_sha256=baseline['domains_sha256'])
        if cache is not None:
            from road_query_view_cache import save
            save(graphs,cache,binding,context);print('[Session cache] complete numeric query views saved',flush=True)
    for g in graphs:validate(g)
    for s in context['sources']:
        expected=candidates[s['cbsa']]
        require(all(s[k]==expected[k] for k in ['node','node_lonlat','native_origin_lonlat','access_verified','connector_costs_included','lead_policy']),'Preserved research candidate changed')
        require(any(s['node'] in g.node_index and s['node_lonlat']==[float(g.longitude[g.node_index[s['node']]]),float(g.latitude[g.node_index[s['node']]])] for g in graphs),'Source node geometry missing')
    for n,p in baseline['probe_coordinates_lonlat'].items():require(any(int(n) in g.node_index and p==[float(g.longitude[g.node_index[int(n)]]),float(g.latitude[g.node_index[int(n)]])] for g in graphs),'Inherited probe changed')
    require(all(g.report['query_protected_node_ids']==endpoints for g in graphs),'Cached query scope changed')
    from road_query_cut_diagnostic import sweep
    cut_audit=sweep(graphs,[r['longitude_cut'] for r in reference['query_cut_audit']['cuts']])
    require(cut_audit==reference['query_cut_audit'],'Original protected query cut inventory changed')
    require(context['query_core_audit']==reference['query_core_audit'],'Original query core inventory changed')
    context['original_query_cut_audit']=cut_audit
    return graphs,context,baseline
