# Separate 31-source Census regression checkpoint

This snapshot freezes the six-state, 31-source boundary-label experiment. It does
not replace the 26-source/five-state checkpoint or adopt reviewed urban anchors.
All 18 raw-node probes are inherited. Every source origin, unapproved lead,
source-input identity and exact replayed case cost is retained separately.

[Source CI 40805773428](https://github.com/smeyerhuky/claude-react/actions/runs/40805773428)
at `33e00e8c9abc60ccd7b464ab656e8365a4e03d88` computed 2,232 cases and replayed
2,088 finite native paths. Its semantic projection matches the local source run
exactly. Of 1,872 old cases, 1,678 are unchanged, 122 improve and 72 stay
unreachable; no finite route is lost or increased. Runs use 259–279 local calls,
including replay, within the 512-call cap. No dense road union/port closure is
constructed. Original shard limits and the original 128-port oracle remain intact.

The 144 unreachable cases concern two selected research starts: the retained
Tucson lead and Wichita's six-node service-way component. Wichita remains in the
source identity inventory. Its outward ways are tagged `access=no` and excluded
by the unchanged filter; missing access tags on the internal service way do not
prove public entry. See the [raw component evidence](../wichita-model-lead-negative.json)
and [AI review](../connector-reviews/wichita-census-lead.json). This is a model
candidate rejection, not a claim that either metro is inaccessible or ineligible.

All sampled subset winners stay unchanged. These inherited probes do not bound
winners elsewhere, close any state, or establish that new or omitted competitors
are irrelevant. There are 367 qualifiers and 336 unrepresented identities in this
specific comparison. Every lead and all access/release/global/geographic flags
remain unapproved/false. Geographic regions, connector costs, turn/grade fidelity,
exterior completeness and datum alignment remain unresolved. #137 is unchanged.

`baseline.json` is the semantic projection, bound by `manifest.json`. It excludes
machine timing/RSS while retaining precise input/case/source identities and exact
binary64 replay fractions. `report-audit.json` retains real source-run metadata
for schema and malformed-input tests without duplicating the native path legs.
Those tests do not replace source replay or independently certify real access.
The source workflow reruns the exact six inputs and compares the full semantic
projection against this separately versioned reference.

The development inspector offers this 31-source snapshot alongside the original
26-source experiment, Denver comparison and explicitly labeled 26-source
competitor inventory. Production excludes the inspector/data even with its opt-in
flag. The public straight-line map, its exports and existing source CSV are unchanged.

Original OSM inputs are retained in unpublished source archive revision 6;
© OpenStreetMap contributors, ODbL 1.0. Population/domain identities remain bound
to the existing official Census 2025 sources. No source release or cloud
environment was published.
