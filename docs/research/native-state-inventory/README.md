# Native Census point state inventory

Classify all **367 qualifying native Census representative points** against the exact official 2025 TIGER state polygons. Both retained sources use **NAD83 (EPSG:4269)**; no coordinate transformation or native-to-OSM alignment is asserted. Every point in this version has exactly one state/territory match; missing or multiple matches would be retained explicitly without a nearest-state fallback.

The result guides source investigation, not regional ownership. Memphis's native point is in Tennessee even though its CBSA name also lists Mississippi and Arkansas. Texarkana's is in Texas; St. Joseph's and St. Louis's are in Missouri. The dev inventory exposes these native point labels and a filter, including all five Puerto Rico qualifiers. It preserves all eight source qualifiers absent from the public CSV.

Point membership does not describe a CBSA's full extent, an urban access anchor, extract coverage, exterior driving routes, current road access, water/land ownership or complete competition. No competitor is excluded by its state. The public straight-line map, Census coordinates, frozen 26/31-source costs and independent access gate remain unchanged.

The 9,956,072-byte state ZIP is already retained in the existing unpublished source archive. Its SHA-256, the complete native-domain SHA-256 and report SHA-256 are bound in the manifest. The source reader rejects a foreign or missing CRS and invalid polygons. Dedicated CI downloads the exact state source, checks its identity and reproduces the report byte for byte. Unit cases cover boundary ambiguity, unmatched points, changed CRS, invalid coordinates and incomplete/duplicate inventories.

```sh
python scripts/metro_native_state_inventory.py --state-zip tl_2025_us_state.zip --output reproduced.json
python -m unittest discover -s scripts -p 'test_metro_native_state_inventory.py' -v
```
