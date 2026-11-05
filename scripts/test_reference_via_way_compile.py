import copy
from fractions import Fraction
import itertools
import json
import unittest
from road_reference_scenario import ROOT, load
from road_reference_way_permissions import DEFAULTS
from reference_via_way_compile import compile_relation
from road_maneuver_probe import solve
from test_road_maneuver_probe import independent_history_truth


def fixture():
    points = {i:[-105.+i*.001,40.+(i%2)*.001] for i in range(1,10)}
    ways = [dict(id=wid,tags={'highway':'residential','oneway':'no'},
                 nodes=[[nid,*points[nid]] for nid in ids])
            for wid,ids in [(10,[1,2,3]),(20,[3,4,5]),(30,[5,6,7])]]
    nodes = [dict(id=nid,lonlat=points[nid],tags={}) for nid in range(1,8)]
    relation = dict(id=42,tags={'type':'restriction','restriction':'no_left_turn'},
        members=[dict(type='w',ref=wid,role=role) for wid,role in [(10,'from'),(20,'via'),(30,'to')]])
    return relation,ways,nodes


def compile_case(*args, **kwargs):
    return compile_relation(*args,default_policy=DEFAULTS,**kwargs)


class ReferenceViaWayTests(unittest.TestCase):
    def compiled(self, result):
        self.assertEqual(result['status'],'compiled_declared_maneuver',result.get('reason'))
        self.assertTrue(result['topology_compiled'])
        for flag in ('access_verified','anchors_adopted','release_eligible','route_cost_emitted',
                     'all_incident_ways_accounted','other_relations_accounted','independent_maneuver_geometry_verified'):
            self.assertIs(result[flag],False)

    def rejected(self,result):
        self.assertEqual(result['status'],'unsupported')
        self.assertFalse(result['topology_compiled'])
        for key in ('declared_arc_sequence','transition','active_pattern'):
            self.assertIsNone(result[key])

    def test_entire_via_geometry_uses_exact_original_segment_indexes(self):
        original=fixture(); before=copy.deepcopy(original); result=compile_case(*original); self.compiled(result)
        self.assertEqual(result['declared_arc_sequence'],['raw:10:1:forward','raw:20:0:forward','raw:20:1:forward','raw:30:0:forward'])
        self.assertEqual([(a['from'],a['to']) for a in result['transition']],[(2,3),(3,4),(4,5),(5,6)])
        self.assertEqual(original,before)

    def test_all_eight_member_orientation_combinations(self):
        for flags in itertools.product((False,True),repeat=3):
            relation,ways,nodes=fixture()
            for reverse,way in zip(flags,ways):
                if reverse:way['nodes'].reverse()
            result=compile_case(relation,ways,nodes);self.compiled(result)
            expected=[f'raw:10:{0 if flags[0] else 1}:{"backward" if flags[0] else "forward"}']
            expected += ['raw:20:1:backward','raw:20:0:backward'] if flags[1] else ['raw:20:0:forward','raw:20:1:forward']
            expected += [f'raw:30:{1 if flags[2] else 0}:{"backward" if flags[2] else "forward"}']
            self.assertEqual(result['declared_arc_sequence'],expected)

    def test_ordered_multiple_via_ways(self):
        relation,ways,nodes=fixture();ways.insert(2,dict(id=25,tags={'highway':'residential','oneway':'no'},nodes=[[5,-104.995,40.001],[8,-104.992,40.]]))
        ways[-1]['nodes'][0]=[8,-104.992,40.];nodes.append(dict(id=8,lonlat=[-104.992,40.],tags={}))
        relation['members'].insert(2,dict(type='w',ref=25,role='via'))
        result=compile_case(relation,ways,nodes);self.compiled(result)
        self.assertEqual(result['declared_way_chain'],[10,20,25,30])
        relation['members'][1:3]=list(reversed(relation['members'][1:3]))
        self.rejected(compile_case(relation,ways,nodes))

    def test_permissions_cover_full_via_and_exact_approach_departure(self):
        relation,ways,nodes=fixture();ways[1]['tags']['oneway']='-1';self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();nodes[3]['tags']['access']='no';self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();nodes[0]['tags']['access']='no';self.compiled(compile_case(relation,ways,nodes))
        nodes[0]['tags']={'barrier':'bollard'};self.rejected(compile_case(relation,ways,nodes))

    def test_conditional_member_controls_use_explicit_feature_clock(self):
        relation,ways,nodes=fixture();ways[1]['tags']['oneway:conditional']='yes @ (We)'
        self.rejected(compile_case(relation,ways,nodes,relation_zone='America/Denver'))
        self.compiled(compile_case(relation,ways,nodes,feature_zones={'way:20':'America/Denver'}))
        ways[1]['tags']['motorcar:conditional']='no @ (We)'
        self.rejected(compile_case(relation,ways,nodes,feature_zones={'way:20':'America/Denver'}))
        scenario=load();scenario['reference_instant_utc']='2026-10-29T18:00:00Z'
        self.compiled(compile_case(relation,ways,nodes,scenario=scenario,feature_zones={'way:20':'America/Denver'}))

    def test_relation_controls_are_strictly_static_and_mode_precedence_is_explicit(self):
        relation,ways,nodes=fixture();relation['tags']['restriction:motorcar']='only_right_turn'
        result=compile_case(relation,ways,nodes);self.compiled(result)
        self.assertEqual(result['active_pattern']['kind'],'only');self.assertEqual(result['selected_key'],'restriction:motorcar')
        for key,value in [('restriction:conditional','no_left_turn @ (We)'),('except','motorcar'),('restriction:bicycle','no_left_turn'),('hour_on','19:00'),('hov','yes'),('restriction','none')]:
            r,w,n=fixture();r['tags'][key]=value;self.rejected(compile_case(r,w,n))

    def test_complete_node_set_and_geometry_cannot_be_substituted(self):
        relation,ways,nodes=fixture();self.rejected(compile_case(relation,ways,nodes[:-1]))
        duplicate=copy.deepcopy(nodes);duplicate[-1]=copy.deepcopy(duplicate[0]);self.rejected(compile_case(relation,ways,duplicate))
        moved=copy.deepcopy(nodes);moved[2]['lonlat'][0]+=.0001;self.rejected(compile_case(relation,ways,moved))
        foreign=copy.deepcopy(nodes);foreign[-1]['id']=99;self.rejected(compile_case(relation,ways,foreign))

    def test_parallel_interior_ambiguous_and_repeated_geometry_reject(self):
        relation,ways,nodes=fixture();ways[1]['id']=21;self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();ways[0]['nodes'][1:]=list(reversed(ways[0]['nodes'][1:]));self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();ways[1]['nodes'].append(copy.deepcopy(ways[0]['nodes'][0]));self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();ways[1]['nodes'].append(copy.deepcopy(ways[1]['nodes'][0]));self.rejected(compile_case(relation,ways,nodes))

    def test_wrong_members_extra_context_and_zones_reject(self):
        relation,ways,nodes=fixture();relation['members'][1]['type']='n';self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();relation['members'].append(dict(type='w',ref=20,role='via'));self.rejected(compile_case(relation,ways,nodes))
        relation,ways,nodes=fixture();extra=copy.deepcopy(ways[1]);extra['id']=40;self.rejected(compile_case(relation,ways+[extra],nodes))
        self.rejected(compile_case(*fixture(),feature_zones={'way:999':'America/Denver'}))
        self.rejected(compile_case(*fixture(),relation_zone='not/a/zone'))

    def test_no_partial_output_when_pattern_budget_exhausted(self):
        relation,ways,nodes=fixture()
        via=[[3,*nodes[2]['lonlat']]]+[[100+i,-104.99+i*.000001,40.] for i in range(128)]+[[5,*nodes[4]['lonlat']]]
        ways[1]['nodes']=via
        nodes.extend(dict(id=row[0],lonlat=row[1:],tags={}) for row in via[1:-1])
        nodes=[n for n in nodes if n['id']!=4]
        self.rejected(compile_case(relation,ways,nodes))

    def test_compiled_patterns_enforce_full_history_against_independent_oracle(self):
        for kind in ('no_left_turn','only_left_turn'):
            relation,ways,nodes=fixture();relation['tags']['restriction']=kind
            result=compile_case(relation,ways,nodes);self.compiled(result)
            arcs=[dict(a,length=1,travel_time=2) for a in result['transition']]
            arcs.extend([dict(id='exit',way=40,**{'from':4,'to':8},length=3,travel_time=1),
                         dict(id='return',way=50,**{'from':8,'to':6},length=3,travel_time=1)])
            pattern=[result['active_pattern']]
            for metric in ('length','travel_time'):
                for source,target in ((2,6),(3,6),(4,6),(2,8),(2,4),(2,2)):
                    actual=solve(range(1,9),arcs,pattern,source,target,metric)
                    truth=independent_history_truth(arcs,pattern,source,target,metric)
                    self.assertEqual(truth,None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost'])))
            path=solve(range(1,9),arcs,pattern,2,6)['arc_path']
            self.assertEqual(path,['raw:10:1:forward','raw:20:0:forward','exit','return'] if kind.startswith('no_')
                             else ['raw:10:1:forward','raw:20:0:forward','raw:20:1:forward','raw:30:0:forward'])

    def test_actual_source_chains_and_complete_raw_inputs_are_preserved(self):
        from reference_via_way_checkpoint import CONTEXT, EXPECTED, project
        context=json.loads(CONTEXT.read_text());before=copy.deepcopy(context)
        result=project(context)
        for rid,sequence in EXPECTED.items():
            self.assertEqual(result['compilations'][str(rid)]['declared_arc_sequence'],sequence)
        self.assertEqual(context,before)

    def test_actual_source_mutations_cannot_hide_remote_controls_or_missing_records(self):
        from reference_via_way_checkpoint import CONTEXT, project
        original=json.loads(CONTEXT.read_text())
        changed=copy.deepcopy(original);changed['nodes'].pop()
        with self.assertRaises(ValueError):project(changed)
        changed=copy.deepcopy(original);next(n for n in changed['nodes'] if n['id']==1829343894)['tags']['barrier']='gate'
        with self.assertRaises(ValueError):project(changed)
        changed=copy.deepcopy(original);changed['source']['sha256']='0'*64
        with self.assertRaises(ValueError):project(changed)
