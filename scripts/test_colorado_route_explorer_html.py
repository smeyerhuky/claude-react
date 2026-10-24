"""Offline viewer generation regression tests."""
import json
import tempfile
import unittest
from pathlib import Path
from colorado_route_explorer_html import render_html


class ViewerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.source = Path(self.tmp.name) / "routes.json"
        self.target = Path(self.tmp.name) / "interactive.html"

    def test_embeds_verified_routes_without_external_assets(self):
        data = {"status": "pass", "trips": [{"geometry": {
            "length": [[-105, 39], [-104, 40]],
            "travel_time": [[-105, 39], [-104, 40]]}}]}
        self.source.write_text(json.dumps(data))
        render_html(self.source, self.target)
        page = self.target.read_text()
        self.assertIn('id="trip"', page)
        self.assertIn('id="region"', page)
        self.assertIn("populateTrips()", page)
        self.assertIn('id="metric"', page)
        self.assertIn("[-105,39]", page)
        self.assertNotIn("__DATA__", page)
        self.assertNotIn("<script src=", page)

    def test_rejects_unverified_and_missing_geometry(self):
        for data in ({"status": "fail", "trips": [{"geometry": {}}]},
                     {"status": "pass", "trips": [{"geometry": {"length": [[0, 0], [1, 1]]}}]}):
            with self.subTest(data=data):
                self.source.write_text(json.dumps(data))
                with self.assertRaises(ValueError):
                    render_html(self.source, self.target)

    def test_escapes_embedded_html(self):
        data = {"status": "pass", "trips": [{"origin": "</script><script>alert(1)</script>",
            "geometry": {"length": [[0, 0], [1, 1]], "travel_time": [[0, 0], [1, 1]]}}]}
        self.source.write_text(json.dumps(data))
        render_html(self.source, self.target)
        self.assertNotIn("</script><script>alert(1)", self.target.read_text())


if __name__ == "__main__":
    unittest.main()
