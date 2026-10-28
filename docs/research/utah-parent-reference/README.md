# Pinned Utah-prefix regression reference

`domains.json` is the exact complete Census-domain artifact from successful
source run 40640674406, job 122657819801, code head
`e815bf4aa4f8bb632e37c4833be5b15a8721abcc` (#176).

`baseline.json` is a lossless projection of that run's Arizona exterior report:
all 780 original graph-cost labels, every source/probe coordinate, source
provenance, graph/model metadata and safety flags needed by the Utah comparison.
Unused path arrays, timings and repeated route diagnostics are omitted. The
complete upstream report SHA256 is recorded in both the projection and manifest;
the projected-file and domain hashes are bound separately. No label or origin
was recomputed, rounded or substituted when creating the reference.

This is a regression reference from passed research CI, **not independent road,
access or geographic ground truth**. The Utah run reconstructs the entire exact
three-state prefix and reproduces every label, including unreachable cases,
before comparing the enlarged graph. It also checks every prefix arc rather
than treating sampled agreement as graph closure. All release/access/global/
coverage flags remain false.

Original source bytes are retained in the unpublished research source archive
documented in `docs/research-source-archive.md`. The new Utah source has the same
explicit replication timestamp as all three prefix files. Dated provider URLs
are used for CI acquisition; both byte size and SHA256 must match.

OSM-derived costs/geometry: © OpenStreetMap contributors, source extracts by
Geofabrik; data under ODbL 1.0 (https://opendatacommons.org/licenses/odbl/1-0/).
Census fields come from the exact official 2025 source files recorded in the
domain provenance. Public straight-line UI/data and #137's independent review
and separate-approver requirements are unchanged.
