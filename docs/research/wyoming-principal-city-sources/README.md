# Wyoming principal-city source context

Cheyenne (5613900, CBSA 16940) is Wyoming's one principal-city membership in this retained qualifying inventory. No additional city is inferred from population, geography or a familiar metro name.

The [official police parking FAQ](https://www.cheyennepd.org/Services/Parking/Parking-Frequently-Asked-Questions) names Cox Parking Structure, Jack R. Spiker Parking Structure and the East Lot at East 17th Street and Warren Avenue. It describes two free hours followed by a flat charge or monthly permit option. Street time limits, designated back-in angle locations and the overnight street-parking answer have separate scopes. The street overnight answer does not establish unrestricted overnight access to every garage or reserved space.

Captured directly over HTTP on 2026-10-31 UTC. The record retains a short quote, factual observations, primary URL and original response identity; full HTML and runtime state are omitted. Capture hashes identify response bytes not retained in the derived record. The manifest binds the exact official Census inventory and retained record bytes.

```sh
python scripts/wyoming_principal_city_source_screen.py
python -m unittest discover -s scripts -p test_nevada_principal_city_source_screen.py -v
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The shared scope tests include Wyoming and reject rehashing the street answer into garage approval. These are source-interpretation checks, not audited real-world connector fixtures or independent certification. Cheyenne's exact vehicle entry, clearance, grade, directional maneuvers and connector costs remain unresolved. No anchor or Census-origin replacement is selected; the old 1.798 km origin-gap disclosure and frozen graph experiment remain unchanged. The source-work inventory registers one context, with zero approved anchors or connectors and every release gate intact.
