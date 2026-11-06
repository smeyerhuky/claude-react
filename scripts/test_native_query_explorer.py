from fractions import Fraction
import json
from pathlib import Path
import re
import unittest
from unittest.mock import patch
from build_native_query_explorer import payload,render
from fort_collins_bidirectional_checkpoint import REFERENCE

ROOT=Path(__file__).resolve().parents[1]


class NativeQueryExplorerTests(unittest.TestCase):
    def test_frozen_offline_html_and_all_four_exact_paths_match(self):
        html=render();self.assertEqual(html,(ROOT/'src/research/metro-native-directional-bounds.html').read_text())
        encoded=re.search(r'<script id="native-bounds-data" type="application/json">(.*?)</script>',html,re.S).group(1);data=json.loads(encoded)
        self.assertEqual(set(data['queries']),{'forward:length','forward:travel_time','reverse:length','reverse:travel_time'})
        for q in data['queries'].values():
            cost=sum((Fraction(data['arcs'][aid][q['metric']]) for aid in q['path']),Fraction(0))
            self.assertEqual([str(cost.numerator),str(cost.denominator)],q['cost_exact'])
            self.assertTrue(q['conditional_exterior_exclusion']);self.assertFalse(q['access_verified']);self.assertFalse(q['release_eligible'])

    def test_full_core_and_unknown_ways_remain_explicit_without_possible_witness_arcs(self):
        data=payload();self.assertEqual((len(data['core_points']),len(data['roads'])),(294,107))
        self.assertEqual({w['id'] for w in data['roads'] if w['unknown']},{201855578,1216151141})
        self.assertTrue(all(a.startswith('raw:') for a in data['arcs']))
        self.assertEqual(data['approved_connectors'],0);self.assertEqual(data['adopted_anchors'],0)
        for flag in ('normal_graph_admitted','access_verified','release_eligible'):self.assertFalse(data[flag])

    def test_untrusted_source_names_are_script_escaped_and_no_external_resources_are_loaded(self):
        data=payload();data['roads'][0]['name']='</script><script>window.bad=true</script>&'
        with patch('build_native_query_explorer.payload',return_value=data):html=render()
        self.assertNotIn('</script><script>window.bad',html);self.assertIn('\\u003c/script>',html)
        self.assertIn("default-src 'none'",html)
        self.assertNotRegex(html,r'<(?:script|img|link|iframe)[^>]+(?:src|href)=')
        self.assertNotRegex(html,r'\b(?:fetch|XMLHttpRequest|WebSocket|postMessage)\s*\(')

    def test_stale_or_promoted_report_is_not_rendered(self):
        report=json.loads((REFERENCE/'report.json').read_text());report['actual_access_verified']=True
        with patch('build_native_query_explorer.project',return_value=report),self.assertRaises(ValueError):render()
