# Bounded boundary-label routing experiment

The existing dense-port oracle rejects the six-state query view at 178 ports
against its unchanged 128-port cap. This separate solver tests a different
composition method. It does not reinterpret that rejection as success, change
that oracle or increase its limits. The frozen 26-source checkpoint is unchanged.
Full six-state comparison results must pass source CI before any new scenario is
adopted; fixture tests alone establish no additional route coverage.

## Composition and stopping rule

A local pass seeds one shard with the currently known costs at its shared native
OSM vertices, plus the original source when that source belongs to the shard.
One solver-only super-source and its outgoing initial-label edges let the existing
SciPy Dijkstra compute that local closure. These auxiliary edges do not become
road arcs, connectors or replayed paths. No full road union or dense overlay
matrix is constructed. Only equal native identities with matching coordinates
transfer labels. Geometrically coincident distinct identities remain disconnected.

Every finite label represents a real node-state walk from the original source.
Each improvement records its local entry vertex and an immutable reference to
the prior prefix. The two local closures alternate until a complete sweep makes
no boundary improvement. A pass with exactly the same seed vector as its previous
pass can reuse that already applied deterministic closure. This is exact input
comparison, not an epsilon stopping criterion or a truncated iteration count.

At a fixed point, each shard's local shortest-path inequalities hold and shared
labels agree. Any whole-model walk decomposes into local subwalks at shared
vertices, so none can improve the fixed-point cost. This argument requires the
existing nonnegative, static node-state edge model. It does not cover missing
roads, connectors, turns, grade, legal access or independently aligned datums.

The prefix histories produce local legs for every finite selected query. The
solver groups required legs by owner and start, reruns local Dijkstra and replays
native stored directed arcs using exact binary64 fractions. Initial-label edges
are excluded. Leg joins, costs, actual-direction path hashes and composed costs
must agree within the existing replay tolerance. Unreachable queries are returned
only after convergence. Exhausting a budget raises without returning partial
answers or labeling a still-unsettled target unreachable.

## Explicit budgets

- At most 32 sources and 32 targets per run; query views enforce their original
  checksum-bound endpoint set.
- At most 192 shared label entries and 192 seed-row entries per local pass. These
  are sparse seed vectors, not a dense metric closure. The original 128-port
  oracle and its rejection remain independently tested.
- Each working shard, **including** its one auxiliary vertex and seed arcs,
  must fit its original declared node/arc limits (never above 15 million /
  40 million). The original graph objects are not mutated.
- At most 512 local Dijkstra calls per run, counting both propagation and replay.
  No partially converged answer is emitted when the budget is exhausted.
- At most 200,000 history entries and composed segments, 64 million predecessor
  tracing steps and 64 million replayed native nodes per run. A per-pass root
  memo retains at most one million entries; reaching that memo size stops caching
  additional entries without changing path traversal or the answer.

All old source identities, precise Census regression origins and probe coordinates
remain fixed. The optional `--solver boundary-label-v1` uses the same six exact
inputs and query-pruned graph union as the negative experiment. Successful runs
must compare all 1,872 old costs without losing or increasing a finite route,
compute all 2,232 new scenario costs and replay every finite selected path. Five
new source leads remain unapproved. A source report identifies its solver and
scenario separately; it never overwrites the frozen 26-source reference.

Independent tiny-union tests cover repeated alternating-owner paths, directed
unreachability, zero arcs, parallel per-metric minima, overlapping ways, reverse
queries, query-view scope, working-resource exhaustion, and more than 128 shared
vertices with the original dense oracle still rejecting the same input. These
are mathematical fixtures, not independently reviewed real-world connectors.
All access/release/global/geographic flags remain false. The public straight-line
map and #137 approval gate remain intact.

The full experiment passed source CI at `33e00e8c9abc60ccd7b464ab656e8365a4e03d88`:
2,232 cases, 2,088 finite replays, all 1,872 retained comparisons preserved without
finite-route loss/increase, with 122 improvements. A separate
[31-source checkpoint](research/census-31-source-checkpoint/README.md) retains the
result without changing the old reference. All 18 probes are inherited and
sampled winners remain unchanged; this establishes no geographic closure.
