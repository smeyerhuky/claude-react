# Las Vegas native-origin access review

The unchanged native Census point and selected primitive service-way lead fall
numerically inside OSM way 1520965805, tagged Hollywood Pit and operated by
Boulder Sand & Gravel. The operator's retained location page independently
publishes its quarry services, weekday hours of 6:00 AM–2:45 PM and customer
directions from Lake Mead Boulevard via Arnona Road to the first pit on the right.
This confirms useful facility context; it does not identify the exact selected
origin-to-road path or establish permission for that point and vehicle class.

The primitive vertex 7614401690 is 44.969 m from the native Census point. The
nearest raw-highway projection is a different 16.491 m diagnostic. A mapped gate
is 293.938 m away, but it has not been identified as the operator's entrance.
None is an adopted connector or reviewed urban access anchor.

The AI packet answers all five questions as unresolved: exact physical
connection, legal motor access, same-grade connection, directed turns and
connector cost. Nine machine assertions check retained facts and limitations.
The packet remains `needs_evidence`, with no approval or ledger entry. Need an
independently locatable entrance/site plan and applicable rights, grade and
current permitted turns for an actual chosen anchor/path before separate review.

The source workflow recovers the exact dated Nevada input and reproduces the
selected closed quarry polygon, service way, lead and gate. It checks literal
operator text against the retained HTML hash without reinterpreting changing web
content. The selected scan is not a complete landuse/barrier/restriction inventory;
raw Census/OSM coordinate comparisons have no verified datum alignment. OSM data
© OpenStreetMap contributors, ODbL 1.0. The operator page remains its publisher's
content, retained with exact request provenance for review.

```sh
python scripts/las_vegas_origin_context.py --osm local-data/nevada.osm.pbf --output /tmp/context.json --compare docs/research/las-vegas-origin-context/model-report.json
python scripts/las_vegas_origin_context.py --operator-only --output /tmp/operator.json --compare docs/research/las-vegas-origin-context/operator-report.json
python scripts/connector_review_packet.py docs/research/connector-reviews/29820-census-lead.json
```

The development inventory retains all 55 investigated identities and all 367
qualifiers, including eight absent from the public CSV. It shows the new packet
and quarry-context triage. The public straight-line map, native points and #137's
independent access gate remain unchanged. A successful graph query never clears
this review.
