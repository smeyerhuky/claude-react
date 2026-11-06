# Arkansas principal-city publication work

Nine exact official principal-city memberships span four CBSAs: Bentonville,
Fayetteville, Rogers and Springdale (22220); Conway, Little Rock and North Little
Rock (30780); Fort Smith (22900); and Jonesboro (27860). A shared CBSA does not
permit substituting another city's publication or collapsing its identity.

On November 6, 2026 UTC, ordinary HTTPS requests inspected eight municipal
publications. Bentonville and Jonesboro moved to new official hosts; fresh
successful requests bind their canonical URLs. Fort Smith's selected parking
publication returned HTTP 403. Its record retains the failed-attempt fingerprint
and an explicit retrieval gap, with no quote or observations. Search-result
text is not inspected evidence, and a retrieval failure is not a finding that
car access is unavailable.

Conway's May 19 notice schedules work from May 26 through the end of 2026.
Scheduled work and anticipated effects do not verify actual construction,
completion, reopening or conditions at the October 28 reference instant.
Fayetteville's reserved parking and payment windows remain distinct. Little
Rock's free-meter periods do not grant alley access. North Little Rock's FAQ
distinguishes a private operator's lot from city ownership. Rogers museum
accessibility does not establish vehicle-entry grade. Municipal contact
addresses and office hours in Bentonville, Jonesboro and Springdale do not
identify reviewed vehicle connections. Springdale's retrieved ordinary text
does not expose clerk office hours, so none are inferred.

The JSON records contain short literal quotes and limited factual observations.
Response hashes identify external response bytes; they cannot be reconstructed
from these derived records. Raw HTML, error bodies, dynamic application state,
environment configuration and private archives are not published. No map or
entrance image was visually audited. These records do not evaluate the fixed
scenario, compile access rules, adopt anchors, approve connectors, route cities
or certify coverage. All access reviews remain unresolved; #137's independent
reviewer and different release approver remain required.

Verify with:

```sh
python scripts/arkansas_principal_city_source_screen.py
python -m unittest discover -s scripts -p test_arkansas_principal_city_source_screen.py -v
python scripts/principal_city_source_work.py
```
