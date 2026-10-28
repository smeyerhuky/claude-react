from pathlib import Path
import shutil
import tempfile
import unittest

from colorado_exterior_parent_competition import compare_exterior
from colorado_utah_exterior_competition import REFERENCE, classify_expansion_effects, load_reference
from road_primitive_sparse import PrimitiveSparseBuilder
from test_colorado_exterior_parent_competition import fixture


class UtahExtensionTests(unittest.TestCase):
    def test_frozen_reference_is_bound_to_passed_source_inventory(self):
        manifest, domains, baseline = load_reference(REFERENCE)
        self.assertEqual(len(domains["source_qualifying_cbsa_ids"]), 367)
        self.assertEqual(len(baseline["sources"]), 13)
        self.assertEqual(manifest["additional_cbsa_ids"], ["39340", "41100"])
        for target in ("baseline.json", "domains.json"):
            with tempfile.TemporaryDirectory() as d:
                root = Path(d)
                for name in ("manifest.json", "baseline.json", "domains.json"):
                    shutil.copyfile(REFERENCE.parent/name, root/name)
                with (root/target).open("a") as f:
                    f.write(" ")
                with self.assertRaises(ValueError):
                    load_reference(root/"manifest.json")

    def test_second_expansion_reproduces_first_expansion_costs_and_preserves_leads(self):
        original, first_parent, domains, original_report = fixture()
        first = compare_exterior(original, first_parent, domains, original_report, ["30000"])
        # Replay the same ordered sources, snapshot the larger prefix, then
        # append a second exterior source rather than resetting the baseline.
        b = PrimitiveSparseBuilder()
        tags = {"highway": "primary", "oneway": "yes"}
        b.add(10, tags, [(1, 0., 0.), (4, .3, .5), (2, .3, 0.)])
        b.add(11, tags, [(3, 0., .2), (2, .3, 0.)])
        b.add(20, {**tags, "oneway": "no"}, [(1, 0., 0.), (6, .15, 0.), (2, .3, 0.)])
        larger_prefix = b.snapshot()
        b.add(30, {**tags, "oneway": "no"}, [(7, .29, 0.), (2, .3, 0.)])
        parent = b.finish()
        next(r for r in domains["domains"] if r["cbsa"] == "40000")["native_representative_lonlat"] = [.29, 0.]
        result = compare_exterior(larger_prefix, parent, domains, first, ["40000"])
        classify_expansion_effects(result, [s["cbsa"] for s in first["sources"]], ["40000"])
        self.assertEqual(result["original_prefix_costs_reproduced"], 36)
        self.assertEqual(result["source_costs_computed"], 48)
        self.assertGreater(result["changed_subset_winner_cases"], 0)
        self.assertEqual(result["winner_cases_changed_from_exterior_roads"], 0)
        self.assertGreater(result["winner_cases_changed_from_added_sources"], 0)
        for row in result["comparisons"]:
            option = next(o for o in row["source_costs"] if o["cbsa"] == "40000")
            self.assertEqual(option["prefix_cost_status"], "not_computed_for_previously_unrepresented_source")
        self.assertEqual(result["sources"][:3], first["sources"])
        self.assertEqual(result["sources"][3]["node"], 7)
        self.assertEqual(result["unrepresented_source_qualifying_cbsa_ids"], [])
        self.assertFalse(result["complete_global_competition"])
        self.assertEqual(result["applied_source_exclusions"], [])


if __name__ == "__main__":
    unittest.main()
