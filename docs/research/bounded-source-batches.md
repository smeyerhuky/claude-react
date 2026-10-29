# More source queries within the existing oracle limits

The native boundary-label oracle accepts at most 32 sources per call. Adding a
33rd competitor must not silently raise this limit or reset the Dijkstra budget.
The source-batch wrapper divides queries into groups of at most 32 and passes
only the remaining part of one shared 512-call budget to each group. Native path
replays count against that same budget. Exhaustion in any group raises an error;
no partial combined report is returned.

All original graph, 192-boundary-vertex and 64-protected-endpoint limits remain.
The wrapper validates every endpoint before the first group. A new source still
requires graph views freshly derived with that source protected; this wrapper
cannot extend an old pruned view. Native replay legs stay in their original
batch to avoid mixing identically keyed legs from separate solves.

Synthetic tests compare 33 sources with independent NetworkX costs for both
metrics and directions, including zero-length arcs and unreachable queries.
They also force budget exhaustion in the final group and reject a missing final
endpoint before any routing work. These are algorithm checks, not evidence that
a 33-source real graph fits, complete coverage, connector access or urban-anchor
approval. No existing cost checkpoint or public map changes.
