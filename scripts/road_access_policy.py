"""Fail-closed gate for using geometric road snaps in allocation.

Diagnostic candidates are NEVER treated as verified by proximity. A separate,
trusted connector validation step must provide evidence for the exact edge and
point before a snap can enter a production allocation path.
"""
import math


def eligible_access_candidates(candidates, verified_connectors=None):
    """Return only independently verified candidates.

    verified_connectors maps (keyed directed edge tuple, snapped coordinate tuple)\n    to evidence records:
    {"connector_traversable": True, "legal_access": True,
     "grade_separation_checked": True, "origin_connected": True}.
    A caller must obtain these facts from independent source data; the snapping
    pipeline must not create or infer them.
    """
    evidence = verified_connectors or {}
    approved = []
    for candidate in candidates:
        edge = tuple(candidate["edge"])
        snapped = tuple(candidate["snapped"])
        record = evidence.get((edge, snapped))
        if not isinstance(record, dict):
            continue
        if not all(record.get(field) is True for field in
                   ("connector_traversable", "legal_access",
                    "grade_separation_checked", "origin_connected")):
            continue
        if any(flag in candidate.get("access_risks", ()) for flag in
               ("controlled_access", "restricted_access",
                "restricted_motor_vehicle", "restricted_motorcar")):
            continue
        gap = candidate.get("gap_m")
        if not isinstance(gap, (int, float)) or not math.isfinite(gap) or gap < 0:
            continue
        approved.append({**candidate, "access_verified": True,
                         "connector_evidence": dict(record)})
    return approved
