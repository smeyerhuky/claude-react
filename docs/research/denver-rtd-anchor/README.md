# Denver RTD urban-anchor pilot

This is an unapproved alternative to the Union Station pickup proposal, not an adopted origin. Public straight-line regions, Census regression origins, both frozen road checkpoints and the #137 approval ledger are unchanged.

## Decision and evidence

Reject **10th/Osage as a parking-access candidate**: the operator's station record lists `AUTOS: 0`. This does not establish that pickup or other vehicle access is prohibited.

Investigate **38th/Blake Park-n-Ride**: RTD's linked facilities service lists 200 auto spaces. The operator's map description explicitly states that locations are generalized for planning. Its geometry point and attribute LATITUDE/LONGITUDE disagree; neither is an accepted entrance. RTD also warns that parking fees may apply. Capacity and a fee link do not establish unconditional public driving rights.

Pinned Colorado OSM maps driveway way **436487553**, tagged two-way, meeting Wynkoop Street and 39th Street at node **176077058** (`[-104.9735792, 39.7730621]`). Its mapped length is **81.396 m**. The operator geometry point is **91.138 m** from that junction. The latter is registration displacement, never connector length. No anchor, travel time, legal turn or access approval follows from these values.

The full operator parking guide and station page requests returned HTTP 403. Attempts are retained. This is an evidence retrieval blocker, not evidence of prohibited access. Generalized GIS and OSM alone cannot resolve it.

## What would finish this candidate

Obtain an independently locatable operator or road-authority site/entrance plan, applicable parking/vehicle-use conditions and current direction/turn/grade evidence. Match the actual directed entry and exit to the pinned road nodes; choose an explicit anchor and calculate its path length/cost. Review all five questions in the retained AI packet. Only supported findings can proceed to #137's separate, different release approver. Another name in the same AI run is not independent approval.

A single Denver location also needs a documented selection decision for the multi-center Denver–Aurora–Centennial CBSA. This pilot does not silently resolve that policy by choosing the nearest lot.

## Replay

```sh
python scripts/denver_rtd_anchor_evidence.py
python -m unittest discover -s scripts -p 'test_denver_rtd_anchor_evidence.py' -v
python scripts/connector_review_packet.py docs/research/connector-reviews/denver-blake-rtd-proposal.json
```

The manifest retains exact requests, source byte counts and SHA-256 hashes. The operator map data links the facilities endpoint; metadata names owner `rtdgis`. `osm-extract.json` retains selected complete ways and restrictions touching those ways from the fixed Colorado PBF. An empty restriction list is not proof of unrestricted turns. CI replays retained evidence without network requests; it does not verify current physical conditions or approve access.
