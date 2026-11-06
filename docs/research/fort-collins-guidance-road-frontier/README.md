# Source incidence at all previous road-model nodes

The 45 raw nodes of the prior 12-road model now have original-source incidence
enumeration. This extends the preceding 19-node pass by 26 road nodes. The
extractor retains every incident way without spatial/highway/access filtering,
full raw geometry/node/tag records, and all touching restriction/connectivity
types or namespaces. It verifies the original source size/SHA before, between
and after the same bounded two passes; no source budgets are raised.

The 35 incident ways require five complete member ways. Capturing those exposes
one more control, producing **40 complete ways, 169 nodes and nine restrictions**
with no missing members. Every earlier source way/node and all shared raw records
remain exact; every earlier seed incidence is preserved. Eight outside-class
ways remain in the source snapshot and are explicitly accounted for.

All nine declarations compile individually from complete members. Thirty-one
roads yield 165 individual directed weights. One further in-class road, Maple
Street way 134584347, retains `maxspeed=25 mph` and `maxspeed:type=sign`. The
current speed profile rejects that additional namespace. The complete 32-road,
121-node candidate therefore returns **no graph and no query answer**. Individual
supported weights are diagnostic inventory, never a partial graph or a fallback
route. No tag is stripped to force support. Unsupported queries are not labeled
as solved NoData or physical/geographic disconnection.

This enumerates all nodes of the **previous** road model, not all nodes of the
expanded candidate. There are **124 unenumerated outer source-member nodes**.
Geographic closure, grade/lane links, physical/legal access, exterior competitors
and geographic masks remain unverified. The separate Tenney Court bollard
candidate remains unsupported. Zero connectors are approved, no anchors are
adopted and #137 remains intact. Public map, older inspector views, prior model
reports and all 2,508 Census comparison costs remain unchanged.

```sh
python -m unittest discover -s scripts -p test_fort_collins_guidance_frontier.py -v
python scripts/fort_collins_guidance_frontier_checkpoint.py
python scripts/fort_collins_guidance_road_frontier.py --osm ORIGINAL_COLORADO_PBF --output /tmp/source-context.json
cmp /tmp/source-context.json docs/research/fort-collins-guidance-road-frontier/source-context.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The report binds source identity, retained records, frozen parent, fixed scenario
and implementation. OSM-derived records are attributed to OpenStreetMap
contributors under ODbL. No original PBF, private archive or environment
configuration is published.
