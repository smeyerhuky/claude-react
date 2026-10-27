import unittest

from colorado_adjacent_source_interfaces import RetainedInventory, UnionAudit, validate_sources

TAGS = {"highway": "primary", "oneway": "yes"}
POINTS = [(1, -105., 37.), (2, -104.9, 37.), (3, -104.8, 37.)]
SOURCES = [{"name": name, "sha256": digit*64, "replication_timestamp": "2026-10-27T00:00:00Z", "size_bytes": 10}
           for name, digit in (("colorado.osm.pbf", "a"), ("new-mexico.osm.pbf", "b"))]


class AdjacentInterfacesTests(unittest.TestCase):
    def audit(self):
        inventory = RetainedInventory("colorado.osm.pbf")
        inventory.add(10, TAGS, POINTS)
        audit = UnionAudit(inventory, SOURCES)
        audit.begin_source()
        audit.add(10, TAGS, POINTS)
        return audit

    def test_identical_overlap_is_deduplicated_but_parallel_ways_survive(self):
        audit = self.audit()
        audit.begin_source()
        audit.add(10, TAGS, POINTS)
        audit.add(20, TAGS, [POINTS[1], (4, -104.9, 36.9)])
        audit.add(21, TAGS, [POINTS[1], (4, -104.9, 36.9)])
        result = audit.report()
        row = result["extracts"][0]
        self.assertEqual(result["parent_modeled_way_count"], 3)
        self.assertEqual(result["sources"][1]["identical_overlap_highway_ways"], 1)
        self.assertEqual(row["directed_adjacency_counts"]["outbound"], 2)
        self.assertEqual(row["raw_interface_nodes"], [{"osm_node_id": 2, "lonlat": [-104.9, 37.],
                                                    "can_enter_retained_way_set": False,
                                                    "can_exit_retained_way_set": True}])
        for flag in ("release_eligible", "access_certified", "parent_exterior_coverage_certified",
                     "source_union_geographic_coverage_certified", "complete_global_competition"):
            self.assertIs(result[flag], False)

    def test_reverse_only_and_omitted_internal_arcs_keep_both_port_roles(self):
        audit = self.audit()
        audit.begin_source()
        audit.add(20, {**TAGS, "oneway": "-1"}, [POINTS[1], (4, -104.9, 36.9)])
        audit.add(21, TAGS, [POINTS[0], POINTS[2]])
        row = audit.report()["extracts"][0]
        self.assertEqual(row["directed_adjacency_counts"]["inbound"], 1)
        self.assertEqual(row["directed_adjacency_counts"]["outbound"], 0)
        self.assertEqual(row["directed_adjacency_counts"]["omitted_internal"], 1)
        self.assertEqual({p["osm_node_id"] for p in row["raw_interface_nodes"]}, {1, 2, 3})

    def test_conflicting_overlap_geometry_tags_and_support_fail(self):
        for tags, points in (({**TAGS, "access": "private"}, POINTS),
                             ({**TAGS, "oneway": "-1"}, POINTS),
                             (TAGS, [POINTS[0], (2, -104.95, 37.), POINTS[2]])):
            with self.subTest(tags=tags, points=points):
                audit = self.audit()
                audit.begin_source()
                with self.assertRaisesRegex(ValueError, "Overlapping"):
                    audit.add(10, tags, points)

    def test_shared_node_coordinate_conflict_on_different_way_id_fails(self):
        audit = self.audit()
        audit.begin_source()
        with self.assertRaisesRegex(ValueError, "shared-node coordinate"):
            audit.add(20, TAGS, [(2, -104.91, 37.), (4, -104.9, 36.9)])
        inventory = RetainedInventory("bad")
        inventory.add(10, TAGS, POINTS)
        with self.assertRaisesRegex(ValueError, "across ways"):
            inventory.add(11, TAGS, [(2, -104.91, 37.), (4, -104.9, 36.9)])

    def test_mixed_missing_or_repeated_sources_fail_before_scanning(self):
        cases = [[SOURCES[0]], [SOURCES[0], SOURCES[0]],
                 [SOURCES[0], {**SOURCES[1], "replication_timestamp": "2026-10-26T00:00:00Z"}],
                 [SOURCES[0], {**SOURCES[1], "replication_timestamp": ""}],
                 [SOURCES[0], {**SOURCES[1], "sha256": SOURCES[0]["sha256"]}],
                 [SOURCES[0], {**SOURCES[1], "sha256": "unknown"}]]
        for sources in cases:
            with self.subTest(sources=sources), self.assertRaises(ValueError):
                validate_sources(sources)

    def test_incomplete_scan_duplicate_within_source_and_missing_lineage_fail(self):
        audit = self.audit()
        with self.assertRaisesRegex(ValueError, "Not all"):
            audit.report()
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            audit.add(10, TAGS, POINTS)
        inventory = RetainedInventory("missing")
        inventory.add(30, TAGS, POINTS)
        audit = UnionAudit(inventory, SOURCES)
        audit.begin_source()
        audit.begin_source()
        with self.assertRaisesRegex(ValueError, "missing"):
            audit.report()
        with self.assertRaisesRegex(ValueError, "More scans"):
            audit.begin_source()


if __name__ == "__main__":
    unittest.main()
