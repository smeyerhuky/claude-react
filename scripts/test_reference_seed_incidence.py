import copy
import json
import unittest
from reference_seed_incidence_checkpoint import audit, WITNESS, FALSE_FLAGS


class SeedIncidenceTests(unittest.TestCase):
    def witness(self):
        return json.loads(WITNESS.read_text())

    def test_retained_original_source_incidence_and_unenumerated_outer_nodes(self):
        result = audit(self.witness())
        self.assertEqual([result[k] for k in ('seed_nodes','source_incident_ways','complete_member_nodes',
            'touching_restriction_namespace_relations','unenumerated_new_member_nodes')],[8,8,27,1,19])
        self.assertFalse(result['all_graph_node_incidence_enumerated'])
        self.assertFalse(result['access_verified'])

    def test_omitted_or_added_incident_way_and_seed_fail(self):
        original = self.witness()
        changed = copy.deepcopy(original); changed['all_source_way_ids_at_seed_nodes']['6543050322'].pop()
        with self.assertRaises(ValueError): audit(changed)
        changed = copy.deepcopy(original); changed['all_source_way_ids_at_seed_nodes']['6543050322'].append(999)
        with self.assertRaises(ValueError): audit(changed)
        changed = copy.deepcopy(original); changed['seed_node_ids'].pop()
        with self.assertRaises(ValueError): audit(changed)
        changed = copy.deepcopy(original); changed['unenumerated_new_member_node_ids'].pop()
        with self.assertRaises(ValueError): audit(changed)

    def test_full_raw_record_and_source_identities_cannot_be_changed(self):
        original = self.witness()
        for key in ('source_sha256','raw_context_sha256','kernel_report_sha256'):
            changed = copy.deepcopy(original); changed[key] = '0'*64
            with self.subTest(key=key),self.assertRaises(ValueError): audit(changed)
        for key in ('complete_way_record_sha256','complete_node_record_sha256','touching_restriction_namespace_record_sha256'):
            changed = copy.deepcopy(original); changed[key][next(iter(changed[key]))] = '0'*64
            with self.subTest(key=key),self.assertRaises(ValueError): audit(changed)

    def test_source_enumeration_is_not_geographic_or_access_approval(self):
        original = self.witness()
        for key in FALSE_FLAGS:
            changed = copy.deepcopy(original); changed[key] = True
            with self.subTest(key=key),self.assertRaises(ValueError): audit(changed)
        changed = copy.deepcopy(original); changed['all_anchors_approved'] = True
        with self.assertRaises(ValueError): audit(changed)
