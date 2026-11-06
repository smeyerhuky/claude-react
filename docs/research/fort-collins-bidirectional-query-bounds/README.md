# Both directions of the retained native-node query

Solve and independently replay each direction and metric within the unchanged
294-node source core. The forward query is native node 11268369829 to
11268369827; the reverse query swaps those exact endpoints. Each query starts
with unconstrained maneuver history at the fixed scenario instant.

| Direction | Shortest distance | Fastest modeled time |
| --- | ---: | ---: |
| Forward | 219.361325 m | 34.146758 s |
| Reverse | 14.446950 m | 2.241216 s |

The directed model is asymmetric. The two reverse witnesses use the same three
supported arcs, while the retained forward distance/time witnesses differ.
Reverse witnesses are proposed from the supported arc universe and independently
validated against exact geometry, maneuver history and stored costs. No cost is
obtained by transposing the forward matrix. Exact rational costs and path hashes
are retained; the table is rounded for reading only.

All four finite brackets coincide with their supported witnesses. All four
conditional first-exit certificates hold within the existing core: 47 exits,
46 reachable and strictly dominated, and one unreachable exit per query. The
earlier forward certificates remain byte-for-byte equivalent as JSON values.
The narrow forward-time margin still uses exact fractions; ties remain
competitive and would block exclusion.

The parent source evidence remains unchanged: two original PBF captures reconcile
179 raw ways, 897 nodes and 15 declarations at 294 inspected source nodes. The
bound source identity, captured incidence, declared car classes/defaults, fixed
scenario and implementation fingerprints are retained. All fifteen declarations
remain accounted: thirteen active patterns, one inactive declaration and one
audited one-way-inert NO prohibition. There are 869 supported individual arcs,
32 hypothetical geometry possibilities and 603 unenumerated outer nodes.

The inherited domain requires original-source replay, unchanged known member
permissions/weights/maneuvers, exact native-node adjacency, unconstrained start,
unchanged reversal policy, no new core/interior/connector attachments and
nonnegative exterior continuation. Unknown gate/whole-way turn geometry remains
an explicitly hypothetical bidirectional zero-time relaxation. Source helpers do
not themselves scan the PBF or verify exterior nonnegativity.

The 107-way strict API still rejects both directions at its unchanged 100-way
budget. No ordinary graph/query result, fallback or modeled NoData is emitted.
Connector approach history is not modeled; these native starts cannot be reused
as approved metro/anchor access. Physical/grade/legal access, other origins or
metros, geographic masks and public release remain independently unresolved.

```sh
python -m unittest discover -s scripts -p test_fort_collins_bidirectional_bounds.py -v
python scripts/fort_collins_bidirectional_checkpoint.py
python scripts/fort_collins_core_exclusion_checkpoint.py
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

Read-only CI freezes this two-file report/docs artifact and retains current parent
original-source replay checks. Tests compare all four queries with an independent
history oracle, independently calculate reverse prefix bounds and reject reused
forward paths or costs. No source PBF, private archive, municipal page body or
environment configuration is published. OSM-derived records are attributed to
OpenStreetMap contributors under ODbL. Public straight-line rendering, older
inspectors, all 2,508 Census costs and the fixed October 28 scenario stay unchanged.
Zero connectors are approved and no anchors adopted; #137 independent access
review/different release approver and #138/#139 coverage/assets gates stay intact.
