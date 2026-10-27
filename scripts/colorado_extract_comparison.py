#!/usr/bin/env python3
"""Research-only comparison of metro origins against two road graph extracts.

Geometric proximity does not prove a routable path or legal/physical access.
Never use this report as release approval.
"""
import argparse
import json
from pathlib import Path

from colorado_connector_review_queue import build_review_queue
from colorado_metro_winners import read_metros
from stream_osm_roads import load_pbf


def compare_queues(baseline, expanded):
    """Fail closed if expanded inventory drops a qualifying CBSA."""
    a = {str(x["cbsa"]): x for x in baseline["metros"]}
    b = {str(x["cbsa"]): x for x in expanded["metros"]}
    if not a or set(a) != set(b):
        raise ValueError("Expanded comparison changed qualifying CBSA identities")
    rows = []
    for cbsa in sorted(a):
        old, new = a[cbsa], b[cbsa]
        rows.append({
            "cbsa": cbsa,
            "baseline_triage": old["triage_status"],
            "expanded_triage": new["triage_status"],
            "baseline_candidate_count": len(old["candidates"]),
            "expanded_candidate_count": len(new["candidates"]),
        })
    return {
        "release_eligible": False,
        "access_certified": False,
        "extract_coverage_certified": False,
        "comparison_is_geometric_only": True,
        "qualifying_cbsa_count": len(rows),
        "changed_triage_count": sum(x["baseline_triage"] != x["expanded_triage"] for x in rows),
        "metros": rows,
        "warning": "No inference of geographic completeness, network reachability or legal access",
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--baseline-osm", required=True)
    parser.add_argument("--expanded-osm", required=True)
    parser.add_argument("--metros", required=True)
    parser.add_argument("--output", required=True)
    args = parser.parse_args()
    metros = read_metros(args.metros)
    baseline = build_review_queue(load_pbf(args.baseline_osm), metros)
    expanded = build_review_queue(load_pbf(args.expanded_osm), metros)
    result = compare_queues(baseline, expanded)
    Path(args.output).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps({k: v for k, v in result.items() if k != "metros"}, indent=2))


if __name__ == "__main__":
    main()
