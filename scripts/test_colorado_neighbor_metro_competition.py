import copy
import unittest
from unittest.mock import patch

import networkx as nx

from colorado_neighbor_metro_competition import PROBE_PLACES, audit_competition, baseline_origin_coverage, select_probe_places, validate_inventory
from road_spike import assign


def graph_fixture():
    g=nx.MultiDiGraph()
    for u,v,length,time in [(1,3,50000,4000),(2,3,110000,3000),(3,1,110000,3000),(3,2,50000,4000)]:
        g.add_edge(u,v,length=length,travel_time=time)
    g.add_node(4)
    for n in g:g.nodes[n].update(x=float(n),y=0.)
    return g,[{"cbsa":"10000","node":1},{"cbsa":"20000","node":2}]


def inventory_fixture():
    metros=[{"cbsa":cbsa,"name":name,"population":pop,"lon":lon,"lat":lat}
            for cbsa,name,pop,lon,lat in [("10000","A",100000,0.,0.),("20000","B",200000,1.,1.)]]
    r={"release_eligible":False,"access_certified":False,"road_coverage_certified":False,"complete_global_competition":False,
       "source_qualifying_cbsa_ids":["10000","20000","30000"],"existing_csv_cbsa_ids":["10000","20000"],
       "domains":[{"cbsa":m["cbsa"],"name":m["name"],"source_population":m["population"],"native_representative_lonlat":[m["lon"],m["lat"]]} for m in metros]+[{"cbsa":"30000"}]}
    return r,metros


class NeighborMetroTests(unittest.TestCase):
    def test_metric_and_direction_competition_with_separate_isochrone_checks(self):
        g,sources=graph_fixture()
        r=audit_competition(g,sources,[1,2,3,4],["10000","20000","30000"])
        self.assertEqual(r["independent_source_costs_checked"],32)
        self.assertEqual(r["single_source_isochrone_probe_checks"],32)
        self.assertEqual(r["unrepresented_source_qualifying_cbsa_ids"],["30000"])
        winners={(x["orientation"],x["metric"]):x["subset_winner_ids"] for x in r["probes"] if x["probe"]=="3"}
        self.assertEqual(winners[("metro-to-location","length")],["10000"])
        self.assertEqual(winners[("metro-to-location","travel_time")],["20000"])
        self.assertEqual(winners[("location-to-metro","length")],["20000"])
        self.assertEqual(winners[("location-to-metro","travel_time")],["10000"])
        self.assertTrue(all(x["subset_winner_ids"]==[] and len(x["source_costs"])==2 for x in r["probes"] if x["probe"]=="4"))
        self.assertEqual(r["applied_source_exclusions"],[])
        self.assertFalse(r["complete_global_competition"])

    def test_corrupted_production_label_is_independently_detected(self):
        g,sources=graph_fixture()
        def corrupt(graph,sources,metric,**kwargs):
            r=assign(graph,sources,metric,**kwargs)
            if "max_cost" not in kwargs:
                for label in r.values():label["cost"]+=1
            return r
        with patch("colorado_neighbor_metro_competition.assign",side_effect=corrupt):
            with self.assertRaisesRegex(ValueError,"winner/cost"):
                audit_competition(g,sources,[1,2,3],["10000","20000"])

    def test_unknown_or_duplicate_source_and_bad_weights_fail(self):
        g,sources=graph_fixture()
        with self.assertRaises(ValueError):audit_competition(g,sources,[1,2],["10000"])
        with self.assertRaises(ValueError):audit_competition(g,sources,[1,2],["10000","20000","20000"])
        g[1][3][0]["travel_time"]=-1
        with self.assertRaisesRegex(ValueError,"costs"):
            audit_competition(g,sources,[1,2],["10000","20000"])

    def test_hidden_baseline_shape_origin_is_not_missing_raw_geography(self):
        rows={10:({},[(1,0.,0.),(2,1.,0.),(3,2.,0.)])}
        sources=[{"cbsa":"10000","node":1},{"cbsa":"20000","node":2},{"cbsa":"30000","node":4}]
        result=baseline_origin_coverage(sources,rows,{1,3})
        self.assertEqual([(r["retained_raw_source_geometry_present"],r["retained_contracted_source_node_present"]) for r in result],
                         [(True,True),(True,False),(False,False)])

    def test_official_town_probe_identity_is_separate_from_metro_origins(self):
        rows=[{"GEOID":geoid,"NAME":name,"USPS":"CO","LSAD":"43","FUNCSTAT":"A",
               "INTPTLONG":"-106.0","INTPTLAT":"37.1"} for geoid,name in PROBE_PLACES.items()]
        leads=select_probe_places(rows)
        self.assertEqual(len(leads),3)
        self.assertTrue(all(p["cbsa"].startswith("diagnostic-place:") for p in leads))
        bad=copy.deepcopy(rows);bad[0]["USPS"]="NM"
        with self.assertRaises(ValueError):select_probe_places(bad)
        with self.assertRaises(ValueError):select_probe_places(rows+rows[:1])

    def test_complete_source_inventory_and_exact_identity_binding(self):
        r,metros=inventory_fixture()
        self.assertEqual(len(validate_inventory(r,metros,{"10000","20000"})),2)
        for mutate in (lambda r:r["source_qualifying_cbsa_ids"].append("10000"),
                       lambda r:r["domains"].pop(),
                       lambda r:r["domains"][0].update(name="wrong"),
                       lambda r:r["domains"][0].update(source_population=99999),
                       lambda r:r["domains"][0].update(native_representative_lonlat=[1.,1.]),
                       lambda r:r.update(release_eligible=True)):
            bad=copy.deepcopy(r);mutate(bad)
            with self.assertRaises(ValueError):validate_inventory(bad,metros,{"10000","20000"})


if __name__=="__main__":unittest.main()
