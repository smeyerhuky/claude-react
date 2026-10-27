"""Conditional cost bounds for routes leaving an inner geographic rectangle.

An inner rectangle is a hypothesis, never a road-coverage certificate. A caller
must establish source coverage, cost domination and a full feasible incumbent.
"""
from fractions import Fraction

from metro_competition_bounds import RADIUS_M, number, point


def boundary_distance_lower_bound(center, bounds, radius_m=0):
    """Bound distance from an endpoint ball to any rectangle boundary point.

    Latitude sides use R*3.14*abs(delta_lat)/180.
    For longitude sides, distance >= distance to the meridian plane, giving
    R*cos(lat)*abs(sin(delta_lon)). Use cos(lat)>=1-abs(lat)/90 and
    sin(delta)>=min(delta,180-delta)/90 on [0,180] degrees. The full meridian
    plane is a superset of the side, so this remains a conservative lower bound.
    """
    lon, lat = point(center)
    if not isinstance(bounds, (list, tuple)) or len(bounds) != 4:
        raise ValueError("Explicit unwrapped rectangle required")
    west, south, east, north = map(number, bounds)
    point((west, south)); point((east, north))
    radius = number(radius_m)
    if not west < east or east-west >= 180 or not south < north or radius < 0:
        raise ValueError("Ordered rectangle narrower than 180 degrees and nonnegative radius required")
    if not west <= lon <= east or not south <= lat <= north:
        raise ValueError("Endpoint center outside declared inner rectangle")
    latitude = [RADIUS_M*Fraction(314, 100)*abs(lat-side)/180 for side in (south, north)]
    longitude = [RADIUS_M*(1-abs(lat)/90)*min(abs(lon-side), 180-abs(lon-side))/90
                 for side in (west, east)]
    return max(Fraction(0), min(latitude+longitude)-radius)


def screen_exterior_routes(origin, destination, bounds, *, metric, incumbent_upper_bound,
                           origin_radius_m=0, destination_radius_m=0,
                           speed_ceiling_kph=None, margin=0):
    """Every excursion pays a first-exit prefix and last-entry suffix.

    Their boundary points can differ. Independently minimizing the two legs is
    optimistic, hence valid even with multiple excursions and directed roads.
    No exterior cost or direct connection between the boundary points is added.
    """
    upper, slack = number(incumbent_upper_bound), number(margin)
    if min(upper, slack) < 0 or metric not in ("length", "travel_time"):
        raise ValueError("Nonnegative full incumbent/margin and explicit metric required")
    lower = boundary_distance_lower_bound(origin, bounds, origin_radius_m) + boundary_distance_lower_bound(
        destination, bounds, destination_radius_m)
    if metric == "travel_time":
        if speed_ceiling_kph is None or number(speed_ceiling_kph) <= 0:
            raise ValueError("Travel time requires an explicit positive GLOBAL speed ceiling")
        lower /= number(speed_ceiling_kph)*1000/3600
    return {"method": "rational-rectangle-excursion-lower-bound-v1", "conditional_only": True,
            "release_eligible": False, "access_certified": False,
            "parent_exterior_coverage_certified": False, "complete_global_competition": False,
            "metric": metric, "units": "meters" if metric == "length" else "seconds",
            "excursion_cost_lower_bound_exact": [str(lower.numerator), str(lower.denominator)],
            "excursion_cost_lower_bound": float(lower),
            "conditional_exterior_routes_cannot_improve": lower > upper+slack,
            "applied_exterior_route_exclusions": [],
            "preconditions_not_certified": [
                "all modeled incident ways at every inner-region routing node are included, tied to exact source snapshot and boundary",
                "all full route costs dominate the declared spherical geometry, including connectors and numerical errors",
                "independently justified endpoint domains and feasible fully costed incumbent upper bound",
                "global speed ceiling including exterior roads and connectors for travel_time",
                "every eligible metro included or separately rigorously excluded; physical/legal access remains independent"]}
