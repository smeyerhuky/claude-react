# Northern Colorado native path witnesses

This is a research experiment over an intentionally incomplete supported road
subset, **not** a public road-distance layer, a statewide graph, an anchor adoption
or an independent access approval. The public straight-line map, ten older
inspector views and historical 2,508-cost checkpoint retain their existing models.

The exact retained Colorado OpenStreetMap PBF is scanned three times. All complete
motorway/trunk/primary/secondary ways (including links) with a native node in
`[-105.20, 40.34, -104.60, 40.67]` are selected as potential travel roads. Every
restriction/connectivity/restriction-prefixed relation in that extract touching
any selected way is collected, with its entire member-way geometry and tagged
member nodes. Context extends beyond the window when a whole way or restriction
requires it; the rectangle is not a closed geographic coverage certificate.
Missing members, duplicate identities and exceeded budgets stop the experiment.
The PBF is fingerprinted before and after extraction.

The existing typed permission/posted-speed implementation evaluates each whole
way under the fixed **2026-10-28T18:00:00Z** solo-car scenario. America/Denver is an
explicit research assignment, not a certified geographic timezone join. Unknown
way controls remain unsupported. Every travel way belonging to a restriction
that cannot be completely compiled or whose member weights are unsupported is
quarantined. A rejected combined constraint set stops the run without dropping
rules or producing a partial result. Existing small-graph admission budgets and
all prior frozen experiments are unchanged.

A separate projection preserves the original maneuver language on the retained
arc subset. In particular, an ONLY turn requiring an omitted exit must not allow
a different internal turn. The retained prefix is constrained and all internal
departures at its terminal node are prohibited; ending a path there is allowed
under the existing solver's terminal-prefix policy. An independent exhaustive
walk oracle checks the projection over every subset of a small graph. Unsupported
interactions that the existing solver cannot represent fail closed.

Five **unadopted** road-node hypotheses are selected on named US 287 and US 34
Business streets in Fort Collins, Loveland and Greeley. Selection uses an interior
vertex with no node tags, nearest a declared context point within 750 meters,
then checks membership in the retained Census principal-city polygon. Context
point displacement is **not** a connector length or an access attestation. The
Greeley selections are hundreds of meters from their context points; no claim
that these are appropriate final destinations follows. Starts have no incoming
approach history. No off-road connector, garage access or anchor-set policy is
adopted by this experiment.

Forty ordered, non-self queries cover both metrics. Twelve have finite witnesses
between the Fort Collins and Loveland hypotheses; 28 have no witness in this
subset, including every query involving Greeley. Those 28 are **unresolved**, not
real-world unreachable or modeled NoData. No finite path implies a uniform
30-kilometer incumbent bound for arbitrary destinations or an entire window.
The retained weak-component diagnostic puts the three Fort Collins/Loveland
hypotheses in one 16,340-node component; Greeley's two hypotheses are in separate
226-node and 233-node components. These are properties of the retained subset,
not independent geographic or physical connectivity evidence.
Each finite path is independently checked against the **original**, preprojection
NO/ONLY rules, directed arc continuity, endpoint IDs, immediate-reversal policy
and exact rational sum of stored binary costs. Costs use meters and seconds;
they exclude connectors, traffic, waiting and arrival-time access reevaluation.
They are not globally shortest certified routes or physically verified access.

`report.json` retains source and implementation fingerprints, deterministic native
candidate selections, unsupported/quarantine accounting, ordered raw arc IDs,
exact costs, solver diagnostics and explicit research-only flags. Full regional
raw context, graph archives, original PBFs and environment configuration remain
outside the repository and artifact. Fresh source replay reconstructs them in
memory and compares the complete derived report:

```sh
python scripts/northern_urban_path_checkpoint.py --osm /path/to/colorado.osm.pbf
```

Install the workflow's pinned osmium, networkx and tzdata versions and its geometry
and workbook dependencies first. `--write` explicitly regenerates the retained
report. A read-only PR workflow recovers the existing hash-bound source cache,
runs independent negative tests, performs the original-source replay and retains
only this README and the derived report as its artifact.

Zero connectors are approved. No anchors are adopted. Independent factual access,
full destination attachment, complete principal-city anchor sets, geographic
coverage, exterior competition and land/water validity remain release gates.
The user's previously recorded release authorization does not supply unresolved
physical or legal facts. Research-routed leads remain 33 of 359 displayed metros;
this experiment does not add a verified metro to that count.

Derived OSM records: © OpenStreetMap contributors, available under the
[Open Database License](https://www.openstreetmap.org/copyright).
