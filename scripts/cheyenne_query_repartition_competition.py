"""32-source research through query-only repartitioning; original limits unchanged."""
import argparse
from collections import Counter
import json
from pathlib import Path
import resource
import time
from cheyenne_graph_views import prepare
from colorado_expanded_parent_competition import winners
from kansas_two_partition_competition import compare_retained
from metro_scenario_checkpoint import FLAGS,require
from road_boundary_label_oracle import BoundaryLabelOracle
from road_query_repartition import repartition


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--parent-osm',type=Path,nargs=7,required=True);p.add_argument('--query-cut',type=float,default=-104.);p.add_argument('--session-cache',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args();began=time.monotonic()
    views,context,baseline=prepare(a.parent_osm,a.session_cache)
    require(context['query_core_audit']['surviving_shared_vertices']==216,'Original measured query interface changed')
    graphs,audit=repartition(views,a.query_cut);del views
    print('[Query repartition]',json.dumps(audit),flush=True)
    oracle=BoundaryLabelOracle(*graphs)
    sources=context['sources'];probes=baseline['probe_coordinates_lonlat'];old={s['cbsa'] for s in baseline['sources']}
    for s in sources:s['query_view_membership_shards']=[i for i,g in enumerate(graphs) if s['node'] in g.node_index]
    cases=[];runs=[];statuses=Counter();checks=0
    for direction in ['metro-to-location','location-to-metro']:
        for metric in ['length','travel_time']:
            run=oracle.solve([s['node'] for s in sources],list(map(int,probes)),metric,reverse=direction=='location-to-metro',progress=lambda e:print('[Fixed point]',json.dumps(e),flush=True))
            values={(r['source'],r['target']):r for r in run['results']}
            for probe in probes:
                key='|'.join((metric,direction,probe));rows=[]
                for s in sources:
                    r=values[s['node'],int(probe)];before=baseline['cases'][key][s['cbsa']]['graph_only_cost'] if s['cbsa'] in old else None
                    status=compare_retained(before,r['cost']) if s['cbsa'] in old else 'new_source_no_previous_cost'
                    if s['cbsa'] in old:statuses[status]+=1;checks+=1
                    rows.append(dict(cbsa=s['cbsa'],graph_only_cost=r['cost'],exact_stored_path_cost=r['exact_stored_path_cost'],segments=r['segments'],previous_graph_only_cost=before,comparison_status=status))
                tied,best=winners(rows,'graph_only_cost');retained=winners([r for r in rows if r['cbsa'] in old],'graph_only_cost')[0]
                cases.append(dict(metric=metric,orientation=direction,probe=probe,source_costs=rows,subset_winner_ids=tied,retained_source_winner_ids=retained,best_graph_only_cost=best,added_source_winner_changed=tied!=retained))
            runs.append({k:v for k,v in run.items() if k!='results'});print('[Completed]',direction,metric,run['finite_queries_replayed'],flush=True)
    require(checks==2232 and len(cases)==72 and len(sources)==32,'Complete old/new cost accounting required')
    result=dict(context,schema='cheyenne-query-repartition-competition-v1',scenario_id=f'census-seven-state-query-repartition-v1-fullcut-107.4-querycut{a.query_cut:g}',solver_policy='boundary-label-v1',sources=sources,source_qualifying_cbsa_ids=baseline['source_qualifying_cbsa_ids'],unrepresented_source_qualifying_cbsa_ids=sorted(set(baseline['source_qualifying_cbsa_ids'])-{s['cbsa'] for s in sources}),diagnostic_source_cbsa_ids=sorted(s['cbsa'] for s in sources),applied_source_exclusions=[],probe_coordinates_lonlat=probes,metric_units=baseline['metric_units'],comparisons=cases,source_costs_computed=2304,new_source_costs_computed=72,retained_costs_compared=checks,retained_cost_comparison_statuses=dict(statuses),finite_queries_replayed=sum(r['finite_queries_replayed'] for r in runs),local_oracle_runs=runs,interface_audit=oracle.audit,query_repartition_audit=audit,partition_graphs=[g.report for g in graphs],query_cut=a.query_cut,elapsed_seconds=time.monotonic()-began,peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss,warning='Graph-only32-source subset at18 inherited probes. Query-only reassignment preserves native pairs; no full-source cut at the query cut is constructed. All road leads remain unapproved; no urban anchor or global coverage adopted.',**{f:False for f in FLAGS})
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')

if __name__=='__main__':main()
