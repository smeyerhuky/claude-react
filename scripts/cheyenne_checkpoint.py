"""Validate the separate 32-source graph-only experiment without approving access."""
import argparse
from collections import Counter
import hashlib
from fractions import Fraction
import json
import math
from pathlib import Path
from metro_scenario_checkpoint import FLAGS, project as common, require
from six_state_checkpoint import load_reference

ROOT=Path(__file__).resolve().parents[1]
CANDIDATES=ROOT/'docs/research/cheyenne-partition-layouts/initial-negative.json'
NAMES=('colorado.osm.pbf','new-mexico.osm.pbf','arizona.osm.pbf','utah.osm.pbf','oklahoma.osm.pbf','kansas.osm.pbf','wyoming.osm.pbf')


def winners(rows,field):
    finite=[(r[field],r['cbsa']) for r in rows if r[field] is not None]
    best=min((v for v,_ in finite),default=None)
    return ([] if best is None else sorted(cbsa for v,cbsa in finite if abs(v-best)<=max(.002,abs(best)*1e-9))),best


SCENARIO='census-seven-state-query-repartition-v1-fullcut-107.4-querycut-104'


def project(report):
    result=common(report);old=load_reference()
    require(report['schema']=='cheyenne-query-repartition-competition-v1' and report['scenario_id']==SCENARIO and report['solver_policy']=='boundary-label-v1','Separate query-only32-source scenario required')
    previous={s['cbsa']:s for s in old['sources']};ids={s['cbsa'] for s in result['sources']}
    require(ids==set(previous)|{'16940'} and len({s['node'] for s in result['sources']})==32,'Exactly31 retained and one distinct Cheyenne lead required')
    require(result['source_qualifying_cbsa_ids']==old['source_qualifying_cbsa_ids'] and len(result['unrepresented_source_qualifying_cbsa_ids'])==335,'All367 competitors must remain accounted for')
    require(result['probe_coordinates_lonlat']==old['probe_coordinates_lonlat'] and result['metric_units']==old['metric_units'] and result['domains_sha256']==old['domains_sha256'],'Inherited probes, units and native domains changed')
    archive=json.loads((ROOT/'scripts/research-source-snapshots/co-nm-az-20261027.json').read_text());files={r['filename']:r for r in archive['files']}
    expected=[dict(name=n,sha256=files[n]['sha256'],size_bytes=files[n]['bytes'],replication_timestamp='2026-10-27T21:23:59Z') for n in NAMES]
    require(result['source_provenance']==expected,'Exact seven original inputs required')
    require(report['candidate_reference_sha256']==hashlib.sha256(CANDIDATES.read_bytes()).hexdigest() and report['retained_checkpoint_sha256']==hashlib.sha256((ROOT/'docs/research/census-31-source-checkpoint/baseline.json').read_bytes()).hexdigest(),'Immutable prior checkpoints changed')
    negative=json.loads(CANDIDATES.read_text());candidates={s['cbsa']:s for s in negative['candidate_sources']}
    for s in result['sources']:
        require(all(s[k]==candidates[s['cbsa']][k] for k in ('node','node_lonlat','native_origin_lonlat','lead_policy','access_verified','connector_costs_included','diagnostic_gap_m')),'Unapproved native lead changed')
        if s['cbsa'] in previous:
            require(s['retained_reference_record']==previous[s['cbsa']],'Full31-source record changed')
        require(s['query_view_membership_shards'] and set(s['query_view_membership_shards'])<= {0,1},'Missing query membership')
    require(set(result['cases'])==set(old['cases']) and report['source_costs_computed']==2304 and report['new_source_costs_computed']==72 and report['retained_costs_compared']==2232,'Complete32-by72 costs required')
    statuses=Counter()
    for key,rows in old['cases'].items():
        for cbsa,record in rows.items():
            before=record['graph_only_cost'];now=result['cases'][key][cbsa]['graph_only_cost']
            if before is not None:
                require(now is not None and now<=before+max(.002,abs(before)*1e-9),'Retained route lost or increased')
                status='unchanged' if math.isclose(before,now,rel_tol=1e-9,abs_tol=.002) else 'improved'
            else:status='still_unreachable' if now is None else 'newly_finite'
            statuses[status]+=1
    require(dict(statuses)==report['retained_cost_comparison_statuses'],'Retained cost accounting differs')
    for case in report['comparisons']:
        rows=case['source_costs'];tied,best=winners(rows,'graph_only_cost');retained=winners([r for r in rows if r['cbsa'] in previous],'graph_only_cost')[0]
        require(case['subset_winner_ids']==tied and case['best_graph_only_cost']==best and case['retained_source_winner_ids']==retained and case['added_source_winner_changed']==(tied!=retained),'Sampled winner accounting differs')
    endpoints=sorted({s['node'] for s in result['sources']}|set(map(int,result['probe_coordinates_lonlat'])))
    endpoint_hash=hashlib.sha256(json.dumps(endpoints,separators=(',',':')).encode()).hexdigest()
    query=report['query_core_audit'];interface=report['interface_audit'];audit=report['query_repartition_audit']
    require(len(endpoints)==43 and query['protected_osm_node_ids']==endpoints and query['protected_node_set_sha256']==endpoint_hash and query['arbitrary_new_endpoints_supported'] is False,'Exact43 protected endpoints required')
    require(query==negative['query_core_audit'] and query['surviving_shared_vertices']==216,'Original protected query inventory changed')
    require(report['ingestion_cut']==-107.4 and report['query_cut']==-104.0 and report['full_model_union_nodes']==23582740,'Original full ingestion and query-only layout required')
    require(audit['output_shared_vertices']==191 and audit['input_pair_entries']==audit['assigned_pair_entries'] and audit['native_vertices_omitted']==0 and audit['coordinate_changes']==0,'Native pair or vertex preservation failed')
    require(audit['full_source_repartition_constructed'] is False and audit['flattened_weighted_union_constructed'] is False,'No full-source query cut or weighted union allowed')
    require(interface['boundary_vertex_count']==191 and interface['boundary_vertex_limit']==192 and interface['dense_port_closure_constructed'] is False and interface['flattened_road_union_constructed'] is False,'Original bounded interface policy required')
    for g in report['partition_graphs']+report['full_partition_graphs']:
        require(g['nodes']<=g['resource_limits']['nodes']<=15000000 and g['directed_primitive_arcs']<=g['resource_limits']['arcs']<=40000000,'Original shard budgets changed')
    runs=report['local_oracle_runs']
    require(len(runs)==4 and {(r['metric'],r['reverse']) for r in runs}=={(m,d) for m in ('length','travel_time') for d in (False,True)},'All four directed metric runs required')
    for run in runs:
        require(run['converged'] is True and run['solver_policy']=='two-shard-boundary-label-fixed-point-v1' and run['dense_overlay_constructed'] is False and run['auxiliary_nodes_per_shard']==1,'Converged bounded local oracle required')
        require(1<=run['local_dijkstra_calls']<=512 and run['local_dijkstra_calls']==run['propagation_dijkstra_calls']+run['replay_dijkstra_calls'],'Original shared replay budget changed')
        require(len(run['fixed_point_sweeps'])==32 and {s['source'] for s in run['fixed_point_sweeps']}=={s['node'] for s in result['sources']} and all(s['converged'] is True for s in run['fixed_point_sweeps']),'Every source must converge')
        require(max(run['working_shard_nodes'])<=15000000 and max(run['working_shard_arcs'])<=40000000,'Working graphs exceed original caps')
    source_nodes={s['cbsa']:s['node'] for s in result['sources']}
    for run in runs:
        legs={}
        for leg in run['legs']:
            key=(leg['shard'],leg['from'],leg['to'])
            require(key not in legs and key[0] in (0,1),'Duplicate or invalid native leg')
            require(leg['solver_path_orientation']==('reversed_model_graph' if run['reverse'] else 'model_graph') and leg['raw_node_count']>=1,'Native replay orientation changed')
            for field in ('solver_path_sha256','actual_directed_path_sha256'):
                require(len(leg[field])==64 and all(c in '0123456789abcdef' for c in leg[field]),'Native replay hash missing')
            legs[key]=Fraction(*map(int,leg['exact_stored_path_cost']))
        checked=0
        for case in report['comparisons']:
            if case['metric']!=run['metric'] or (case['orientation']=='location-to-metro')!=run['reverse']:continue
            for row in case['source_costs']:
                if row['graph_only_cost'] is None:
                    require(not row['segments'],'Unreachable query has native segments');continue
                current=source_nodes[row['cbsa']];total=Fraction(0)
                for segment in row['segments']:
                    key=tuple(segment)
                    require(key in legs and key[1]==current,'Native replay legs do not join')
                    current=key[2];total+=legs[key]
                require(current==int(case['probe']) and total==Fraction(*map(int,row['exact_stored_path_cost'])),'Composed native replay does not match exact reported cost')
                checked+=1
        require(checked==run['finite_queries_replayed'],'Per-run finite replay accounting differs')
    require(sum(r['finite_queries_replayed'] for r in runs)==result['finite_queries'],'Replay accounting differs')
    result.update(schema='census-32-source-query-repartition-regression-v1',scenario_id=SCENARIO,solver_policy='boundary-label-v1',query_endpoint_set_sha256=endpoint_hash,retained_cost_comparison_statuses=dict(statuses),**{f:False for f in FLAGS})
    return result


REFERENCE=ROOT/'docs/research/census-32-source-checkpoint'


def load_reference32(root=REFERENCE):
    root=Path(root);manifest=json.loads((root/'manifest.json').read_text());raw=(root/'baseline.json').read_bytes()
    require(hashlib.sha256(raw).hexdigest()==manifest['baseline_sha256'],'32-source checkpoint bytes changed')
    data=json.loads(raw)
    require(data['schema']=='census-32-source-query-repartition-regression-v1' and data['scenario_id']==SCENARIO,'Separate32-source snapshot required')
    require(all(data.get(f) is False for f in FLAGS),'Research snapshot cannot certify access or coverage')
    require(len(data['sources'])==32 and len(data['cases'])==72 and data['finite_queries']+data['unreachable_queries']==2304,'Complete32-source snapshot required')
    return data


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('report',type=Path);p.add_argument('--compare',type=Path);a=p.parse_args();r=project(json.loads(a.report.read_text()))
    if a.compare:require(r==project(json.loads(a.compare.read_text())),'Independent original-source semantic reproduction differs')
    print(json.dumps(dict(scenario_id=SCENARIO,sources=32,costs=2304,finite=r['finite_queries'],unreachable=r['unreachable_queries'],access_certified=False),indent=2))
