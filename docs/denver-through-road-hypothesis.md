# Separate Denver through-road waypoint experiment

`denver-wynkoop-17th-through-road-hypothesis-v1` asks how much graph-only route
cost changes when the Denver graph start is the independently located municipal/
OSM road junction at 17th and Wynkoop instead of the preserved Census-origin road
lead. It is an explicit research hypothesis, not adoption of a production anchor.

The station pickup candidate remains a separate unresolved proposal. A through-
road waypoint means reaching a modeled road node; it grants no right to stop,
park, enter a curb lane or cross a bicycle lane. The experiment does not invent a
zero-cost physical connector or replace the original Census representative point.
Both start locations remain unapproved, and off-road connector costs are excluded.

The two scenarios are:

- Preserved Denver Census research lead: node 6350018589, with its original native
  Census origin retained in the record.
- Hypothetical through-road graph start: node 3033992180 at
  [-104.9997276, 39.7528388], corresponding to the municipal junction located in
  the [Denver evidence audit](research/denver-urban-anchor/README.md). The 1.897 m
  municipal/OSM displacement is a data discrepancy, not a connecting path length.

The fixed target probes are the retained Boulder, Colorado Springs, Denver, Fort
Collins and Pueblo road-lead nodes. Each scenario is evaluated against all five
for distance and modeled time, in both directions: forty explicit cases. Every
finite result is replayed on the directed CSR arcs with exact rational sums of
stored binary64 weights and a hash of the actual direction's OSM node sequence.
Unreachable cases remain explicit null results; no endpoint may be dropped or
moved. Synthetic tests compare all directions/costs/path hashes with an independent
NetworkX oracle and reject missing/moved/duplicate endpoints.

The graph is built only from the exact dated Colorado PBF. Results are not the
five-state costs from the separately preserved Census experiment: exterior routes
may be missing. This experiment makes no competitor-winner claim. It changes no
eligibility inventory and excludes no metro from any production calculation.
The report binds PBF metadata, municipal evidence and Census checkpoint identities,
metrics/units, graph model/caps and endpoint coordinates. Static turn restrictions,
legal/physical access and geographic coverage remain unresolved.

Reproduce:

```sh
python scripts/denver_waypoint_hypothesis.py --osm colorado.osm.pbf --output report.json
```

The read-only `Denver through-road waypoint hypothesis` workflow downloads the
exact dated input and runs the same checks. No approval ledger, release verifier,
public map, existing Census scenario or dependency changes are involved.
