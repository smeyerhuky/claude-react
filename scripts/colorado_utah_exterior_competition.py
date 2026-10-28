#!/usr/bin/env python3
"""Reproduce the validated three-state prefix, then add Utah roads/sources."""
import argparse
import hashlib
import json
from pathlib import Path
import resource
import time

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_expanded_parent_competition import winners
from colorado_exterior_parent_competition import SourceScan, compare_exterior
from colorado_metro_winners import read_metros
from colorado_neighbor_metro_competition import validate_inventory
from road_primitive_sparse import PrimitiveSparseBuilder

REFERENCE = Path(__file__).resolve().parents[1]/"docs/research/utah-parent-reference/manifest.json"
UTAH_IDS = {"39340", "41100"}


def classify_expansion_effects(result, prefix_ids, additional_ids):
    """Separate road-only winner changes from adding sources on the same graph."""
    prefix_ids, additional_ids = set(prefix_ids), set(additional_ids)
    result["prefix_diagnostic_source_cbsa_ids"] = sorted(prefix_ids)
    result["additional_source_cbsa_ids"] = sorted(additional_ids)
    for row in result["comparisons"]:
        retained, _ = winners([o for o in row["source_costs"] if o["cbsa"] in prefix_ids], "graph_only_cost")
        row["retained_source_exterior_winner_ids"] = retained
        row["winner_changed_from_exterior_roads"] = retained != row["prefix_subset_winner_ids"]
        row["winner_changed_from_added_sources"] = retained != row["exterior_subset_winner_ids"]
        for option in row["source_costs"]:
            option["prefix_cost_status"] = ("not_computed_for_previously_unrepresented_source" if option["cbsa"] in additional_ids
                else "unreachable_in_prefix_graph" if option["prefix_cost"] is None else "computed_in_prefix_graph")
    result["winner_cases_changed_from_exterior_roads"] = sum(r["winner_changed_from_exterior_roads"] for r in result["comparisons"])
    result["winner_cases_changed_from_added_sources"] = sum(r["winner_changed_from_added_sources"] for r in result["comparisons"])
    return result


def digest(path):
    with Path(path).open("rb") as f:
        return hashlib.file_digest(f, "sha256").hexdigest()


def load_reference(path):
    path = Path(path)
    manifest = json.loads(path.read_text())
    baseline_path, domains_path = path.parent/"baseline.json", path.parent/"domains.json"
    if (manifest.get("schema") != "utah-prefix-reference-v1" or manifest.get("release_eligible") is not False or
            manifest["additional_cbsa_ids"] != sorted(UTAH_IDS) or
            digest(baseline_path) != manifest["baseline_sha256"] or digest(domains_path) != manifest["domains_sha256"]):
        raise ValueError("Exact research prefix reference required")
    baseline = json.loads(baseline_path.read_text()); domains = json.loads(domains_path.read_text())
    if (baseline["reference_projection_schema"] != "exterior-parent-cost-reference-v1" or
            baseline["upstream_report_sha256"] != manifest["upstream_report_sha256"] or
            baseline["domains_sha256"] != digest(domains_path) or
            baseline["source_provenance"] != manifest["prefix_sources"] or
            [s["name"] for s in manifest["prefix_sources"]] != ["colorado.osm.pbf", "new-mexico.osm.pbf", "arizona.osm.pbf"] or
            [s["name"] for s in manifest["additional_sources"]] != ["utah.osm.pbf"] or
            len(baseline["sources"]) != 13 or len(baseline["comparisons"]) != 60 or
            sum(len(c["source_costs"]) for c in baseline["comparisons"]) != 780):
        raise ValueError("Incomplete projected source-cost reference")
    validate_sources(manifest["prefix_sources"]+manifest["additional_sources"])
    return manifest, domains, baseline


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--reference-manifest", type=Path, default=REFERENCE)
    p.add_argument("--metros", type=Path, required=True)
    p.add_argument("--parent-osm", type=Path, nargs="+", required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    manifest, domains, baseline = load_reference(args.reference_manifest)
    if digest(args.metros) != domains["source_provenance"]["metros_csv_sha256"]:
        raise ValueError("Exact unchanged Census CSV required")
    validate_inventory(domains, read_metros(args.metros), {s["cbsa"] for s in baseline["sources"]} | UTAH_IDS)
    metadata = [source_metadata(path) for path in args.parent_osm]
    expected = manifest["prefix_sources"]+manifest["additional_sources"]
    if metadata != expected:
        raise ValueError("Exact ordered CO/NM/AZ/UT source bytes required")
    began = time.monotonic()
    builder = PrimitiveSparseBuilder(max_nodes=15000000, max_arcs=40000000)
    prefix = None
    for index, path in enumerate(args.parent_osm):
        scan = SourceScan(builder)
        HighwayReader(scan).apply_file(str(path), locations=True, idx="sparse_mem_array")
        del scan
        print(f"[Utah exterior] {path.name}: {len(builder.ids)} nodes /{len(builder.u)} arcs", flush=True)
        if index+1 == len(manifest["prefix_sources"]):
            prefix = builder.snapshot()
    parent = builder.finish(); del builder
    result = compare_exterior(prefix, parent, domains, baseline, sorted(UTAH_IDS))
    classify_expansion_effects(result, [s["cbsa"] for s in baseline["sources"]], UTAH_IDS)
    result.update(source_provenance=metadata, domains_sha256=manifest["domains_sha256"],
        baseline_report_sha256=manifest["baseline_sha256"], reference_manifest_sha256=digest(args.reference_manifest),
        upstream_report_sha256=manifest["upstream_report_sha256"], upstream_ci=manifest["upstream_ci"],
        elapsed_seconds=time.monotonic()-began,
        peak_process_rss_kib=resource.getrusage(resource.RUSAGE_SELF).ru_maxrss)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({k: result[k] for k in ("source_costs_computed", "original_prefix_costs_reproduced",
        "primitive_paths_replayed", "improved_original_source_cost_cases", "changed_subset_winner_cases", "release_eligible")}))


if __name__ == "__main__":
    main()
