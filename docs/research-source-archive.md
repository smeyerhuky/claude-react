# Pinned research original-source archive

The fixed manifest at `scripts/research-source-snapshots/co-nm-az-20261027.json`
records exact CO/NM/AZ/UT/OK OpenStreetMap bytes with common replication timestamp
2026-10-27T21:23:59Z, Census 2025 population/CBSA/state/county/area-water archives,
the Colorado Gazetteer, all five Denver-area county water files used by the
preserved regression, and the unchanged public CONUS CSV. The nineteen original
files cover current coupled routing, all four geography test areas and the
Oklahoma resource preflight.
Source URLs, sizes and SHA256 values identify
each original input. The filename `population.xlsx` preserves the exact official
`cbsa-met-est2025-pop.xlsx` bytes.

The manual **Pinned research source archive** workflow retains these inputs in
the existing draft `research-sources-20261027-co-nm-az-v1` (release ID 426327474).
PR checks validate the inventory and small remote checksum probes with read-only
permissions. Only manual dispatch receives a scoped repository Actions token to
upload assets. It verifies every source hash and size, then each GitHub asset's
reported SHA256, state and size. Existing identical assets are reusable; changed
assets fail rather than being overwritten. The workflow requires the release to
remain draft before every upload and never publishes, creates or replaces a
release. No extra secret values are required.

This retains original bytes beyond short-lived derived CI artifacts and mutable
`latest` URLs. Changed upstream bytes must fail; acquire the exact archived asset
or separately review/version a new snapshot rather than rewriting a checksum.
`SHA256SUMS-v4` and `source-manifest-v4.json` accompany the complete inputs.
Revision 3 added Utah and dated provider URLs; revision 4 adds the Oklahoma
resource-preflight input. The collection retains
its original tag so existing recovery links remain valid. All three earlier revisions
and their metadata assets are retained unchanged;
new metadata filenames prevent overwriting earlier checksums or documentation.
Archive metadata
is not access evidence, a coverage certificate or a production release manifest.
The draft is intentionally unpublished; authorized repository writers can inspect
or retrieve it. Publication is a separate owner action.

Authorized writers can recover the exact inputs without the old workspace:

```sh
gh release download research-sources-20261027-co-nm-az-v1 \
  --repo smeyerhuky/claude-react --dir local-data/pinned-20261027
cd local-data/pinned-20261027
sha256sum -c SHA256SUMS-v4
```

## Source attribution and rights

OpenStreetMap data © OpenStreetMap contributors, available under the
[Open Database License 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
See [OpenStreetMap copyright and attribution](https://www.openstreetmap.org/copyright).
Unmodified extracts are supplied by [Geofabrik](https://download.geofabrik.de/).

Census inputs are official U.S. Census Bureau TIGER/Line and population source
files; exact URLs and hashes appear in the manifest. Retention does not imply
government endorsement or complete hydrology, independent ground truth or datum
accuracy. The CSV is the repository's existing derived CONUS inventory.

All release/access/global/coverage flags remain false. #137 independent physical
and legal connector review and a different release approver remain required.
No source is excluded, no connector is self-certified, and no public map, road
beta or environment publication is enabled by this archive.

Revision 4 adds the exact Oklahoma PBF used only for the bounded raw-node
resource counterexample. It does not add Oklahoma roads to routing. Earlier
v1/v2/v3 metadata names and every earlier original asset remain retained; this
revision uses fresh v4 metadata names and never publishes the draft.
