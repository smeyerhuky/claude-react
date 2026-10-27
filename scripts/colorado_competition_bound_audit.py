#!/usr/bin/env python3
"""Check conditional geometry bounds against real independent node-route costs.

The three unapproved fixed graph vertices are the ONLY known origin domains.
Every omitted metro remains unknown. No representative-point snap policy is
invented, no competitor is actually removed, and no release gate is granted.
"""
import argparse
import csv
import hashlib
import json
from pathlib import Path

from metro_competition_bounds import number, screen_competitors


def audit_bounds(audit, eligible_ids):
    ids = list(eligible_ids)
    if (not ids or len(ids) != len(set(ids)) or sorted(ids) != audit["qualifying_cbsa_ids"] or
            audit["release_eligible"] is not False or audit["complete_global_competition"] is not False):
        raise ValueError("Incomplete inventory or research-safety mismatch")
    sources = audit["sources"]
    selected = {s["cbsa"] for s in sources}
    if len(sources) < 2 or len(selected) != len(sources) or not selected.issubset(ids):
        raise ValueError("Invalid diagnostic source inventory")
    unknown = sorted(set(ids)-selected)
    if unknown != audit["omitted_qualifying_cbsa_ids"]:
        raise ValueError("Omitted source inventory mismatch")
    coordinates = audit["probe_coordinates_lonlat"]
    domains = {s["cbsa"]: {"center_lonlat": coordinates[str(s["node"])], "radius_m": 0,
                           "evidence_reference": "unapproved fixed baseline graph vertex " + str(s["node"])}
               for s in sources}
    reports, checked = [], 0
    for graph in ("baseline", "expanded"):
        if audit[graph+"_routing_model"]["routing_model"] != "static-passenger-car-v2":
            raise ValueError("Review geometric/speed assumptions after routing model change")
        for orientation in ("location-to-metro", "metro-to-location"):
            for metric in ("length", "travel_time"):
                rows = audit[graph][orientation][metric]["probes"]
                expected_probes = audit["fixed_probe_node_ids"]
                if len(rows) != len(expected_probes) or {r["probe"] for r in rows} != set(expected_probes):
                    raise ValueError("Missing or duplicate route probes")
                for row in rows:
                    if row["status"] not in ("reachable", "tied"):
                        raise ValueError("Bounds audit requires a finite feasible incumbent")
                    result = screen_competitors(ids, domains, coordinates[row["probe"]], metric=metric,
                                                incumbent_cost=row["cost"], speed_ceiling_kph=140,
                                                margin=1 if metric == "length" else ".1")
                    known = {r["cbsa"]: r for r in result["sources"] if r["cbsa"] in selected}
                    costs = row["source_costs"]
                    if len(costs) != len({r["cbsa"] for r in costs}) or any(r["cbsa"] not in selected for r in costs):
                        raise ValueError("Invalid independent source costs")
                    if not costs or number(row["cost"]) != min(number(r["cost"]) for r in costs):
                        raise ValueError("Incumbent does not match independent best source cost")
                    for option in costs:
                        fraction = known[option["cbsa"]]["lower_bound_exact"]
                        lower = number(fraction[0])/number(fraction[1])
                        if number(option["cost"]) < 0 or lower > number(option["cost"])+number(".002"):
                            raise ValueError("Conditional lower bound exceeds independent route cost")
                        checked += 1
                    unknown_rows = [r for r in result["sources"] if r["cbsa"] not in selected]
                    if any(r["conditional_exclusion"] or r["lower_bound"] is not None for r in unknown_rows):
                        raise ValueError("Unknown source was conditionally excluded")
                    reports.append({"graph": graph, "orientation": orientation, "metric": metric,
                                    "probe": row["probe"], "conditional_only": True,
                                    "known_graph_vertex_origin_bounds": list(known.values()),
                                    "unknown_origin_domain_count": len(unknown_rows),
                                    "applied_source_exclusions": []})
    if not reports or not checked:
        raise ValueError("Vacuous bounds audit")
    return {"release_eligible": False, "access_certified": False, "complete_global_competition": False,
            "method": result["method"], "qualifying_cbsa_ids": sorted(ids), "unknown_origin_domain_ids": unknown,
            "scope": "Only the unapproved fixed graph-vertex origins; no Census-to-road connector costs or access claims",
            "time_ceiling_assumption_kph": 140,
            "warning": "140km/h caps this static model, not real/exterior roads or unmodeled connectors; all exclusions remain conditional",
            "preconditions_not_certified": result["preconditions_not_certified"],
            "independent_source_route_costs_checked": checked, "lower_bound_violations": 0,
            "applied_source_exclusions": [], "probes": reports}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--audit", type=Path, required=True)
    parser.add_argument("--metros", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    audit = json.loads(args.audit.read_text())
    csv_hash = hashlib.sha256(args.metros.read_bytes()).hexdigest()
    if audit["metros_csv_sha256"] != csv_hash:
        raise ValueError("Metro CSV provenance mismatch")
    with args.metros.open(newline="", encoding="utf-8") as handle:
        ids = [r["cbsa"] for r in csv.DictReader(handle) if int(r["population"]) >= audit["threshold_population"]]
    result = audit_bounds(audit, ids)
    result["metros_csv_sha256"] = csv_hash
    result["directed_audit_sha256"] = hashlib.sha256(args.audit.read_bytes()).hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({k: result[k] for k in ("release_eligible", "independent_source_route_costs_checked",
                                           "lower_bound_violations", "applied_source_exclusions")}, indent=2))


if __name__ == "__main__":
    main()
