# Colorado coverage and competition acceptance (#138)

All current outputs are research-only. Passing contract tests or enlarging an
extract does not complete #138. Issue #137 independently gates access evidence;
#139 gates the future opt-in UI. The public straight-line map is unchanged.

## Contracts to establish before claiming a covered region

| Dimension | Acceptance evidence | Current limitation |
| --- | --- | --- |
| Geography | Exact sourced Census land/water geometries, hashes, acquisition provenance, positive water and off-land negatives for the claimed viewport | Sloan's Lake preview only; thin/seasonal waterways not certified |
| Road coverage | Complete modeled graph inside a stated boundary, all cut arcs accounted for, adjacent-state and leave/re-enter route analysis | Complete-way clipping and index envelopes do not prove closure |
| Metro inventory | Exact unique qualifying CBSA identities from hashed CSV; every source included or rigorously excluded per destination and metric | 367 qualifying in the complete supplied Census table (359 in the public CSV); 15-source CO/NM/AZ/UT research comparisons leave 352 unrepresented |
| Origins | Explicit origin semantics plus exact connectors, direction, costs and independently reviewed physical/legal entry | CBSA representative points and nearest-road snaps are unapproved |
| Destinations | Exact supported on-road attachment, direction, ambiguity and legal/physical access review; unsupported samples transparent | Geometric projection cannot establish entry or grade separation |
| Reachability | Directed distance and modeled-time routes, disconnected and one-way negatives, boundary and threshold regression cases | A route in a clipped graph gives an upper bound, not proof of the global optimum |
| Independent validation | Separate shortest-path implementation, both metrics and declared orientation; real source golden points/cross-sections including rivers, ramps and mountains | Existing PNG oracle checks selected pixels within the same clipped graph only |
| Reproduction/performance | Source hashes, versions, deterministic selection/ties, source/metric thresholds, tile counts with reason denominators, measured memory and runtime | Live OSM URLs are not immutable; archive exact source bytes for repeatable evidence |
| Release | Independently approved connectors and repository release manifest; opt-in UI reviewed separately | No research artifact is production eligible |

## Route orientation is a required part of the contract

`road_spike.assign` and the existing PNG oracle answer **location -> metro**.
`colorado_directed_boundary_comparison` answers **metro -> location**.
One-way edges make these different. Neither validates the other without an
explicit reversal. An outward isochrone uses metro -> location; a return-to-metro
isochrone uses location -> metro. Future artifacts must label orientation and
validate each requested direction independently. Preserve existing research
behavior until the caller explicitly chooses a direction.

## Raw-source origin investigation

Run `colorado_origin_source_investigation.py` against the original Geofabrik
Colorado PBF, before clipping or filtering. It scans all highway ways and reports
nearest mapped geometry separately from the current supported driving model.
It bypasses graph contraction and SegmentGridIndex, but reuses the local
polyline projection helper. It is a geometric investigation, not an independent
access oracle or exact ellipsoidal nearest-distance certificate.

Snapshot: `research/colorado-raw-origin-investigation-20261027.json`.
OSM SHA256: `7bd588e3c811eef3620dd3d4b4646252b238b2483c6c8463434c4ca021822c7c`.
CSV SHA256: `ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8`.
20km investigation radius; zero highway ways with missing locations.

| CBSA | Closest mapped highway | Gap | Closest model-drivable geometry | Gap |
| --- | --- | ---: | --- | ---: |
| Boulder 14500 | path, way 224445917 | 136.8m | service, way 781731427 | 1,912.5m |
| Colorado Springs 17820 | primary Highway 94, way 1264689876 | 953.0m | same | 953.0m |
| Denver 19740 | service, way 678185599 | 32.5m | same | 32.5m |
| Fort Collins 22660 | track, way 846517141 | 448.3m | residential, way 168219611 | 1,890.7m |
| Greeley 24540 | secondary Highway 392, way 1550739361 | 843.3m | same | 843.3m |

The raw scan supports the <=500m missing-driving-candidate reports for Boulder
and Colorado Springs in this source snapshot. Boulder has nearby mapped path
geometry excluded by the supported road classes; adding paths to a driving graph
would change vehicle semantics, not establish access. Fort Collins' nearest
modeled road is north of the expanded extract's 40.6-degree boundary. Enlarging
that extract would still not put it within the current 100m candidate criterion.
These are observations about these coordinates and source bytes, never claims
that the metros are physically inaccessible.

Origin semantics remain unresolved: preserve the representative coordinate and
require a justified access connector, or source an urban access anchor under a
separately reviewed product definition. Increasing a snap radius silently creates
unverified connector kilometers and changes route costs; it is not a fix.

## Practical scaling path and proof obligations

1. Keep a national inventory of qualifying sources even for a small destination
   tile. Cache versioned, explicitly unapproved origin investigations separately
   from independently reviewed connectors.
2. Use multi-source directed Dijkstra for winner production; use per-source
   shortest paths only for bounded independent probes. Reuse distance labels
   for budget queries instead of recomputing a route for every pixel.
3. Exclude a competitor only when an admissible lower bound on its *full*
   modeled route exceeds a feasible incumbent upper bound, with a conservative
   numerical margin. Spherical great-circle length is admissible only when every
   modeled edge and connector cost dominates that same geometry convention.
   For time, divide by a proved model-wide speed ceiling (including connectors).
   A missing origin or omitted local edge alone proves no such bound.
   [Conditional rational bounds and real-route checks](colorado-conditional-competition-bounds.md) and [connector-budget sensitivity](colorado-connector-budget-frontier.md)
   implement this calculation without certifying its unresolved preconditions or
   removing any unknown-origin competitors.
4. Partition the graph with explicit cut arcs and exact boundary labels or
   certified optimistic exterior costs. Overlap alone is insufficient: a better
   route can leave and re-enter beyond any arbitrary overlap.
5. Start with a rigorously limited tile/threshold and expand only when its origin,
   cut-arc, destination and geographic obligations are discharged. Report every
   unsupported reason and percentage with its denominator.

No lower-bound certificate can repair incomplete data *inside* the claimed graph
boundary. Geometric exclusion must not substitute for access review, turn
restrictions, physical road closure evidence, or independent geographic sourcing.

[Expanded primitive-parent competition](colorado-expanded-parent-competition.md)
adds six explicit Colorado source leads while preserving the original four,
and records the remaining outside-parent source priorities. It is a graph-only
research extension, not discharge of these acceptance obligations.

[Arizona exterior competition](colorado-arizona-exterior-competition.md) checks
every modeled prefix arc, inventories weighted interfaces, and compares added
source roads without declaring the expanded parent geographically complete.

[Southern town geography](colorado-southern-town-geography.md) exercises sourced
water/off-land exclusions and independently rejected painted negatives at the
actual three town probe areas, while keeping hydrological completeness and
absolute geographic accuracy explicitly uncertified.

[Utah exterior competition](colorado-utah-exterior-competition.md) preserves the
three-state prefix, reproduces every prior source cost and separates exterior
road effects from added-source effects; the enlarged parent remains uncertified.

[Bounded remaining-Utah competitors](colorado-utah-bounded-competitors.md)
uses three same-graph 15+1 experiments and checks all repeated costs before
forming an eighteen-source research union. The 349 other identities remain
unrepresented; no unknown source is excluded or connector certified.

[Two-partition routing research](colorado-two-partition-routing.md) tests bounded
local shortest-path composition across the retained graph and Oklahoma, including
shared/shared arc improvements and repeated leave/re-enter paths. Its unapproved
26-source subset leaves 341 identities unknown; it does not authorize UI regions.
