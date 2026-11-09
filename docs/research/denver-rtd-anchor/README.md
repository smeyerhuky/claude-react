# Denver RTD urban-anchor pilot

This is an unapproved alternative to the Union Station pickup proposal, not an adopted origin. Public straight-line regions, Census regression origins, both frozen road checkpoints and the #137 approval ledger are unchanged.

## Decision and evidence

Reject **10th/Osage as a parking-access candidate**: the operator's station record lists `AUTOS: 0`. This does not establish that pickup or other vehicle access is prohibited.

Investigate **38th/Blake Park-n-Ride**: RTD's linked facilities service lists 200 auto spaces. The operator's map description explicitly states that locations are generalized for planning. Its geometry point and attribute LATITUDE/LONGITUDE disagree; neither is an accepted entrance. RTD also warns that parking fees may apply. Capacity and a fee link do not establish unconditional public driving rights.

Pinned Colorado OSM maps driveway way **436487553**, tagged two-way, meeting Wynkoop Street and 39th Street at node **176077058** (`[-104.9735792, 39.7730621]`). Its mapped length is **81.396 m**. The operator geometry point is **91.138 m** from that junction. The latter is registration displacement, never connector length. No anchor, travel time, legal turn or access approval follows from these values.

The original October 29 operator guide/station requests returned HTTP 403; those
attempts remain retained. A November 9 follow-up directly retrieved both the
[parking guide](https://www.rtd-denver.com/how-to-ride/parking) and
[38th/Blake facility page](https://app.rtd-denver.com/facilities/38th-blake-station)
with HTTP 200. `parking-publication-followup.json` retains body receipts and
limited factual observations; full HTML is kept outside the repository.

The current publications state transit-passenger parking conditions, require RTD
permission for parking without transit use, and describe 38th/Blake's paid-parking
terms and 200 spaces. This resolves that retrieval gap. It does not establish
that the terms applied at the fixed October 28 scenario instant. Parking-use
conditions are not evidence that entering the driveway, pickup or drop-off is
prohibited. Exact vehicle-path permissions, physical connection, grade, turns
and connector costs remain unresolved. The AI packet now records these specific
gaps instead of treating already retrieved publications as unavailable.

## What would finish this candidate

Obtain an independently locatable operator or road-authority site/entrance plan, applicable parking/vehicle-use conditions and current direction/turn/grade evidence. Match the actual directed entry and exit to the pinned road nodes; choose an explicit anchor and calculate its path length/cost. Review all five questions in the retained AI packet. Only supported findings can proceed to #137's separate, different release approver. Another name in the same AI run is not independent approval.

The destination policy is already chosen: nearest of a reviewed set across the
metro's principal cities. No further user policy decision is pending here. One
unadopted Denver candidate does not supply that complete reviewed set; see the
[anchor-set contract](../metro-anchor-set-contract.md).

## Replay

```sh
python scripts/denver_rtd_anchor_evidence.py
python -m unittest discover -s scripts -p 'test_denver_rtd_anchor_evidence.py' -v
python scripts/connector_review_packet.py docs/research/connector-reviews/denver-blake-rtd-proposal.json
```

The manifest retains exact requests, source byte counts and SHA-256 hashes. The operator map data links the facilities endpoint; metadata names owner `rtdgis`. `osm-extract.json` retains selected complete ways and restrictions touching those ways from the fixed Colorado PBF. An empty restriction list is not proof of unrestricted turns. CI replays retained evidence without network requests; it does not verify current physical conditions or approve access.
