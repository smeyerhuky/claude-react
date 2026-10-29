# Development-only inspector in the metro component

Run the component with an explicit opt-in:

```sh
VITE_METRO_ROAD_RESEARCH=1 npm run dev
```

Open **Metro Population Regions — Interactive Map**, then **Inspect road research
(dev)**. The dialog offers the frozen 26-source road-node experiment and Denver's
separate through-road-start comparison, plus the complete competitor inventory.
All views remain experimental and carry
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
python scripts/build_metro_competitor_explorer.py --output src/research/metro-competitor-inventory.html
```

CI regenerates and compares all three files, strictly lints the new panel and rejects
new lint diagnostics in the existing component. The old component currently has
six unused-variable errors and two hook-dependency warnings; this change adds
none and does not claim a clean global lint run. CI also builds production with
the opt-in flag and rejects research text/checkpoint hashes in shipped JavaScript.
Browser checks cover enabled/disabled development modes, all embedded views,
iframe sandbox, button/Escape closure and exact parent URL/canvas/marker/label
preservation. Existing production map/export visual checks remain applicable.

This is an inspection tool, not an access attestation or approved road artifact
loader. #137, geographic coverage obligations and production road-mode acceptance
remain separate requirements. No connector ledger entry or origin-policy approval
is created by opening the inspector.

The competitor inventory retains all 367 source qualifiers: 26 identities in the
frozen route comparison and 341 unrepresented competitors. It retains the eight
qualifiers absent from the public CSV. These are native Census representative
points, not road nodes or reviewed urban anchors. Blue means membership in the
frozen experiment, including any unreachable cases; it does not mean access or
geographic coverage. Amber means unrepresented, not ineligible or inaccessible.

Filter by investigation status, public CSV membership, name or CBSA; select a
row or keyboard-focusable point for details. Unknown competitors retain the
complete investigation queue's order. Its native-point distance is a scheduling
heuristic rather than a road lower bound or exclusion proof. Investigation is
organized by competitors and evidence, not a declaration that states are complete.
No unfinished Kansas experiment is added to the frozen 26-source counts.

CI checks every displayed native coordinate and identity against the retained
Census domains, all 341 queue identities in order, absent CSV qualifiers, search,
keyboard selection and zero offline-view network requests. It also exercises the
inventory inside the sandboxed component and compares the parent canvas and state
before opening and after closing it. Production excludes this view and its data.

The inventory also distinguishes 14 unrepresented identities with retained
native-point lead scans from the other 327 without those particular scans. These
14 are still part of the same 341 unrepresented route competitors. They include
all first ten queue identities; scanned geometry is not modeled route coverage.
Select a row or point to see per-extract mapped and model-supported ways/gaps,
with the original snapshot identity and report hashes. Cross-border observations
remain separate: Joplin and Kansas City have very different nearest geometry in
Kansas and Missouri. The five new native-point AI reviews display `needs evidence`;
no review result is converted to access approval. Filters never alter the parent
map or its population threshold.
