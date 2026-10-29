"""Audit the separately versioned33-source experiment; never certify access."""
import argparse
from collections import Counter
from fractions import Fraction
import hashlib,json,math
from pathlib import Path
from cheyenne_checkpoint import ROOT,REFERENCE as PREVIOUS,load_reference32,winners
from metro_scenario_checkpoint import FLAGS,project as common,require

LAYOUT=ROOT/'docs/research/las-vegas-partition-layout/preflight.json'
SCENARIO='census-eight-state-query-repartition-v1-fullcut-107.4-querycut-104-source-batches-v1'


def sha(path):return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def project(report):
    result=common(report);old=load_reference32();reference=json.loads(LAYOUT.read_text());previous={s['cbsa']:s for s in old['sources']};candidates={s['cbsa']:s for s in reference['candidate_sources']}
    require(report['schema']=='las-vegas-eight-state-query-competition-v1' and report['scenario_id']==SCENARIO and report['solver_policy']=='shared-budget-source-batches-v1','Explicit separate33-source scenario required')
    require(len(result['sources'])==33 and {s['cbsa'] for s in result['sources']}==set(previous)|{'29820'} and len({s['node'] for s in result['sources']})==33,'Exactly32 retained sources and one distinct Las Vegas lead required')
    require(result['source_qualifying_cbsa_ids']==old['source_qualifying_cbsa_ids'] and len(result['unrepresented_source_qualifying_cbsa_ids'])==334,'Complete367-competitor accounting required')
    require(result['probe_coordinates_lonlat']==old['probe_coordinates_lonlat'] and result['metric_units']==old['metric_units'] and result['domains_sha256']==old['domains_sha256'],'Original18 probes, units and native domains required')
    require(report['retained32_checkpoint_sha256']==sha(PREVIOUS/'baseline.json') and report['candidate_reference_sha256']==sha(LAYOUT),'Exact retained source and layout references required')
    manifest=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text());entry=next(r for r in manifest['files'] if r['filename']=='nevada.osm.pbf')
    expected=old['source_provenance']+[dict(name='nevada.osm.pbf',sha256=entry['sha256'],size_bytes=entry['bytes'],replication_timestamp='2026-10-27T21:23:59Z')]
    require(result['source_provenance']==expected==reference['source_provenance'],'Exact ordered eight original inputs required')
    source_nodes={s['cbsa']:s['node'] for s in report['sources']};source_order=[s['node'] for s in report['sources']];targets=list(map(int,result['probe_coordinates_lonlat']))
    for s in result['sources']:
        candidate=candidates[s['cbsa']]
        require(all(s[k]==v for k,v in candidate.items() if k!='query_view_membership_shards'),'Native candidate identity or policy changed')
        if s['cbsa'] in previous:require(s['retained32_reference_record']==previous[s['cbsa']],'Full32-source reference record changed')
        require(s['query_view_membership_shards'] and set(s['query_view_membership_shards'])<={0,1},'Missing bounded query membership')
    require(set(result['cases'])==set(old['cases']) and report['source_costs_computed']==2376 and report['new_source_costs_computed']==72 and report['retained_costs_compared']==2304,'All2376 costs and2304 retained comparisons required')
    statuses=Counter()
    for case in report['comparisons']:
        key='|'.join((case['metric'],case['orientation'],case['probe']))
        for row in case['source_costs']:
            cbsa=row['cbsa'];now=row['graph_only_cost'];before=old['cases'][key][cbsa]['graph_only_cost'] if cbsa in previous else None
            require(row['previous_graph_only_cost']==before,'Retained cost input changed')
            if cbsa not in previous:status='new_source_no_previous_cost'
            elif before is None:status='still_unreachable' if now is None else 'newly_finite'
            else:
                require(now is not None and now<=before+max(.002,abs(before)*1e-9),'Retained finite route lost or increased')
                status='unchanged' if math.isclose(before,now,abs_tol=.002,rel_tol=1e-9) else 'improved'
            require(row['comparison_status']==status,'Per-source retained comparison differs')
            if cbsa in previous:statuses[status]+=1
        tied,best=winners(case['source_costs'],'graph_only_cost');retained=winners([r for r in case['source_costs'] if r['cbsa'] in previous],'graph_only_cost')[0]
        require(case['subset_winner_ids']==tied and case['best_graph_only_cost']==best and case['retained_source_winner_ids']==retained and case['added_source_winner_changed']==(tied!=retained),'Sampled winner accounting differs')
    require(dict(statuses)==report['retained_cost_comparison_statuses'],'Complete retained comparison accounting differs')
    query=report['query_core_audit'];audit=report['query_repartition_audit'];interface=report['interface_audit']
    endpoints=sorted(set(source_order+targets));endpoint_hash=hashlib.sha256(json.dumps(endpoints,separators=(',',':')).encode()).hexdigest()
    require(len(endpoints)==44 and query==reference['query_core_audit'] and query['protected_osm_node_ids']==endpoints and query['protected_node_set_sha256']==endpoint_hash and query['arbitrary_new_endpoints_supported'] is False,'Fresh checksum-bound44-endpoint scope required')
    require(audit==reference['query_repartition_audit'] and audit['assigned_pair_entries']==audit['input_pair_entries']==37491258 and audit['output_shared_vertices']==191 and audit['native_vertices_omitted']==0 and audit['coordinate_changes']==0,'Native weighted-pair reassignment changed')
    require(audit['full_source_repartition_constructed'] is False and audit['flattened_weighted_union_constructed'] is False,'No full-source query cut or weighted union allowed')
    require(report['ingestion_cut']==-107.4 and report['query_cut']==-104.0 and report['full_model_union_nodes']==25307145,'Original full ingestion and query-only layout required')
    require(interface['boundary_vertex_count']==191 and interface['boundary_vertex_limit']==192 and interface['dense_port_closure_constructed'] is False and interface['flattened_road_union_constructed'] is False,'Original192-boundary oracle policy required')
    require(report['full_partition_graphs']==reference['full_partition_graphs'],'Full original source graph inventory changed')
    for graph in report['partition_graphs']+report['full_partition_graphs']:
        require(graph['nodes']<=graph['resource_limits']['nodes']<=15000000 and graph['directed_primitive_arcs']<=graph['resource_limits']['arcs']<=40000000,'Original shard limits changed')
    runs=report['oriented_source_batch_runs'];require(len(runs)==4 and {(r['metric'],r['reverse']) for r in runs}=={(m,d) for m in ('length','travel_time') for d in (False,True)},'All four directed metric runs required')
    checked=0
    for run in runs:
        require(run['solver_policy']=='shared-budget-source-batches-v1' and run['converged'] is True and run['partial_results_returned'] is False,'Complete converged source batches required')
        require(run['source_batch_limit']==32 and run['shared_local_dijkstra_limit']==512 and run['protected_endpoint_limit']==64,'Original native and shared oracle limits changed')
        require(all(run[f] is False for f in ('access_certified','release_eligible','complete_global_competition','road_coverage_certified')),'Batches cannot approve access or coverage')
        require(len(run['batches'])==2 and [b['batch_source_ids'] for b in run['batches']]==[source_order[:32],source_order[32:]],'Exactly32+1 native source groups required')
        used=0;run_finite=0
        for index,batch in enumerate(run['batches']):
            group=batch['batch_source_ids'];calls=batch['local_dijkstra_calls']
            require(type(calls) is int and 1<=calls<=512-used and calls==batch['propagation_dijkstra_calls']+batch['replay_dijkstra_calls'],'Final batch reset or exceeded the shared512-call budget')
            used+=calls
            require(batch['solver_policy']=='two-shard-boundary-label-fixed-point-v1' and batch['converged'] is True and batch['dense_overlay_constructed'] is False and batch['auxiliary_nodes_per_shard']==1,'Converged native oracle without a dense overlay required')
            require(batch['metric']==run['metric'] and batch['reverse']==run['reverse'],'Native batch metric or orientation differs')
            require(max(batch['working_shard_nodes'])<=15000000 and max(batch['working_shard_arcs'])<=40000000,'Native working graph budget changed')
            require(len(batch['fixed_point_sweeps'])==len(group) and {x['source'] for x in batch['fixed_point_sweeps']}==set(group) and all(x['converged'] is True for x in batch['fixed_point_sweeps']),'Every source must converge in its native group')
            native={(r['source'],r['target']):r for r in batch['results']}
            require(len(native)==len(batch['results'])==len(group)*len(targets) and set(native)=={(s,t) for s in group for t in targets},'Complete native batch result inventory required')
            legs={}
            for leg in batch['legs']:
                key=(leg['shard'],leg['from'],leg['to']);require(key not in legs and key[0] in (0,1),'Duplicate or invalid native leg')
                require(leg['solver_path_orientation']==('reversed_model_graph' if run['reverse'] else 'model_graph') and leg['raw_node_count']>=1,'Native path orientation changed')
                for field in ('solver_path_sha256','actual_directed_path_sha256'):require(len(leg[field])==64 and all(c in '0123456789abcdef' for c in leg[field]),'Native path hash missing')
                legs[key]=Fraction(*map(int,leg['exact_stored_path_cost']))
            finite=0
            for case in report['comparisons']:
                if case['metric']!=run['metric'] or (case['orientation']=='location-to-metro')!=run['reverse']:continue
                for row in case['source_costs']:
                    node=source_nodes[row['cbsa']]
                    if node not in group:continue
                    n=native[node,int(case['probe'])]
                    require(row['batch_index']==index and row['graph_only_cost']==n['cost'] and row['exact_stored_path_cost']==n['exact_stored_path_cost'] and row['segments']==n['segments'],'Source comparison is not the exact native batch result')
                    if row['graph_only_cost'] is None:require(not row['segments'],'Unreachable query has path segments');continue
                    current=node;total=Fraction(0)
                    for segment in row['segments']:
                        key=tuple(segment);require(key in legs and key[1]==current,'Native composed legs do not join');current=key[2];total+=legs[key]
                    require(current==int(case['probe']) and total==Fraction(*map(int,row['exact_stored_path_cost'])),'Exact native replay sum differs')
                    finite+=1
            require(finite==batch['finite_queries_replayed'],'Native finite replay accounting differs');run_finite+=finite
        require(used==run['local_dijkstra_calls']==run['propagation_dijkstra_calls']+run['replay_dijkstra_calls'] and used<=512,'Combined propagation and replay budget differs')
        require(run_finite==run['finite_queries_replayed'],'Combined finite replay accounting differs');checked+=run_finite
    require(checked==result['finite_queries'],'All finite native replays must be accounted for')
    result.update(schema='census-33-source-query-repartition-regression-v1',scenario_id=SCENARIO,solver_policy='shared-budget-source-batches-v1',query_endpoint_set_sha256=endpoint_hash,retained_cost_comparison_statuses=dict(statuses),**{f:False for f in FLAGS})
    return result


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('report',type=Path);p.add_argument('--compare',type=Path);a=p.parse_args();result=project(json.loads(a.report.read_text()))
    if a.compare:require(result==project(json.loads(a.compare.read_text())),'Independent33-source semantic reproduction differs')
    print(json.dumps(dict(scenario_id=SCENARIO,sources=33,costs=2376,finite=result['finite_queries'],unreachable=result['unreachable_queries'],access_certified=False),indent=2))
