# Fixed reference-time road model: policy contract and disclosure preview

The user selected a fixed-time approximation for the eventual road tab and asked
for its assumptions in a map info tooltip. The initial research reference is
**2026-10-28 at 18:00 UTC**, or **noon MDT in Colorado**, close to the pinned
October27 OSM snapshot. This date/time is an explicit modeling choice, not a
claim that every source or road condition was independently inspected then.

Every controlled feature uses that same absolute instant, converted through an
explicit IANA timezone. This is not a different local noon everywhere: Phoenix
is 11 a.m., New York 2 p.m. and Honolulu 8 a.m. at the same instant. Unknown timezone
assignment is unsupported. Conversion reads the declared tzdata2026.5 / IANA2026e
package files directly; it does not silently use the host's timezone database or
current clock.

Access is **frozen at the reference instant for the whole modeled route**. This
is a static reference-snapshot approximation, not an arrival-aware, time-dependent
itinerary. Traffic, waiting and changes in access during the journey are not
modeled. A real trip can encounter different conditions before arrival. Free-flow
travel time is modeled time, not a forecast or navigation promise.

The profile is an ordinary private passenger car with one occupant, no special
permits or HOV exemption, and tolls allowed. Height, width, length and mass are
not yet specified: clearance-controlled edges remain unsupported until a reviewed
dimension profile is supplied. Unknown conditional controls must remain unsupported,
not assumed open. This policy does not implement the conditional evaluator or
change any existing road filter.

## Planned map disclosure

The development inspector has a keyboard-accessible disclosure preview, clearly
marked **Not applied to the frozen experiments**:

> Reference: 28 Oct 2026, 12:00 MDT (18:00 UTC). Solo passenger car. Access is frozen at that instant; free-flow time excludes traffic and waiting. Conditions may change before arrival. Vehicle, reviewed-anchor and coverage limits apply; unsupported areas remain transparent.

This is planned copy for future audited road assets. It is not a public road mode
or a claim about current frozen costs. The preview remains inside the existing
development opt-in; production removes the entire panel, even with the flag set.

## Exact cost namespace

Canonical scenario JSON has its own SHA-256. The anchor-set research cost contract
is versioned to **v2** and requires that exact scenario identity in the query and
every anchor cost row, in addition to the registry, CBSA, graph bundle, sample,
metric, direction and units. Mixed scenarios reject before a minimum can be
reported. Changing the reference instant creates a different cost namespace even
if the road geometry and sample are identical.

The existing33-source/19-sample checkpoint was **not rerouted** under this policy.
Its2,508 costs,2,356 finite and152 modeled NoData retain their old model identity.
The explicit old-checkpoint-evaluated flag remains false. No anchor or connector
is adopted, no evidence approval is generated and all release/access flags are false.
#137's independent evidence and separate approver gate remains unchanged.

Eight scenario tests cover regional local clocks, time/identity mixing, rejected
permits/exemptions/dimensions/approvals, invalid UTC references, unknown/pathlike
zones, host-clock independence, disclosure limits and timezone version mismatch.
Seven anchor-set tests remain applicable. UI checks verify the preview's keyboard
disclosure, unchanged older views, unchanged map state/canvas and production exclusion.

```sh
python -m unittest discover -s scripts -p test_road_reference_scenario.py -v
python -m unittest discover -s scripts -p test_metro_anchor_set_contract.py -v
python scripts/road_reference_scenario.py --output /tmp/reference-scenario.json
cmp /tmp/reference-scenario.json src/research/metro-reference-scenario.json
```

Complete conditional/mode/lane evaluation, independently reviewed connectors and
anchor sets, exterior/competitor coverage, masks, goldens and compatible approved
release artifacts remain prerequisites for the actual public road tab.
