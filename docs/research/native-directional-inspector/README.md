# Native directional bounds in the development inspector

The existing development-only inspector gains a tenth view: **Fort Collins
native directional bounds — conditional model**. All nine older views and their
frozen source data remain unchanged. The new standalone HTML uses the merged
four-query checkpoint and its retained 294-node source geometry; it performs no
browser routing or network requests.

Select forward/reverse and distance/time independently. The view shows the
supported witness, exact first-exit margin, all four rounded costs, directed raw
segments, every first-exit screen row, source/scenario/report fingerprints and
the inherited completion domain. A focused witness viewport and a full retained
geometry view are available; enabling the exit overlay shows the full context.
Unknown gate/whole-way turn geometry is amber dashed and never drawn as a
supported blue witness. All exact path/cost identities are checked before HTML
is generated. Names are script-escaped and rendered with textContent.

```sh
VITE_METRO_ROAD_RESEARCH=1 npm run dev -- --host 0.0.0.0
```

Open `/claude-react/#/metro-population-voronoi`, click **Inspect road research
(dev)**, then select the new view. Without the opt-in flag the inspector stays
absent. Production excludes the inspector and its data even when that flag is
set. The generated `src/research/metro-native-directional-bounds.html` can also
be opened directly as a standalone offline file.

```sh
python scripts/build_native_query_explorer.py --output /tmp/native-bounds.html
cmp /tmp/native-bounds.html src/research/metro-native-directional-bounds.html
python -m unittest discover -s scripts -p test_native_query_explorer.py -v
node scripts/check_native_query_explorer.cjs src/research/metro-native-directional-bounds.html
python scripts/las_vegas_ui_checkpoint.py --check-frozen
```

The browser check requires Playwright and Chromium; CI installs an isolated
driver. `PLAYWRIGHT_CHROMIUM_EXECUTABLE` can select an existing local browser.
Checks cover all four paths/costs, exact evidence, unknown controls, all 47 exits,
offline operation and mobile layout. The integrated browser test retains every
old view, checks opt-in/sandbox/keyboard closure and compares the public map's
state and canvas byte for byte before and after the inspector is used. Production
build checks reject inspector text, schema or source fingerprints in emitted JS.

This view presents conditional native-node model evidence. The 107-way strict
graph remains unsupported at its unchanged 100-way limit. It shows 603 outer
source nodes as uninspected; it approves no actual road access, connector,
anchor, geographic mask or public road layer. Independent access review and a
different release approver (#137), coverage/competitor/mask checks (#138) and
public assets/UI release (#139) remain required. All 2,508 older Census costs and
public straight-line behavior stay unchanged. No source PBF, private archive,
municipal page body or environment configuration is published. OSM-derived
records retain attribution to OpenStreetMap contributors under ODbL.
