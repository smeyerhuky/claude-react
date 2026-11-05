import copy
from fractions import Fraction
import json
import unittest
from road_reference_declared_graph import compile_graph, query, MAX_WAYS
from road_reference_way_permissions import DEFAULTS
from road_reference_scenario import ROOT, load
from test_road_maneuver_probe import independent_history_truth


def fixture():
    xy = {1: [-105.002,40.], 2: [-105.001,40.], 3: [-105.,40.],
          4: [-105.,40.001], 5: [-105.,40.002], 6: [-104.998,40.001]}
    ways = [dict(id=wid, tags={'highway':'residential', 'oneway':'no'},
                 nodes=[[nid, *xy[nid]] for nid in ids])
            for wid, ids in [(10,[1,2,3]), (20,[3,4,5]), (30,[3,6]), (40,[6,4])]]
    nodes = [dict(id=nid, lonlat=point, tags={}) for nid, point in xy.items()]
    relation = dict(id=42, tags={'type':'restriction', 'restriction':'no_left_turn'},
        members=[dict(type='w',ref=10,role='from'),dict(type='n',ref=3,role='via'),dict(type='w',ref=20,role='to')])
    return ways, nodes, [relation]


def compile_case(*args, **kwargs):
    return compile_graph(*args, default_policy=DEFAULTS, **kwargs)


def query_case(*args, **kwargs):
    return query(*args, default_policy=DEFAULTS, **kwargs)


class ReferenceDeclaredGraphTests(unittest.TestCase):
    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported', result)
        self.assertIsNone(result['graph']); self.assertFalse(result['declared_graph_compiled'])

    def test_composed_real_weights_and_patterns_match_independent_history_oracle(self):
        ways,nodes,relations=fixture(); original=copy.deepcopy((ways,nodes,relations))
        for raw_kind in ('no_left_turn','only_left_turn'):
            relations[0]['tags']['restriction']=raw_kind
            compiled=compile_case(ways,nodes,relations)
            self.assertEqual(compiled['status'],'compiled_declared_graph')
            graph=compiled['graph']
            for metric in ('length','travel_time'):
                for source,target in ((1,5),(5,1),(2,4),(3,4),(2,6),(2,2)):
                    answer=query_case(ways,nodes,relations,source,target,metric)
                    self.assertEqual(answer['status'],'solved_declared_graph')
                    actual=answer['result']; truth=independent_history_truth(graph['arcs'],graph['maneuvers'],source,target,metric)
                    self.assertEqual(truth, None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])))
            path=query_case(ways,nodes,relations,2,4)['result']['arc_path']
            self.assertEqual(path,['raw:10:1:forward','raw:30:0:forward','raw:40:0:forward']
                             if raw_kind.startswith('no_') else ['raw:10:1:forward','raw:20:0:forward'])
        relations[0]['tags']['restriction']='no_left_turn'
        self.assertEqual((ways,nodes,relations),original)

    def test_same_scenario_binds_weights_and_patterns_without_host_timezone_fallback(self):
        ways,nodes,relations=fixture()
        relations[0]['tags']={'type':'restriction','restriction:conditional':'no_left_turn @ (We)'}
        self.rejected(compile_case(ways,nodes,relations))
        fixed=compile_case(ways,nodes,relations,relation_zones={'42':'America/Denver'})
        scenario=load(); scenario['reference_instant_utc']='2026-10-29T18:00:00Z'
        other=compile_case(ways,nodes,relations,scenario=scenario,relation_zones={'42':'America/Denver'})
        self.assertEqual(len(fixed['graph']['maneuvers']),1); self.assertEqual(other['graph']['maneuvers'],[])
        self.assertNotEqual(fixed['scenario_sha256'],other['scenario_sha256'])
        for compiled in (fixed,other):
            for row in compiled['graph']['relation_compilations']:
                self.assertEqual(row['scenario_sha256'],compiled['scenario_sha256'])

    def test_distance_and_time_can_choose_different_paths(self):
        ways,nodes,_=fixture()
        ways[1]['tags']['maxspeed']='5'
        for way in ways[2:]: way['tags']['maxspeed']='100'
        distance=query_case(ways,nodes,[],2,4,'length')['result']
        time=query_case(ways,nodes,[],2,4,'travel_time')['result']
        self.assertEqual(distance['arc_path'],['raw:10:1:forward','raw:20:0:forward'])
        self.assertEqual(time['arc_path'],['raw:10:1:forward','raw:30:0:forward','raw:40:0:forward'])
        graph=compile_case(ways,nodes,[])['graph']
        for metric,answer in [('length',distance),('travel_time',time)]:
            truth=independent_history_truth(graph['arcs'],[],2,4,metric)
            self.assertEqual(Fraction(*map(int,answer['exact_stored_path_cost'])),truth)

    def test_unsupported_disconnected_supplied_context_cannot_be_cropped(self):
        ways,nodes,relations=fixture()
        ways[-1]['tags']['maxspeed']='signals'
        self.rejected(compile_case(ways,nodes,relations))
        answer=query_case(ways,nodes,relations,1,2)
        self.assertIsNone(answer['result']); self.assertFalse(answer['route_cost_emitted'])

    def test_complete_shared_node_identity_and_coordinates(self):
        ways,nodes,relations=fixture(); ways[1]['nodes'][0][1] += .0001
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=fixture(); self.rejected(compile_case(ways,nodes[:-1],relations))
        duplicate=copy.deepcopy(nodes); duplicate[-1]=copy.deepcopy(nodes[0])
        self.rejected(compile_case(ways,duplicate,relations))
        self.rejected(compile_case(ways,nodes+[dict(id=999,lonlat=[0,0],tags={})],relations))

    def test_duplicate_ways_and_relations_reject(self):
        ways,nodes,relations=fixture()
        self.rejected(compile_case(ways+[copy.deepcopy(ways[0])],nodes,relations))
        self.rejected(compile_case(ways,nodes,relations+copy.deepcopy(relations)))

    def test_external_or_unsupported_relation_rejects_entire_bundle(self):
        ways,nodes,relations=fixture(); relations[0]['members'][2]['ref']=999
        self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=fixture(); relations[0]['tags']['restriction:conditional']='no_left_turn @ (PH)'
        self.rejected(compile_case(ways,nodes,relations,relation_zones={'42':'America/Denver'}))

    def test_conflicting_only_constraints_reject_before_bundle_output(self):
        ways,nodes,relations=fixture(); relations[0]['tags']['restriction']='only_left_turn'
        other=copy.deepcopy(relations[0]); other['id']=43; other['members'][2]['ref']=30
        self.rejected(compile_case(ways,nodes,relations+[other]))

    def test_unknown_feature_zone_and_relation_zone_records_reject(self):
        self.rejected(compile_case(*fixture(),feature_zones={'way:999':'America/Denver'}))
        self.rejected(compile_case(*fixture(),relation_zones={'999':'America/Denver'}))

    def test_budgets_and_malformed_fields_never_emit_partial_graph(self):
        ways,nodes,relations=fixture()
        self.rejected(compile_case(ways*(MAX_WAYS+1),nodes,relations))
        ways[0]['nodes']=[None,None]; self.rejected(compile_case(ways,nodes,relations))
        ways,nodes,relations=fixture(); relations[0]['members']=[None,None,None]
        self.rejected(compile_case(ways,nodes,relations))

    def test_invalid_query_and_no_assumed_reverse_permission(self):
        answer=query_case(*fixture(),999,2); self.assertEqual(answer['status'],'unsupported'); self.assertIsNone(answer['result'])
        self.assertFalse(answer['route_cost_emitted'])
        answer=query_case(*fixture(),1,2,'unknown'); self.assertEqual(answer['status'],'unsupported')

    def test_no_geographic_approval_or_anchor_claims(self):
        result=compile_case(*fixture())
        for key in ('complete_geographic_graph_constructed','all_incident_ways_accounted','other_relations_accounted',
                    'geographic_timezone_assignment_verified','access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(result[key],False)
        self.assertEqual(result['graph']['same_way_reversals'],'disallowed')

    def test_actual_declared_pair_routes_at_reference_and_blocks_when_active(self):
        raw=json.loads((ROOT/'docs/research/fort-collins-entry-context/raw-osm-context.json').read_text())
        relations=raw['restrictions']; ids={m['ref'] for r in relations for m in r['members'] if m['type']=='w'}
        ways=[w for w in raw['ways'] if w['id'] in ids]
        nids={p[0] for w in ways for p in w['nodes']}; nodes=[n for n in raw['nodes'] if n['id'] in nids]
        kwargs=dict(relation_zones={'20193102':'America/Denver'})
        graph=compile_case(ways,nodes,relations,**kwargs)['graph']
        incoming=next(a for a in graph['arcs'] if a['id']=='raw:696728766:5:forward')
        outgoing=next(a for a in graph['arcs'] if a['id']=='raw:1475543490:0:forward')
        for metric in ('length','travel_time'):
            result=query_case(ways,nodes,relations,incoming['from'],outgoing['to'],metric,**kwargs)
            self.assertEqual(result['result']['arc_path'],[incoming['id'],outgoing['id']])
            self.assertFalse(result['access_verified']); self.assertFalse(result['geographic_coverage_certified'])
            active=load(); active['reference_instant_utc']='2026-10-30T01:00:00Z'
            result=query_case(ways,nodes,relations,incoming['from'],outgoing['to'],metric,scenario=active,**kwargs)
            self.assertIsNone(result['result']['cost'])
            self.assertFalse(result['route_cost_emitted'])
        bollard=next(w for w in raw['ways'] if w['id']==815164359)
        ids=nids|{p[0] for p in bollard['nodes']}; nodes=[n for n in raw['nodes'] if n['id'] in ids]
        self.rejected(compile_case(ways+[bollard],nodes,relations,**kwargs))
