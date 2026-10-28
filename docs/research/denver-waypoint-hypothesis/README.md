# Retained through-road hypothesis result and offline comparison

This is the exact successful #191 source-CI report, pinned by `manifest.json`.
It contains all forty directed distance/time cases, exact stored path costs and
actual-direction path hashes. Every case was finite and replayed; the Colorado
primitive graph has 5,292,810 nodes and 10,591,536 unique directed pairs.

For Denver-to-probe distance, moving the graph start changes Boulder/Fort Collins
costs by -41.551 km and Colorado Springs/Pueblo by +35.029 km. In the reverse
direction those changes are -41.397 km and +35.105 km. The original Denver road
lead probe is about 42.4 km from the through-road hypothesis. These are model
sensitivity results, not a preference or approval of either physical destination.

Build the offline comparison:

```sh
python scripts/build_denver_waypoint_explorer.py --output comparison.html
```

The viewer verifies result and display-name CSV hashes, preserves all forty unique
cases, requires explicit meter/second bindings and refuses positive access/release
flags. It shows two graph-start costs and their difference for five probes, with
distance/time and direction controls. Both directions use their own replayed
results. Browser CI checks all four control combinations and all forty displayed
costs/differences, with no page errors or network requests. HTML and screenshot
artifacts can be regenerated after GitHub retention expires.

No station pickup curb, legal stopping right, off-road connector, production urban
anchor, competitor winner or geographic region is approved. The five-state Census
baseline, public map and #137 gate remain unchanged. See the
[experiment scope](../../denver-through-road-hypothesis.md).
