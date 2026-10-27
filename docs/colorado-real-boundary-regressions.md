# Real Colorado extract-boundary regressions

The first four fixed probes (three metro source nodes and Sloan's Lake) had
identical results across the baseline and expanded graphs. That did not prove
extract completeness. A broader outward-route scan found the following among
578,930 common reachable baseline vertices, using only the three unapproved
Boulder, Colorado Springs and Denver node sources:

| Metric | Changed winners | Lower winner costs | Higher costs | Newly reachable baseline vertices |
| --- | ---: | ---: | ---: | ---: |
| Road length | 0 | 1,250 | 0 | 300 |
| Modeled time | 12 | 980 | 0 | 300 |

The broad scan uses the custom allocator for discovery. Selected observations
were checked on both graphs using fresh, independent NetworkX shortest paths.
See the versioned discovery and route-witness JSONs in `research/` for exact
source hashes, model version, source nodes, coordinates and per-metro costs.
This is conditional three-source graph evidence, not global competition: all
359 qualifying Census sources remain eligible and 356 are not represented.
No connector costs or independently approved access evidence are included.

## Two fail-closed real-source regression probes

`colorado_boundary_regression_probes.json` adds these baseline OSM node identities
to the directed audit, so both metrics and both directions are independently
checked at six fixed probes. The explicit historical expectations are outward:

| OSM node | Metric | Baseline winner/cost | Expanded winner/cost |
| --- | --- | --- | --- |
| 176941993 | time | Colorado Springs 17820 / 2,925.807s | Denver 19740 / 2,683.277s |
| 176985903 | length | Colorado Springs 17820 / 147,470.728m | Colorado Springs 17820 / 125,667.110m |

Node 176941993 (-104.5145698, 39.3031617) lies **inside** the original extract
bbox. The expanded Denver route leaves east of -104.5 and re-enters before the
probe. Its full geometry reaches -104.4735985 and uses OSM way **17045571**, absent
from the baseline PBF. The old closest metro among these three is wrong at this
probe under the expanded modeled graph. This is a real leave/re-enter example,
not a synthetic border fixture or an access certification.

Node 176985903 (-105.5081393, 38.5994114) is a baseline graph vertex **outside**
the nominal south clipping bbox, retained by complete-way extraction. Its
expanded route uses seven added ways and is 21.8km shorter. Thus even the clip
bbox does not exactly describe the retained graph's geometry or its closure.

CI requires the historical winner identities, at least a 200s / 20,000m cost
improvement respectively, independent shortest-path agreement, and explicit
expanded route witnesses through added OSM ways. The first case must leave and
re-enter the declared bbox. Witness costs must match independently checked probe
costs. The fixture binds the source metro inventory and static model version;
missing nodes, altered coordinates, ties, unreachable probes, lost improvements,
wrong units and model/source mismatches fail closed.

The discovery raw PBF SHA256 is recorded in the fixture; CI still records its
actual current PBF hashes independently. A future OSM update or model change may
invalidate an expectation. Investigate the new sources and routes before
refreshing a golden; do not weaken the check just to obtain green CI.

All release, global-completeness and physical/legal-access certifications remain
false. These probes expose incompleteness; they do not prove that the expanded
graph is complete. The public straight-line map is unchanged.
