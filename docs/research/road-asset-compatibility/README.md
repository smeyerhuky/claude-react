# Browser-side road-asset compatibility research

The future road-distance/time tab must not reuse an asset after a change to its
query or inputs. `src/research/metroRoadAssetCompatibility.js` supplies browser
WebCrypto byte verification and exact context matching before any future consumer
considers geometry. It has no production caller, fetcher, renderer or access to
the approval ledger. It does not activate a road tab or provide road regions.

This is one engineering dependency for #139, not completion of that gate. All
fixtures are synthetic, with an empty GeoJSON feature collection and fictional
identities. They do not represent Colorado, actual routes or adopted anchors.
The 33-source historical experiment, public straight-line map and ten existing
inspector views remain unchanged. Zero connectors are approved.

## Caller contract

`inspectRoadResearchAsset(manifestBytes, payloadBytes, expected)` accepts bounded
`Uint8Array` bytes and a separately selected expectation:

- `manifest_sha256`: an exact byte digest from an independently trusted catalog;
- `context`: the complete live query, independently constructed by the caller.

Never derive the expected digest or expected context from the incoming manifest.
A content hash authenticates bytes only relative to that independently selected
expectation. This helper neither establishes the trustworthiness of a catalog
nor approves the data behind its entries.

The context contains five SHA-256 bindings: `graph_bundle_sha256`,
`anchor_registry_sha256`, `scenario_sha256`, `metro_dataset_sha256` and
`coverage_mask_sha256`. It also requires sorted unique `eligible_cbsa_ids`, the
exact integer `population_threshold`, `metric`, `direction`, `units` a versioned `extent_id`, `layer_kind` and `cost_limit`. The caller must compute the eligible set from its selected
dataset, not copy a proposed set from the asset. The exact dataset digest prevents
built-in data and a changed/uploaded CSV from sharing a receipt. A CSV has no
supported road asset merely because its place names resemble the Census data.

All four query contexts remain distinct: `length`/`meters` and
`travel_time`/`seconds`, each with `metro-to-location` or `location-to-metro`.
For `nearest-metro-regions`, `cost_limit` must be null. For
`nearest-metro-isochrone`, it is an explicit positive integer cutoff (at most
1,000,000,000) in the chosen metric's units. A different cutoff or layer kind
requires a different context, even with the same population threshold.
These names are explicit; no implicit conversion from the anchor algebra's
`from_anchor`/`to_anchor` terms occurs. A changed fixed scenario, anchor set,
coverage mask, extent, dataset, eligible set, threshold, metric or direction
requires a matching separately selected manifest. There is no nearest-threshold
fallback, direction reversal or inference that missing connector costs are zero.
The production graph-bundle identity remains subject to a separate review; the
historical eight-input research manifest is not an approved production bundle.

## Manifest and byte checks

The manifest has exactly these fields:

- `schema`: `metro-road-asset-research-v1`;
- `research_only`: `true`;
- `release_eligible`: `false`;
- `context`: the complete context above;
- `payload`: exactly `sha256`, positive integer `size_bytes`, and `format: geojson`.

Manifest bytes use UTF-8 `canonicalManifest(document)` with recursively sorted
object keys, preserved array order and no trailing newline. Strict decoding and
canonical equality reject duplicate JSON keys, a BOM and alternate encodings.
Unknown fields, missing identities, invalid units, unsafe extent names, unsorted
or duplicate metro IDs and approval assertions reject the input. No URL or local
path can be embedded as a loading instruction. An exact manifest hash is checked
before interpretation; exact payload size and SHA-256 are checked afterward.

Budgets are 256 KiB of manifest bytes, 16 MiB of payload bytes and 10,000 eligible
metro IDs. Larger region assets need explicit partitioning and another reviewed
contract, not a silent budget increase. Inputs are copied before the first
asynchronous operation, including Node Buffer inputs whose `slice()` would alias
caller memory. Receipts describe those snapshots. A future UI must cancel stale
requests or recheck the receipt's context against the current query after await;
this helper cannot observe a map selection changed while hashing was underway.

A receipt reports byte/context compatibility only. `geometry_validated`,
`access_verified`, `geographic_coverage_certified` and `release_eligible` stay
false. The payload is deliberately opaque here: a matching digest does not prove
that it is valid GeoJSON, lies within its declared extent or mask, or represents
correct routes, complete competitors, isochrones, reviewed anchors or costs.
It must not be fed into a renderer as an approval result. #137 still requires
independent connector evidence and a different release approver; #138 requires
coverage, exterior-route and competitor reasoning, independent masks and golden
checks. Geometry validation, those gates, a reviewed production bundle and #139's
interaction/export tests remain necessary before public activation.

## Verification

```sh
node --test scripts/test_metro_road_asset_compatibility.mjs
NODE_PATH=/path/to/playwright/node_modules node scripts/check_metro_road_asset_compatibility.cjs
```

The second command runs a local-only HTTP server and actual Chromium WebCrypto.
Set `CHROMIUM_PATH` only when using a separately installed Chromium executable.
It checks four matching directed metric contexts, sixteen mismatch/ambiguity
rejections and mutation isolation, with zero browser errors or unexpected
requests. Node tests additionally cover resource budgets, malformed context and
payload schemas, encoding ambiguity, unauthorized flags and Buffer aliasing.
The read-only CI workflow uses the pinned Playwright 1.56.1 browser/driver pair.
