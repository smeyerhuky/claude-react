import unittest

from colorado_raw_boundary_interfaces import ParentAudit, RawInventory

TAGS = {"highway": "primary", "oneway": "yes"}
POINTS = [(1, 0., 0.), (2, 1., 0.), (3, 2., 0.)]


class RawBoundaryTests(unittest.TestCase):
    def inventory(self):
        inventory = RawInventory("baseline")
        inventory.add(10, TAGS, POINTS)
        return inventory

    def test_reverse_only_boundary_and_hidden_shape_node_interface(self):
        audit = ParentAudit([self.inventory()])
        audit.add(10, TAGS, POINTS)
        # Node 2 is an interior shape point, not a retained way endpoint.
        audit.add(20, {**TAGS, "oneway": "-1"}, [POINTS[1], (4, 1., 1.)])
        audit.add(30, {**TAGS, "oneway": "no"}, POINTS[1:])
        audit.add(40, TAGS, [POINTS[2], (5, 3., 0.)])
        result = audit.report()
        row = result["extracts"][0]
        self.assertEqual(row["directed_adjacency_counts"], {"inbound": 1, "outbound": 1, "omitted_internal": 2, "identical_coordinate_adjacencies": 0})
        self.assertEqual(row["retained_raw_interface_node_count"], 2)
        self.assertIn({"osm_way_id": 20, "segment_index": 0, "u": 4, "v": 2}, row["sample_directed_adjacencies"])
        self.assertFalse(result["extract_coverage_certified"])
        self.assertFalse(row["parent_raw_adjacency_interface_empty"])

    def test_parent_lineage_checks_tags_coordinates_and_missing_ways(self):
        audit = ParentAudit([self.inventory()])
        with self.assertRaisesRegex(ValueError, "disagree"):
            audit.add(10, {**TAGS, "maxspeed": "20"}, POINTS)
        audit = ParentAudit([self.inventory()])
        with self.assertRaisesRegex(ValueError, "disagree"):
            audit.add(10, TAGS, [POINTS[0], (2, 1.1, 0.), POINTS[2]])
        with self.assertRaisesRegex(ValueError, "missing"):
            ParentAudit([self.inventory()]).report()

    def test_repeated_and_parallel_adjacencies_are_counted(self):
        audit = ParentAudit([self.inventory()], sample_limit=1)
        audit.add(10, TAGS, POINTS)
        audit.add(21, TAGS, [POINTS[1], (4, 1., 1.), POINTS[1], (4, 1., 1.)])
        audit.add(20, TAGS, [POINTS[1], (4, 1., 1.)])
        row = audit.report()["extracts"][0]
        self.assertEqual(row["directed_adjacency_counts"]["outbound"], 3)
        self.assertEqual(row["directed_adjacency_counts"]["inbound"], 1)
        self.assertEqual(row["sample_directed_adjacencies"], [{"osm_way_id": 20, "segment_index": 0, "u": 2, "v": 4}])

    def test_zero_coordinate_length_is_only_a_potential_adjacency(self):
        audit = ParentAudit([self.inventory()])
        audit.add(10, TAGS, POINTS)
        audit.add(20, TAGS, [POINTS[1], (4, 1., 0.)])
        row = audit.report()["extracts"][0]
        self.assertEqual(row["directed_adjacency_counts"]["identical_coordinate_adjacencies"], 1)
        self.assertNotIn("route_cost", row)

    def test_unknown_direction_and_private_ways_do_not_invent_connections(self):
        audit = ParentAudit([self.inventory()])
        audit.add(10, TAGS, POINTS)
        audit.add(20, {**TAGS, "oneway": "reversible"}, [POINTS[1], (4, 1., 1.)])
        audit.add(30, {**TAGS, "access": "private"}, [POINTS[1], (4, 1., 1.)])
        result = audit.report()
        self.assertEqual(result["parent_unsupported_direction_way_count"], 1)
        self.assertTrue(result["extracts"][0]["parent_raw_adjacency_interface_empty"])
        self.assertFalse(result["parent_exterior_coverage_certified"])

    def test_duplicate_or_malformed_extracts_fail_closed(self):
        inventory = self.inventory()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            inventory.add(10, TAGS, POINTS)
        with self.assertRaises(ValueError):
            inventory.add(11, TAGS, [(1, float("nan"), 0), POINTS[1]])
        with self.assertRaises(ValueError):
            ParentAudit([inventory, inventory])


if __name__ == "__main__":
    unittest.main()
