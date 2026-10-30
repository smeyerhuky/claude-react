# New Mexico urban-anchor source screening

New Mexico's four native-point qualifying identities already have graph-only
research costs. This batch evaluates municipal context for all four, without
replacing their Census origins or adopting a facility/road point as an anchor.
No connector or geographic release is approved.

| CBSA | Retained primary source | What it establishes and what it does not |
| --- | --- | --- |
| Albuquerque 10740 | City Parking Facilities | Hourly parking is published for all named structures and the Main Library/Old Town surface lots. A facility-use offer is not an exact directed entry/grade/turn or all-hours finding. Parking-office address is not a selected garage entrance. |
| Farmington 22140 | Official Civic Center page | Identifies 200 W Arrington and the downtown facility's purpose. Does not establish public motor entry, a driveway, or parking rights. Proximity to US64 is not connection evidence. |
| Las Cruces 29740 | Official Downtown Master Plan Update page | Explicitly identifies the linked plan as a draft. Planning proposals are not as-built driving permission or current entry geometry. No anchor is chosen from this source. |
| Santa Fe 42140 | Official Parking Division page | Distinguishes Water Street's 24/7 surface lot from closing-hour garages; Sandoval prohibits trailers/bike racks. Locations, hours and use conditions must remain specific to the actual selected venue/path. |

The Albuquerque April2026 parking study was also inspected. Its management,
parking-supply and design recommendations did not establish an exact permitted
vehicle entry in this review, so it is not used to certify one. The large linked
Las Cruces draft PDF download was incomplete and is excluded entirely; the
retained city-page excerpts establish its draft status, not the PDF's contents.

Each retained source records exact URL, retrieval time, response size and digest,
selected literal visible-text excerpts and an explicit interpretation. Full HTML
form/runtime state is omitted. Response digests cannot be recomputed from the
excerpts and are not publisher authentication or physical/legal certification.
The manifest binds every excerpt file and the existing native-state inventory.

`municipal_source_screen.py` requires all four identities exactly once, keeps
location/planning/parking guidance distinct, checks retained source bytes and
rejects adoption, verified-entry or release claims. This is integrity checking,
not independent connector approval. It does not write #137's ledger or produce
public geographic assets. Every actual directed entry/exit, grade, turn, vehicle
profile, connector cost and anchor-policy selection remains separately reviewed.

Run `python scripts/municipal_source_screen.py docs/research/new-mexico-anchor-source-batch/manifest.json`.
Run `python -m unittest discover -s scripts -p test_municipal_source_screen.py -v`.
Continue the state work queue without calling a source screen a verified state.
