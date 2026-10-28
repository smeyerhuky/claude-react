# Kansas and Texas: raw origins and bounded addition-shard preflight

The exact dated extracts share replication timestamp 2026-10-27T21:23:59Z with
the existing five states. They remain research inputs, not coverage certificates.

The supported-highway node-ID counter completed Oklahoma at 4,016,550 nodes and
Oklahoma plus Kansas at 7,308,146. Adding Texas encountered a 15,000,001st node
on way 21937580, node 236399841 at [-98.2076764, 32.6353546]. The Texas pass stopped
there, so the union count is a **lower bound**, not a complete inventory. No road
matrix was built and the 15-million-node cap was not raised. This establishes a
necessary resource failure for that specific combined addition shard; it says
nothing about real-world access or state completeness. An Oklahoma/Kansas shard
still needs arc, raw-overlap and routing-interface checks before use.

Complete raw-highway scans investigated five explicit native Census origins in
each new extract. Nearest model-eligible polyline gaps were:

| CBSA / metro | Gap (m) |
| --- | ---: |
| 28140 Kansas City | 13,042.69 |
| 29940 Lawrence | 291.92 |
| 31740 Manhattan | 392.18 |
| 45820 Topeka | 192.70 |
| 48620 Wichita | 160.03 |
| 10180 Abilene | 61.86 |
| 11100 Amarillo | 118.47 |
| 19100 Dallas-Fort Worth-Arlington | 31.92 |
| 43300 Sherman-Denison | 188.72 |
| 48660 Wichita Falls | 1,119.08 |

These are unapproved geometry leads, not graph source additions, legal/physical
connectors or independently reviewed urban anchors. In particular, Kansas City's
statistical origin is far from the selected Kansas-extract lead; no multi-state
CBSA is declared represented merely because geometry was found within 25 km.
All ten remain in the 341-identity unknown-competitor inventory until a separately
versioned routing experiment includes them. No exclusions or native point moves.

The source hashes, sizes, timestamp and first stopping witness are retained in
`node-preflight.json`; the complete raw scan reports bind each PBF and Census CSV.
Read-only CI reproduces all three reports from the exact dated inputs. Archive
revision 5 adds both PBFs to the existing unpublished draft, preserving all prior
assets and metadata. The aggregate archive budget becomes 2.2 billion bytes for
2,142,116,765 bytes of originals; individual assets remain below 2 billion bytes.
This archival budget is separate from unchanged road-graph node/arc caps.

Next routing investigation: test the Oklahoma/Kansas addition shard against the
preserved four-state prefix, verify raw overlaps and interface budgets, preserve
all 26 old source identities, and keep any new experiment separate from the
frozen Census baseline. Texas needs a different bounded partition design.
