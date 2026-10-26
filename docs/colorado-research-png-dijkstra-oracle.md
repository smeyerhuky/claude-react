# Independent directed Dijkstra research PNG oracle

The `colorado_road_png_dijkstra_oracle.py` diagnostic samples actual
colored pixels from the research-only `by-road-distance.png` and
`by-road-time.png` artifacts, decodes their CBSA from the stored RGBA
palette, and recomputes each selected origin-to-metro shortest path using
NetworkX Dijkstra from the projected **road-edge endpoint**.

Unlike the raster renderer, this check does **not** reuse the
precomputed node-to-metro winner labels. A differing CBSA, unsupported
edge access, tie, missing source or corrupted PNG color fails the test.
Sample positions are distributed deterministically across visible
pixels; adjust the bound of at most 40 samples if runtime permits.

```bash
python scripts/colorado_road_png_dijkstra_oracle.py \
  --osm local-data/roads.osm.pbf \
  --metros public/data/metros-census-2025.csv \
  --preview-dir colorado-real-road-preview/routed-layers \
  --max-samples 8 \
  --output colorado-real-road-preview/dijkstra-oracle.json
```

This validates software routing arithmetic **only within the same
clipped, incomplete OSM graph**. It does not independently prove real-world
legal or physical road access (#137), complete Census/USGS land/water
coverage, routes leaving the graph extract (#138), or readiness to enable
the website's By road modes (#139).

The output explicitly carries `release_eligible:false`,
`access_certified:false`, and
`external_network_coverage_proven:false`. No image or generated
connector evidence is approved for production by this check.
