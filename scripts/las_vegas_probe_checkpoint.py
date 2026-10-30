"""Audit a protected Las Vegas probe and its exact directed-query transposition."""
import argparse,hashlib,json
from fractions import Fraction
from pathlib import Path
from cheyenne_checkpoint import winners
from las_vegas_probe_reference import verify,REFERENCE
from metro_scenario_checkpoint import FLAGS,project as common,require

SCENARIO='census-eight-state-las-vegas-probe-v1-transposed-target-batches'


def project(report,retained_report):
    bound,old,model_identity=verify(REFERENCE/'retained33-source-report.json');require(retained_report==bound,'Exact independent parent report required');result=common(report);sources=report['sources'];source_nodes={s['cbsa']:s['node'] for s in sources};order=[s['node'] for s in sources]
    candidate=next(s for s in old['sources'] if s['cbsa']=='29820');probe=candidate['node']
    require(report['schema']=='las-vegas-protected-probe-extension-v1' and report['scenario_id']==SCENARIO and report['solver_policy']=='single-probe-transposed-target-batches-v1','Separate protected-probe scenario required')
    require(result['sources']==old['sources'] and result['source_provenance']==old['source_provenance'] and result['domains_sha256']==old['domains_sha256'] and result['metric_units']==old['metric_units'],'Exact retained33-source graph, identities and metric units required')
    require(result['source_qualifying_cbsa_ids']==old['source_qualifying_cbsa_ids'] and result['unrepresented_source_qualifying_cbsa_ids']==old['unrepresented_source_qualifying_cbsa_ids'],'All367 qualifiers and334 unknown competitors required')
    identity=hashlib.sha256(json.dumps(old,sort_keys=True,separators=(',',':')).encode()).hexdigest()
    require(report['graph_model_sha256']==model_identity and report['retained33_raw_report_sha256']==hashlib.sha256((REFERENCE/'retained33-source-report.json').read_bytes()).hexdigest(),'Probe and parent graph policy or raw evidence differ')
    require(report['retained33_projection_sha256']==identity,'Retained33-source semantic identity changed')
    require(result['probe_coordinates_lonlat']=={str(probe):candidate['node_lonlat']} and probe in retained_report['query_core_audit']['protected_osm_node_ids'],'One already-protected Las Vegas road-node probe required')
    require(report['source_costs_computed']==report['new_probe_costs_computed']==132 and report['new_endpoints_added']==0 and len(result['cases'])==4,'All132 new costs without new graph endpoints required')
    for key in ('query_core_audit','query_repartition_audit','interface_audit','full_partition_graphs','partition_graphs','full_model_union_nodes','ingestion_cut','query_cut'):
        require(report[key]==retained_report[key],'Retained graph or resource scope changed: '+key)
    expected={'|'.join((m,d,str(probe))) for m in ('length','travel_time') for d in ('metro-to-location','location-to-metro')}
    require(set(result['cases'])==expected,'All four directed metric cases required')
    runs=report['oriented_probe_runs'];require(len(runs)==4 and {(r['metric'],r['requested_direction']) for r in runs}=={(m,d) for m in ('length','travel_time') for d in ('metro-to-location','location-to-metro')},'Every requested probe direction/metric required')
    previous={(r['metric'],r['reverse']):r for r in retained_report['oriented_source_batch_runs']};total_finite=0
    for run in runs:
        direction=run['requested_direction'];metric=run['metric'];native_reverse=direction=='metro-to-location';base=previous[metric,direction=='location-to-metro']['local_dijkstra_calls']
        require(run['solver_policy']=='single-probe-transposed-target-batches-v1' and run['native_reverse']==native_reverse and run['probe']==probe and run['converged'] is True and run['partial_results_returned'] is False,'Exact complete transposed native-query policy required')
        require(run['native_target_batch_limit']==32 and run['protected_endpoint_limit']==64 and run['shared_local_dijkstra_limit']==512-base and run['retained_source_run_calls']==base,'Only the original remaining oracle budget may be used')
        require(all(run[f] is False for f in ('access_certified','release_eligible','complete_global_competition')),'Probe query cannot approve access or coverage')
        require(len(run['native_runs'])==2 and [r['native_target_ids'] for r in run['native_runs']]==[order[:32],order[32:]],'Native target groups must remain32+1')
        case=next(c for c in report['comparisons'] if c['metric']==metric and c['orientation']==direction);rows={source_nodes[r['cbsa']]:r for r in case['source_costs']}
        tied,best=winners(case['source_costs'],'graph_only_cost');require(case['subset_winner_ids']==tied and case['best_graph_only_cost']==best,'Sampled winner accounting differs')
        used=0;finite=0
        for index,native_run in enumerate(run['native_runs']):
            targets=native_run['native_target_ids'];calls=native_run['local_dijkstra_calls']
            require(type(calls) is int and 1<=calls<=512-base-used and calls==native_run['propagation_dijkstra_calls']+native_run['replay_dijkstra_calls'],'Native target group reset or exceeded the shared remaining budget')
            used+=calls
            require(native_run['metric']==metric and native_run['reverse']==native_reverse and native_run['converged'] is True and native_run['solver_policy']=='two-shard-boundary-label-fixed-point-v1','Native transposition metric or direction changed')
            require(native_run['dense_overlay_constructed'] is False and native_run['auxiliary_nodes_per_shard']==1 and max(native_run['working_shard_nodes'])<=15000000 and max(native_run['working_shard_arcs'])<=40000000,'Original native graph/overlay limits changed')
            sweeps=native_run['fixed_point_sweeps'];require(len(sweeps)==1 and sweeps[0]['source']==probe and sweeps[0]['converged'] is True,'Probe must be the single native source')
            values={(r['source'],r['target']):r for r in native_run['results']}
            require(len(values)==len(native_run['results'])==len(targets) and set(values)=={(probe,t) for t in targets},'Complete unique native target results required')
            legs={}
            for leg in native_run['legs']:
                key=(leg['shard'],leg['from'],leg['to']);require(key not in legs and key[0] in (0,1),'Duplicate/invalid native leg')
                require(leg['solver_path_orientation']==('reversed_model_graph' if native_reverse else 'model_graph') and leg['raw_node_count']>=1,'Native leg orientation changed')
                for field in ('solver_path_sha256','actual_directed_path_sha256'):require(len(leg[field])==64 and all(c in '0123456789abcdef' for c in leg[field]),'Native replay hash missing')
                legs[key]=Fraction(*map(int,leg['exact_stored_path_cost']));require(legs[key]>=0,'Negative native leg cost')
            batch_finite=0
            for node in targets:
                row=rows[node];n=values[probe,node]
                require(row['native_batch_index']==index and row['native_source']==probe and row['native_target']==node,'Requested/native source-target role mapping changed')
                require(row['graph_only_cost']==n['cost'] and row['exact_stored_path_cost']==n['exact_stored_path_cost'] and row['segments']==n['segments'],'Requested cost is not the exact transposed native result')
                if row['graph_only_cost'] is None:require(not row['segments'],'Unreachable probe query has segments');continue
                current=probe;value=Fraction(0)
                for segment in row['segments']:
                    key=tuple(segment);require(key in legs and key[1]==current,'Native transposed legs do not join');current=key[2];value+=legs[key]
                require(current==node and value==Fraction(*map(int,row['exact_stored_path_cost'])),'Exact transposed native replay differs')
                batch_finite+=1
            require(batch_finite==native_run['finite_queries_replayed'],'Native target-group finite accounting differs');finite+=batch_finite
        require(used==run['local_dijkstra_calls'] and base+used==run['combined_local_dijkstra_calls']<=run['combined_local_dijkstra_limit']==512,'Retained and probe queries must share the original512-call limit')
        require(finite==run['finite_queries_replayed'],'Combined probe finite accounting differs');total_finite+=finite
    require(total_finite==result['finite_queries'],'Every finite probe result requires a native replay')
    self_rows=[r for c in report['comparisons'] for r in c['source_costs'] if r['cbsa']=='29820']
    require(len(self_rows)==4 and all(r['graph_only_cost']==0 and r['segments']==[] for r in self_rows),'Selected road-node identity must have zero graph cost without inventing a connector')
    result.update(schema='census-33-source-protected-probe-regression-v1',scenario_id=SCENARIO,solver_policy='single-probe-transposed-target-batches-v1',retained33_projection_sha256=identity,graph_model_sha256=model_identity,**{f:False for f in FLAGS})
    return result


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('report',type=Path);p.add_argument('--retained-report',type=Path,required=True);p.add_argument('--compare',type=Path);a=p.parse_args();old=json.loads(a.retained_report.read_text());result=project(json.loads(a.report.read_text()),old)
    if a.compare:require(result==project(json.loads(a.compare.read_text()),old),'Independent protected-probe reproduction differs')
    print(json.dumps(dict(probes=1,sources=33,costs=132,finite=result['finite_queries'],unreachable=result['unreachable_queries'],access_certified=False),indent=2))
