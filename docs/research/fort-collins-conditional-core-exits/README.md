# Source-bound conditional native-core exit exclusion

This checkpoint binds the two retained native OSM node queries to a **294-node
inspection core**. The layout contains every node in the prior required
293-node selection plus explicitly named inspection node 9016011070. That extra
node is a source-inspection choice, not a reviewed urban anchor.

Two original-source captures contain **96/98 complete raw ways** at 130/164
seeds. Each stays within the unchanged 100-way capture limit and requests the
same seven complete member ways. The unchanged two-input/200-way reconciliation
retains **179 ways, 897 nodes and 15 controls**. All earlier whole records remain
exactly preserved and all referenced members resolve. All raw classes are
retained, including 72 ways outside the explicitly declared car-model classes;
that classification does not establish legal access exclusion. There remain
**603 unenumerated outer source-member nodes**.

The separate finite diagnostic contains **869 individually supported arcs and
32 hypothetical geometry possibilities** on the unchanged gate and Cherry Street
turn-indication ways. Possibilities run in both directions with stored spherical
distance and zero time; they confer no permission. All fifteen declarations remain
accounted: thirteen active compiled patterns, one inactive declaration and the
retained one-way-inert NO prohibition. Earlier raw inputs, compilers, profiles
and frozen reports do not change.

Each supported witness is independently validated against the known arcs and all
active maneuver patterns and stays entirely inside the core. The exact stored
costs remain approximately **219.361325 m** for shortest distance and **34.146758 s**
for the separate fastest-time witness. The finite lower and upper brackets
coincide, and neither minimizing walk uses hypothetical geometry.

For each metric, the relaxed prefix graph has **47 first exits: 46 reachable and
one unreachable**. Every reachable exit strictly exceeds its witness before any
outside continuation is added. The minimum distance exit bound is approximately
227.007081 m. The minimum time exit bound is approximately 34.193054 s, only
**0.046296 s** above its witness. Decisions use exact rational stored-weight sums;
no rounding, epsilon or tie suppression is allowed. Ties would block exclusion.

The conditional argument is: every exterior walk must first leave through an
enumerated exit. Prefix relaxation ignores maneuver/reversal constraints, so its
cost is a lower bound. Nonnegative outside continuation cannot recover a strictly
positive first-exit gap. Unreachable exits remain explicit; reaching one through
an earlier exterior visit would already incur an earlier first exit.

The report binds the complete captured incidence at every core node, the exact
PBF identity, both captures, declared car classes/defaults, all retained controls,
supported witness, arc universe and implementation hashes. **Original-source
replay is required.** The reconciliation/certificate helpers do not scan that
PBF and do not themselves verify external nonnegativity. Read-only CI reproduces
both captures against the exact source before this evidence is accepted.

The domain is original native-node/adjacent-vertex model topology, unchanged
known permissions/weights/maneuvers and audited member directions, fixed scenario,
exact endpoints, unconstrained start and unchanged reversal policy. It excludes
new core/interior/connector attachments. Unknown geometry is a lower-bound
relaxation; completions cannot invalidate the supported interior witness.
Outside continuation must be nonnegative. Tests demonstrate failures when these
conditions change. Native-node incidence and a conditional model bound are not
independent physical/grade/legal access evidence or actual geographic closure.

The **107-way strict graph remains rejected** by its unchanged 100-way budget.
Ordinary queries emit no graph, route cost, fallback or modeled NoData. Gate
operation and the whole-way mandatory-turn interpretation remain unknown. No
exterior route filter is applied to public assets and no global actual-road,
other-origin/metro, geographic-mask or release claim is made.

```sh
python -m unittest discover -s scripts -p test_road_witness_core_exclusion.py -v
python -m unittest discover -s scripts -p test_fort_collins_core_exclusion.py -v
python scripts/fort_collins_core_exclusion_checkpoint.py
python scripts/fort_collins_core_exclusion_source.py --osm ORIGINAL_COLORADO_PBF --partition 0 --output /tmp/source-partition-0.json
python scripts/fort_collins_core_exclusion_source.py --osm ORIGINAL_COLORADO_PBF --partition 1 --output /tmp/source-partition-1.json
cmp /tmp/source-partition-0.json docs/research/fort-collins-conditional-core-exits/source-partition-0.json
cmp /tmp/source-partition-1.json docs/research/fort-collins-conditional-core-exits/source-partition-1.json
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

CI retains only five derived source/layout/report/docs files. No PBF, private
archive, municipal page body or environment configuration is published.
OSM-derived records are attributed to OpenStreetMap contributors under ODbL.
The public straight-line map, older inspectors, fixed October 28 scenario and
all 2,508 Census costs stay unchanged. Zero connectors are approved and no anchors
adopted. Independent access review and a different release approver (#137),
coverage/competitor/mask checks (#138) and public assets/UI release (#139) remain
required. This single-pair model checkpoint completes no city, metro or state.
