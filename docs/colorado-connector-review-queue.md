# Independent Colorado metro road-access inspection backlog

The `colorado_connector_review_queue.py` tool prepares **candidate road
segments requiring independent human review**. It never approves a
connector and cannot be passed as trusted release input.

Research command after filtering a Colorado OSM PBF:

```bash
python scripts/colorado_connector_review_queue.py \
  --osm local-data/roads.osm.pbf \
  --metros public/data/metros-census-2025.csv \
  --threshold 100000 --max-gap-m 100 --per-metro 4 \
  --output colorado-connector-review/review-queue.json
```

Every qualifying CBSA in the supplied 2025 Census CSV appears in the
queue **even if its origin has no road candidate in the clipped
graph**. Each nearby geometric edge suggestion records the source
OSM way ID/link, source road access/one-way tags, nearest projection
coordinates and straight-line geometric gap. These are inspection
leads, not proof of physical entrance, legal motor access, grade
separation or globally correct routing.

## National inventory versus local road extract

The 2025 Census metropolitan inventory is national; the Colorado research
road graph is clipped to a comparatively small corridor. A missing road
candidate for a metro thousands of miles away is **not** an observed
Colorado access failure. The queue preserves **every** population-qualifying
CBSA but separates two *diagnostic* cases:

- `missing_metros_outside_road_index_envelope`: origin is outside the
  conservative bounding envelope of *all indexed road polyline segments*.
  The graph extract cannot support a connector assessment there.
- `missing_metros_inside_road_index_envelope`: origin is in that coarse
  envelope but has no modeled road segment within the geometric search radius.
  An inside-envelope result does **not** prove a road or legal connection.

Both categories stay unverified, and their sum must equal
`metros_without_geometric_candidates`. The envelope is based on spatial
index cells and may extend beyond actual roads; it is **not** an accurate
state boundary, route closure or geographic coverage certificate. No CBSA
is removed by classification, even if clearly outside the extract.

**Origin-coordinate limitation:** Census representative CBSA points
can be well away from named downtown street networks or independently
verified drivable urban access anchors. The queue explicitly labels
origins as unverified representative points; proximity to an OSM way
never authorizes converting them into the production By road destination.
An independent anchor-definition and road-entry review is required.

All entries deliberately carry `access_verified: false` and
`has_approved_connector: false`. The top-level schema is
`colorado-road-connector-review-queue-v1`, **incompatible** with the
release evidence loader. The final approval ledger in #141 remains
empty and requires a different independently audited source and
review procedure. Generated OSM links cannot independently certify
the corresponding road conditions; a verified entry still needs
field/aerial/public-access review and exact source hashes.

See [issue #137](https://github.com/smeyerhuky/claude-react/issues/137)
for mandatory independent checks. This queue is specifically a
reviewer worklist designed to expose **missing metro competitors**,
rather than silently excluding them from potential region winners.

Neither this tool nor its unit tests modify the existing website
or produce release-eligible shaded road regions.

## Bounded triage of locally unmatched origins

For an eligible metro whose Census representative point is **inside the coarse road-index envelope** but has **no road within the normal geometric gap** (100 m by default), the research queue now optionally supplies `nearest_unapproved_triage_lead_within_500m`. This is the closest directed road segment found within a *separate fixed 500 m search*, including OSM way link, projected point, distance, and access clues. `null` means no lead was found within 500 m, **not** that no road exists beyond it. The per-metro `road_proximity_triage_status` distinguishes an unapproved candidate within the configured gap, an unapproved 500 m lead, an origin outside the coarse envelope, and an origin inside that envelope with **no indexed road found within 500 m**. The summary `inside_envelope_missing_without_triage_lead` complements `inside_envelope_missing_with_triage_lead`; together they account for all missing origins inside the coarse envelope. Neither classification establishes full graph coverage or physical/legal access. The summary `inside_envelope_missing_with_triage_lead` counts these entries. The existing candidate count, review status, population eligibility, 100 m gate, and release-approval behavior are unchanged. In particular, this extra lead **must never be promoted to an approved connector or routed destination**. Reviewers should first check whether the Census representative point is an appropriate access anchor, then independently establish physical connectivity, public legal motor access, grade separation, direction, and evidence hashes. The exact two inside-envelope metros and their road IDs must be read from a fresh real-OSM artifact; they are not inferred from synthetic fixtures.
