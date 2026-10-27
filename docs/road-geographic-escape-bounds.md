# Conditional geographic excursion bounds (#138)

`road_geographic_escape_bounds.py` supplies a mathematical building block for
regional routing. It does not identify a complete region or apply any exclusion.
Every coverage/access/release flag stays false. It must not turn a graph envelope
or a supplied bounding box into a coverage certificate.

For endpoints s,d inside a rectangle C, any continuous route that leaves C has
a first exit and a last re-entry. Consequently its length is at least

```
distance(s, boundary(C)) + distance(d, boundary(C))
```

The exit and entry can differ; their connecting exterior cost is optimistically
zero. Multiple excursions and one-way restrictions do not invalidate this lower
bound. Permitted endpoint radii reduce their respective terms by triangle
inequality, clamped to zero. To lower-bound time, divide by an independently
justified global speed ceiling, including connectors and exterior roads.

The boundary terms use exact rational inequalities on the radius-6,371,000 m
sphere. For latitude sides use R*3.14*abs(delta_lat)/180. A longitude side is
contained in its full meridian plane, so its distance is at least
R*cos(latitude)*abs(sin(delta_longitude)); lower-bound cosine by
1-abs(latitude)/90 and sine by min(delta,180-delta)/90 for delta in [0,180]
degrees. Take the minimum over all four sides. Inputs must describe an ordered,
unwrapped rectangle narrower than 180 degrees and centers inside it. Exact
binary float interpretation comes from conditional competition bounds version 2.

`screen_exterior_routes` compares the resulting lower bound strictly against a
supplied feasible full incumbent upper bound plus margin. Ties remain possible.
A positive conditional result only becomes usable after proving all of:

- Complete incident modeled ways at every raw OSM node inside the region,
  including shape nodes hidden by contraction, bound to the
  actual source snapshot, extraction process and geographic boundary.
- Full route costs dominate this coordinate model, including floating-point
  errors, origin/destination connectors and a global time-speed ceiling.
- Independently justified origin/destination domains and feasible fully costed
  incumbent upper bound under exactly the same metric/endpoints/orientation.
- Every eligible competing metro included or separately excluded rigorously.
- Independent physical/legal access requirements remain satisfied separately.

Tests compare boundary terms with independent vector spherical geometry and use
independent Bellman-Ford on 20 random directed parents for each metric. A two-layer
state graph requires an actual outside-node visit, preventing a direct interior
route from accidentally validating an excursion bound. Tests also cover endpoint
uncertainty, boundary contact, ties, unknown speed caps and invalid regions.
These are mathematical model tests, not real-region geographic closure evidence.

## Source-provider investigation and unresolved binding

[Geofabrik technical documentation](https://download.geofabrik.de/technical.html)
describes its clipping polygons and completed border-crossing ways. The
[Osmium extraction manual](https://docs.osmcode.org/osmium/latest/osmium-extract.html)
specifies complete-way selection by incident nodes and warns about boundary
precision. Those statements suggest a possible coverage argument for a safely
inset region; provider documentation alone is not independent verification.

The current published Colorado polygon at
https://download.geofabrik.de/north-america/us/colorado.poly has recorded SHA256
`c4c84e42a59d2322b4f711a6da3426c0763f918543e53520cd8ae85f3d032f76`.
A diagnostic Shapely check found rectangle [-108.9,37.1,-102.1,40.9] strictly
inside that polygon. The polygon has not been bound to the exact Colorado PBF
snapshot. Neither that containment check nor this helper certifies its roads.
No real-data closure/exclusion result is claimed. Next integrate verified
snapshot-bound coverage and rigorously costed incumbents before using the bound
with the 367-metro domain inventory. The public map and both origin scenarios
are unchanged.

## Actual sourced path checks

`colorado_escape_witness_audit.py` also checks the 12 real Colorado/New Mexico
path witnesses from the adjacent-source workflow. It binds both PBF hashes and
timestamps, independently replays every directed primitive cost using vector
atan2 spherical geometry (2 mm / 1e-9 relative agreement tolerance), and verifies
the conditional lower bound against each actual excursion's replayed cost.
Diagnostic rectangles are constructed around each path's endpoints with 0.001
degree padding; they make no road-coverage claim. A witness must actually visit
an outside coordinate, and both metrics must be checked. The initial local run
checked six actual excursions per metric with no disagreements. CI reproduces
these checks from newly acquired actual source data. This checks known path
costs, not optimality, a global speed ceiling, regional closure or legal access.
