# Additional Las Vegas road-node sample

The 33-source comparison preserves all 18 inherited probes. This separate
extension adds the unapproved Las Vegas road lead as a sample without adding a
new graph endpoint: that node is already among the 44 protected endpoints.
All 33 sources are compared in both metrics and directions, producing 132 new
costs. A source's cost to its identical road node is zero graph cost; this does
not create an off-road connector or adopt an urban access anchor.

The extension computes metro-to-probe costs as probe-to-metro costs on the
reversed model graph. Native target groups stay 32+1, and exact native path
replays retain their explicit solver direction. Independent asymmetric
NetworkX tests detect a direction swap, preserve unreachable and zero-cost
cases, reject missing endpoints before work and enforce the remaining budget
across target groups.

The retained parent report comes from successful original-source CI 40941595075
at 637027ce526d2bf9ab7afb81b6a7d7c35b2e130a. Its complete projection matches the
local 33-source run. The manifest pins its exact bytes, 36 transitive graph-source
files and graph package versions. New computation fails if those model inputs
or code differ. This avoids combining the parent snapshot with a changed graph
policy. Historical read-only auditing preserves the recorded policy identity.

Each metric/direction receives only the budget remaining after its parent run,
including every native replay. Combined calls must stay at or below 512. The
original 15m-node/40m-arc, 192-boundary and 64-endpoint caps remain; the actual
shared interface has 191 vertices. The CI job builds fresh protected views from
all eight exact original PBFs. Any temporary numeric views are created and
consumed in that same job, never restored from a prior execution.

The selected source and probe lie numerically inside OSM's Hollywood Pit
polygon. The retained operator page provides facility/customer directions;
precise connector access, legal rights, grade and turns remain unresolved in
`29820-census-lead.json`. All 334 other qualifying competitors remain unknown.
This experiment cannot enable public road regions or certify access/coverage.
