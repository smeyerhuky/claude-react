# Colorado By road connector release approval (fail-closed)

The road allocation CLI has two distinct operating modes.

* **Research / diagnostics**: `--connector-evidence` can load candidate records, but
  even positive `access_verified` assertions are **not proof of physical or
  legal road access**. All road-node and raster output stays experimental.
* **Release gate**: `--require-verified-access` requires both
  `--connector-evidence` **and** an exact approval entry in the versioned,
  repository-owned `scripts/colorado_reviewed_connectors.json` ledger.
  The ledger is empty until independent review is actually completed.
  The CLI has no user-selectable ledger override.

## What an approval binds

An entry has the form:

```json
{
  "evidence_sha256": "<64 lowercase hex digits>",
  "osm_sha256": "<64 lowercase hex digits>",
  "metros_sha256": "<64 lowercase hex digits>",
  "reviewed_by": "<individual independent evidence reviewer>",
  "approved_by": "<different independent release approver>",
  "audit_reference": "<auditable inspection record reference>"
}
```

All three SHA-256 values refer to **exact file bytes**, not to file names, OSM
tags, or the date of a download. The JSON evidence file still must pass
the exact CBSA/node/origin-coordinate and four-assertion checks.

An entry must **not** be added merely because an automated test passes, a
reviewer name appears in uploaded JSON, or the road appears near a metro center.
An independently sourced audit must check the actual directed physical
connection, public/legal motor access, grade separation and barriers.
Reviewers must document their inspection and independently approve the
particular hashed road network, metro data and connector evidence. See
[issue #137](https://github.com/smeyerhuky/claude-react/issues/137).

The repository approval ledger is an **integrity and process control**. A hash
match proves input identity, not that a driveway exists, is accessible, or
satisfies local law. The code explicitly reports that it cannot certify truth.
An approved connector set still **does not** authorize a geographic beta:
graph boundary completeness, coastline/water masking and independent
point-by-point validation must pass [issue #138](https://github.com/smeyerhuky/claude-react/issues/138),
and the feature-gated UI must pass [issue #139](https://github.com/smeyerhuky/claude-react/issues/139).

## Missing metro competitors

Release mode additionally refuses to allocate if **any** metro qualifying at
the lowest requested population threshold was omitted by the road snap/extract,
even if its Census representative point is outside the clipped graph. A missing
candidate cannot be silently assumed irrelevant to nearest-global-metro
routing. Research mode continues to report rejected snaps without asserting
complete geographic coverage. This guard is necessary but not sufficient:
exterior shortest paths and boundary closure remain unverified (#138).

## Rejection behavior

Absent/malformed ledger entries, stale OSM or metro input hashes, changed
evidence bytes, duplicate approvals, missing reviewers, and non-independent
approver identities reject the release command before building the road graph.
There is no straight-line substitute or automatic fallback.

Synthetic tests intentionally supply a **temporary** fake ledger to verify
logic. No test fixture, synthetic reviewer or fake hash is a real approved
Colorado road connector, and the default checked-in ledger starts empty.
