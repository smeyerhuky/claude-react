# Exact source recovery

`python scripts/fetch_research_source.py --source colorado.osm.pbf --output local-data/colorado.osm.pbf` recovers only a filename in the pinned original-source manifest. It first tries the existing unpublished archive, then the original canonical URL if archive lookup/transfer is unavailable. Every recovered file must match the exact original size and SHA-256 before becoming usable. Existing matching local inputs are reused; corrupt local inputs, conflicting archive records and published/foreign archive identities fail without replacement. No source release is created or published.

The manual **Exact research source recovery** workflow can prime a default-branch Actions cache for the six original routing inputs. This avoids repeating large provider downloads when read-only PR jobs cannot access draft assets. Its cache key depends on those six input names/sizes/hashes, so unrelated archive extensions do not invalidate it. All cached bytes remain untrusted until the same size/SHA-256 checks pass. Cache expiry is an availability issue; the archive and canonical sources remain the recovery paths.

Only manual dispatch gets a repository token able to read the draft originals; PR checks use read-only permissions. The manual job invokes read-only API/download operations and caches only the six public original PBFs, with no credentials or environment files. All six total about 1.3 GB under a 1.5 GB cache-input budget; no graph caps or original-source retention budget changes. Source cache priming is not source publication, access certification or a production release.

## Verify actual bytes from the unpublished draft

The manual workflow also offers `purpose=restore-nevada`; its default remains
`prime-original-cache`.

```sh
gh workflow run research-source-recovery.yml --repo smeyerhuky/claude-react --ref main -f purpose=restore-nevada
```

The restore operation downloads Nevada plus the current revision's manifest,
README and checksum list from the existing unpublished draft. It compares actual
bytes with the pinned repository hashes, verifies all original entries' asset
metadata and checks every asset's content identity remains unchanged. The
`draft-source-byte-restore-verification` artifact contains only a receipt; raw
source bytes are not uploaded or published. A writer job identity is needed to
read draft assets, but all release operations are reads. Byte recovery is never
independent connector/access certification.
