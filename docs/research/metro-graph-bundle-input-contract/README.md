# Research graph-bundle input contract

This contract separates **eight original OSM files** from the **33 native metro
origins** in the frozen 19-sample checkpoint. It is an input-accounting step
toward the separately reviewed multi-source bundle contract required by #139.
It installs no production loader, changes no graph, and cannot unlock #137's
single-OSM-file approval gate. Do not pass a manifest as the OSM file to that gate.

`bundle.json` binds the sorted source names, SHA-256 values, byte counts and
replication timestamps, plus the exact graph model, retained compiler/dependency
policy, native origin records, domain inventory and endpoint set. Four retained
input files have repository-local byte fingerprints. The historical scenario
identity stays separate from the fixed-departure scenario: these 2,508 costs
(2,356 finite, 152 modeled NoData) were not evaluated under that newer scenario.
No anchor policy, connectors or zero connector costs are inferred from graph-only
costs. All four metric/direction contexts retain their units and distinct labels.

`report.json` reproduces the bundle against the independently retained checkpoint
and fingerprints the contract/checkpoint code and empty approval ledger. It
reports metadata verification only: `source_bytes_verified` is false. Successful
retained-input or canonical-hash checks do not imply that original PBF bytes were
read, headers replayed, the graph rebuilt, timestamps independently corroborated,
source snapshots synchronized, topology reconciled or geographic coverage proven.
These checks do not adopt anchors or certify current legal/physical vehicle access.

## Verification

```sh
python scripts/metro_graph_bundle_checkpoint.py
python -m unittest discover -s scripts -p test_metro_graph_bundle_contract.py -v
```

The canonical bundle digest is in the separately retained `report.json`. Select
that expected digest independently; do not compute an expected digest from an
untrusted incoming manifest and treat the resulting self-consistency as identity
verification. Query consumers must also supply their independently selected
graph/origin/domain/endpoint bindings and scenario, metric and direction.

The optional CLI verifies original file bytes only when every declared file is
present in one selected directory:

```sh
python scripts/metro_graph_bundle_contract.py \
  docs/research/metro-graph-bundle-input-contract/bundle.json \
  --expected-sha256 EXPECTED_DIGEST_FROM_RETAINED_REPORT \
  --source-dir /path/to/exact-original-extracts
```

A missing original, size mismatch, same-size content alteration or escaping
symlink prevents a success result. Complete preflight precedes streaming hashes.
A successful byte check reports no header replay or graph rebuild and still
cannot authorize access or release. It describes the bytes read during that
check; a later graph build must bind its own inputs to those exact fingerprints.
The frozen report never upgrades itself based on a local invocation.

Validation rejects duplicate JSON keys, unknown fields, unsafe paths, duplicate
source names/content identities, unsupported timestamps, noninteger or oversized
inputs, unbounded manifests and mixed query identities. Limits are explicit:
64 sources, 64 GiB per source, 2 TiB total and 1 MiB of manifest JSON. Input
verification uses bounded-memory reads; limits do not claim a graph of that size
can fit a routing solver's memory or shard budget.

All approval flags remain false. #137 still requires independent current access
evidence and a different release approver; #138 requires geographic coverage,
exterior-route and competitor closure, masks and independent checks; #139 requires
reviewed compatible region assets and UI validation. Zero connectors are approved,
no anchors are adopted, and the public straight-line map and older inspector views
remain untouched. Raw extracts, private archives and environment configuration are
not included in this artifact. No additional metro is routed by this contract.
