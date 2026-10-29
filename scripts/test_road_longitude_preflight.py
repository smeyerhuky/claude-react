import unittest
from road_longitude_preflight import LongitudeCutSweep


class LongitudeSweepTests(unittest.TestCase):
    def test_histograms_match_direct_membership_for_each_candidate(self):
        cuts=[-1.25,-.25,.25,1.25]
        p={i:(i,x,39.) for i,x in [(1,-2.),(2,-1.),(3,1.),(4,2.),(5,-1.5),(6,1.5)]}
        ways=[(10,{'highway':'residential'},[p[i] for i in (1,2,3,4)]),
              (11,{'highway':'primary','oneway':'yes'},[p[i] for i in (2,5,6,3)])]
        scan=LongitudeCutSweep(cuts)
        for way,tags,points in [*ways,ways[0]]:scan.add(way,tags,points)
        result=scan.finish();self.assertEqual(result['duplicate_raw_highways_verified'],1)
        for row in result['cuts']:
            nodes=[set(),set()];arcs=[0,0]
            for _,tags,points in ways:
                for a,b in zip(points,points[1:]):
                    side=0 if (a[1]+b[1])/2<row['longitude_cut'] else 1
                    nodes[side].update((a[0],b[0]));arcs[side]+=1 if tags.get('oneway')=='yes' else 2
            self.assertEqual(row['partition_nodes'],[len(s) for s in nodes])
            self.assertEqual(row['partition_raw_arcs'],arcs)
            self.assertEqual(row['shared_node_count'],len(nodes[0]&nodes[1]))
        self.assertFalse(result['release_eligible'])

    def test_aggregate_caps_fail_without_resume(self):
        for kwargs in ({'max_node_records':1},{'max_raw_arcs':1}):
            scan=LongitudeCutSweep([0.],**kwargs)
            with self.assertRaises(ValueError):scan.add(1,{'highway':'residential'},[(1,-1.,39.),(2,1.,39.)])
            with self.assertRaises(ValueError):scan.finish()

    def test_invalid_candidate_sets_rejected(self):
        for cuts in ([],[1.,0.],[0.,0.],[float('nan')],[True],list(range(257))):
            with self.assertRaises(ValueError):LongitudeCutSweep(cuts)


if __name__=='__main__':unittest.main()
