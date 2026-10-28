# Urban access anchors and AI-led connector review

The user selected independently reviewed urban access anchors for eventual road
mode on 2026-10-28, then authorized AI-led evidence review and deterministic or
mixed GitHub validation. This authorizes investigation and documented AI findings;
it does not establish any particular road entrance's physical or legal status.

## Separate destination policy

`urban-access-anchor-v1` names the proposed destination policy. It is not yet an
approved coordinate registry. CBSA identity and population still determine metro
eligibility. Preserve every existing Census-point research origin and its routing
regression. Never replace a point just to make a route connect.

A proposed anchor must identify its CBSA, explicit urban location and reason for
selection, precise coordinate/datum provenance, actual directed entry path, road
node/edge, path distance and cost assumptions, and exact source graph bundle and
metro-data hashes. For a multi-center CBSA, explicitly decide whether one location
or a defined set represents the metro before evaluating winners; never silently
use the first named city. Census city points are selection leads, not access proof.
No actual urban anchor is adopted by this document.

## Review procedure

1. Retain inspectable evidence with provenance, capture date and exact hashes.
   Inspect agency/public-access records, restrictions and physical entry evidence;
   an OSM rendering or model output alone cannot establish real-world access.
2. Run reproducible topology and identity checks. The existing Tucson full-source
   workflow rebuilds the component; packet CI additionally checks the retained
   report's bytes and explicit assertions. Those are different checks.
3. The AI reviewer answers physical connection, legal motor access, same-grade
   entry, direction/turns and connector cost separately, citing retained evidence
   and explaining uncertainty. Unknown is a valid and necessary outcome.
4. Reject a candidate that fails the required model connection without excluding
   the metro. Obtain a separately versioned urban candidate instead of changing
   the Census regression. Publish no inferred access assertions.
5. Submit supported findings for separate release approval bound to exact inputs.
   The existing repository approval ledger and #137 gate remain unchanged.

The review record explicitly discloses AI authorship. A second execution of the
same AI, CI success or a different agent name does not establish independent
review or create a separate approver. The user may act as the separate approver
of a concrete supported packet; generic authorization to investigate does not
approve evidence that has not yet been inspected.

## Deterministic packet checks and their limits

Run `python scripts/connector_review_packet.py PACKET.json`. GitHub's
`Connector AI review packet integrity` workflow checks all retained packets,
source hashes, machine assertions, complete answers and evidence references.
A supported access finding requires a retained source classified as an
independent access record, and a handoff requires all five supported findings.
These are consistency checks: CI cannot establish that a source classification
is honest or its interpretation correct. AI review must examine that separately.
No packet is accepted as release evidence by this tool; its schema is deliberately
different from the existing connector-evidence loader. It cannot write the ledger
or set `access_verified`, even when ready for separate approval.

The initial [Tucson review](research/connector-reviews/tucson-census-lead.json)
rejects the old modeled candidate, records eight reproducible assertions and
leaves all five real-world access questions unknown. This is useful negative
review, not an approved urban anchor or real-world inaccessibility claim.

The [Denver Union Station proposal](research/connector-reviews/denver-union-station-proposal.json)
uses station-operator pickup and valet guidance independent of OSM. It is a
plausible urban destination lead, but the text does not locate an exact entry or
establish unrestricted private-car use. All five connector findings remain
unknown. This packet records actual AI source review rather than substituting
a nearest-road snap for evidence.

## Remaining release work

The current approval gate binds one OSM file. Multi-source research needs an
explicit graph-bundle/anchor-policy binding extension before release; a manifest
must not be passed off as an OSM file. Audited real-world positive and negative
fixtures, missing-competitor accounting, exterior routing, geographic masks and
UI artifact compatibility remain necessary (#137, #138, #139). The public
straight-line map stays unchanged. This workflow does not close those issues.
