import copy
from datetime import datetime
from unittest.mock import patch
import unittest
from road_reference_scenario import load,validate,digest,local_reference,planned_tooltip,declared_zone
from metro_anchor_set_contract import aggregate,registry_digest,SCHEMA


class FixedReferenceScenarioTests(unittest.TestCase):
    def test_one_absolute_instant_has_explicit_regional_local_clocks(self):
        scenario=load()
        expected={'America/Denver':'2026-10-28T12:00:00-06:00',
                  'America/Phoenix':'2026-10-28T11:00:00-07:00',
                  'America/New_York':'2026-10-28T14:00:00-04:00',
                  'Pacific/Honolulu':'2026-10-28T08:00:00-10:00'}
        for zone,value in expected.items():
            with self.subTest(zone=zone):self.assertEqual(local_reference(scenario,zone).isoformat(),value)

    def test_changed_reference_invalidates_same_graph_anchor_cost_binding(self):
        scenario=load();changed=copy.deepcopy(scenario);changed['reference_instant_utc']='2026-10-28T19:00:00Z'
        first,second=digest(scenario),digest(changed);self.assertNotEqual(first,second)
        registry=dict(schema=SCHEMA,research_only=True,cbsa='99999',set_version='synthetic-v1',
                      principal_city_source=dict(url='https://example.org/synthetic',sha256='a'*64),
                      principal_city_ids=['city'],anchors=[dict(id='anchor',principal_city_id='city')])
        query=dict(graph_bundle_sha256='b'*64,scenario_sha256=first,sample_id='synthetic',metric='length',direction='from_anchor')
        row=dict(schema=SCHEMA,cbsa='99999',registry_sha256=registry_digest(registry),**query,
                 anchor_id='anchor',unit='meters',status='finite',graph_cost=1,connector_cost=2)
        self.assertEqual(aggregate(registry,[row],**query)['cost'],3)
        with self.assertRaisesRegex(ValueError,'scenario'):aggregate(registry,[row],**{**query,'scenario_sha256':second})

    def test_no_undeclared_permits_dimensions_exemptions_or_approval_flags(self):
        for mutation in ('permit','hov','occupants_bool','dimension','arrival','old_checkpoint','approval'):
            scenario=load()
            if mutation=='permit':scenario['vehicle']['special_permits']=['permit']
            elif mutation=='hov':scenario['vehicle']['hov_exemption']=True
            elif mutation=='occupants_bool':scenario['vehicle']['occupants']=True
            elif mutation=='dimension':scenario['vehicle']['height_m']=0
            elif mutation=='arrival':scenario['arrival_time_access_policy']='reevaluated'
            elif mutation=='old_checkpoint':scenario['old_checkpoint_evaluated_under_scenario']=True
            else:scenario['access_verified']=True
            with self.subTest(mutation=mutation),self.assertRaises(ValueError):validate(scenario)

    def test_ambiguous_invalid_or_nonutc_reference_is_rejected(self):
        for instant in ('2026-10-28T18:00:00','2026-10-28T18:00:00+00:00','2026-02-30T18:00:00Z',
                        '2026-10-28T18:00:60Z',' 2026-10-28T18:00:00Z',True):
            scenario=load();scenario['reference_instant_utc']=instant
            with self.subTest(instant=instant),self.assertRaises(ValueError):validate(scenario)

    def test_missing_or_pathlike_zone_never_falls_back_to_utc(self):
        for zone in ('','../UTC','/etc/passwd','America/../Denver','America/Not_A_Zone',None):
            with self.subTest(zone=zone),self.assertRaises(ValueError):local_reference(load(),zone)
        self.assertEqual(local_reference(load(),'UTC').hour,18)

    def test_host_clock_does_not_change_the_declared_reference(self):
        scenario=load();before=digest(scenario)
        with patch('road_reference_scenario.datetime',wraps=datetime) as clock:
            clock.now.side_effect=AssertionError('Host clock must not select model time')
            clock.utcnow.side_effect=AssertionError('Host clock must not select model time')
            self.assertEqual(digest(scenario),before)
            self.assertEqual(local_reference(scenario,'America/Denver').hour,12)

    def test_planned_tooltip_discloses_snapshot_freeflow_and_unknown_limits(self):
        scenario=load();copy=planned_tooltip(scenario)
        for phrase in ('28 Oct 2026','12:00 MDT','18:00 UTC','Solo passenger car','frozen',
                       'free-flow','traffic and waiting','change before arrival','unsupported areas'):
            self.assertIn(phrase,copy)
        self.assertFalse(scenario['old_checkpoint_evaluated_under_scenario'])
        self.assertFalse(scenario['access_verified']);self.assertFalse(scenario['release_eligible'])

    def test_timezone_release_changes_require_a_new_reviewed_binding(self):
        scenario=load();scenario['timezone_data']['version']='unreviewed'
        with self.assertRaisesRegex(ValueError,'timezone data'):validate(scenario)


if __name__=='__main__':unittest.main()
