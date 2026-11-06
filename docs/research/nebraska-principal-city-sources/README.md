# Nebraska principal-city publication work

The exact qualifying inventory has two Nebraska principal-city memberships:
Lincoln (3128000, CBSA 30700) and Omaha (3137000, CBSA 36540). This accounts
for the supplied population-qualified inventory, not every Nebraska city or
every component of a cross-state metro.

Ordinary HTTPS requests successfully inspected both selected sources on
November 6, 2026 UTC. Lincoln's municipal Center Park Garage page distinguishes
monthly credentials and reserved parking, and lists a facility address and
clearance. Its embedded map point is not a surveyed vehicle entrance, and its
clearance does not establish the clearance of a complete path. No vehicle
dimensions or anchor coordinates are adopted.

Omaha retains the federal court's jury parking PDF, with its visitor scope
explicit. The captured bytes list Tower Parking, 19th and Capitol Street
Parking, and 15th and Douglas Garage. Older search-rendered text that listed a
different garage is not substituted for the captured document. No publication
or revision date is inferred. Reasonable parking-fee reimbursement belongs to
the jury-service context; it is not a general public entitlement. The attachment
distinguishes the federal courthouse from the county courthouse and describes
a building entrance, which is not a vehicle connector. Printed garage hours,
clearance cautions and rates do not verify access at the reference instant.
Embedded maps and entrance images were not visually audited.

Only short literal quotes, limited observations and response fingerprints are
retained. Raw HTML/PDF, dynamic state, environment configuration and private
archives remain outside the repository. Hashes identify external response
bytes and cannot be recomputed from these derived records. Capture timestamps
are not independent access-review dates. No fixed-scenario rules are evaluated,
no route is added and no geographic coverage is certified. All access reviews
remain unresolved, no anchors are adopted and zero connectors are approved.
#137's independent reviewer and different release approver remain required;
#138 and #139 remain open.

```sh
python scripts/nebraska_principal_city_source_screen.py
python -m unittest discover -s scripts -p test_nebraska_principal_city_source_screen.py -v
python scripts/principal_city_source_work.py
```
