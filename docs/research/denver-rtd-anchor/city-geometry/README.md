# Independent historical footprint comparison

Denver's **Parking Lots 2022** capture criteria explicitly include lot entrances and connections to adjacent roads. These city-published polygons corroborate a mapped driveway more precisely than RTD's generalized station point. All geometry is compiled in **2D from 2022 aerial imagery**; this is historical footprint evidence, not a current site inspection or access determination.

In the retained query, parking polygon **41640** overlaps **74.139 m** of OSM driveway **436487553**. **7.267 m** lies outside that polygon toward road junction **176077058**; the polygon does not cover the junction. These measurements use WGS84 / UTM zone 13N (`EPSG:32613`), giving a total modeled path of 81.406 m. The earlier 81.396 m value uses spherical geodesic segment lengths. Neither changes an adopted connector cost: no anchor is approved.

The same query returns **zero driveway polygons** and seven parking polygons, including pervious islands. An empty driveway query does not mean the mapped driveway is absent or prohibited: Denver uses separate capture rules, including sidewalk precedence. The lot polygon extends beyond the candidate lot; its identifier is not a parcel identifier or proof of RTD ownership.

The AI packet now cites this independent source and the reproducible overlap. Its physical-connection finding remains unknown for the **complete current connection**. Legal motor access, same-grade connectivity, current turns and connector cost also remain unresolved. Two-dimensional overlap cannot resolve elevation or lawful use, and green CI cannot certify them.

Replay with the project's Python dependencies:

```sh
python scripts/denver_blake_city_geometry.py
python -m unittest discover -s scripts -p 'test_denver_blake_city_geometry.py' -v
```

The manifest records exact municipal item, service, layer and bounded query URLs, response hashes and retrieval date. Source metadata identifies the publisher, imagery year and capture criteria. Tests cover replay, byte tampering and empty coverage that must remain unverified.
