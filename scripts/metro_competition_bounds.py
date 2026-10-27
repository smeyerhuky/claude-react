"""Conditional competitor screening, never a source/access/coverage certificate.

Exact rational inequalities avoid rounding a near tie into an exclusion. The
geometry contract is the radius-6371000m sphere used by stream_osm_roads. A
caller must independently establish origin domains, route-cost domination and
a GLOBAL speed ceiling before using these conditional results to omit sources.
"""
from fractions import Fraction

RADIUS_M = 6371000


def number(value):
    if isinstance(value, bool) or not isinstance(value, (int, float, str, Fraction)):
        raise ValueError("Expected finite numeric value")
    try:
        # Preserve the actual stored binary coordinate/cost. Decimal text of a
        # float is round-trip safe, but is not its exact mathematical value.
        return Fraction.from_float(value) if isinstance(value, float) else Fraction(str(value))
    except (ValueError, ZeroDivisionError, OverflowError) as error:
        raise ValueError("Expected finite numeric value") from error


def point(value):
    if not isinstance(value, (tuple, list)) or len(value) != 2:
        raise ValueError("Expected longitude/latitude pair")
    lon, lat = map(number, value)
    if not -180 <= lon <= 180 or not -90 <= lat <= 90:
        raise ValueError("Coordinate outside longitude/latitude range")
    return lon, lat


def distance_lower_bound(origin, destination, origin_radius_m=0, destination_radius_m=0):
    """Weaker than great-circle distance, but rational and globally admissible.

    Latitude: R*pi*|delta_lat|/180 >= R*3.14*|delta_lat|/180.
    Longitude: spherical chord >= 2R*min(cos(lat))*sin(delta_lon/2),
    cos(lat) >= 1-|lat|/90 and sin(delta_lon/2) >= delta_lon/180.
    Subtract both permitted spherical endpoint radii by triangle inequality.
    """
    a, b = point(origin), point(destination)
    radii = [number(origin_radius_m), number(destination_radius_m)]
    if min(radii) < 0:
        raise ValueError("Negative endpoint radius")
    delta_lon = abs(a[0]-b[0])
    delta_lon = min(delta_lon, 360-delta_lon)
    latitude = RADIUS_M * Fraction(314, 100) * abs(a[1]-b[1]) / 180
    longitude = 2 * RADIUS_M * (1-max(abs(a[1]), abs(b[1]))/90) * delta_lon/180
    return max(Fraction(0), max(latitude, longitude)-sum(radii))


def screen_competitors(eligible_ids, origin_domains, destination, *, metric,
                       incumbent_cost, speed_ceiling_kph=None,
                       destination_radius_m=0, margin=0):
    """Retain every eligible ID; unknown domains and ties cannot be excluded.

    An incumbent must be a feasible FULL route under the SAME origin/domain,
    destination, orientation, metric and cost model. This module does not prove
    those preconditions. It deliberately emits only conditional exclusions.
    """
    ids = list(eligible_ids)
    if not ids or any(not isinstance(i, str) or not i for i in ids) or len(ids) != len(set(ids)):
        raise ValueError("Missing or duplicate qualifying source inventory")
    if set(origin_domains)-set(ids):
        raise ValueError("Origin domain outside qualifying inventory")
    point(destination)
    radius, upper, slack = map(number, (destination_radius_m, incumbent_cost, margin))
    if min(radius, upper, slack) < 0:
        raise ValueError("Negative radius, incumbent or margin")
    if metric not in ("length", "travel_time"):
        raise ValueError("Unsupported metric")
    speed = None if speed_ceiling_kph is None else number(speed_ceiling_kph)*1000/3600
    if speed is not None and speed <= 0:
        raise ValueError("Speed ceiling must be positive")
    rows = []
    for cbsa in sorted(ids):
        domain = origin_domains.get(cbsa)
        bound, conditional = None, False
        if domain is None:
            reason = "unknown_origin_domain"
        else:
            if not isinstance(domain.get("evidence_reference"), str) or not domain["evidence_reference"].strip():
                raise ValueError("Origin domain needs a traceable evidence reference")
            distance = distance_lower_bound(domain["center_lonlat"], destination, domain["radius_m"], radius)
            if metric == "travel_time" and speed is None:
                reason = "unknown_global_speed_ceiling"
            else:
                bound = distance if metric == "length" else distance/speed
                conditional = bound > upper+slack
                reason = "conditional_bound_exceeds_incumbent" if conditional else "may_compete"
        rows.append({"cbsa": cbsa, "reason": reason, "conditional_exclusion": conditional,
                     "lower_bound": None if bound is None else float(bound),
                     "lower_bound_exact": None if bound is None else [str(bound.numerator), str(bound.denominator)]})
    return {"release_eligible": False, "complete_global_competition": False,
            "method": "rational-spherical-coordinate-lower-bound-v2",
            "metric": metric, "units": "meters" if metric == "length" else "seconds",
            "conditional_only": True, "applied_source_exclusions": [], "sources": rows,
            "numeric_input_contract": "Float values preserve their exact stored binary value; strings and rational values retain explicit exact semantics",
            "preconditions_not_certified": ["complete independently justified origin domains",
                "all full route costs dominate the radius-6371000m spherical geometry",
                "feasible full incumbent with the same endpoints, metric and orientation",
                "global speed ceiling including connectors for travel_time",
                "modeled graph and geographic coverage; independent physical/legal access"]}
