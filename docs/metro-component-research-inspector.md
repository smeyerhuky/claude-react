# Development-only inspector in the metro component

Run the component with an explicit opt-in:

```sh
VITE_METRO_ROAD_RESEARCH=1 npm run dev
```

Open **Metro Population Regions — Interactive Map**, then **Inspect road research
(dev)**. The dialog offers the frozen 26-source road-node experiment and Denver's
separate through-road-start comparison. Both views remain experimental and carry
unapproved-access warnings. They are fixed research results: changing the map's
population threshold, custom CSV, selected metro or pins does not change them.
They never render geographic ownership regions or activate production road mode.

The inspector requires both Vite development mode and the opt-in flag. Production
builds remove the lazy panel and embedded research data even if that flag is set.
The existing straight-line canvas, geography, controls, share state and PNG export
paths are unchanged. The dialog uses an iframe with `allow-scripts` only; it does
not grant same-origin access to the parent component. Native modal close/Escape
behavior returns to the map without changing its state or canvas pixels.

The embedded HTML is generated from the separately pinned research checkpoints:

```sh
python scripts/build_metro_probe_explorer.py --output src/research/metro-census-probes.html
python scripts/build_denver_waypoint_explorer.py --output src/research/denver-waypoint-comparison.html
```

CI regenerates and compares both files, strictly lints the new panel and rejects
new lint diagnostics in the existing component. The old component currently has
six unused-variable errors and two hook-dependency warnings; this change adds
none and does not claim a clean global lint run. CI also builds production with
the opt-in flag and rejects research text/checkpoint hashes in shipped JavaScript.
Browser checks cover enabled/disabled development modes, both embedded views,
iframe sandbox, button/Escape closure and exact parent URL/canvas/marker/label
preservation. Existing production map/export visual checks remain applicable.

This is an inspection tool, not an access attestation or approved road artifact
loader. #137, geographic coverage obligations and production road-mode acceptance
remain separate requirements. No connector ledger entry or origin-policy approval
is created by opening the inspector.
