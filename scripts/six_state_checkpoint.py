"""Separate 31-source cost checkpoint; never rewrite the frozen 26-source case."""
import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path

from metro_scenario_checkpoint import FLAGS, load_reference as load_census, project as validate_common, require

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/census-31-source-checkpoint'
ADDED={'28140','29940','31740','45820','48620'}
SCENARIO='census-six-state-longitude-query-v1-cut-107.4-boundary-label-v1'


def project(report):
    old=load_census();old_sources={s['cbsa']:s for s in old['sources']}
    result=validate_common(report)
    require(report.get('solver_policy')=='boundary-label-v1' and report['scenario_id']==SCENARIO,'Explicit separate boundary-label scenario required')
    require(len(result['sources'])==31 and {s['cbsa'] for s in result['sources']}==set(old_sources)|ADDED,'Exactly 26 retained and five new identities required')
    require(len({s['node'] for s in result['sources']})==31,'Distinct native road leads required')
    require(result['source_qualifying_cbsa_ids']==old['source_qualifying_cbsa_ids'] and len(result['unrepresented_source_qualifying_cbsa_ids'])==336,'Complete qualifying inventory required')
    require(result['probe_coordinates_lonlat']==old['probe_coordinates_lonlat'],'All 18 inherited probes must be preserved')
    require(result['domains_sha256']==old['domains_sha256'],'Original Census domains required')
    archive=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text())
    files={e['filename']:e for e in archive['files']}
    names=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf')
    expected=[dict(name=n,sha256=files[n]['sha256'],size_bytes=files[n]['bytes'],replication_timestamp='2026-10-27T21:23:59Z') for n in names]
    require(result['source_provenance']==expected,'Exact ordered six-source identities required')
    for source in result['sources']:
        if source['cbsa'] in old_sources:
            previous=old_sources[source['cbsa']]
            require(source['retained_reference_record']==previous,'Full old source record must be retained')
            require(all(source[k]==v for k,v in previous.items() if k!='source_shard'),'Old origin, road lead or unapproved policy changed')
    keys={'|'.join((metric,direction,probe)) for metric in ('length','travel_time') for direction in ('metro-to-location','location-to-metro') for probe in old['probe_coordinates_lonlat']}
    require(set(result['cases'])==keys and report['source_costs_computed']==2232,'All 72 direction/metric/probe cases and 2232 costs required')
    statuses=Counter()
    for key in keys:
        for cbsa,record in old['cases'][key].items():
            before=record['graph_only_cost'];now=result['cases'][key][cbsa]['graph_only_cost']
            if before is not None:
                require(now is not None and now<=before+max(.002,abs(before)*1e-9),'Retained finite route lost or increased')
                status='unchanged' if math.isclose(before,now,abs_tol=.002,rel_tol=1e-9) else 'improved'
            else:status='still_unreachable' if now is None else 'newly_finite'
            statuses[status]+=1
    require(report['retained_costs_compared']==1872 and dict(statuses)==report['retained_cost_comparison_statuses'],'Retained comparison accounting changed')
    endpoint_ids=sorted({s['node'] for s in result['sources']}|set(map(int,result['probe_coordinates_lonlat'])))
    endpoint_hash=hashlib.sha256(json.dumps(endpoint_ids,separators=(',',':')).encode()).hexdigest()
    audit=report['query_core_audit']
    require(len(endpoint_ids)==42 and audit['protected_osm_node_ids']==endpoint_ids and audit['protected_node_set_sha256']==endpoint_hash,'Complete checksum-bound query scope required')
    require(audit['arbitrary_new_endpoints_supported'] is False,'Query view cannot support arbitrary endpoints')
    interface=report['interface_audit']
    require(interface['boundary_vertex_count']==178 and interface['boundary_vertex_limit']==192,'Bounded shared label inventory changed')
    require(interface['dense_port_closure_constructed'] is False and interface['flattened_road_union_constructed'] is False,'No dense closure or full road union allowed')
    require(report['full_model_union_nodes']==22027949,'Full input inventory changed')
    for graph in report['partition_graphs']+report['full_partition_graphs']:
        limits=graph['resource_limits']
        require(graph['nodes']<=limits['nodes']<=15000000 and graph['directed_primitive_arcs']<=limits['arcs']<=40000000,'Original shard caps changed')
    runs=report['local_oracle_runs']
    require(len(runs)==4 and {(run['metric'],run['reverse']) for run in runs}=={(m,r) for m in ('length','travel_time') for r in (False,True)},'Every oriented metric run required')
    for run in runs:
        require(run['solver_policy']=='two-shard-boundary-label-fixed-point-v1' and run['converged'] is True,'Fixed-point solver required')
        require(run['dense_overlay_constructed'] is False and run['auxiliary_nodes_per_shard']==1,'Only local auxiliary rows allowed')
        require(type(run['local_dijkstra_calls']) is int and 1<=run['local_dijkstra_calls']<=512,'Local call budget changed')
        require(run['local_dijkstra_calls']==run['propagation_dijkstra_calls']+run['replay_dijkstra_calls'],'Replay must count against the same budget')
        require(len(run['fixed_point_sweeps'])==31 and {s['source'] for s in run['fixed_point_sweeps']}=={s['node'] for s in result['sources']} and all(s['converged'] is True for s in run['fixed_point_sweeps']),'Every source must converge')
        require(max(run['working_shard_nodes'])<=15000000 and max(run['working_shard_arcs'])<=40000000,'Working graphs exceed native resource caps')
    require(sum(run['finite_queries_replayed'] for run in runs)==result['finite_queries'],'Finite replay accounting differs')
    result.update(schema='census-31-source-boundary-label-regression-v1',scenario_id=SCENARIO,
                  solver_policy='boundary-label-v1',query_endpoint_set_sha256=endpoint_hash,
                  full_model_union_nodes=report['full_model_union_nodes'],retained_cost_comparison_statuses=dict(statuses),
                  retained_census_checkpoint_sha256=report['census_checkpoint_sha256'],
                  **{flag:False for flag in FLAGS})
    old_raw=(ROOT/'docs/research/census-26-source-checkpoint/baseline.json').read_bytes()
    require(result['retained_census_checkpoint_sha256']==hashlib.sha256(old_raw).hexdigest(),'Frozen 26-source checkpoint identity changed')
    return result


def load_reference(root=REFERENCE):
    root=Path(root);manifest=json.loads((root/'manifest.json').read_text());raw=(root/'baseline.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==manifest['baseline_sha256'],'31-source checkpoint bytes changed')
    result=json.loads(raw)
    require(result['schema']=='census-31-source-boundary-label-regression-v1' and result['scenario_id']==SCENARIO,'Separate scenario identity required')
    require(all(result.get(flag) is False for flag in FLAGS),'Cost snapshot cannot approve access or coverage')
    return result


def check(report,root=REFERENCE):
    actual=project(report);expected=load_reference(root)
    require(actual==expected,'Separate 31-source costs or identities changed; review/version a new scenario')
    return dict(scenario_id=SCENARIO,sources_preserved=31,costs_preserved=2232,finite_queries=actual['finite_queries'],unreachable_queries=actual['unreachable_queries'],access_certified=False,release_eligible=False)

if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('report',type=Path);args=p.parse_args()
    print(json.dumps(check(json.loads(args.report.read_text())),indent=2))
