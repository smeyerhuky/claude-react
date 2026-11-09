from itertools import combinations
import unittest
from road_maneuver_subset_projection import project_to_arc_subset
from road_maneuver_probe import solve


def arc(a,u,v):return dict(id=a,way=ord(a),**{'from':u,'to':v},length=1,travel_time=2)
def rule(identity,kind,*sequence):return dict(id=identity,kind=kind,arc_sequence=list(sequence))


def legal(path,rules):
    # Independent path-language oracle: every completed NO occurrence forbids
    # a path; each activated ONLY prefix must continue as named when it continues.
    for r in rules:
        seq=r['arc_sequence']
        for start in range(len(path)):
            if r['kind']=='no':
                if path[start:start+len(seq)]==seq:return False
            elif path[start]==seq[0]:
                for offset in range(1,min(len(seq),len(path)-start)):
                    if path[start+offset]!=seq[offset]:return False
    return True


class ManeuverSubsetProjectionTests(unittest.TestCase):
    def setUp(self):
        self.arcs=[arc('a',1,2),arc('b',2,3),arc('c',2,4),arc('d',3,4),arc('e',3,2),arc('f',4,1)]

    def test_external_only_continuation_blocks_internal_alternatives_but_not_stopping(self):
        p=project_to_arc_subset(self.arcs,[rule('only','only','a','b')],{'a','c'})
        self.assertEqual(p['projected_maneuvers'],[rule('subset-rule-0','no','a','c')])
        self.assertTrue(legal(['a'],p['projected_maneuvers']))
        self.assertFalse(legal(['a','c'],p['projected_maneuvers']))
        self.assertFalse(p['release_eligible']);self.assertFalse(p['access_verified'])

    def test_internal_only_prefix_is_preserved_before_external_required_arc(self):
        original=[rule('only','only','a','b','d')]
        projected=project_to_arc_subset(self.arcs,original,{'a','b','c','e'})['projected_maneuvers']
        self.assertFalse(legal(['a','c'],projected))
        self.assertFalse(legal(['a','b','e'],projected))
        self.assertTrue(legal(['a','b'],projected))
        self.assertTrue(legal(['b','e'],projected))  # No invented source approach.

    def test_exhaustive_subset_walks_match_independent_original_language(self):
        cases=[[rule('n','no','a','b','d')],[rule('o','only','a','b','d')],
               [rule('o','only','a','b'),rule('n','no','b','e')],
               [rule('o','only','a','b','d'),rule('p','only','b','d'),rule('n','no','c','f')]]
        by_id={a['id']:a for a in self.arcs};ids=list(by_id)
        comparisons=0
        for original in cases:
            for size in range(len(ids)+1):
                for subset in combinations(ids,size):
                    projected=project_to_arc_subset(self.arcs,original,subset)['projected_maneuvers']
                    paths=[[]]
                    for _ in range(6):
                        following=[]
                        for path in paths:
                            for aid in subset:
                                if not path or by_id[path[-1]]['to']==by_id[aid]['from']:
                                    extended=path+[aid];comparisons+=1
                                    self.assertEqual(legal(extended,original),legal(extended,projected),(original,subset,extended))
                                    following.append(extended)
                        paths=following
        self.assertGreater(comparisons,1000)

    def test_solver_cannot_escape_only_rule_by_omitting_required_external_arc(self):
        original=[rule('o','only','a','b')]
        projected=project_to_arc_subset(self.arcs,original,{'a','c','f'})
        travel=[a for a in self.arcs if a['id'] in projected['allowed_arc_ids']]
        for metric in ('length','travel_time'):
            result=solve([1,2,3,4],travel,projected['projected_maneuvers'],1,4,metric)
            self.assertIsNone(result['cost'])
            stop=solve([1,2,3,4],travel,projected['projected_maneuvers'],1,2,metric)
            self.assertIsNotNone(stop['cost'])

    def test_generated_duplicates_keep_all_provenance_and_invalid_originals_reject(self):
        p=project_to_arc_subset(self.arcs,[rule('o','only','a','b'),rule('n','no','a','c')],{'a','c'})
        self.assertEqual(len(p['projected_maneuvers']),1)
        self.assertEqual({r['source_pattern_id'] for r in p['projected_rule_origins']['subset-rule-0']},{'o','n'})
        for rules in ([rule('o','only','a','b'),rule('p','only','a','c')],
                      [rule('x','no','a','b'),rule('x','no','c','f')],
                      [rule('x','no','a','d')]):
            with self.assertRaises(ValueError):project_to_arc_subset(self.arcs,rules,{'a','b','c'})

    def test_expansion_budgets_and_unknown_arcs_fail_without_partial_projection(self):
        with self.assertRaises(ValueError):project_to_arc_subset(self.arcs,[rule('o','only','a','b')],{'a','c'},max_projected_patterns=0)
        with self.assertRaises(ValueError):project_to_arc_subset(self.arcs,[],{'foreign'})
        with self.assertRaises(ValueError):project_to_arc_subset(self.arcs,[],['a','a'])
        with self.assertRaises(ValueError):project_to_arc_subset(self.arcs,[],{'a'},max_projected_patterns=True)

    def test_terminal_only_provenance_and_unrepresentable_interaction_fail_closed(self):
        p=project_to_arc_subset(self.arcs,[rule('o','only','a','b')],{'a'})
        self.assertEqual(p['omitted_patterns'],[dict(source_pattern_id='o',reason='only-prefix-already-terminal-in-subset')])
        with self.assertRaisesRegex(ValueError,'Only maneuver forces a prohibited subsequence'):
            project_to_arc_subset(self.arcs,[rule('o','only','a','b','d'),rule('p','only','b','e')],{'a','b','d'})
