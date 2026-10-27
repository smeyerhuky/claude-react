# Census source scope and possible origin domains (#138)

The public CSV is a **CONUS** inventory. Its builder explicitly retains only
representative points inside longitude [-125,-66], latitude [24,50], and its
report says `matched_conus_metros_at_least_100k`. Preserve its 359 records and
public straight-line map. They are not the entire qualifying U.S./Puerto Rico
inventory in the same official population source.

The supplied 2025 Census metropolitan population workbook contains **367**
metropolitan areas at population >=100,000. Exact `NAMELSAD` matching to official
TIGER2025 CBSA polygons, without fuzzy joins, identifies eight absent from the
public CONUS CSV:

| CBSA | Metro |
| --- | --- |
| 11260 | Anchorage, AK |
| 27980 | Kahului-Wailuku, HI |
| 46520 | Urban Honolulu, HI |
| 10380 | Aguadilla, PR |
| 11640 | Arecibo, PR |
| 32420 | Mayagüez, PR |
| 38660 | Ponce, PR |
| 41980 | San Juan-Bayamón-Caguas, PR |

This is a source-scope audit, **not** a change to active eligibility or a claim
those metros are inaccessible/irrelevant. A broader road product must explicitly
include or rigorously exclude the appropriate sources; absence from the legacy
CSV is not an exclusion proof. Threshold qualifiers refer to this exact supplied
workbook, not an independent census of every possible metropolitan definition.

`metro_origin_domains.py` preserves both identity inventories, source populations,
native CBSA internal points and bounding boxes. It validates source `.prj` as
EPSG:4269 and checks each internal point against its actual polygon. The source
lock records exact official XLSX/ZIP URLs and hashes; changed source bytes fail
until reviewed/versioned. Missing/ambiguous names, duplicated IDs, population
mismatches and loss of an existing qualifying metro fail closed.

The seven selected Colorado named-city point leads can also be checked for
numeric membership in their corresponding actual CBSA polygons. This provides
geographic association evidence only: it does not establish an official
principal-city crosswalk, an appropriate urban origin, source-datum alignment,
road access or legal entry. Outside points remain visible review failures;
they never fall back to representative points.

Possible future urban origins can be constrained to the corresponding CBSA
footprint as an explicit research hypothesis, without choosing exact anchors.
An enclosing box is then a conservative *origin domain* for later admissible
bounds. It is **never a certificate of road graph coverage**. Applying route
bounds still requires matching coordinate/cost conventions and a feasible,
fully costed incumbent; native NAD83 envelopes must not silently be treated as
verified WGS84 road origins. All access, global-competition and release flags
remain false. No source is actually excluded by this artifact.

Each box also gets a conservative rational spherical covering ball, compatible
with the endpoint-radius method in `metro_competition_bounds.py` once coordinate
and cost assumptions are discharged. The center is the interval midpoint and
the radius is `R*(22/7)*(longitude_span+latitude_span)/360`. A path along a
meridian and then a parallel is no longer than this bound because `22/7 > pi`
and a parallel's radius is no larger than `R`. Thus all points of the enclosing
box are covered, including unknown candidate origins; exact rational values
avoid rounding the enclosing radius inward. The source TIGER/GEOS bounding-box
endpoints are interpreted as their exact stored IEEE-754 binary values, not
nearby shortest-printable decimal strings; the exported floating radius is
rounded outward. This is a numerical enclosure only, not a datum-alignment or
road-access certificate. This does not choose a road origin,
verify that an urban anchor actually exists inside the domain, or provide a
feasible full-route incumbent. Those preconditions still block actual source
exclusion and release. Independent vector-geometry tests check corners and
sample points, including poles and wide-longitude boxes.
