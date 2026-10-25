"""Conservative access-risk diagnostics for geometric road snaps.

These flags are not a pedestrian/vehicle-access oracle. A low-risk candidate
is still unverified without an actual traversable connector from the origin.
"""
from road_segment_snapping import snap_point

CONTROLLED = {"motorway", "motorway_link", "trunk", "trunk_link"}
RESTRICTED = {"no", "private"}


def access_risks(edge_data, gap_m, crossing_unknown=True):
    risks = []
    if edge_data.get("highway") in CONTROLLED:
        risks.append("controlled_access")
    for tag in ("access", "motor_vehicle", "motorcar"):
        if edge_data.get(tag) in RESTRICTED:
            risks.append("restricted_" + tag)
    if gap_m > 0:
        risks.append("off_road_connector_unverified")
        if crossing_unknown:
            risks.append("grade_barrier_or_crossing_unverified")
    return risks


def diagnose_point(graph, lon, lat, max_gap_m=1000, limit=8, index=None):
    """Annotate snap candidates; do not silently certify road access."""
    matches = snap_point(graph, lon, lat, max_gap_m=max_gap_m, limit=limit, index=index)
    results = []
    for match in matches:
        u, v, key = match["edge"]
        risks = access_risks(graph[u][v][key], match["gap_m"])
        results.append({**match, "access_risks": risks,
                        "access_verified": False})
    return results
