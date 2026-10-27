# Conservative research pixel geography (#138)

The research mask now requires the **whole pixel rectangle** to be covered by
the supplied land polygons and disjoint from the supplied water polygons.
Any water contact, including a line or corner on a shoreline, makes the cell
transparent. Cells only partly covered by land are also transparent. A narrow
supplied water polygon cannot disappear just because no pixel center lies in it.
This deliberately reduces painting around shores and coverage boundaries.

Pixel coordinates enclose exact linear interpolation of the input floating-point
viewport bounds. Each edge rounds outward when needed, so adjacent cells overlap
by rounding width rather than leave tiny unsupported gaps. The PNG manifest
records the versioned support rule and the land/water hashes. Counts classify
partial land first, then water contact, then supported land; their sum equals the
number of cells. Road routing still samples a supported pixel at its center:
this does not prove continuous road access throughout the painted rectangle.

`colorado_png_geography_oracle.py` checks every PNG cell with independently
constructed scalar rectangles and polygon difference/intersection operations.
It imports no production mask functions. CI loads and hashes the actual Census
GeoJSON independently, checks alpha for every unsupported footprint and compares
reason counts with the manifest. It still uses the same GEOS library and source
polygons: algorithmic cross-checking is not independent evidence that Census
hydrology is complete. The separate directed Dijkstra PNG oracle remains intact.

Synthetic regressions include thin water between centers, corner-only contact,
partial land, source holes, decimal grid edges and deliberately painted water
pixels that the independent checker must reject. Actual OSM+Census CI must pass
before merge; historical center-mask pixel totals are not current expectations.

No public map, connector approvals or release gates change. Missing source
waterways, seasonal water, OSM road completeness, physical/legal connectors and
global competing sources remain unresolved under the [coverage contract](colorado-coverage-acceptance.md).
