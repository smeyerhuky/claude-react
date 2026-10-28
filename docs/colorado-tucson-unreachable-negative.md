# Tucson native-point lead: an explicit modeled-unreachable case

The two-partition source run in #185 computed all 1,872 source/probe/metric cases
and replayed all 1,800 finite queries. All 72 unreachable results belonged to
Tucson's unapproved native-point lead, in both directions and both metrics over
the eighteen raw-node probes. Tucson remains in the source inventory; no metro
was silently excluded or assigned another origin to make the run connect.

A complete Arizona-only model scan explains the local disconnection. The lead
is OSM node 175244806 at [-111.755014, 32.082966], 5,691.8 m from the preserved
CBSA representative point [-111.7836574, 32.128038]. Its weak component contains
exactly nodes 175053966, 175244804 and 175244806 on residential way 16894310.
The only other incident mapped highway is track 16877709, with 106 nodes outside
the modeled component. The current supported-driving filter excludes tracks.
The residential way retains `tiger:reviewed=no`; those tags are source clues,
not an independent audit of either road.

This is **not** a statement that Tucson or the mapped track is inaccessible in
real life. It is a negative case for this statistical origin, unapproved nearest
vertex and supplied static model. Road proximity does not prove connection to a
larger component, legal motor access or same-grade entry. No filter was widened,
origin moved, connector certified or straight-line fallback substituted.

The [versioned report](research/tucson-unreachable-negative.json) binds the exact
Arizona PBF, native source record, complete three-node component, both incident
ways/tags, Census CSV/domains and upstream #185 report provenance. Dedicated CI
rebuilds the full supplied Arizona graph, checks the nearest lead and complete
weak component, then scans all raw highways for incident ways and reproduces the
records. This is same-source reproducibility, not independent real-world golden
routing or access evidence. The five-source unreachability is established by
#185's report; the component check itself claims only the supplied Arizona graph.

The source PBF is already retained in the unpublished input archive. No new raw
input, approval-ledger change, environment publication or production UI change is
needed. OpenStreetMap data is © OpenStreetMap contributors, ODbL. #137's independent
access reviewer and separate approver remain mandatory. Urban access anchors, if
chosen as a different product policy, require a separately versioned scenario and
review; they must not overwrite this Census-origin regression.
