# Complete remaining competitor investigation queue

This is an explicit inventory of all 341 qualifying source identities still
unrepresented in the preserved 26-source experiment. No identity is removed,
including the eight source qualifiers absent from the public CONUS CSV. Every
row remains `unknown_competitor` with unverified access. Counts are inventory
counts, not geographic coverage percentages or state completion.

For scheduling only, the queue sorts native Census representative points by
spherical distance to the nearest of the existing eighteen road-node probes.
CBSA ID breaks ties. The first ten are Wichita Falls, Joplin, Wichita, Fort Smith,
Fayetteville, Sherman-Denison, Amarillo, Dallas-Fort Worth, Abilene and Springfield.
These are statistical points, not urban anchors. A large CBSA domain, a different
reviewed anchor or an exterior route may change which competitor matters most.
No distance here is a certified road bound or reason to exclude a competitor.

The queue binds the population/domain bytes and frozen Census checkpoint by
SHA-256. Reproduce with:

```sh
python scripts/metro_competitor_review_queue.py --output queue.json
```

Read-only CI reproduces the committed queue byte for byte and checks complete
identity accounting, duplicate/missing domains, unknown competitors and invalid
coordinates. Investigation should use exact dated raw sources and resource
preflight before extending graph partitions; a state's presence in a source
bundle never means all its competitors or geography are covered.
