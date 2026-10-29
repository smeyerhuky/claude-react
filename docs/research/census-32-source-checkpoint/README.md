# Separate 32-source Cheyenne research snapshot

This graph-only snapshot adds Cheyenne to the separately frozen 31-source case.
All 367 qualifying identities remain accounted for;335 are unrepresented in this
snapshot. The same 18 inherited probes produce 2,304 direction/metric/source costs:
2,160 finite native path replays and 144 modeled unreachable results. Cheyenne
has 72 finite costs but wins none of these sampled cases; that observation cannot
exclude it elsewhere. No reviewed urban anchor or access connector is adopted.

Across the 2,232 retained costs,54 improve,2,034 are unchanged and 144 remain
modeled unreachable. Adding Wyoming roads can improve existing-source costs,
independently of whether Cheyenne wins a sampled query. The frozen 26- and 31-source
snapshots are unchanged. Tucson and Wichita remain unsupported model starts;
this says nothing about real-world city accessibility.

The full seven-source ingestion uses the valid −107.4° partition. Protecting all 43
query endpoints and pruning irrelevant leaves leaves 216 shared vertices, above
the unchanged 192-boundary limit. A query-only repartition at −104° assigns all
34,828,277 existing directed weighted pairs exactly once, retains every native
vertex and coordinate and produces 191 shared vertices. It never constructs the
invalid full-source partition at −104°, a flattened weighted road union or a
dense port closure. All 15-million-node/40-million-arc shard limits and the 512-call
oracle limit remain. Cheyenne's selected primitive vertex is1.798 km from its
native Census point; no connector across that gap is verified or costed.

Original-source CI 40931876552 at 487ccc0caa1a37bd43e0fc8fae1213fafcb8b8fc rebuilt
all seven exact inputs without a derived graph cache. Its complete semantic
projection matches the local result exactly. The manifest binds both raw report
hashes; `source-report.json` retains the independent CI report beyond artifact
expiration. The deterministic checker validates source identities, every exact
composed native replay, retained costs, sampled winner accounting, resource
budgets and all false approval flags before comparing the frozen snapshot.

```sh
python scripts/cheyenne_checkpoint.py --check-frozen
python -m unittest discover -s scripts -p 'test_cheyenne_checkpoint.py' -v
python scripts/build_cheyenne_probe_explorer.py --output /tmp/cheyenne.html
node scripts/check_cheyenne_probe_explorer.cjs /tmp/cheyenne.html
```

The optional development inspector exposes this snapshot separately from the
older experiments. Browser checks compare all 2,304 displayed values, all 32
identities and 335 unknown competitors, with zero network requests. Public builds
exclude the inspector even when its development opt-in flag is supplied. The
straight-line map and #137's independent access-evidence gate remain intact.
