# Nearest reviewed set: research aggregation contract

The user selected the nearest of a reviewed set across principal cities for a
multi-center CBSA. `scripts/metro_anchor_set_contract.py` defines the arithmetic
and missing-data behavior separately from approving or installing actual anchors.
Its fixtures are synthetic. There are no adopted anchors, coordinates or new
connector approvals, and no production caller or public tab activation.

A versioned expected registry must explicitly name each principal-city identity,
its retained source identity and the anchors assigned to it. Every declared city
needs an expected anchor. Names are not split on hyphens. A SHA-256 binding covers
the entire registry, including membership and version. Source hashes and complete
membership declarations are input identities, not proof that the selected set is
complete or appropriate; independent review must establish that separately.
Population thresholds and eligibility remain attached to the CBSA. This helper
never tests city populations or removes a CBSA from the competitor domain.

For one sample, graph bundle, requested metric and direction, each required anchor
contributes an explicit status. Finite rows require both graph and connector costs
in meters or seconds as requested. Neither a missing connector cost nor a missing
row becomes zero. The minimum uses full costs and preserves exact stored-number
ties. Outward distance, return distance, outward modeled time and return modeled
time are separate queries and may select different anchors. `from_anchor` means
anchor to sample; `to_anchor` means sample to anchor. The connector cost must be
for that same direction and metric, including all relevant directed connector
segments. No units, directions, samples, CBSA IDs, registries or graph bundles can
be mixed within a query.

| Required-anchor results | Metro research result |
| --- | --- |
| All accounted for, at least one finite, others finite or modeled unreachable | Finite full-cost minimum, preserving ties |
| All modeled unreachable | Modeled unreachable within the declared graph |
| Any unknown or missing row | Unknown, even if another anchor is finite |

When an unknown remains, the minimum of a finite subset is labeled only as an
**upper bound on the declared minimum**, conditional on the supplied costs being
valid. It is not the complete result and cannot drive a winner region. With no
finite subset the bound is absent. Modeled unreachable is never a claim of
real-world inaccessibility. Unsupported statuses, duplicate or foreign anchors,
nonfinite/negative costs, and missing source identities reject the query.

The helper uses exact rational arithmetic on the supplied stored numeric values;
it does not certify coordinate accuracy, measured lengths or travel-time realism.
Adding two numbers does not establish a valid shortest path. An upstream turn-aware
route contract must establish compatible connector arrival/departure states and
optimal full paths; a cheapest unconstrained road-node cost plus a connector may
be invalid or suboptimal. This helper cannot certify that compatibility, the graph
bundle, exterior coverage, missing competitors, masks or principal-city coverage.
Every output is research-only with adoption, access verification and release
eligibility false. Those flags remain false even when every cost is finite.

The existing #137 evidence and separate approver gate is unchanged. Its current
single-source binding still needs an explicitly reviewed graph-bundle extension;
this registry is not an approval ledger and cannot substitute for one. Existing
Census-origin regressions, 33-source frozen costs, older inspectors and public
straight-line behavior remain unchanged.

Validation uses seven tests covering connector-sensitive winners, exact ties,
independent metric/direction choices, missing and unknown anchors, all/mixed
modeled-unreachable cases, invalid component costs, mismatched identities and
complete principal-city membership. Run:

```sh
python -m unittest discover -s scripts -p test_metro_anchor_set_contract.py -v
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```
