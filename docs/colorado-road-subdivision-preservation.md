# Baseline modeled-path preservation across new OSM junctions

An expanded extract may add an intersecting way at a baseline shape vertex.
Contraction then replaces one baseline arc with two expanded arcs. An endpoint
pair check rejects that valid refinement, while a bounding-box/edge-count check
can miss a genuinely lost directed road. Neither is a sufficient inclusion test.

`colorado_road_subdivision_preservation.py` decomposes each directed contracted
edge into consecutive original OSM node pairs, preserving ordered coordinates,
way identity, modeled speed and access/direction tags. It hashes these tuples
with SHA256 and counts every occurrence. Before comparison it independently
recomputes edge length and modeled time from full geometry/speed and checks them
within explicit floating-point tolerance. It also checks graph endpoints against
their source geometry. Missing provenance fails closed.

Require the expanded multiset to contain every baseline directed primitive arc,
and require every baseline graph junction node to remain a graph node. Thus each
baseline contracted arc has an expanded path through the same ordered primitive
segments; every original transition remains available at the same junction.
Concatenating those witnesses preserves modeled baseline paths modulo
subdivision and numerical cost tolerance. Parallel/repeated arcs count separately.
A nearby unrelated way, changed speed, reversed direction or dropped junction
cannot stand in for the original evidence.

The real directed competition CLI builds the baseline fingerprint, releases that
graph, then streams the expanded fingerprint against it before auditing expanded
routes. This avoids holding both full road graphs or two full primitive inventories
at once. SHA256 collision resistance is a computational assumption, not independent
physical/legal evidence. The baseline inventory has an explicit memory bound.

Regression cases cover valid junction subdivision, missing reverse/parallel arcs,
substituted way identity, altered costs/speeds and dropped baseline junctions.

The narrow result is `modeled_baseline_paths_preserved_modulo_subdivision:true`.
All release, access and extract-completeness certifications remain false. This
is a statement about two modeled graphs built from the supplied source bytes;
a baseline missing a road remains incomplete after all its arcs are preserved.
It does not discharge boundary closure, adjacent-state routes, omitted metros,
turn restrictions, geographic masking or independently audited connectors.
