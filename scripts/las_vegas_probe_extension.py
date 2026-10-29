"""Add a Las Vegas road-node probe inside the already protected44-endpoint scope."""
import argparse,hashlib,json,time
from pathlib import Path
from colorado_expanded_parent_competition import winners
from las_vegas_probe_reference import verify
from las_vegas_graph_views import prepare
from metro_scenario_checkpoint import FLAGS,require
from road_boundary_label_oracle import BoundaryLabelOracle
from road_query_repartition import repartition
from road_transposed_probe_queries import solve


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--parent-osm',type=Path,nargs=8,required=True);p.add_argument('--retained-report',type=Path,required=True);p.add_argument('--session-cache',type=Path);p.add_argument('--output',type=Path,required=True);a=p.parse_args();began=time.monotonic()
    old_report,old,model_identity=verify(a.retained_report,require_current=True)
    views,context,_=prepare(a.parent_osm,a.session_cache);graphs,audit=repartition(views,-104.0);del views
    sources=context['sources']
    for s in sources:s['query_view_membership_shards']=[i for i,g in enumerate(graphs) if s['node'] in g.node_index]
    require(sorted(sources,key=lambda s:s['cbsa'])==old['sources'] and context['source_provenance']==old['source_provenance'],'Exact retained33-source graph/origin scope required')
    require(audit==old_report['query_repartition_audit'],'Identical protected graph reassignment required')
    candidate=next(s for s in sources if s['cbsa']=='29820');probe=candidate['node'];require(probe in context['query_core_audit']['protected_osm_node_ids'],'Probe must already be protected; no endpoint extension allowed')
    oracle=BoundaryLabelOracle(*graphs);previous={(r['metric'],r['reverse']):r for r in old_report['oriented_source_batch_runs']};cases=[];runs=[]
    for direction in ('metro-to-location','location-to-metro'):
        for metric in ('length','travel_time'):
            before=previous[metric,direction=='location-to-metro']['local_dijkstra_calls'];remaining=512-before
            require(1<=remaining<=512,'Shared retained/new query budget exhausted')
            run=solve(oracle,[s['node'] for s in sources],probe,metric,direction,max_oracles=remaining)
            run.update(retained_source_run_calls=before,combined_local_dijkstra_calls=before+run['local_dijkstra_calls'],combined_local_dijkstra_limit=512)
            require(run['combined_local_dijkstra_calls']<=512,'Original total per-metric/direction budget exceeded')
            values={r['source']:r for r in run['results']};rows=[]
            for source in sources:
                r=values[source['node']];rows.append(dict(cbsa=source['cbsa'],graph_only_cost=r['cost'],exact_stored_path_cost=r['exact_stored_path_cost'],segments=r['segments'],native_batch_index=r['native_batch_index'],native_source=r['native_source'],native_target=r['native_target']))
            tied,best=winners(rows,'graph_only_cost');cases.append(dict(metric=metric,orientation=direction,probe=str(probe),source_costs=rows,subset_winner_ids=tied,best_graph_only_cost=best))
            runs.append(run);print('[Completed]',direction,metric,run['finite_queries_replayed'],run['local_dijkstra_calls'],run['combined_local_dijkstra_calls'],flush=True)
    result=dict(context,schema='las-vegas-protected-probe-extension-v1',scenario_id='census-eight-state-las-vegas-probe-v1-transposed-target-batches',solver_policy='single-probe-transposed-target-batches-v1',graph_model_sha256=model_identity,retained33_projection_sha256=hashlib.sha256(json.dumps(old,sort_keys=True,separators=(',',':')).encode()).hexdigest(),retained33_raw_report_sha256=hashlib.sha256(a.retained_report.read_bytes()).hexdigest(),source_qualifying_cbsa_ids=old['source_qualifying_cbsa_ids'],unrepresented_source_qualifying_cbsa_ids=old['unrepresented_source_qualifying_cbsa_ids'],diagnostic_source_cbsa_ids=sorted(s['cbsa'] for s in sources),applied_source_exclusions=[],metric_units=old['metric_units'],probe_coordinates_lonlat={str(probe):candidate['node_lonlat']},comparisons=cases,source_costs_computed=132,new_probe_costs_computed=132,new_endpoints_added=0,finite_queries_replayed=sum(r['finite_queries_replayed'] for r in runs),oriented_probe_runs=runs,interface_audit=oracle.audit,query_repartition_audit=audit,partition_graphs=[g.report for g in graphs],query_cut=-104.0,elapsed_seconds=time.monotonic()-began,warning='One additional sample at the unapproved Las Vegas road lead. Its self cost is a graph-node identity, never an approved urban anchor or off-road connector. All334 other competitors remain unknown.',**{f:False for f in FLAGS})
    a.output.parent.mkdir(parents=True,exist_ok=True);a.output.write_text(json.dumps(result,indent=2,sort_keys=True)+'\n')

if __name__=='__main__':main()
