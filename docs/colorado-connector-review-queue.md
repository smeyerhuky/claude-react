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
