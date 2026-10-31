import copy
import unittest
from road_reference_segment_permissions import project
from road_reference_way_permissions import evaluate, DEFAULTS


def fixture():
    way = dict(id=100, nodes=[[1, -105, 40], [2, -105.001, 40], [3, -105.002, 40], [4, -105.003, 40]],
               tags={'highway': 'residential'})
    nodes = [dict(id=row[0], lonlat=row[1:], tags={}) for row in way['nodes']]
    return way, nodes


class ReferenceSegmentPermissionTests(unittest.TestCase):
    def run_projection(self, way, nodes, zones=None):
        return project(way, nodes, default_policy=DEFAULTS, feature_zones=zones)

    def allowed(self, result, expected):
        self.assertEqual(result['status'], 'supported_segment_projection', result.get('reason'))
        matrix = [[s['directions'][d]['modeled_permitted'] for d in ('forward', 'backward')]
                  for s in result['segments']]
        self.assertEqual(matrix, expected)
        self.assertEqual(result['eligible_directed_segments'], sum(sum(row) for row in expected))
        self.assertEqual(result['denied_directed_segments'], 2 * len(expected) - sum(sum(row) for row in expected))
        for flag in ('access_verified', 'route_cost_emitted', 'release_eligible', 'anchors_adopted',
                     'turn_restrictions_evaluated', 'geographic_coverage_certified'):
            self.assertIs(result[flag], False)

    def rejected(self, result):
        self.assertEqual(result['status'], 'unsupported')
        self.assertIsNone(result['segments'])
        self.assertIsNone(result['eligible_directed_segments'])
        self.assertIsNone(result['denied_directed_segments'])

    def test_internal_denial_blocks_incident_segments_without_whole_way_reachability_claim(self):
        way, nodes = fixture(); nodes[1]['tags'] = {'access': 'no'}
        whole = evaluate(way, nodes, default_policy=DEFAULTS)
        self.assertEqual(whole['eligible_directions'], [])
        result = self.run_projection(way, nodes)
        self.allowed(result, [[False, False], [False, False], [True, True]])
        self.assertEqual(result['segments'][0]['directions']['forward']['endpoint_node_denials'], [2])
        self.assertEqual(result['segments'][2]['directions']['forward']['endpoint_node_denials'], [])

    def test_endpoint_denial_does_not_invent_reachability_for_other_segments(self):
        way, nodes = fixture(); nodes[0]['tags'] = {'motorcar': 'private'}
        result = self.run_projection(way, nodes)
        self.allowed(result, [[False, False], [True, True], [True, True]])
        self.assertNotIn('reachable', result)
        self.assertNotIn('cost', result)
        for segment in result['segments']:
            self.assertNotIn('cost', segment)

    def test_way_prohibition_cannot_be_lifted_by_node_permission(self):
        way, nodes = fixture(); way['tags']['motorcar'] = 'no'
        for node in nodes: node['tags']['motorcar'] = 'yes'
        self.allowed(self.run_projection(way, nodes), [[False, False]] * 3)

    def test_explicit_backward_access_and_reverse_oneway_preserve_raw_orientation(self):
        way, nodes = fixture(); way['tags'].update({'oneway': '-1', 'motorcar:forward': 'no'})
        result = self.run_projection(way, nodes)
        self.allowed(result, [[False, True]] * 3)
        for index, segment in enumerate(result['segments']):
            self.assertEqual(segment['raw_segment_index'], index)
            self.assertEqual(segment['raw_geometry'], way['nodes'][index:index + 2])
            self.assertEqual((segment['directions']['backward']['from_node'],
                              segment['directions']['backward']['to_node']), (index + 2, index + 1))

    def test_node_mode_and_reference_condition_compose_on_exact_incident_segments(self):
        way, nodes = fixture()
        nodes[1]['tags'] = {'access': 'no', 'motorcar': 'yes'}
        nodes[2]['tags'] = {'motor_vehicle': 'yes', 'motor_vehicle:conditional': 'no @ (We 11:00-12:00)'}
        zones = {'node:3': 'America/Phoenix'}
        self.allowed(self.run_projection(way, nodes, zones), [[True, True], [False, False], [False, False]])
        self.rejected(self.run_projection(way, nodes))

    def test_unknown_remote_control_rejects_all_without_truncation_or_tag_deletion(self):
        for tags in ({'barrier': 'gate'}, {'motorcar': 'destination'}, {'maxheight': '2.1'},
                     {'access:conditional': 'no @ (PH)'}, {'access:forward': 'no'}):
            way, nodes = fixture(); nodes[-1]['tags'] = tags
            before = copy.deepcopy((way, nodes))
            self.rejected(self.run_projection(way, nodes, {'node:4': 'America/Denver'}))
            self.assertEqual((way, nodes), before)

    def test_even_remote_raw_records_and_coordinates_are_required(self):
        way, nodes = fixture()
        self.rejected(self.run_projection(way, nodes[:-1]))
        changed = copy.deepcopy(nodes); changed[-1]['lonlat'][0] = -106
        self.rejected(self.run_projection(way, changed))
        changed = copy.deepcopy(nodes); changed[-1] = changed[0]
        self.rejected(self.run_projection(way, changed))

    def test_closed_raw_way_keeps_index_identity_but_self_segment_is_unsupported(self):
        way, nodes = fixture(); way['nodes'].append(copy.deepcopy(way['nodes'][0]))
        result = self.run_projection(way, nodes)
        self.allowed(result, [[True, True]] * 4)
        self.assertEqual(result['segments'][-1]['directions']['forward']['to_node'], 1)
        way['nodes'].append(copy.deepcopy(way['nodes'][0]))
        self.rejected(self.run_projection(way, nodes))

    def test_input_hash_binds_remote_node_tags_and_whole_projection(self):
        way, nodes = fixture(); before = copy.deepcopy((way, nodes))
        original = self.run_projection(way, nodes)
        self.assertEqual((way, nodes), before)
        nodes[-1]['tags']['motorcar'] = 'no'
        changed = self.run_projection(way, nodes)
        self.assertNotEqual(original['raw_input_sha256'], changed['raw_input_sha256'])
        self.assertNotEqual(original['whole_way_projection_sha256'], changed['whole_way_projection_sha256'])
        self.assertEqual(original['segments'][0], changed['segments'][0])

    def test_output_geometry_and_selections_cannot_mutate_raw_inputs_or_other_segments(self):
        way, nodes = fixture(); before = copy.deepcopy((way, nodes))
        result = self.run_projection(way, nodes)
        result['segments'][0]['raw_geometry'][0][1] = -106
        result['segments'][0]['directions']['forward']['access_selection']['raw_value'] = 'no'
        self.assertEqual((way, nodes), before)
        self.assertIsNone(result['segments'][1]['directions']['forward']['access_selection']['raw_value'])


if __name__ == '__main__':
    unittest.main()
