"""Select source-inspection nodes by saturating a supplied graph's relaxed cost bounds."""
import hashlib
import json
from metro_competition_bounds import number
from road_core_exit_bounds import screen_first_exits,need,MAX_NODES


def sha(value):return hashlib.sha256(json.dumps(value,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()


def select_known_core(nodes,arcs,core_ids,source,target,*,incumbent_costs,max_rounds=MAX_NODES):
    need(type(max_rounds) is int and 1<=max_rounds<=MAX_NODES,'Bounded core-selection round budget required')
    need(isinstance(core_ids,(list,tuple)) and 1<=len(core_ids)<=MAX_NODES
         and all(type(n) is int and n>0 for n in core_ids) and len(set(core_ids))==len(core_ids),
         'Explicit bounded unique initial core nodes required')
    need(isinstance(incumbent_costs,dict) and set(incumbent_costs)=={'length','travel_time'},'Explicit same-query bounds for both metrics required')
    upper={metric:number(value) for metric,value in incumbent_costs.items()}
    need(all(value>=0 for value in upper.values()),'Nonnegative finite incumbent bounds required')
    core=set(core_ids);rounds=[]
    for _ in range(max_rounds):
        screens={metric:screen_first_exits(nodes,arcs,sorted(core),source,target,
            metric=metric,incumbent_upper_bound=upper[metric]) for metric in ('length','travel_time')}
        added=sorted({row['to_node'] for screen in screens.values() for row in screen['exits']
                      if row['reason']=='may_compete_or_tie'})
        rounds.append(dict(core_size=len(core),added_node_ids=added,
            metric_summaries={metric:dict(first_exits=len(screen['exits']),reachable_first_exits=screen['reachable_first_exits'],
                may_compete_or_tie=sum(row['reason']=='may_compete_or_tie' for row in screen['exits']),
                screen_sha256=sha(screen)) for metric,screen in screens.items()}))
        if not added:
            return dict(schema='known-graph-competitive-source-core-v1',source=source,target=target,
                initial_core_node_ids=sorted(core_ids),selected_source_node_ids=sorted(core),rounds=rounds,
                final_known_graph_screens=screens,known_graph_only=True,source_inspection_selection_only=True,
                source_incidence_certified=False,incumbent_feasibility_certified=False,
                applied_exterior_route_exclusions=[],geographic_coverage_certified=False,access_verified=False,release_eligible=False,
                warning='Saturation only within the supplied known graph using nonnegative stored costs and relaxed prefixes. Ties remain competitive. Selected nodes require original-source inspection; new incident ways/controls may expose more competitive exits. This is not geographic closure, a feasible-prefix claim, physical/legal access or release approval.')
        core.update(added)
    raise ValueError('Core-selection round budget exhausted; no partial selection returned')
