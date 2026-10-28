# Research extension: bounded central/western six-state partitions

The first attempted grouping retained the original CO/NM/AZ/UT prefix and added
Kansas to Oklahoma. It passed the addition node/arc budgets (7,308,146 nodes and
15,161,057 raw arcs) but the existing oracle rejected its interface at the
unchanged 128-port cap, before route cases were computed. The
[local negative record](research/kansas-partition-layouts/retained-prefix-negative.json)
identifies exact inputs and the reproduction command. It is a local observation,
not a claim that this negative has independently passed CI.

The new explicit layout is `central-western-v1`:

- Central partition: Colorado, Oklahoma, Kansas.
- Western partition: New Mexico, Arizona, Utah.

The same six dated inputs, graph filter and native origins are retained. The
partition grouping changes; the frozen five-state scenario does not. Each new
shard must pass the unchanged 15-million-node / 40-million-arc caps. The oracle
must pass its existing 128-port, 32-source, 32-target, 192-overlay-node and
512-local-oracle per-run budgets. No automatic truncation or resource increase.
The legacy grouping can be selected explicitly with `--layout retained-prefix-v1`;
there is no silent fallback between layouts.

Retain all 26 source identities and eighteen raw-node destinations from the frozen
five-state experiment. Every previous source record is copied in full as
`retained_reference_record`; current shard membership is recorded separately
because shard numbers belong to a particular layout. Native points, road nodes,
coordinates and unapproved status must match the reference exactly. Add five
explicit unapproved nearest-primitive-vertex leads in the Kansas-containing shard
for Kansas City, Lawrence, Manhattan, Topeka and Wichita. Required endpoints cannot
be dropped or moved.

The experiment computes 2,232 source/probe/direction/metric costs, compares every
one of the 1,872 old cases and replays every finite selected path. Old finite
routes must remain feasible without a cost increase beyond replay tolerance.
Old unreachable costs remain distinct from new-source costs that have no previous
comparison. Invalid numeric costs fail. The report separates winner changes among
retained sources due to added roads from changes due to the five new sources.
Neither is a global-winner or geographic-region claim: 336 other qualifying
identities remain unrepresented in this graph-only comparison.

All six PBFs must match exact dated metadata. Raw overlapping way fingerprints and
shared node coordinates must agree. No flattened full road union is constructed.
The separately versioned five-state baseline remains available unchanged; an
expanded-graph improvement never overwrites it.

This remains a graph-only experiment. Kansas City's native-point lead can be far
from its representative point; no connector cost or legal/physical access is
inferred. Turn restrictions, grade, arbitrary destination entry, exterior
completeness and land/water/datum coverage remain unresolved. All source access
and release flags stay false. The public straight-line map and #137 approval gate
remain unchanged.
