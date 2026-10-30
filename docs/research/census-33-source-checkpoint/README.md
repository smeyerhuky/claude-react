# Frozen 33-source, 19-sample research inspector

This separate development snapshot combines the independently audited 33-source
comparison's 18 inherited samples with #216's protected Las Vegas road-node
sample. It preserves all 2,376 inherited costs and adds 132: **2,508 total,
2,356 finite, 152 modeled NoData**, across two metrics and both directions.

The parent raw report remains in `../las-vegas-probe-extension/`; the additional
raw `probe-report.json` is retained here from artifact 12931799402 of successful
original-source CI 40951842923, exact head
`711de65debf6fa8af49245fa7a9257d11e705210`. Its archive SHA-256 was checked against
GitHub's digest. `manifest.json` binds both raw reports and `baseline.json`.
The checker audits the original directed native replays and shared budgets,
then compares the entire regenerated union with the frozen baseline. It does
not infer correctness from snapshot counts or hashes alone.

Run `python scripts/las_vegas_ui_checkpoint.py --check-frozen`, then
`python scripts/build_las_vegas_probe_explorer.py --output /tmp/las-vegas.html`.
The HTML works offline. The browser check compares every one of its 2,508 costs
against the frozen checkpoint, checks NoData and zero self costs, and rejects
network requests. The inspector remains behind the existing development-only
opt-in and iframe sandbox; older views and the public straight-line map remain.

These are graph-only costs among 33 unapproved source leads. All 334 other
qualifying competitors remain unknown. Modeled NoData does not establish
real-world inaccessibility. No urban access anchors are adopted, connector costs
are excluded, and **zero connectors are approved**. The Las Vegas road node's
four zero self costs imply no off-road connection. Its Hollywood Pit access
question is unresolved. Reviewed urban access anchors remain the future
direction, subject to #137's independent access-evidence gate. This snapshot
does not approve geographic coverage, global winners, or road-region release.
