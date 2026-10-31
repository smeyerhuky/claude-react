# Frozen principal-city source-work inventory

This development-only snapshot accounts for all **698 official principal-city memberships across 367 qualifying metros and 52 jurisdictions**. It joins retained city-source batches by exact city FIPS and CBSA. State grouping follows the principal city's official state, which can differ from the state containing the metro's Census representative point. Washington, DC therefore retains its principal-city membership even though the separate native-point work queue has no DC representative points.

Current work accounting:

| Status | Memberships | Meaning |
| --- | ---: | --- |
| Context retained | 44 | A source context or prior review record is registered; no vehicle entry is certified |
| Selected publication unavailable | 6 | A selected publication could not be inspected; no search snippet is promoted |
| Not recorded here | 648 | No city-source record is registered in this inventory; this does not mean no evidence exists |
| Approved anchors | **0** | No reviewed anchor set is adopted; zero connectors are approved |

The 50 registered work records cover Colorado (12), New Mexico (4), Arizona (16), Utah (8), Oklahoma (3) and Kansas (7). Colorado's prior contexts and Denver AI proposal remain distinct from new publication observations. The four New Mexico context files map explicitly to its four official principal cities; no metro-title splitting or inferred additional city membership occurs. A named building, public parking description, modeled road lead or retained AI proposal is not a reviewed vehicle connector.

`report.json` binds the official Census workbook/domain inventory, exact retained records, source manifests, approval ledger and relevant projection/checker code. State batches run their existing validators before projection. New state batches require registering their checker and regenerating this snapshot; they cannot silently disappear from the UI. The independent approval ledger must remain empty for this version. Changing it requires independent review and a new inventory version, not an automatic status upgrade.

The report never adopts an anchor, writes a connector or computes a road cost. All city access-review statuses remain unresolved. Every state's release eligibility remains false, including a state with no registered context. Missing required members of a future reviewed anchor set must remain unknown rather than being dropped from the nearest-anchor calculation. #137's separate approver, #138's coverage work and #139's artifact gate remain open.

## Offline explorer and development inspector

```sh
python scripts/principal_city_source_work.py
python -m unittest discover -s scripts -p test_principal_city_source_work.py -v
python scripts/build_principal_city_source_explorer.py --output /tmp/principal-sources.html
cmp /tmp/principal-sources.html src/research/metro-principal-sources.html
NODE_PATH=/path/to/playwright/node_modules node scripts/check_principal_city_source_explorer.cjs /tmp/principal-sources.html
```

The generator verifies the frozen report before rendering. The standalone HTML embeds all data, uses no external scripts, styles, images or requests, and prohibits network resources through its content-security policy. Its filters cover every city state and source status. City details disclose the source kind, retrieval method, primary URL as selectable text, observations, limitations, retained record path and SHA-256. No external page is opened automatically. Source text is encoded into JSON and rendered through `textContent`, never executable HTML.

The development inspector adds this as a seventh view, opt-in only, with its existing `allow-scripts` iframe sandbox. All six older experiments remain available. The planned fixed-reference assumptions remain explicitly unapplied to the frozen experiments. Production builds exclude the new HTML, schema marker and inspector even when the research flag is set. Browser checks cover all 52 city-state groups, all status counts, separate Lehi/Orem/Provo records in one CBSA, keyboard selection, empty searches, no external requests, all older views and unchanged public map state/canvas.

The 2,508-cost checkpoint remains 2,356 finite costs and 152 modeled NoData, with no connectors or adopted urban anchors. Those costs have not been evaluated under the fixed-reference scenario. Source-work accounting is not current legal/physical access, geographic coverage or public road-tab readiness. No environment configuration or private source archive is included.
