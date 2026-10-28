#!/usr/bin/env python3
"""Conditional connector-budget sensitivity for all supplied Census metros."""
import argparse
from fractions import Fraction
import hashlib
import json
from pathlib import Path

from metro_competition_bounds import number, point
from metro_connector_budget_frontier import connector_budget_frontier


def audit_frontiers(domains,regional,parent):
    for report in (domains,regional,parent):
        for flag in ("release_eligible","access_certified","complete_global_competition","road_coverage_certified"):
            if report.get(flag) is not False:raise ValueError("Research safety mismatch")
    ids=domains["source_qualifying_cbsa_ids"]
    records={r["cbsa"]:r for r in domains["domains"]}
    if (not ids or len(ids)!=len(set(ids)) or len(records)!=len(domains["domains"]) or
            set(records)!=set(ids) or regional["source_qualifying_cbsa_ids"]!=ids or parent["source_qualifying_cbsa_ids"]!=ids):
        raise ValueError("Complete matching Census source inventory required")
    sources={s["cbsa"]:s for s in regional["sources"]}
    if len(sources)!=len(regional["sources"]) or len(sources)<2 or not set(sources)<=set(ids):
        raise ValueError("Distinct source incumbents required")
    for cbsa,source in sources.items():
        if records[cbsa]["native_representative_lonlat"]!=[source["lon"],source["lat"]]:
            raise ValueError("Incumbent Census origin scenario mismatch")
    if parent["source_provenance"]!=regional["source_provenance"]:
        raise ValueError("Parent source provenance mismatch")
    coordinates=regional["probe_coordinates_lonlat"]
    expected={(o,m,p) for o in ("metro-to-location","location-to-metro") for m in ("length","travel_time") for p in coordinates}
    rows=parent["comparisons"]
    keys={(r["orientation"],r["metric"],r["probe"]) for r in rows}
    if len(rows)!=len(keys) or keys!=expected:raise ValueError("Incomplete parent cases")
    origin_domains={cbsa:{"center_lonlat":point(r["native_representative_lonlat"]),"radius_m":0,
                          "evidence_reference":"Exact Census native representative point; datum/access unverified"}
                    for cbsa,r in records.items()}
    frontiers=[]
    for row in rows:
        options=row["source_costs"]
        if len(options)!=len(sources) or {o["cbsa"] for o in options}!=set(sources):
            raise ValueError("Incomplete parent source cost inventory")
        finite=[]
        for option in options:
            exact=option.get("exact_stored_arc_path_cost")
            if option["primitive_parent_cost"] is None:
                if exact is not None:raise ValueError("Unreachable source has path cost")
                continue
            if not isinstance(exact,list) or len(exact)!=2:raise ValueError("Replayed exact graph path required")
            cost=number(exact[0])/number(exact[1])
            label=number(option["primitive_parent_cost"])
            if cost<0 or abs(cost-label)>max(Fraction(2,1000),abs(label)*Fraction(1,1000000000)):
                raise ValueError("Exact path/label cost mismatch")
            finite.append((cost,option["cbsa"]))
        if not finite:raise ValueError("No finite graph-only incumbent")
        cost,cbsa=min(finite)
        metric=row["metric"]
        result=connector_budget_frontier(ids,origin_domains,coordinates[row["probe"]],metric=metric,
                    graph_path_cost=cost,connector_budgets=[0,5000,25000] if metric=="length" else [0,600,3600],
                    margin=1 if metric=="length" else ".1",speed_ceiling_kph=140 if metric=="travel_time" else None,incumbent_cbsa=cbsa)
        result.update(probe=row["probe"],orientation=row["orientation"],incumbent_cbsa=cbsa,
                      incumbent_source_node=sources[cbsa]["node"],destination_node_lonlat=coordinates[row["probe"]])
        frontiers.append(result)
    return {"release_eligible":False,"access_certified":False,"complete_global_competition":False,
            "road_coverage_certified":False,"datum_alignment_verified":False,"conditional_only":True,
            "applied_source_exclusions":[],"source_qualifying_cbsa_ids":ids,
            "unrepresented_source_qualifying_cbsa_ids":sorted(set(ids)-set(sources)),
            "origin_scenario":"Census native representative points only; no urban-anchor substitution",
            "travel_time_global_speed_assumption_kph":140,
            "connector_contract":"TOTAL directed source-plus-destination connector cost is unknown. Budgets are hypothetical upper-bound assumptions, not measured costs, feasibility or access evidence.",
            "scope":"Fixed raw road-node destinations; query-town connectors are not included or approved. Census/OSM datum alignment and global geometric cost domination remain unverified.",
            "source_thresholds_computed":len(ids)*len(frontiers),"frontiers":frontiers}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    for name in ("domains","regional-report","parent-report","output"):
        parser.add_argument("--"+name,type=Path,required=True)
    args=parser.parse_args()
    domains=json.loads(args.domains.read_text());regional=json.loads(args.regional_report.read_text());parent=json.loads(args.parent_report.read_text())
    digest=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    if regional["domains_sha256"]!=digest(args.domains) or parent["regional_report_sha256"]!=digest(args.regional_report):
        raise ValueError("Exact domain/regional/parent report binding mismatch")
    result=audit_frontiers(domains,regional,parent)
    result.update(domains_sha256=digest(args.domains),regional_report_sha256=digest(args.regional_report),parent_report_sha256=digest(args.parent_report))
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(result,indent=2,sort_keys=True)+"\n")
    print(json.dumps({k:result[k] for k in ("source_thresholds_computed","conditional_only","applied_source_exclusions","release_eligible")}))


if __name__=="__main__":main()
