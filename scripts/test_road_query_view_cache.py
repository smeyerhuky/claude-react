from pathlib import Path
import tempfile
import unittest
from road_query_leaf_core import prune
from road_query_view_cache import save,load
from test_road_query_leaf_core import graph
from test_road_longitude_partition import arcs


class QueryCacheTests(unittest.TestCase):
    def views(self):
        a=graph([(1,{'highway':'residential'},[(1,-108.,39.),(2,-107.,39.)])])
        b=graph([(2,{'highway':'residential'},[(2,-107.,39.),(3,-106.,39.)])])
        return prune((a,b),[1,3])[0]

    def test_roundtrip_keeps_native_arcs_and_scope(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'views';views=self.views();save(views,p,{'scope':[1,3]},{'access_verified':False})
            restored,ctx=load(p,{'scope':[1,3]});self.assertFalse(ctx['access_verified'])
            for a,b in zip(views,restored):
                self.assertEqual(a.report,b.report)
                for metric in ['length','travel_time']:self.assertEqual(arcs(a,metric),arcs(b,metric))
            with self.assertRaises(ValueError):load(p,{'scope':[1,2,3]})
            with self.assertRaises(ValueError):save(views,p,{'scope':[1,3]},ctx)

    def test_array_tamper_fails_before_use(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'views';save(self.views(),p,{},{});q=p/'0-length.data.npy';q.write_bytes(q.read_bytes()+b'x')
            with self.assertRaises(ValueError):load(p,{})

    def test_metadata_corruption_and_scope_binding_are_not_attestations(self):
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/'views';save(self.views(),p,{},{});q=p/'manifest.json';q.write_text(q.read_text().replace('"release_eligible": false','"release_eligible": true'))
            with self.assertRaises(ValueError):load(p,{})
