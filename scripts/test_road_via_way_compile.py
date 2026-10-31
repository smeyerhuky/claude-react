import copy
import json
from pathlib import Path
import unittest
from road_via_way_compile import compile_relation,UnsupportedViaWay
from road_maneuver_probe import solve
from via_way_compiler_checkpoint import project,REFERENCE


def way(wid,*ids,**tags):
    return dict(id=wid,tags=dict(highway='residential',oneway='yes',**tags),nodes=[[n,0,0] for n in ids])


def fixture():
    ways=[way(10,1,2),way(20,2,3,4),way(30,4,5),way(40,5,6)]
    relation=dict(id=100,tags=dict(type='restriction',restriction='no_left_turn'),members=[
        dict(type='w',ref=20,role='via'),dict(type='w',ref=40,role='to'),
        dict(type='w',ref=30,role='via'),dict(type='w',ref=10,role='from')])
    arcs=[]
    for w in ways:
        for i,(a,b) in enumerate(zip(w['nodes'],w['nodes'][1:])):
            arcs.append(dict(id=f"{w['id']}:{i}",way=w['id'],**{'from':a[0],'to':b[0]},length=1,travel_time=1))
    return relation,ways,arcs


class ViaWayCompilerTests(unittest.TestCase):
    def test_multi_via_shape_segments_and_roles_not_positional(self):
        relation,ways,arcs=fixture();pattern=compile_relation(relation,ways,arcs)
        self.assertEqual(pattern['arc_sequence'],['10:0','20:0','20:1','30:0','40:0'])
        self.assertEqual(pattern['ordered_member_way_ids'],[10,20,30,40])
        self.assertEqual(pattern['raw_junction_node_ids'],[2,4,5])
        arcs+= [dict(id='detour1',way=50,**{'from':2,'to':7},length=4,travel_time=4),
                dict(id='detour2',way=60,**{'from':7,'to':6},length=4,travel_time=4)]
        self.assertEqual(solve(range(1,8),arcs,[pattern],1,6)['arc_path'],['10:0','detour1','detour2'])
        self.assertEqual(solve(range(1,8),arcs,[pattern],3,6)['arc_path'],['20:1','30:0','40:0'])
        self.assertFalse(pattern['access_verified']);self.assertFalse(pattern['release_eligible'])

    def test_reversed_raw_via_geometry_uses_explicit_minus_one_direction(self):
        relation,ways,arcs=fixture();ways[1]['nodes'].reverse();ways[1]['tags']['oneway']='-1'
        self.assertEqual(compile_relation(relation,ways,arcs)['arc_sequence'],['10:0','20:0','20:1','30:0','40:0'])
        ways[1]['tags']['oneway']='yes'
        with self.assertRaisesRegex(UnsupportedViaWay,'contradicts raw'):compile_relation(relation,ways,arcs)

    def test_only_kind_and_specific_car_tag_precedence_are_explicit(self):
        relation,ways,arcs=fixture();relation['tags']['restriction:motorcar']='only_straight_on'
        pattern=compile_relation(relation,ways,arcs)
        self.assertEqual(pattern['kind'],'only');self.assertEqual(pattern['raw_restriction_kind'],'only_straight_on')
        self.assertEqual(solve(range(1,7),arcs,[pattern],1,6)['cost'],5)

    def test_missing_intermediate_arc_duplicate_arc_or_unsplit_junction_reject(self):
        relation,ways,arcs=fixture()
        for kind in ('missing','duplicate','interior','ambiguous'):
            rr,ww,aa=copy.deepcopy((relation,ways,arcs))
            if kind=='missing':aa.pop(2)
            elif kind=='duplicate':aa.append({**aa[1],'id':'parallel'})
            elif kind=='interior':ww[1]['nodes'].append([8,0,0])
            else:ww[1]['nodes'].insert(1,[1,0,0])
            with self.subTest(kind=kind),self.assertRaises(UnsupportedViaWay):compile_relation(rr,ww,aa)

    def test_unordered_disconnected_or_repeated_members_are_not_guessed(self):
        relation,ways,arcs=fixture()
        for kind in ('reverse_via_order','missing_way','repeated_member','via_node','unknown_role'):
            rr,ww,aa=copy.deepcopy((relation,ways,arcs))
            if kind=='reverse_via_order':rr['members'][0],rr['members'][2]=rr['members'][2],rr['members'][0]
            elif kind=='missing_way':ww.pop()
            elif kind=='repeated_member':rr['members'][2]['ref']=20
            elif kind=='via_node':rr['members'][0]['type']='n'
            else:rr['members'][0]['role']='unknown'
            with self.subTest(kind=kind),self.assertRaises(UnsupportedViaWay):compile_relation(rr,ww,aa)

    def test_conditional_mode_exception_hov_lane_and_purpose_controls_reject(self):
        relation,ways,arcs=fixture()
        for key,value,target in [('restriction:conditional','no_left_turn @ (Mo-Fr)','relation'),
                                 ('except','bus','relation'),('restriction:hgv','no_left_turn','relation'),
                                 ('motor_vehicle:conditional','no @ (Mo-Fr)','way'),('hov','yes','way'),
                                 ('turn:lanes','left|through','way'),('motorcar','destination','way'),
                                 ('vehicle','agricultural','way'),('oneway','reversible','way')]:
            rr,ww,aa=copy.deepcopy((relation,ways,arcs))
            (rr['tags'] if target=='relation' else ww[1]['tags'])[key]=value
            with self.subTest(key=key),self.assertRaises(UnsupportedViaWay):compile_relation(rr,ww,aa)

    def test_context_cannot_forge_source_identity_or_adoption(self):
        import tempfile,shutil
        for field,value in [('source',{}),('anchor_adopted',True)]:
            with self.subTest(field=field),tempfile.TemporaryDirectory() as folder:
                root=Path(folder)/'context';shutil.copytree(REFERENCE,root)
                path=root/'colorado-context.json';context=json.loads(path.read_text());context[field]=value
                path.write_text(json.dumps(context))
                with self.assertRaisesRegex(ValueError,'Exact unadopted'):project(root)

    def test_raw_colorado_chain_and_arizona_conditional_negative(self):
        report=project()
        self.assertEqual(report['positive']['compiled_pattern']['arc_sequence'],
                         ['800937106:0:0','186839303:0:0','800937105:0:0'])
        outward=report['positive']['comparisons'][0]
        self.assertEqual(outward['without_rule']['arc_path'],['800937106:0:0','186839303:0:0','800937105:0:0'])
        self.assertIsNone(outward['with_declared_rule']['cost'])
        self.assertTrue(report['negative']['rejected']);self.assertFalse(report['negative']['route_cost_emitted'])
        az=json.loads((REFERENCE/'arizona-context.json').read_text())
        approach=next(w for w in az['ways'] if w['id']==437327483)
        self.assertEqual(approach['tags']['motor_vehicle:conditional'],'no @ (Mo-Fr 06:00-09:00,15:00-19:00)')
        self.assertFalse(report['access_verified']);self.assertFalse(report['release_eligible'])


if __name__=='__main__':unittest.main()
