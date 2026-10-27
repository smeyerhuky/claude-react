"""Independent scalar PNG footprint check; no production mask calls/imports.

Uses polygon difference/intersection for every cell, not the vectorized
covers/intersects mask. Decimal cell construction independently encloses the
linear grid. Shared GEOS source geometry is not independent hydrology evidence.
"""
import math
from decimal import Decimal, localcontext

from PIL import Image
from shapely.geometry import box


def verify_png_footprints(image_path, land, water, bounds):
    if (land.is_empty or water.is_empty or not land.is_valid or not water.is_valid or
            land.geom_type not in ("Polygon", "MultiPolygon") or water.geom_type not in ("Polygon", "MultiPolygon")):
        raise ValueError("Need valid nonempty source land and water polygons")
    if len(bounds) != 4 or any(isinstance(v, bool) or not isinstance(v, (int, float)) or not math.isfinite(v) for v in bounds):
        raise ValueError("Invalid geographic bounds")
    west, south, east, north = bounds
    if not -180 <= west < east <= 180 or not -90 <= south < north <= 90:
        raise ValueError("Invalid geographic bounds")
    with Image.open(image_path) as image:
        image.load()
        width, height = image.size
        if image.mode != "RGBA" or width*height > 20000:
            raise ValueError("Expected bounded RGBA PNG")
        def edge(start, end, i, count, upper):
            with localcontext() as context:
                context.prec = 80
                start, end = Decimal(start), Decimal(end)
                exact = start+(end-start)*i/count
                value = float(exact)
                if upper and Decimal(value) < exact:
                    value = math.nextafter(value, math.inf)
                elif not upper and Decimal(value) > exact:
                    value = math.nextafter(value, -math.inf)
                return value
        counts = {"land_nonwater": 0, "water_excluded": 0, "outside_supplied_land": 0}
        painted, transparent = 0, 0
        for y in range(height):
            for x in range(width):
                cell = box(edge(west, east, x, width, False), edge(south, north, height-y-1, height, False),
                           edge(west, east, x+1, width, True), edge(south, north, height-y, height, True))
                off_land = not cell.difference(land).is_empty
                wet = not cell.intersection(water).is_empty
                reason = "outside_supplied_land" if off_land else "water_excluded" if wet else "land_nonwater"
                counts[reason] += 1
                alpha = image.getpixel((x, y))[3]
                if alpha and (off_land or wet):
                    raise ValueError(f"Painted pixel ({x}, {y}) overlaps water or unsupported land")
                painted += alpha > 0
                transparent += alpha == 0
    return {"release_eligible": False, "land_water_completeness_certified": False,
            "method": "independent-scalar-polygon-difference-intersection-v1",
            "geography_pixel_counts": counts, "routed_pixels": painted,
            "transparent_pixels": transparent, "unsupported_painted_pixels": 0}
