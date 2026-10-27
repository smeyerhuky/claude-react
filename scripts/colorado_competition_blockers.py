#!/usr/bin/env python3
"""Fail-closed release blocker inventory from real baseline/expanded OSM audits."""
import argparse
import json
from pathlib import Path


def blocker_inventory(comparison):
    rows = comparison["metros"]
    if len(rows) != comparison["qualifying_cbsa_count"] or len({r["cbsa"] for r in rows}) != len(rows):
        raise ValueError("Incomplete or duplicate qualifying metro inventory")
    eligible = [r for r in rows if r["expanded_candidate_count"] > 0]
    missing = [r for r in rows if r["expanded_candidate_count"] == 0]
    if any(r["expanded_candidate_count"] < 0 for r in rows):
        raise ValueError("Invalid candidate count")
    # A candidate is geometric only. Even two candidates cannot prove a
    # complete source set or validate a legal/physical connector.
    return {
        "release_eligible": False,
        "access_certified": False,
        "extract_coverage_certified": False,
        "qualifying_cbsa_count": len(rows),
        "expanded_geometric_candidate_cbsa_count": len(eligible),
        "missing_geometric_candidate_cbsa_count": len(missing),
        "missing_geometric_candidate_cbsa_ids": sorted(r["cbsa"] for r in missing),
        "changed_triage_count": sum(r["baseline_triage"] != r["expanded_triage"] for r in rows),
        "directed_global_competition_testable": False,
        "reason": "Missing eligible source origins prevent complete global metro competition; no independent physical/legal connector validation",
    }


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--comparison", required=True)
    p.add_argument("--output", required=True)
    args = p.parse_args()
    result = blocker_inventory(json.loads(Path(args.comparison).read_text()))
    Path(args.output).write_text(json.dumps(result, indent=2, sort_keys=True) + "\n")
    print(json.dumps({k: v for k, v in result.items() if not k.endswith("_ids")}, indent=2))


if __name__ == "__main__":
    main()
