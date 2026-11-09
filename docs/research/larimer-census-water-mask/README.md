# Fort Collins-area Census water-mask checkpoint

This checkpoint supplies real, independently published geometry to the existing
full-pixel land/water mask. It is a bounded coverage dependency for the future
road tab, not a road map, routing result or statewide completeness certificate.
The public straight-line map, ten development inspectors, 33-source historical
costs and fixed road scenario are unchanged. No connector is adopted or approved.

## Exact source and selection

The U.S. Census Bureau's public 2025 files are pinned by URL, full original byte
count and SHA-256 in `manifest.json` and the replay script:

- [Larimer County TIGER/Line area water](https://www2.census.gov/geo/tiger/TIGER2025/AREAWATER/tl_2025_08069_areawater.zip):
  2,300 records scanned, with 279 intersecting the closed investigation window.
- [2025 county cartographic boundaries, 1:500,000](https://www2.census.gov/geo/tiger/GENZ2025/shp/cb_2025_us_county_500k.zip):
  all 3,235 records scanned to select the unique Larimer, Colorado GEOID 08069.

The window is longitude -105.20 to -105.00 and latitude 40.50 to 40.65. Every
intersecting area-water feature is retained, including unnamed polygons; no
water-class filter, clipping, coordinate rounding or simplification is applied.
Selection uses polygon intersection, not whether a source vertex falls inside
the window. Features extending outside the window keep complete geometry.
The 279 features comprise 267 H2030, ten H2040 and two H3020 records. Keep actual
HYDROID and published names; the large western reservoir record 110436273317
has no published FULLNAME in this file, so no name is invented for it.

The county outline is an administrative footprint, not a declaration that every
interior point is land. The area-water layer is separately subtracted. This
small window lies wholly inside the selected county polygon; generalized county
borders are not used to certify a precise county-edge mask or coastline.

Both originals declare native NAD83 (EPSG:4269). Conversion to the mask's WGS84
coordinates explicitly selects EPSG operation 1188, NAD83 to WGS 84 (1), with its
stated four-meter accuracy. The operation is not selected implicitly from the
host's available grids. Its stated accuracy is **not a worst-case error bound**,
a surveyed datum/epoch match or justification for precise shoreline or driveway
claims. Coordinate values remain unchanged under this operation; recording the
operation does not make datum uncertainty disappear.

Original ZIPs remain outside the repository. Only derived public Census geometry,
provenance, this report and implementation are retained. The CI replay downloads
these two public originals; it never reads or publishes the private OSM archive.
Byte-identical source replay establishes the stated selection and transformation,
not current shoreline truth or completeness of the publisher's water inventory.

## Full-cell exclusions

The 100 × 75 grid has 7,500 cells. The existing mask requires the **entire cell**
to lie within the supplied county footprint and have no water intersection,
including boundary contact. It excludes **1,289 cells** touching supplied water
and leaves **6,211 candidate nonwater cells**, with zero outside the county.
A center-only test would miss shoreline and narrow-water contact; a regression
explicitly checks that many excluded cells have a center outside mapped water.

The western reservoir and City Park Lake interior probes are excluded. A campus
context probe is outside supplied water and in a candidate cell. These are
regressions against the same source, **not independently surveyed golden points**.
They do not validate unrecorded water, current or seasonal shorelines, source
accuracy, public vehicle access or eligibility for road shading.

The frozen `report.json` includes the whole mask, retained source hashes and
implementation fingerprints. It reports `original_source_replayed: false`
because ordinary offline replay does not read the ZIPs. An invocation that
actually verifies the complete originals separately reports that replay as true;
it never rewrites the frozen report to imply that access is certified.

## Reproduction

```sh
python -m unittest discover -s scripts -p test_larimer_census_water_mask.py -v
python scripts/larimer_census_water_mask.py
python scripts/larimer_census_water_mask.py --original-dir /path/to/exact/census-zips
python scripts/render_larimer_census_water_mask.py /tmp/larimer-mask.png
```

Five tests exercise retained replay, known mapped-water exclusions, missing and
mutated water (including recomputed metadata hashes), altered provenance or
approval claims, full-cell versus center tests and original hash preflight.
Read-only CI also requires full original-source replay and retains the derived
files plus a comparison figure. Source bytes, zip members, CRS, record counts,
county identity, selected HYDROIDs and every derived file byte must match.
There is no geometry repair, missing-water fallback or OSM-derived water mask.

The optional `--write --original-dir ...` operation reconstructs the retained
files only from complete exact originals. Review a proposed source/vintage or
implementation change before accepting regenerated checkpoint expectations.

## Remaining coverage work

This addresses a source-backed local water-mask example within #138. It does
not establish a statewide land/water inventory, seasonal/current completeness,
independent surveyed negatives, destination attachment access, graph boundary
closure, complete competitor reasoning or road assets. Candidate nonwater cells
are unverified for road access and stay unsupported until those checks pass.
The source operation's positional uncertainty also needs an explicit reviewed
policy before any production shoreline claim. Existing #137 evidence and #139
asset compatibility checks remain in force; recorded user release authorization
does not supply missing geographic facts.
