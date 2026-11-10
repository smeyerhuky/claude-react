# Dated northern site imagery context

Five existing native-road hypotheses now have a reproducible historical overhead review. Three individual USDA NAIP scenes, served through Microsoft's Planetary Computer catalogue and crop API, report acquisition on **September 25, 2023**, at **0.3 m** source resolution. The reported 16:00 UTC timestamp is catalogue metadata, not a claim of exact aircraft exposure time.

Every requested crop spans 192 m × 192 m in the native projected grid, 640 × 640 pixels, north up in native EPSG:26913. Requests explicitly select the individual scene and red/green/blue bands, with nearest-neighbor resampling and a validity mask. A scene must cover the entire requested window; every output pixel must be valid. Selecting a tile merely because it contains the center is insufficient: an initial Greeley 10th Street selection crossed a tile edge. The retained covering scene avoids that defect, and a regression test rejects it.

`items.json` retains complete public individual-scene metadata. `manifest.json` binds original response hashes, canonical item hashes, decoded RGBA hashes, exact unsigned request URLs and the existing agency/native/witness checkpoints. `review.json` records Codex's visual observations bound to each candidate, scene, acquisition and pixel hash. `report.json` reproduces those bindings and explicit limits. These are analyst observations, not an independent human approval or a new access certification. Original pixels remain outside the repository and CI artifacts.

The crops show paved surfaces at the registered positions, with vehicles and markings nearby. This provides historical physical context beyond road-name proximity. Overhead views cannot establish surveyed grade, present barriers, legal turns, ordinary-car permission, clearance or October 2026 conditions. The existing NAD83/WGS84 operation's stated 4 m accuracy is **not** a worst-case error bound. Registration is not an approved attachment or a connector cost.

The federal USGS NAIP Plus service initially examined here returned primary scenes dated August 2019; its service-refresh timestamp was not substituted for acquisition. County services labelled 2024/2025 were not treated as dated imagery without acquisition metadata. No newer/current-condition claim is made.

Reproduce the five small crops and audit, without downloading full GeoTIFFs:

```sh
python scripts/northern_site_imagery.py --original-dir /tmp/northern-site-originals --download
python -m unittest discover -s scripts -p test_northern_site_imagery.py -v
```

Use Pillow 12.3.0 and pyproj 3.8.0 / PROJ 9.8.1 for the retained native request coordinates. The source replay permits different PNG compression only when every decoded RGBA pixel is identical; both wire hashes and decoded hashes remain recorded. Any changed primary metadata or pixels stops replay rather than refreshing a snapshot automatically. Fresh originals stay in runner temporary storage; the artifact contains only the five retained documentation files and fresh source receipts.

This checkpoint adopts no anchors, approves no connectors and certifies no geographic coverage. It changes no costs, source graph, fixed departure scenario, inspector view or public-map behavior. Historical 2,508 / 2,356 / 152 counts remain intact. The future public road tab still needs complete reviewed principal-city anchor sets, access evidence, geographic/competitor/mask verification and release-compatible assets.

Sources: [USDA NAIP programme](https://www.fsa.usda.gov/programs-and-services/aerial-photography/imagery-programs/naip-imagery/), [NAIP catalogue](https://planetarycomputer.microsoft.com/api/stac/v1/collections/naip), and individual scene/crop URLs in the manifest. Native-road positions originate in OpenStreetMap, © OpenStreetMap contributors, under ODbL 1.0, as bound by the parent checkpoint; image registration does not amend that source.
