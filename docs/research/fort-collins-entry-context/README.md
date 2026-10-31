# Fort Collins Civic Center candidate and raw node-control review

This unadopted candidate adds deeper evidence for Fort Collins, one of the two
principal cities in CBSA 22660. It does not represent Loveland, establish a
complete reviewed anchor set, replace a native Census origin or add a connector.
All five full connector findings remain unresolved. Zero connectors are approved.

## Independently published context and its limits

The city's re-fetched Where to Park page describes 24-hour, gateless garages and
hourly/permit use. A parking session is required even for the first free hour;
posted signs still apply. Those conditions do not certify an exact vehicle path.
The event organizer's directions name **North Mason Street** as a Civic Center
entrance street, without an exact coordinate, date or assertion that it is the
only entrance. Its 301 Maple Street reference is the event's Washington Park
address, not a garage anchor.

The city-published exterior image shows two ground-level vehicle-sized openings
and a roadway in the foreground. Its capture date and precise orientation are
unknown. The source URL/SHA, caption and disclosed AI observations are retained;
the original image is not republished. No clearance text, current gate operation,
full-path grade or entry/exit direction is inferred. Independent visual review
would need to fetch the exact cited image bytes again.

The retained January 2026 municipal parking PDF was visually inspected on **page
2**; page 1 is an accessibility cover. It locates the garage and distinguishes
parking facilities, but does not survey a vehicle entry. The office relocation
notice prints **114** North Mason, Suite 5, while Where to Park prints **144**.
Both remain office-contact statements; neither is silently corrected or converted
into a car entrance. OSM's separate building address of **120** is also retained.

The municipal Street Centerlines item/service is bound to City of Fort Collins
organization `dLpFH5mwVvxSN4OE`, owner `ftc_geoevent`. The bounded WGS84 response
has 12 features. Three North Mason rows have **null ONEWAY**, no coded domain for
that field, and **2013-10-30** record revisions. Null is not interpreted as two-way,
an absence of restrictions or current permission. The city's AS IS accuracy,
timeliness and completeness limitations are retained. Only selected publisher
identity is retained; full portal configuration is omitted.

## Exact original-source context

The unchanged original Colorado PBF yields **40 ways, 187 complete member-node
records, 23 additional tagged local nodes and one touching restriction**. Every
selected raw vertex has its complete tags, including untagged records. Selected
way geometry is complete, even where it leaves the investigation envelope.
Crossing ways without an in-envelope vertex, complete incident-way sets and
exterior closure are not established by this selection.

Mapped service ways 696728762 and 696728763 meet footprint 54882910 at tagged
parking-entrance nodes 6543050321 and 6543050323. Their road-side nodes are
6543050320 and 6543050322. This is raw-source topology, not an independently
matched full physical connector, surveyed anchor or reviewed path cost.

Two actual source regressions need to survive future routing changes:

* Tenney Court service way **815164359** contains node **7614361913**, tagged
  `barrier=bollard`, `bollard=removable`. The legacy way-only predicate accepts
  that way; the fixed-reference complete-node profile returns **unsupported**
  with no permissions/cost. This is not proof of actual closure or a claim that
  any old sampled path crossed it. Removal/operation of the mapped barrier is
  unresolved; do not fabricate `access=no` or delete the tag to obtain a route.
* Relation **20193102** has only `restriction:conditional=no_u_turn @ (Th-Sa
  19:00-00:00)`, from way 696728766 via node 6543050322 to way 1475543490. It is
  retained unchanged, not dropped for lacking a static `restriction` key. This
  checkpoint does not evaluate its timing, compile its maneuver or apply it to
  old costs. A separately verified temporal turn contract is still needed.

Neither the mapped bollard nor the conditional relation is an access approval.
The frozen 2,508 costs are unchanged and remain unevaluated under the reference
scenario. No graph limit, public map behavior or independent #137 gate changes.

## Reproduce and inspect

```sh
python scripts/fort_collins_entry_context.py
python -m unittest discover -s scripts -p test_fort_collins_entry_context.py -v
python scripts/connector_review_packet.py docs/research/connector-reviews/fort-collins-civic-center-proposal.json
```

The frozen report binds source/implementation hashes. Fourteen mutation checks
protect actual raw controls, null/date distinctions, exact city identity,
complete geometry/node records, publisher/truncation checks, conditional use
terms, venue/office addresses and photo limits, including altered records with
recomputed hashes. The AI review packet supplies ten reproducible assertions but
does not satisfy the separate approval ledger.

CI downloads the exact dated public Colorado extract, verifies original size/SHA,
re-extracts every retained way/node/restriction and compares complete JSON bytes.
The source hash is rechecked after extraction; no truncated or partial report is
returned on a budget failure. The PBF/private source archive, original web pages,
photo, application state and environment configuration are not published.

OSM data © OpenStreetMap contributors, ODbL. Municipal data are publication context,
not engineering certification or a guarantee of present legal/physical access.
