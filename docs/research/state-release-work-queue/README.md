# State work queue toward the public road-distance/time tab

This queue covers all 50 states, DC and Puerto Rico. It uses all 367 qualifying
Census identities, including AK/HI/PR and the eight absent from the public CSV.
The current audited 33-source, 19-sample checkpoint contains 2,508 costs:
2,356 finite, 152 modeled NoData. **334 qualifying competitors are unrouted;
zero states are public-ready and zero connectors are independently approved.**

State grouping uses the retained native NAD83 representative-point membership.
It is a work assignment, not CBSA extent, extract ownership, route closure or
metro destination policy. In particular Washington's native point is in Virginia;
DC's zero native-point count is not a vacuous coverage certificate. Cross-border
metros and routes leaving/re-entering a state remain in the full competition.
All source identities remain explicit; nothing is excluded by scheduling rank.

`report.json` reproduces against the current audited costs, native membership,
complete domains, retained lead scans and all AI review packets. Input digests
are recorded. A changed approval ledger requires a new independently reviewed
version of this work queue; this script does not consume or create approvals.
Neither a retained lead scan nor a positive AI finding is an approved connector.

## Execution order

Start with Colorado as the existing first public beta target, then New Mexico,
Arizona, Utah, Oklahoma, Kansas, Wyoming and Nevada. Remaining jurisdictions are
scheduled by their earliest still-unrouted competitor in the queue recomputed
against the latest 19-sample baseline. That distance is only a scheduling
heuristic, never an admissible route bound or exclusion proof. Advance unblocked
work in subsequent states while an independent evidence item remains unresolved;
do not mark a blocked state complete or lower its gates to make progress.

For each state, preserve separate records for:

1. Exact retained sources, input hashes and resource preflight. The current
   two-shard bounded solver cannot silently absorb arbitrary additional shards
   or endpoints; reproduce prior directed costs before accepting an extension.
2. Every qualifying metro, justified urban-anchor policy (including multi-center
   CBSAs), actual directed entry/exit paths and connector cost assumptions.
3. Independent current physical/legal/grade/turn evidence and separate release
   approval under #137. No assertion, provider coordinate, photo age assumption
   or green CI may write an approval entry.
4. Destination attachments, independent land/water masks, complete border and
   omitted-competitor reasoning, both directed metrics and threshold regressions
   under #138. Native-point membership does not establish these conditions.
5. Reproducible region/isochrone assets for an explicitly claimed supported
   extent, clear reasoned transparent NoData and independent golden negatives.
6. Exact asset/source/origin-policy/threshold/metric/direction compatibility and
   mobile/interaction/share/export tests under #139 before public activation.

## Public tab contract

Keep Straight-line as the default. The planned separate road tab/modes must
label **road distance** and **modeled free-flow driving time**, with units and
orientation. Outward isochrones use metro-to-location; return-to-metro costs use
location-to-metro. These differ on directed roads. Neither Euclidean Voronoi
cells nor the 19 sampled graph nodes are geographic isochrones.

Production assets must be bound to the exact approved graph bundle, anchor
policy, metro identities, threshold, direction, metric and coverage mask. The
current release gate binds one OSM file; do not pass a manifest as that file or
weaken the independent gate. Build a separately reviewed graph-bundle contract
before multi-source public release. Unsupported water, points, borders,
competitors, custom CSVs and absent/mismatched assets must remain unshaded or
fail closed. Preserve straight-line rendering and the historical inspector views.

## Current first-state work

Colorado's seven native-point qualifiers have graph-only research costs, but
this does not establish urban-anchor access. Denver's municipal street topology
and published curb/parking evidence already narrow its candidates; exact curb
entry/current restrictions remain unresolved. Next evidence work should continue
those candidate-specific questions, while investigating the other six Colorado
metro anchors. No generic nearest-road snap can discharge them. Las Vegas's
separate historical Wrong Way finding remains a Nevada evidence item, not a
reason to stall all other states or to invent permitted ingress.

Run `python scripts/metro_state_work_queue.py --check docs/research/state-release-work-queue/report.json`.
Run `python -m unittest discover -s scripts -p test_metro_state_work_queue.py -v`.
The work queue is reproducible scheduling evidence, not the public release gate.
