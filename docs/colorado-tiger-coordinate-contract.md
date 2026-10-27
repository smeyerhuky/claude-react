# Explicit TIGER coordinate contract (#138)

The official [TIGER2025 documentation, section 3.3.3](https://www2.census.gov/geo/pdfs/maps-data/data/tiger/tgrshp2025/TGRSHP2025_TechDoc_Ch3.pdf)
identifies native shapefile coordinates as GCS NAD83. Previously the reader
ignored `.prj` and emitted those numbers directly as GeoJSON. The reader now
requires a bounded, parseable `.prj` semantically equivalent to EPSG:4269,
records its SHA256 for each archive, and rejects missing, foreign or malformed
CRS metadata even when coordinate numbers look plausible.

The source reader still yields native NAD83 geometry. Preparation selects only
Colorado features, then explicitly applies **EPSG:1188, NAD83 to WGS 84 (1)**
before WGS84 viewport clipping and GeoJSON output. The operation is selected by
its exact EPSG identifier, not by an environment-dependent search for a best
available grid. Native operation axis order is latitude/longitude; geometry
input/output order is explicitly longitude/latitude. Geometry outside the
bounded Colorado operation scope is rejected.

This is an **approximate research conversion**. In the installed PROJ database
EPSG:1188 has reported accuracy 4m and a numerical no-op definition. Thus source
coordinate numbers generally do not move. Applying this declared operation
does not improve the source, establish datum realization/epoch, prove an
absolute 4m error bound, or certify an actual shoreline. The manifest and each
output feature record the operation, definition, reported accuracy, axis order,
pyproj/PROJ versions and false geographic-accuracy certification. No arbitrary
4m buffer is presented as an independently justified uncertainty envelope.

[pyproj's operation selection documentation](https://pyproj4.github.io/pyproj/stable/api/transformer.html)
supports selecting a specific operation with `from_pipeline`. The source
preparation does not claim this operation is the best high-accuracy regional
transformation. Future release work needs reviewed source accuracy, datum/epoch
compatibility with OSM, a justified uncertainty policy and independent physical
evidence; source-polygon footprint checks alone do not establish those facts.

The representative-origin state inventory consumes native TIGER polygons and
now labels that CRS explicitly; the input metro coordinates' datum remains
unverified. No outside-state competitor exclusion or access approval follows.
Actual Census and OSM CI must pass with the new CRS validation, while all
existing release, hydrology, global-competition and connector gates remain
closed. The public map is unchanged.
