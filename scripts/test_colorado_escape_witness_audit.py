import copy
import unittest

from colorado_escape_witness_audit import audit_witnesses, vector_distance


def fixture():
    shape = [[0.,0.],[0.,1.],[1.,0.]]
    length = vector_distance(shape[0],shape[1])+vector_distance(shape[1],shape[2])
    return {"release_eligible": False, "access_certified": False,
            "source_union_geographic_coverage_certified": False, "complete_global_competition": False,
            "path_witnesses": [{"origin": 1, "destination": 3, "metric": metric,
                "independently_replayed_geometry_cost": length if metric == "length" else length/(60*1000/3600),
                "steps": [{"u":1,"v":3,"osm_node_ids":[1,2,3],"geometry_lonlat":shape,"speed_kph":60}]}
                for metric in ("length","travel_time")]}


class EscapeWitnessAuditTests(unittest.TestCase):
    def test_independent_both_metric_excursions_without_closure_claim(self):
        r = audit_witnesses(fixture())
        self.assertEqual(r["independent_actual_path_excursions_checked"],2)
        self.assertTrue(all(row["outside_geometry_points"]>0 for row in r["paths"]))
        self.assertEqual(r["applied_exterior_route_exclusions"],[])
        self.assertFalse(r["parent_exterior_coverage_certified"])

    def test_rejects_corrupt_cost_direction_or_speed(self):
        for mutate in (lambda r:r["path_witnesses"][0].update(independently_replayed_geometry_cost=1),
                       lambda r:r["path_witnesses"][0]["steps"][0].update(osm_node_ids=[3,2,1]),
                       lambda r:r["path_witnesses"][0]["steps"][0].update(speed_kph=141),
                       lambda r:r.update(release_eligible=True)):
            r=copy.deepcopy(fixture()); mutate(r)
            with self.assertRaises(ValueError): audit_witnesses(r)

    def test_no_excursion_or_missing_metric_cannot_validate_vacuously(self):
        r=fixture(); r["path_witnesses"].pop()
        with self.assertRaisesRegex(ValueError,"Both"):
            audit_witnesses(r)
        r=fixture()
        for w in r["path_witnesses"]:
            w["steps"][0]["geometry_lonlat"]=[[0.,0.],[.5,0.],[1.,0.]]
            length=vector_distance([0.,0.],[1.,0.])
            w["independently_replayed_geometry_cost"]=length if w["metric"]=="length" else length/(60*1000/3600)
        with self.assertRaisesRegex(ValueError,"vacuous"):
            audit_witnesses(r)


if __name__ == "__main__":
    unittest.main()
