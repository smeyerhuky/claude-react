# Complete displayed-metro location envelopes

This checkpoint accounts for all **359 displayed qualifying metros and 686
required principal-city memberships**. It uses independently published Census
geometry to supply 49 state/DC envelopes, refined by 15 city envelopes in
Colorado, Nebraska and Wyoming. Every metro and city membership remains explicit.
It does not route new metros, adopt anchors, exclude actual competitors or certify
public road coverage. Missing required anchor results remain unknown.

## Why this matters for a first supported area

A distant metro need not always be routed to prove it cannot win: an admissible
lower bound can exceed a valid full-route incumbent. But a Census representative
point is not a bound on every possible reviewed urban anchor. This work supplies
traceable location envelopes tied to all required principal cities instead.

The coarse state envelopes initially left Cheyenne, Lincoln and Omaha competitive
under one of the window-budget hypotheses. Their actual city envelopes tighten
the calculation without pretending a broad state bound is a precise city location.
They join the twelve Colorado city refinements already retained in PR #283.

These are **conditional model domains**. Consuming them requires an explicit,
reviewed coordinate-admission rule that constrains each future anchor to the
corresponding supplied envelope, plus compatible full-route geometric cost
domination. Such a registry or release policy is not installed here. Geometry
publication alone is not proof of legal city membership, physical vehicle access,
grade, turn permission or current conditions. No missing connector becomes zero.

## Complete scope and cross-state membership

The displayed set is selected from the existing audited domain inventory's public
CSV inclusion identities, with the full principal-city inventory independently
reproduced from the retained Census July 2023 workbook. Alaska, Hawaii and Puerto
Rico remain in the separate nationwide audit and do not block this displayed scope.
No source city population threshold or metro-title parsing is used.

Every principal-city membership supplies its own state. Cross-state metros take
the minimum across **all** those memberships, not a native representative point's
state or the first state in a title. Washington's city domain uses DC even though
the retained metro representative point is in Virginia. Kansas City retains both
Kansas and Missouri memberships. Denver retains five cities; Fort Collins/Loveland
retains both. Missing states, refinements, cities or IDs fail the checkpoint.

## Exact independently published originals

| Census 2025 file | Bytes | Records scanned | Retained contribution |
| --- | ---: | ---: | --- |
| [State boundaries](https://www2.census.gov/geo/tiger/TIGER2025/STATE/tl_2025_us_state.zip) | 9,956,072 | 56 | 49 complete-geometry state/DC envelopes |
| [Colorado places](https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_08_place.zip) | 2,791,333 | 482 | Existing 12-city refinement reproduced exactly |
| [Nebraska places](https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_31_place.zip) | 826,250 | 593 | Lincoln and Omaha |
| [Wyoming places](https://www2.census.gov/geo/tiger/TIGER2025/PLACE/tl_2025_56_place.zip) | 904,349 | 205 | Cheyenne |

Full SHA-256 identities are pinned in code and `manifest.json`. Preflight requires
all four exact originals before claiming complete source replay. ZIP members,
CRC, native CRS, full record counts, state/FIPS/metro/city identities and the
selected place status fields are checked. Nebraska's CLASSFP=C5 and Wyoming's
C1 are retained rather than normalized; both have PCICBSA=Y and FUNCSTAT=A.
These flags do not establish road permission.

Envelopes are computed from full Polygon/MultiPolygon geometry, preserving all
parts and holes when finding bounds. There is no clipping, simplification,
geometry repair, centroid substitution or selection by an in-window vertex.
Only envelope summaries are retained here; the original geometry can be replayed
from the public originals. The Colorado source retains its complete city polygons
in the earlier checkpoint. All city envelopes must fit their source state's box.

Both source types declare NAD83, with explicit EPSG:1188 conversion as before.
Its stated four-meter accuracy is not a worst-case error bound or a physical
jurisdiction/epoch guarantee. Bounds describe a declared source model; they cannot
absorb unbounded real-world position uncertainty or silently certify currentness.
Raw ZIPs stay outside the repository and artifact. No private OSM archive or
environment configuration is read or published by this workflow.

## Two research contexts and strict hypothetical budgets

The first context is the existing arbitrary point [-105.08, 40.59]. The second
is an enclosing spherical ball for the entire earlier water-mask window,
[-105.20,40.50,-105.00,40.65]. Its exact rational radius accounts for every point
in the box, including water; using a superset does not drop a candidate.
This is not a road origin attachment, coverage mask or graph-clipping instruction.
In particular it must not delete bridge edges or prohibit routes leaving a tile.

For each city or state envelope the existing rational rectangle lower bound
applies on the declared radius-6,371,000-meter sphere. Subtract the destination
ball radius and clamp at zero. Take the minimum across every required city in a
metro. Exact stored-coordinate arithmetic protects strict comparisons and ties.
No time bounds are emitted because no global model speed ceiling is established.

The report evaluates hypothetical full-incumbent upper bounds, in **meters**.
These are assumptions, not measured paths, approved connectors or routing results:

| Assumed full route bound | Point: metros still retained | Entire window: metros still retained |
| --- | ---: | ---: |
| 10 km | 1 | 2 |
| 30 km | 2 | 2 |
| 100 km | 5 | 10 |

For the window at 30 km, Fort Collins/Loveland (22660) and Greeley (24540) remain.
That conclusion is conditional on a compatible valid full incumbent of at most
30 km **at every destination point**. It supplies no such paths. For directed
queries the relevant incumbent must be independently valid in that direction;
a symmetric geometric bound does not transpose or approve driving costs.

A strict lower-bound excess is required; equality stays competitive. If the
assumed incumbent budget contradicts the incumbent's own location lower bound,
the hypothesis is refuted and no dominance list is emitted. Not refuted is not
feasible. All 359 identities remain in every report context, and all applied
exclusion and release flags remain empty/false. This is not a claim that the
complete global road competition has been solved.

## Reproduction

```sh
python -m unittest discover -s scripts -p test_metro_state_anchor_domains.py -v
python scripts/metro_state_anchor_domains.py
python scripts/metro_state_anchor_domains.py --original-dir /path/to/four/census-zips
python scripts/render_metro_state_anchor_domains.py /tmp/conditional-budgets.png
```

Eight tests cover all identities/memberships, cross-state and DC assignments,
state-to-city refinement, exact minima and context radii, strict ties and tiny
rational gaps, contradictory incumbents, missing/rehashed input records, altered
source/approval claims and complete original preflight. Read-only CI re-downloads
all originals, requires byte-identical derivation and also exercises the existing
missing-anchor and displayed-scope guards. The frozen report records metadata
verification; only an invocation actually reading the ZIPs reports source replay.
`--write --original-dir ...` rebuilds retained records from exact originals;
inspect any changed source, model or expectations before accepting them.

The public straight-line map, ten inspectors, fixed scenario, historical 2,508
costs and approval ledger remain unchanged. User release authorization is already
recorded. Remaining access and coverage requirements are substantive work: valid
anchors/attachments, fully costed turn-compatible paths, feasible directed and
uniform incumbents, source-model admission, independent mask/golden checks and
exterior-route closure. These budget hypotheses do not substitute for that work.
