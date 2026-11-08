# Exact source recovery

`python scripts/fetch_research_source.py --source colorado.osm.pbf --output local-data/colorado.osm.pbf` recovers only a filename in the pinned original-source manifest. It first tries the existing unpublished archive, then the original canonical URL if archive lookup/transfer is unavailable. Every recovered file must match the exact original size and SHA-256 before becoming usable. Existing matching local inputs are reused; corrupt local inputs, conflicting archive records and published/foreign archive identities fail without replacement. No source release is created or published.

The manual **Exact research source recovery** workflow can prime a default-branch Actions cache for six or eight exact original routing inputs. This avoids repeating large provider downloads when read-only PR jobs cannot access draft assets. The default six-input cache key is unchanged. The explicit eight-input scope additionally binds Wyoming and Nevada; unrelated archive extensions do not invalidate either scope. All cached bytes remain untrusted until the same size/SHA-256 checks pass. Cache expiry is an availability issue; the archive and canonical sources remain the recovery paths.

Only manual dispatch gets the existing repository identity able to read draft originals; PR checks use read-only permissions. The manual job invokes read-only API/download operations and caches only the selected public original PBFs, with no credentials or environment files. Checkout credentials are not persisted. The six-input budget remains 1.5 GB; the eight-input budget is 1.7 GB for 1,504,347,559 pinned bytes. No graph caps or original-source retention budget change. No original bytes enter an artifact or published release. Source cache priming is not source publication, access certification or a production release.

Select `prime-eight-original-cache` on the manual workflow to recover the complete
eight-input set on the default branch. Eight-source consumers select
`cache_key(manifest, scope='eight')`; six-source consumers retain the unchanged
default. Missing or duplicate entries, unsupported scopes and aggregate budget
violations fail closed. A six-input cache never claims to contain eight inputs.

```sh
gh workflow run research-source-recovery.yml --ref main -f purpose=prime-eight-original-cache
```

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
