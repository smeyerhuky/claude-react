# Cheyenne query repartition experiment

Adding the exact Wyoming source to the six-state model keeps both original full-source shards under 15 million nodes / 40 million arcs at longitude −107.4: 8,607,505 and 14,975,532 nodes. But the protected 43-endpoint views have 216 shared vertices, exceeding the existing 192-entry boundary-label budget. The retained initial negative has **zero computed routing costs**; 32 candidates are not 32-source route coverage.

A separate complete full-source node/arc sweep and protected-view cut sweep examined 56 straight cuts. Only −104.0 fits a 192-entry auxiliary seed row for off-boundary sources, at 191 query-shared vertices, but its full-source western shard would have 15,678,020 nodes. This does not prove every possible cut impossible; it rejects the sampled candidates under both existing requirements.

The new pipeline keeps the valid full-source ingestion cut, applies the already tested query-leaf-core proof for the exact same 43 endpoints, then **repartitions only the retained native weighted pairs** at −104.0. It never constructs the oversized full-source cut or a flattened weighted union. Every native identity, coordinate, directed pair and per-metric minimum weight is preserved. Both query shards must independently meet the unchanged graph caps, and the unchanged boundary-label oracle must still converge and replay every finite path within 512 local calls. This is a new query-only preprocessing step, not a claim that the rejected full-source cut became valid.

All 31 frozen source road leads and 18 inherited probes remain fixed. Cheyenne uses the separately retained unapproved native-Census road lead. The target experiment is 2,304 oriented metric/probe/source cases, comparing all 2,232 old cases; no positive checkpoint exists until that run completes and is independently reproduced.

The optional 2 GB numeric query-view cache is for interruptions in the owned local workspace. It binds the exact original source hashes, original candidate/reference scope, graph code and 43 endpoints. It verifies every numeric NPY file and its bounded metadata, loads no pickle, rejects changed bindings/corruption, and never replaces an existing cache. It is not independent evidence. CI always rebuilds from all original inputs and uses no derived query cache.

No source/connector is certified. Census origins, old 26/31-source snapshots, public straight-line mode and #137's independent access gate remain unchanged. No environment or source release is published.
