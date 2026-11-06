"""Road-level car permissions with validated static lane-indication annotations."""
from road_reference_scenario import load,validate,digest
from road_reference_way_permissions import evaluate as historical,DEFAULTS,DIRECTIONS,_raw_values,_access,_oneway,_other_controls
from road_static_lane_guidance import parse
from reference_via_node_compile import canonical_sha

POLICY='reference-car-road-permissions-with-static-guidance-v1'
LANE_REJECTION='Lane context requires separate lane and maneuver evaluation'


def need(value,reason):
    if not value:raise ValueError(reason)


def remaining_way_controls(tags):
    # The immutable historical validator has already checked geometry, tag
    # budgets, all conditional syntax and access/oneway namespaces before its
    # lane rejection. Validate EVERY subsequent family on the original tags.
    # Nothing is removed, rewritten, or passed as a filtered adapter.
    need(not any(k=='hov' or k.startswith('hov:') for k in tags),'HOV context requires separate occupancy/lane evaluation')
    need(not any(k.startswith(('maxheight','maxwidth','maxlength','maxweight','maxweightrating','maxaxleload','width','minspeed')) for k in tags),
         'Dimensional or vehicle-performance control remains unsupported')
    need(not any(k=='opening_hours' or k.startswith('opening_hours:') for k in tags),'Opening-hours composition remains unsupported')
    need(not tags.get('barrier') or tags['barrier']=='no','Physical barrier operation remains unsupported')
    need(not tags.get('traffic_sign'),'Traffic-sign meaning/orientation remains unsupported')
    need(not tags.get('ford') and tags.get('highway')!='ford','Ford conditions remain unsupported')
    need(not any(k.startswith(('construction','proposed:','disused:','abandoned:')) for k in tags),'Lifecycle or construction context remains unsupported')


def evaluate(way,nodes,*,default_policy,scenario=None,feature_zones=None):
    scenario=load() if scenario is None else scenario;validate(scenario)
    need(default_policy==DEFAULTS,'Explicit supported road-default policy required')
    baseline=historical(way,nodes,default_policy=default_policy,scenario=scenario,feature_zones=feature_zones)
    result=dict(schema=POLICY,status='unsupported',scenario_sha256=digest(scenario),default_policy=default_policy,
        historical_projection_sha256=canonical_sha(baseline),input_sha256=None,static_lane_guidance=None,
        direction_permissions=None,eligible_directions=[],raw_value_traces=[],tags_mutated=False,
        node_record_ids_match_way_geometry=baseline['node_record_ids_match_way_geometry'],
        lane_indications_used_as_restrictions=False,lane_connectivity_evaluated=False,lane_changes_evaluated=False,
        lane_level_graph_constructed=False,turn_restrictions_evaluated=False,speed_profile_evaluated=False,
        route_cost_emitted=False,geographic_coverage_certified=False,geographic_timezone_assignment_verified=False,
        access_verified=False,anchors_adopted=False,connector_costs_included=False,release_eligible=False,
        scope='Road-level modeled car access/direction under the fixed scenario, retaining validated static lane-indication metadata. No inferred legal turn bans/permissions, lane links/changes/occupancy, physical access, approved anchors or geographic graph.')
    if baseline['status']!='supported_tag_projection' and baseline.get('reason')!=LANE_REJECTION:
        result['reason']=baseline['reason'];return result
    try:
        need(baseline['node_record_ids_match_way_geometry'] and baseline['input_sha256'] is not None,'Complete historical raw validation required')
        guidance=parse(way['tags']);remaining_way_controls(way['tags'])
        for node in nodes:_other_controls(node['tags'],node=True)
        zones={} if feature_zones is None else feature_zones;traces=[]
        values=_raw_values(way['tags'],f'way:{way["id"]}',scenario,zones,traces)
        node_values={node['id']:_raw_values(node['tags'],f'node:{node["id"]}',scenario,zones,traces) for node in nodes}
        denied=[nid for nid,value in node_values.items() if not _access(value)['modeled_permitted']]
        oneway=_oneway(values,way['tags']);directions={}
        for direction in DIRECTIONS:
            need(not (guidance['counts'].get('lanes:'+direction)==0 and oneway[direction]),
                 'Zero declared lanes conflict with the modeled driving direction')
            access=_access(values,direction,highway_default=True)
            directions[direction]=dict(modeled_permitted=bool(access['modeled_permitted'] and oneway[direction] and not denied),
                access_selection=access,oneway_allows=oneway[direction],node_denials=denied)
        result.update(status='supported_tag_projection',input_sha256=canonical_sha(dict(way=way,nodes=nodes,zones=zones,
            scenario_sha256=digest(scenario),policy=POLICY)),static_lane_guidance=guidance,
            direction_permissions=directions,eligible_directions=[d for d in DIRECTIONS if directions[d]['modeled_permitted']],
            selected_oneway=oneway,raw_value_traces=traces)
    except (ValueError,TypeError) as error:result['reason']=str(error)
    return result
