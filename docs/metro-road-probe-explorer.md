# Offline road-probe explorer

Build an inspectable research view without activating public road mode:

```sh
python scripts/build_metro_probe_explorer.py --output explorer.html
```

Open the resulting self-contained HTML in a browser. It embeds the hash-checked
[Census regression checkpoint](research/census-26-source-checkpoint/README.md),
uses the pinned CSV only for display names, and makes no network requests. Select
road distance or modeled time, either route direction and any of eighteen sampled
road nodes. The cost table retains all twenty-six sources and explicitly labels
Tucson's unreachable cases. Clicking a probe updates the table.

Circles identify probes; triangles identify unapproved source road leads. Colors
show the minimum stored cost among those modeled sources, not a certified global
winner. The 341 unknown competitors are explicitly reported. The coordinate
scatter plot has no region polygons, interpolation, geographic ownership, routing
from arbitrary clicked land, or straight-line fallback. Empty space is unassigned
and has no accessibility meaning. No off-road connector costs are included.

The workflow builds the HTML and checks all 72 metric/direction/probe selections
in Chromium, including source-row preservation, units, Tucson negatives, a known
zero-cost road-node case, point-click selection and zero external requests. Its
artifact contains the HTML and a screenshot; either can be regenerated from the
versioned builder/checkpoint, independent of artifact expiration. Browser tooling
is installed in CI's temporary directory; app dependencies stay unchanged.

This is a research inspection surface, not the production React component's road
mode. The public straight-line map, URL state, canvas and PNG export stay intact.
Connector evidence, geographic coverage and an approved artifact contract remain
requirements for a production road view (#137, #138, #139).
