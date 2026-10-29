"""Research-only six-state experiment: bounded spatial shards with the same six sources."""
import argparse
import hashlib
import json
import math
from pathlib import Path
import resource
import time

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_exterior_parent_competition import SourceScan, same_cost
from colorado_expanded_parent_competition import nearest_primitive_lead, winners
from colorado_two_partition_competition import OverlapScan, load_reference as prefix_reference, SAFETY
from metro_scenario_checkpoint import REFERENCE as CENSUS_REFERENCE, load_reference
from road_partition_oracle import TwoPartitionOracle, InterfacePortBudgetExceeded
from road_primitive_sparse import PrimitiveSparseBuilder
from road_longitude_partition import LongitudePartitionBuilder
from road_query_leaf_core import prune as query_leaf_core

ROOT=Path(__file__).resolve().parents[1]
ADDED_IDS={'28140','29940','31740','45820','48620'}
NAMES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf')


def compare_retained(previous, current):
    for value in (previous,current):
        if value is not None and (type(value) not in (int,float) or not math.isfinite(value) or value<0):
            raise ValueError('Finite nonnegative costs or explicit unreachable required')
    if previous is not None and (current is None or current>previous+max(.002,abs(previous)*1e-9)):
        raise ValueError('Expanded addition shard lost a retained finite route')
    if previous is None:return 'still_unreachable' if current is None else 'newly_finite'
    return 'unchanged' if same_cost(previous,current) else 'improved'


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--parent-osm',type=Path,nargs=6,required=True)
    p.add_argument('--output',type=Path,required=True)
    p.add_argument('--layout',choices=('longitude-query-v1','central-western-v1','retained-prefix-v1'),default='longitude-query-v1')
    p.add_argument('--longitude-cut',type=float,default=-107.4)
    p.add_argument('--query-cut-diagnostic',action='store_true',help='Write alternate-cut counts for protected views, without solving routes')
    p.add_argument('--solver',choices=('port-closure-v1','boundary-label-v1'),default='port-closure-v1')
    p.add_argument('--expect-interface-rejection',action='store_true',help='Reproduce the pinned negative; never treat rejection as route coverage')
    args=p.parse_args();began=time.monotonic()
    if args.solver=='boundary-label-v1' and (args.layout!='longitude-query-v1' or args.expect_interface_rejection or args.query_cut_diagnostic):p.error('Boundary-label solver requires the explicit longitude query scenario')
    if args.expect_interface_rejection and (args.layout!='longitude-query-v1' or args.longitude_cut!=-107.4 or args.query_cut_diagnostic):p.error('Pinned negative requires only longitude-query-v1 at -107.4')
    if args.query_cut_diagnostic and args.layout!='longitude-query-v1':p.error('Cut diagnostic requires longitude-query-v1')
    baseline=load_reference();_,domains,prefix_baseline=prefix_reference()
    manifest=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text())
    archived={s['filename']:s for s in manifest['files']}
    actual=[source_metadata(path) for path in args.parent_osm];validate_sources(actual)
    expected=[{'name':name,'sha256':archived[name]['sha256'],'size_bytes':archived[name]['bytes'],
               'replication_timestamp':manifest['osm_replication_timestamp']} for name in NAMES]
    if actual!=expected or actual[:5]!=baseline['source_provenance']:
        raise ValueError('Exact ordered retained five states and dated Kansas required')
    if domains['source_qualifying_cbsa_ids']!=baseline['source_qualifying_cbsa_ids']:
        raise ValueError('Qualifying inventory changed')
    old={s['cbsa']:s for s in baseline['sources']};selected=set(old)|ADDED_IDS
    if len(old)!=26 or old.keys()&ADDED_IDS or len(selected)!=31 or not selected<=set(baseline['source_qualifying_cbsa_ids']):
        raise ValueError('Exactly 26 retained and five explicit new source identities required')
    spatial=args.layout=='longitude-query-v1'
    partition_audit=None;contributing=[[],[]]
    if spatial:
        splitter=LongitudePartitionBuilder(args.longitude_cut)
        for path in args.parent_osm:
            before=[len(b.u) for b in splitter.builders]
            HighwayReader(SourceScan(splitter)).apply_file(str(path),locations=True,idx='sparse_mem_array')
            for index,builder in enumerate(splitter.builders):
                if len(builder.u)>before[index]:contributing[index].append(path.name)
            print('[Longitude source]',path.name,[len(b.ids) for b in splitter.builders],[len(b.u) for b in splitter.builders],flush=True)
        (prefix,addition),partition_audit=splitter.finish();del splitter
        groups=None;shared_ways=set();legacy=False
    else:
        legacy=args.layout=='retained-prefix-v1'
        groups=((0,1,2,3),(4,5)) if legacy else ((0,4,5),(1,2,3))
        builder=PrimitiveSparseBuilder(max_nodes=15000000,max_arcs=40000000)
        for path in (args.parent_osm[i] for i in groups[1]):
            HighwayReader(SourceScan(builder)).apply_file(str(path),locations=True,idx='sparse_mem_array')
            print('[Partition 1]',path.name,len(builder.ids),len(builder.u),flush=True)
        raw_fingerprints=dict(builder.fingerprints);addition=builder.finish();del builder
        if legacy and addition.report['nodes']!=7308146:raise ValueError('Node preflight did not reproduce')
        builder=PrimitiveSparseBuilder(max_nodes=15000000,max_arcs=40000000);shared_ways=set()
        for path in (args.parent_osm[i] for i in groups[0]):
            scan=OverlapScan(builder,raw_fingerprints)
            HighwayReader(scan).apply_file(str(path),locations=True,idx='sparse_mem_array')
            shared_ways.update(scan.shared);del scan
            print('[Partition 0]',path.name,len(builder.ids),len(builder.u),flush=True)
        prefix=builder.finish();del builder,raw_fingerprints
        if legacy and prefix.report!=prefix_baseline['primitive_parent_graph']:raise ValueError('Preserved prefix model changed')

    graphs=(prefix,addition);sources=[];records={d['cbsa']:d for d in domains['domains']}
    for cbsa in sorted(selected):
        point=records[cbsa]['native_representative_lonlat']
        if cbsa in old:
            s=dict(old[cbsa])
            s['retained_reference_record']=dict(old[cbsa])
            if s['native_origin_lonlat']!=point or s['access_verified'] is not False or s['connector_costs_included'] is not False:
                raise ValueError('Preserved source origin/status changed')
            if not any(s['node'] in g.node_index and s['node_lonlat']==[float(g.longitude[g.node_index[s['node']]]),float(g.latitude[g.node_index[s['node']]])] for g in graphs):
                raise ValueError('Retained source node/geometry missing')
        else:
            s={'cbsa':cbsa,'native_origin_lonlat':point,**nearest_primitive_lead(graphs[1 if spatial or legacy else 0],point),
               'lead_policy':'unapproved-nearest-primitive-vertex-in-declared-kansas-containing-shard',
               'source_shard':1 if spatial or legacy else 0,'access_verified':False,'connector_costs_included':False}
        membership=[i for i,g in enumerate(graphs) if s['node'] in g.node_index]
        s['source_membership_shards']=membership
        s['source_shard']=membership[0]
        sources.append(s)
    if len({s['node'] for s in sources})!=31:raise ValueError('Distinct source road leads required')
    coordinates=baseline['probe_coordinates_lonlat']
    for node,point in coordinates.items():
        if not any(int(node) in g.node_index and point==[float(g.longitude[g.node_index[int(node)]]),float(g.latitude[g.node_index[int(node)]])] for g in graphs):
            raise ValueError('Preserved probe geometry missing')
    full_graph_reports=[dict(g.report) for g in graphs]
    query_audit=None
    if spatial:
        endpoints=sorted({s['node'] for s in sources}|set(map(int,coordinates)))
        graphs,query_audit=query_leaf_core(graphs,endpoints)
        prefix,addition=graphs
        print('[Query core]',json.dumps(query_audit),flush=True)
    if spatial and args.query_cut_diagnostic:
        from road_query_cut_diagnostic import sweep
        diagnostic=sweep(graphs,[round(-109.5+i/10,1) for i in range(56)])
        diagnostic.update(source_provenance=actual,query_core_audit=query_audit,full_partition_graphs=full_graph_reports,initial_longitude_cut=args.longitude_cut)
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(diagnostic,indent=2)+'\n')
        print('[Query cut diagnostic]',json.dumps(diagnostic),flush=True)
        return
    for source in sources:
        source['query_view_membership_shards']=[i for i,g in enumerate(graphs) if source['node'] in g.node_index]
    try:
        if args.solver=='boundary-label-v1':
            from road_boundary_label_oracle import BoundaryLabelOracle
            oracle=BoundaryLabelOracle(prefix,addition)
        else:oracle=TwoPartitionOracle(prefix,addition)
    except InterfacePortBudgetExceeded as exc:
        if not args.expect_interface_rejection:raise
        if exc.count!=178 or exc.limit!=128:raise ValueError('Pinned interface rejection changed') from exc
        from road_query_cut_diagnostic import sweep
        expected_query=json.loads((ROOT/'docs/research/kansas-partition-layouts/query-cut-sweep.json').read_text())
        if actual!=expected_query['source_provenance']:raise ValueError('Pinned query sweep source identity changed')
        cut_audit=sweep(graphs,[row['longitude_cut'] for row in expected_query['cuts']])
        if cut_audit!=expected_query['query_cut_audit']:raise ValueError('Protected cut inventory changed')
        result={**{f:False for f in SAFETY},'schema':'kansas-two-partition-negative-v1',
                'status':'blocked_by_interface_budget','source_provenance':actual,
                'candidate_sources':sources,'candidate_source_count':31,
                'candidate_sources_are_route_coverage':False,
                'published_scenario_source_count':26,'published_scenario_unknown_source_count':341,
                'source_costs_computed':0,'retained_costs_compared':0,'finite_queries_replayed':0,
                'interface_port_count':exc.count,'interface_port_limit':exc.limit,
                'query_core_audit':query_audit,'query_cut_audit':cut_audit,
                'full_partition_graphs':full_graph_reports,'partition_assignment_audit':partition_audit,
                'partition_layout_id':args.layout,'longitude_cut':args.longitude_cut,
                'census_checkpoint_sha256':hashlib.sha256((CENSUS_REFERENCE/'baseline.json').read_bytes()).hexdigest(),
                'elapsed_seconds':time.monotonic()-began,
                'peak_process_rss_kib':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
                'warning':'Expected bounded preflight rejection, not successful routing. Frozen 26-source coverage and access gate unchanged.'}
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
        print(json.dumps({key:result[key] for key in ('status','interface_port_count','source_costs_computed')}))
        return
    if args.expect_interface_rejection:raise ValueError('Pinned rejection unexpectedly became feasible; review before adopting')
    print('[Kansas interface]',json.dumps(oracle.audit),flush=True)
    old_cases=baseline['cases'];cases=[];runs=[];checks=0;statuses={}
    for orientation in ('metro-to-location','location-to-metro'):
        for metric in ('length','travel_time'):
            options={'reverse':orientation=='location-to-metro'}
            if args.solver=='boundary-label-v1':options['progress']=lambda event:print('[Boundary fixed point]',json.dumps(event),flush=True)
            run=oracle.solve([s['node'] for s in sources],list(map(int,coordinates)),metric,**options)
            values={(r['source'],r['target']):r for r in run['results']}
            for probe in coordinates:
                key='|'.join((metric,orientation,probe));options=[]
                for source in sources:
                    row=values[source['node'],int(probe)]
                    previous=old_cases[key][source['cbsa']]['graph_only_cost'] if source['cbsa'] in old else None
                    status=compare_retained(previous,row['cost']) if source['cbsa'] in old else 'new_source_no_previous_cost'
                    if source['cbsa'] in old:
                        checks+=1
                        statuses[status]=statuses.get(status,0)+1
                    options.append({'cbsa':source['cbsa'],'graph_only_cost':row['cost'],
                                    'exact_stored_path_cost':row['exact_stored_path_cost'],'segments':row['segments'],
                                    'previous_graph_only_cost':previous,'comparison_status':status})
                tied,best=winners(options,'graph_only_cost')
                retained=winners([o for o in options if o['cbsa'] in old],'graph_only_cost')[0]
                previous_winners=winners([{'cbsa':c,'graph_only_cost':v['graph_only_cost']} for c,v in old_cases[key].items()],'graph_only_cost')[0]
                cases.append({'orientation':orientation,'metric':metric,'probe':probe,'source_costs':options,
                              'subset_winner_ids':tied,'retained_source_winner_ids':retained,
                              'previous_subset_winner_ids':previous_winners,
                              'road_only_winner_changed':previous_winners!=retained,
                              'best_graph_only_cost':best,'added_source_winner_changed':retained!=tied})
            runs.append({k:v for k,v in run.items() if k!='results'})
            print('[Kansas completed]',orientation,metric,run['finite_queries_replayed'],'replays',flush=True)
    if checks!=1872:raise ValueError('Every old case must be retained and compared')
    result={**{f:False for f in SAFETY},'schema':'kansas-two-partition-competition-v1',
            'scenario_id':'census-six-state-'+args.layout+(f'-cut{args.longitude_cut:g}' if spatial else '')+'-'+args.solver,
            'solver_policy':args.solver,
            'source_membership_scope':'full input shards; query_view_membership_shards records derived ownership',
            'interface_audit_scope':'protected query views' if spatial else 'full shards',
            'full_model_union_nodes':sum(g['nodes'] for g in full_graph_reports)-(query_audit['original_shared_vertices'] if spatial else oracle.audit['shared_vertices']),
            'partition_layout_id':args.layout,'longitude_cut':args.longitude_cut if spatial else None,
            'partition_source_names':contributing if spatial else [[NAMES[i] for i in group] for group in groups],
            'partition_assignment_audit':partition_audit,'query_core_audit':query_audit,
            'full_partition_graphs':full_graph_reports,'applied_source_exclusions':[],
            'source_provenance':actual,'sources':sources,'diagnostic_source_cbsa_ids':sorted(selected),
            'source_qualifying_cbsa_ids':baseline['source_qualifying_cbsa_ids'],
            'unrepresented_source_qualifying_cbsa_ids':sorted(set(baseline['source_qualifying_cbsa_ids'])-selected),
            'probe_coordinates_lonlat':coordinates,'comparisons':cases,'source_costs_computed':len(cases)*len(sources),
            'retained_costs_compared':checks,'retained_cost_comparison_statuses':statuses,
            'new_source_costs_computed':len(ADDED_IDS)*len(cases),
            'finite_queries_replayed':sum(r['finite_queries_replayed'] for r in runs),'local_oracle_runs':runs,
            'interface_audit':oracle.audit,'partition_graphs':[g.report for g in graphs],
            'road_only_winner_changes':sum(c['road_only_winner_changed'] for c in cases),
            'added_source_winner_changes':sum(c['added_source_winner_changed'] for c in cases),
            'shared_raw_highways_fingerprint_verified':None if spatial else len(shared_ways),
            'domains_sha256':baseline['domains_sha256'],
            'census_checkpoint_sha256':hashlib.sha256((CENSUS_REFERENCE/'baseline.json').read_bytes()).hexdigest(),
            'metric_units':baseline['metric_units'],'elapsed_seconds':time.monotonic()-began,
            'peak_process_rss_kib':resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,
            'warning':'31-source graph-only subset, not global winners or geographic regions. Five new leads remain unapproved; missing competitors, exterior routes, connectors/costs, turns/grade and datum remain unresolved. Frozen five-state Census scenario is unchanged.'}
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')
    print(json.dumps({k:result[k] for k in ('source_costs_computed','retained_costs_compared','finite_queries_replayed','retained_cost_comparison_statuses','release_eligible')}))


if __name__=='__main__':main()
