import copy
from fractions import Fraction
import json
import random
import unittest
from fort_collins_competitive_checkpoint import project,SOURCE,REFERENCE,PRIOR_SOURCE,RETAINED,FALSE_FLAGS,RELATION_ZONES
from road_posted_speed_graph import compile_graph
from road_reference_way_permissions import DEFAULTS,HIGHWAYS
from road_reference_scenario import load
from road_maneuver_probe import solve
from test_road_maneuver_probe import independent_history_truth


def raw_graph():
    raw=json.loads(SOURCE.read_text());ways=[w for w in raw['ways'] if w['tags'].get('highway') in HIGHWAYS]
    ids={p[0] for w in ways for p in w['nodes']};nodes=[n for n in raw['nodes'] if n['id'] in ids]
    return ways,nodes,raw['control_relations']


class CompetitiveSourceCoreTests(unittest.TestCase):
    def raw(self):return json.loads(SOURCE.read_text())

    def test_frozen_source_selection_complete_context_and_raw_immutability(self):
        raw=self.raw();before=copy.deepcopy(raw);report=project(raw)
        self.assertEqual(report,json.loads((REFERENCE/'report.json').read_text()));self.assertEqual(raw,before)
        self.assertEqual((report['source_seed_nodes'],report['complete_source_ways'],report['complete_source_nodes']),(96,76,343))
        self.assertEqual((report['declared_roads'],report['declared_road_nodes'],report['weighted_arcs'],report['retained_controls']),(54,216,359,10))
        self.assertEqual(report['unchanged_parent_weighted_arcs'],175)
        selection=report['known_graph_source_selection'];self.assertEqual(len(selection['rounds']),17)
        self.assertEqual(len(selection['initial_core_node_ids']),45);self.assertEqual(len(selection['selected_source_node_ids']),96)
        self.assertTrue(all(s['conditional_exterior_routes_cannot_improve'] for s in selection['final_known_graph_screens'].values()))
        self.assertTrue(all(not s['conditional_exterior_routes_cannot_improve'] for s in report['current_source_core_exit_bounds'].values()))

    def test_1024_metric_query_comparisons_match_independent_history_graph(self):
        report=json.loads((REFERENCE/'report.json').read_text());g=report['declared_compilation']['graph'];nodes=g['nodes']
        q=report['query_replays']['length'];pairs=[(root,node) for root in (q['source'],q['target']) for node in nodes]
        rng=random.Random(264);pairs += [(rng.choice(nodes),rng.choice(nodes)) for _ in range(80)]
        self.assertEqual(len(pairs)*2,1024)
        for metric in ('length','travel_time'):
            for source,target in pairs:
                actual=solve(nodes,g['arcs'],g['maneuvers'],source,target,metric)
                expected=independent_history_truth(g['arcs'],g['maneuvers'],source,target,metric)
                value=None if actual['cost'] is None else Fraction(*map(int,actual['exact_stored_path_cost']))
                self.assertEqual(value,expected,(source,target,metric))

    def test_metric_specific_paths_and_remaining_exits_are_not_global_optimality(self):
        report=json.loads((REFERENCE/'report.json').read_text());distance=report['query_replays']['length'];time=report['query_replays']['travel_time']
        self.assertNotEqual(distance['arc_path'],time['arc_path'])
        trade=report['metric_path_tradeoff'];self.assertLess(trade['length']['length'],trade['travel_time']['length'])
        self.assertLess(trade['travel_time']['travel_time'],trade['length']['travel_time'])
        for metric,count in (('length',15),('travel_time',26)):
            screen=report['current_source_core_exit_bounds'][metric]
            self.assertEqual(sum(r['reason']=='may_compete_or_tie' for r in screen['exits']),count)
            self.assertFalse(screen['conditional_exterior_routes_cannot_improve'])
        self.assertEqual(report['applied_exterior_route_exclusions'],[]);self.assertFalse(report['global_route_optimality_certified'])

    def test_conditional_control_needs_complete_members_and_its_own_explicit_zone(self):
        ways,nodes,controls=raw_graph()
        self.assertIsNone(compile_graph(ways,nodes,controls,default_policy=DEFAULTS)['graph'])
        scenario=load();scenario['reference_instant_utc']='2026-10-30T01:00:00Z'
        active=compile_graph(ways,nodes,controls,default_policy=DEFAULTS,scenario=scenario,relation_zones=RELATION_ZONES)
        self.assertIsNotNone(active['graph']);self.assertEqual(len(active['graph']['maneuvers']),10)
        control=active['graph']['relation_compilations'][active['graph']['supplied_raw_relation_ids'].index(20193102)]
        self.assertEqual(control['active_pattern']['arc_sequence'],['raw:696728766:5:forward','raw:1475543490:0:forward'])
        ways=[w for w in ways if w['id']!=1475543490];ids={p[0] for w in ways for p in w['nodes']};nodes=[n for n in nodes if n['id'] in ids]
        self.assertIsNone(compile_graph(ways,nodes,controls,default_policy=DEFAULTS,relation_zones=RELATION_ZONES)['graph'])

    def test_missing_incidence_members_or_controls_cannot_be_dropped(self):
        for mutation in ('outside_way','member_way','node','control','membership','seed','extra'):
            raw=self.raw()
            if mutation=='outside_way':raw['ways'].remove(next(w for w in raw['ways'] if w['tags'].get('highway') not in HIGHWAYS))
            if mutation=='member_way':raw['ways']=[w for w in raw['ways'] if w['id']!=1475543490]
            if mutation=='node':raw['nodes'].pop()
            if mutation=='control':raw['control_relations'].pop()
            if mutation=='membership':next(rows for rows in raw['all_source_way_ids_at_seed_nodes'].values() if rows).pop()
            if mutation=='seed':raw['seed_node_ids'].pop()
            if mutation=='extra':raw['requested_member_way_ids'].pop()
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)

    def test_unknown_new_controls_do_not_yield_a_partial_graph(self):
        old=json.loads(PRIOR_SOURCE.read_text());priorways={w['id'] for w in old['ways']};priornodes={n['id'] for n in old['nodes']}
        for mutation in ('way','node'):
            raw=self.raw()
            if mutation=='way':next(w for w in raw['ways'] if w['id'] not in priorways and w['tags'].get('highway') in HIGHWAYS)['tags']['barrier']='bollard'
            else:
                new_road_nodes={p[0] for w in raw['ways'] if w['tags'].get('highway') in HIGHWAYS for p in w['nodes']}-priornodes
                next(n for n in raw['nodes'] if n['id'] in new_road_nodes)['tags']['barrier']='gate'
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)
        raw=self.raw();retained=json.loads(RETAINED.read_text());known=priorways|{w['id'] for w in retained['ways']}
        outside=next(w for w in raw['ways'] if w['id'] not in known and w['tags'].get('highway') not in HIGHWAYS)
        outside['nodes'][0][1]+=.01
        with self.assertRaises(ValueError):project(raw)

    def test_source_identity_shared_tags_and_approval_claims_cannot_change(self):
        for mutation in ('source','lane','conditional'):
            raw=self.raw()
            if mutation=='source':raw['source']['sha256']='0'*64
            if mutation=='lane':next(w for w in raw['ways'] if w['id']==140486410)['tags'].pop('turn:lanes:backward')
            if mutation=='conditional':next(r for r in raw['control_relations'] if r['id']==20193102)['tags'].pop('restriction:conditional')
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):project(raw)
        for flag in FALSE_FLAGS:
            raw=self.raw();raw[flag]=True
            with self.subTest(flag=flag),self.assertRaises(ValueError):project(raw)

    def test_all_outer_nodes_outside_classes_and_independent_gates_stay_explicit(self):
        report=json.loads((REFERENCE/'report.json').read_text());raw=self.raw()
        self.assertEqual(report['unenumerated_outer_source_nodes'],247);self.assertEqual(len(report['outside_declared_road_class_ids']),22)
        self.assertTrue(set(report['outside_declared_road_class_ids'])<={w['id'] for w in raw['ways']})
        for flag in ('unknown_controls_omitted','all_graph_node_incidence_enumerated','global_route_optimality_certified',
                     'geographic_coverage_certified','access_verified','anchors_adopted','connector_costs_included','release_eligible'):
            self.assertIs(report[flag],False)
        raw['unenumerated_member_node_ids'].pop()
        with self.assertRaises(ValueError):project(raw)
