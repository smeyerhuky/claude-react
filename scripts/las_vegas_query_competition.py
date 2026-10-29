"""Separate33-source graph-only comparison using one512-call budget per run."""
import argparse,json,resource,time
from collections import Counter
from pathlib import Path
from colorado_expanded_parent_competition import winners
from kansas_two_partition_competition import compare_retained
from las_vegas_graph_views import prepare
from metro_scenario_checkpoint import FLAGS,require
from road_boundary_label_batches import solve
from road_boundary_label_oracle import BoundaryLabelOracle
from road_query_repartition import repartition


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--parent-osm',type=Path,nargs=8,required=True);p.add_argument('--session-cache',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args();began=time.monotonic()
    views,context,baseline=prepare(a.parent_osm,a.session_cache);graphs,audit=repartition(views,-104.0);del views
    print('[Query repartition]',json.dumps(audit),flush=True);oracle=BoundaryLabelOracle(*graphs);sources=context['sources'];probes=baseline['probe_coordinates_lonlat'];old={s['cbsa'] for s in baseline['sources']}
    for s in sources:s['query_view_membership_shards']=[i for i,g in enumerate(graphs) if s['node'] in g.node_index]
    cases=[];runs=[];statuses=Counter();compared=0
    for direction in ('metro-to-location','location-to-metro'):
        for metric in ('length','travel_time'):
            run=solve(oracle,[s['node'] for s in sources],list(map(int,probes)),metric,reverse=direction=='location-to-metro',progress=lambda e:print('[Fixed point]',json.dumps(e),flush=True))
            records={(r['source'],r['target']):r for r in run['results']}
            for probe in probes:
                key='|'.join((metric,direction,probe));rows=[]
                for s in sources:
                    r=records[s['node'],int(probe)];before=baseline['cases'][key][s['cbsa']]['graph_only_cost'] if s['cbsa'] in old else None
                    status=compare_retained(before,r['cost']) if s['cbsa'] in old else 'new_source_no_previous_cost'
                    if s['cbsa'] in old:statuses[status]+=1;compared+=1
                    rows.append(dict(cbsa=s['cbsa'],graph_only_cost=r['cost'],exact_stored_path_cost=r['exact_stored_path_cost'],segments=r['segments'],batch_index=r['batch_index'],previous_graph_only_cost=before,comparison_status=status))
                tied,best=winners(rows,'graph_only_cost');retained=winners([r for r in rows if r['cbsa'] in old],'graph_only_cost')[0]
                cases.append(dict(metric=metric,orientation=direction,probe=probe,source_costs=rows,subset_winner_ids=tied,best_graph_only_cost=best,retained_source_winner_ids=retained,added_source_winner_changed=tied!=retained))
            runs.append({k:v for k,v in run.items() if k!='results'}|dict(metric=metric,reverse=direction=='location-to-metro'))
            print('[Completed]',direction,metric,run['finite_queries_replayed'],run['local_dijkstra_calls'],flush=True)
    require(compared==2304 and len(cases)==72 and len(sources)==33,'Complete retained and new source accounting required')
    result=dict(context,schema='las-vegas-eight-state-query-competition-v1',scenario_id='census-eight-state-query-repartition-v1-fullcut-107.4-querycut-104-source-batches-v1',solver_policy='shared-budget-source-batches-v1',source_qualifying_cbsa_ids=baseline['source_qualifying_cbsa_ids'],unrepresented_source_qualifying_cbsa_ids=sorted(set(baseline['source_qualifying_cbsa_ids'])-{s['cbsa'] for s in sources}),diagnostic_source_cbsa_ids=sorted(s['cbsa'] for s in sources),applied_source_exclusions=[],probe_coordinates_lonlat=probes,metric_units=baseline['metric_units'],comparisons=cases,source_costs_computed=2376,new_source_costs_computed=72,retained_costs_compared=compared,retained_cost_comparison_statuses=dict(statuses),finite_queries_replayed=sum(r['finite_queries_replayed'] for r in runs),oriented_source_batch_runs=runs,interface_audit=oracle.audit,query_repartition_audit=audit,partition_graphs=[g.report for g in graphs],query_cut=-104.0,elapsed_seconds=time.monotonic()-began,peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,warning='Graph-only33-source subset at18 inherited probes. All334 other competitors remain unknown. No connector cost, reviewed urban anchor, geographic coverage or public road-mode approval.',**{f:False for f in FLAGS})
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')

if __name__=='__main__':main()
