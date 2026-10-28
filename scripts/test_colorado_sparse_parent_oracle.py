from fractions import Fraction
import unittest

import numpy as np
from scipy.sparse import csr_array

from colorado_adjacent_route_witnesses import CorridorWays,build_graph
from colorado_neighbor_metro_competition import audit_competition
from colorado_sparse_parent_oracle import compare_parent,trace_path
from road_primitive_sparse import PrimitiveSparseBuilder


def fixture(two_way=False):
    tags={"highway":"primary","oneway":"yes","maxspeed":"60"}
    rows={10:({**tags,"oneway":"no" if two_way else "yes"},[(1,0.,0.),(2,.3,0.)]),11:(tags,[(3,.3,.1),(5,.3,.2)])}
    baseline=build_graph(rows)
    sources=[{"cbsa":"10000","node":1},{"cbsa":"20000","node":3}]
    report=audit_competition(baseline,sources,[1,2,3],["10000","20000","30000"])
    report["selection_bbox"]=[-.01,-.01,.31,.21]
    builder=PrimitiveSparseBuilder()
    for way,(t,points) in rows.items():builder.add(way,t,points)
    builder.add(20,tags,[(3,.3,.1),(4,.35,.1),(2,.3,0.)])
    return builder.finish(),report


class SparseParentTests(unittest.TestCase):
    def test_parent_exterior_connection_changes_subset_winner_and_isochrone(self):
        parent,regional=fixture()
        result=compare_parent(parent,regional)
        self.assertEqual(result["independent_primitive_source_costs_checked"],24)
        self.assertEqual(result["primitive_predecessor_paths_checked"],sum(o["primitive_parent_cost"] is not None for r in result["comparisons"] for o in r["source_costs"]))
        for row in result["comparisons"]:
            for option in row["source_costs"]:
                exact=option["exact_stored_arc_path_cost"]
                if option["primitive_parent_cost"] is None:self.assertIsNone(exact)
                else:self.assertAlmostEqual(float(Fraction(*map(int,exact))),option["primitive_parent_cost"])
        self.assertEqual(result["changed_subset_winner_cases"],2)
        self.assertEqual(result["changed_isochrone_budget_cases"],2)
        self.assertEqual(result["unrepresented_source_qualifying_cbsa_ids"],["30000"])
        cases=[r for r in result["comparisons"] if r["probe"]=="2" and r["orientation"]=="metro-to-location"]
        self.assertTrue(all(r["regional_subset_winner_ids"]==["10000"] and r["primitive_parent_subset_winner_ids"]==["20000"] for r in cases))
        self.assertTrue(all(w["outside_regional_rectangle_vertices"]>0 and w["raw_osm_node_path"]==[3,4,2] for w in result["changed_route_witnesses"]))
        self.assertFalse(result["complete_global_competition"])
        self.assertEqual(result["applied_source_exclusions"],[])

    def test_inward_witness_is_reported_in_original_travel_direction(self):
        parent,regional=fixture(two_way=True)
        result=compare_parent(parent,regional)
        witnesses=[w for w in result["changed_route_witnesses"] if w["orientation"]=="location-to-metro"]
        self.assertTrue(witnesses)
        witness,=[w for w in witnesses if w["source_cbsa"]=="10000" and w["probe"]=="3" and w["metric"]=="length"]
        self.assertEqual(witness["raw_osm_node_path"],[3,4,2,1])
        self.assertGreater(Fraction(*map(int,witness["exact_modeled_path_cost"])),0)

    def test_changed_source_identity_coordinates_inventory_or_cost_fails(self):
        parent,regional=fixture()
        regional["probe_coordinates_lonlat"]["2"]=[.31,0.]
        with self.assertRaisesRegex(ValueError,"coordinate"):
            compare_parent(parent,regional)
        parent,regional=fixture()
        regional["source_qualifying_cbsa_ids"].append("30000")
        with self.assertRaises(ValueError):compare_parent(parent,regional)
        parent,regional=fixture()
        regional["probes"].pop()
        with self.assertRaisesRegex(ValueError,"regional directed"):
            compare_parent(parent,regional)
        parent,regional=fixture()
        for r in regional["probes"]:
            if r["probe"]=="2" and r["orientation"]=="metro-to-location":
                for option in r["source_costs"]:
                    if option["cbsa"]=="10000":option["cost"]=1
        with self.assertRaisesRegex(ValueError,"increased its cost"):
            compare_parent(parent,regional)

    def test_exact_path_trace_preserves_zero_arcs_and_rejects_missing_or_cycles(self):
        matrix=csr_array(([0.,2.],([0,1],[1,2])),shape=(3,3))
        path,cost=trace_path(matrix,np.array([-9999,0,1]),0,2)
        self.assertEqual(path,[0,1,2])
        self.assertEqual(cost,Fraction(2))
        with self.assertRaisesRegex(ValueError,"missing directed"):
            trace_path(matrix,np.array([-9999,0,0]),0,2)
        with self.assertRaisesRegex(ValueError,"cyclic"):
            trace_path(matrix,np.array([-9999,0,2]),0,2)


if __name__=="__main__":unittest.main()
