"""Load independently curated metro-to-road connector evidence, failing closed.

This loader checks binding and declared assertions, NOT physical truth.
Evidence must come from an independently audited connector source.
"""
import json
import math
from pathlib import Path

FIELDS = ("connector_traversable", "legal_access",
          "grade_separation_checked", "origin_connected")


def apply_connector_evidence(snapped, path):
    """Attach only exact matching records; never create positive evidence."""
    document = json.loads(Path(path).read_text(encoding="utf-8"))
    if not isinstance(document, dict) or document.get("schema_version") != 1:
        raise ValueError("Unsupported connector evidence schema")
    if not all(isinstance(document.get(key), str) and document[key].strip()\n               for key in ("source", "reviewed_by")):
        raise ValueError("Connector evidence requires source and independent reviewer")
    records = document.get("connectors")
    if not isinstance(records, list):
        raise ValueError("Connector evidence must contain a connectors list")
    index = {}
    for record in records:
        if not isinstance(record, dict):
            raise ValueError("Malformed connector evidence record")
        cbsa = record.get("cbsa")
        if not isinstance(cbsa, str) or not cbsa:
            raise ValueError("Connector evidence CBSA missing")
        if cbsa in index:
            raise ValueError("Duplicate connector evidence for CBSA " + cbsa)
        if not isinstance(record.get("node"), str) or not record["node"]:\n            raise ValueError("Connector evidence node missing or invalid")\n        if any(field in record and not isinstance(record[field], bool)\n               for field in FIELDS):\n            raise ValueError("Connector evidence assertions must be booleans")\n        index[cbsa] = record
    result = []
    for metro in snapped:
        record = index.get(metro["cbsa"])
        approved = False
        if record is not None:
            coords = (metro.get("lon"), metro.get("lat"),
                      record.get("origin_lon"), record.get("origin_lat"))
            approved = (
                record.get("node") == str(metro["node"])
                and all(isinstance(x, (int, float)) and not isinstance(x, bool)
                        and math.isfinite(x) for x in coords)
                and coords[0] == coords[2] and coords[1] == coords[3]
                and all(record.get(field) is True for field in FIELDS)
            )
        result.append({**metro, "access_verified": approved,
                       "connector_evidence": dict(record) if approved else None})
    return result
