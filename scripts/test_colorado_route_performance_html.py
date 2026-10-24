"""Regression checks for the offline performance report."""
import json
import tempfile
import unittest
from pathlib import Path
from colorado_route_performance_html import render_dashboard


def fixture():
    sample = {"samples_ms": [1.0, 2.0, 3.0], "median_ms": 2.0}
    return {"status": "pass", "graph_sizes": {
        "full": {"nodes": 100, "edges": 200},
        "compressed": {"nodes": 30, "edges": 60}},
        "benchmark_method": "three sequential warm-cache queries",
        "trips": [{"origin": "Denver", "destination": "Boulder", "category": "Front Range",
                   "cost_deltas": {"length": 0.0, "travel_time": 0.0001},
                   "benchmark": {m: {"full": sample, "compressed": sample}
                                 for m in ("length", "travel_time")}}]}


class DashboardTests(unittest.TestCase):
    def test_valid_offline_dashboard(self):
        with tempfile.TemporaryDirectory() as folder:
            source, target = Path(folder) / "routes.json", Path(folder) / "performance.html"
            source.write_text(json.dumps(fixture()))
            render_dashboard(source, target)
            html = target.read_text()
            self.assertIn("Colorado Routing Performance", html)
            self.assertIn('id="category"', html)
            self.assertIn("Denver", html)
            self.assertNotIn("<script src=", html)

    def test_rejects_missing_or_invalid_evidence(self):
        for change in ("status", "delta", "samples", "sizes"):
            with self.subTest(change=change), tempfile.TemporaryDirectory() as folder:
                data = fixture()
                if change == "status":
                    data["status"] = "fail"
                elif change == "delta":
                    data["trips"][0]["cost_deltas"]["length"] = 0.1
                elif change == "samples":
                    data["trips"][0]["benchmark"]["length"]["full"]["samples_ms"] = [1.0]
                else:
                    data["graph_sizes"].pop("full")
                source, target = Path(folder) / "routes.json", Path(folder) / "performance.html"
                source.write_text(json.dumps(data))
                with self.assertRaises(ValueError):
                    render_dashboard(source, target)

    def test_escapes_html_in_data(self):
        with tempfile.TemporaryDirectory() as folder:
            data = fixture()
            data["trips"][0]["origin"] = "</script><script>alert(1)</script>"
            source, target = Path(folder) / "routes.json", Path(folder) / "performance.html"
            source.write_text(json.dumps(data))
            render_dashboard(source, target)
            self.assertNotIn("</script><script>alert(1)", target.read_text())


if __name__ == "__main__":
    unittest.main()
