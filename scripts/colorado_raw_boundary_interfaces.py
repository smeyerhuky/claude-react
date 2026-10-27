#!/usr/bin/env python3
"""Explicit directed raw-OSM interfaces relative to a supplied parent extract.

Inventories omitted adjacencies touching retained RAW shape nodes, including
interior nodes hidden by contraction. No route costs, turns, physical access or
exterior-state completeness are certified. Zero-coordinate-length adjacencies
are retained as conservative leads, not invented positive-cost road arcs.
"""
import argparse
from collections import Counter
import hashlib
import heapq
import json
import math
from pathlib import Path
from types import SimpleNamespace

import osmium

from stream_osm_roads import drivable, direction_flags


def supported(tags):
    return drivable(SimpleNamespace(tags=tags)) and direction_flags(tags) is not None


def fingerprint(way, tags, points):
    if type(way) is not int or way <= 0 or len(points) < 2 or any(
            len(p) != 3 or type(p[0]) is not int or p[0] <= 0 or
            any(isinstance(v, bool) or not isinstance(v, (float, int)) or not math.isfinite(v) for v in p[1:]) or
            not -180 <= p[1] <= 180 or not -90 <= p[2] <= 90 for p in points):
        raise ValueError("Invalid raw OSM way geometry")
    normalized = (way, tuple(sorted(tags.items())), tuple((p[0], float(p[1]), float(p[2])) for p in points))
    return hashlib.sha256(repr(normalized).encode()).digest()


class RawInventory:
    def __init__(self, name):
        self.name, self.ways, self.nodes = name, {}, set()

    def add(self, way, tags, points):
        if not supported(tags):
            return
        if way in self.ways:
            raise ValueError("Duplicate modeled extract way")
        self.ways[way] = fingerprint(way, tags, points)
        self.nodes.update(p[0] for p in points)
        if len(self.nodes) > 8000000:
            raise ValueError("Raw extract node inventory exceeds memory bound")


class ParentAudit:
    def __init__(self, inventories, sample_limit=32):
        if not inventories or len({i.name for i in inventories}) != len(inventories) or any(not i.ways for i in inventories):
            raise ValueError("Need unique nonempty extract inventories")
        if type(sample_limit) is not int or not 1 <= sample_limit <= 100:
            raise ValueError("Invalid boundary sample limit")
        self.inventories, self.limit, self.seen = inventories, sample_limit, set()
        self.remaining = [set(i.ways) for i in inventories]
        self.rows = [{"counts": Counter(), "ports": set(), "ways": set(), "samples": [],
                      "exits": set(), "entries": set(), "coordinates": {}} for _ in inventories]
        self.unsupported_direction_ways = 0

    def add(self, way, tags, points):
        if not drivable(SimpleNamespace(tags=tags)):
            return
        if direction_flags(tags) is None:
            self.unsupported_direction_ways += 1
            return
        if way in self.seen:
            raise ValueError("Duplicate modeled parent way")
        self.seen.add(way)
        if len(self.seen) > 5000000:
            raise ValueError("Parent way inventory exceeds memory bound")
        digest = fingerprint(way, tags, points)
        forward, backward = direction_flags(tags)
        for inventory, remaining, row in zip(self.inventories, self.remaining, self.rows):
            if way in inventory.ways:
                if digest != inventory.ways[way]:
                    raise ValueError("Extract way coordinates/references/tags disagree with parent source")
                remaining.remove(way)
                continue
            if not any(p[0] in inventory.nodes for p in points):
                continue
            row["ways"].add(way)
            for index, (a, b) in enumerate(zip(points, points[1:])):
                arcs = ([(a[0], b[0])] if forward else []) + ([(b[0], a[0])] if backward else [])
                for u, v in arcs:
                    inside_u, inside_v = u in inventory.nodes, v in inventory.nodes
                    if not (inside_u or inside_v):
                        continue
                    kind = "omitted_internal" if inside_u and inside_v else "outbound" if inside_u else "inbound"
                    row["counts"][kind] += 1
                    if a[1:] == b[1:]:
                        row["counts"]["identical_coordinate_adjacencies"] += 1
                    row["ports"].update(n for n, inside in ((u, inside_u), (v, inside_v)) if inside)
                    if len(row["ports"]) > 100000:
                        raise ValueError("Interface inventory exceeds output safety bound; never truncate ports")
                    if inside_u:
                        row["exits"].add(u)
                    if inside_v:
                        row["entries"].add(v)
                    for point in (a, b):
                        if point[0] in row["ports"]:
                            old = row["coordinates"].setdefault(point[0], point[1:])
                            if old != point[1:]:
                                raise ValueError("Interface node coordinates disagree across source ways")
                    item = (way, index, u, v)
                    negated = tuple(-n for n in item)
                    if len(row["samples"]) < self.limit:
                        heapq.heappush(row["samples"], negated)
                    elif negated > row["samples"][0]:
                        heapq.heapreplace(row["samples"], negated)

    def report(self):
        if any(self.remaining):
            raise ValueError("Parent source missing modeled extract ways")
        result = {"release_eligible": False, "access_certified": False, "extract_coverage_certified": False,
                  "parent_exterior_coverage_certified": False, "routing_model": "static-passenger-car-v2:raw-topology",
                  "parent_modeled_way_count": len(self.seen), "parent_unsupported_direction_way_count": self.unsupported_direction_ways,
                  "lineage_method": "SHA256 modeled way IDs, all tags, ordered OSM node references and coordinates",
                  "warning": "Relative to supplied parent source only. Raw adjacency leads include zero-length cases and require cost/turn validation and shape-node junction promotion before routing; no graph closure or exterior-state proof.",
                  "extracts": []}
        for inventory, row in zip(self.inventories, self.rows):
            counts = {k: row["counts"][k] for k in ("inbound", "outbound", "omitted_internal", "identical_coordinate_adjacencies")}
            result["extracts"].append({"name": inventory.name, "way_reference_tag_coordinate_inclusion_verified": True,
                "retained_modeled_ways": len(inventory.ways), "retained_raw_osm_nodes": len(inventory.nodes),
                "omitted_supported_ways_touching_retained_nodes": len(row["ways"]),
                "retained_raw_interface_node_count": len(row["ports"]), "directed_adjacency_counts": counts,
                "raw_interface_nodes": [{"osm_node_id": node, "lonlat": list(row["coordinates"][node]),
                                          "can_exit_retained_way_set": node in row["exits"],
                                          "can_enter_retained_way_set": node in row["entries"]}
                                         for node in sorted(row["ports"])],
                "parent_raw_adjacency_interface_empty": not row["ports"],
                "sample_directed_adjacencies": [{"osm_way_id": w, "segment_index": i, "u": u, "v": v}
                    for w, i, u, v in sorted(tuple(-n for n in item) for item in row["samples"])]})
        return result


class WayReader(osmium.SimpleHandler):
    def __init__(self, consumer):
        super().__init__()
        self.consumer = consumer

    def way(self, w):
        if not drivable(w) or len(w.nodes) < 2:
            return
        if any(not n.location.valid() for n in w.nodes):
            raise ValueError("Missing raw OSM location; cannot verify source lineage")
        self.consumer.add(int(w.id), dict(w.tags), [(int(n.ref), float(n.location.lon), float(n.location.lat)) for n in w.nodes])


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("--parent-osm", type=Path, required=True)
    p.add_argument("--extract-osm", type=Path, nargs="+", required=True)
    p.add_argument("--output", type=Path, required=True)
    args = p.parse_args()
    if len(args.extract_osm) > 2:
        raise ValueError("At most two bounded extracts per audit")
    inventories = []
    for path in args.extract_osm:
        inventory = RawInventory(path.name)
        WayReader(inventory).apply_file(str(path), locations=True, idx="sparse_mem_array")
        print(f"[interfaces] {path.name}: {len(inventory.ways)} modeled ways, {len(inventory.nodes)} raw OSM nodes", flush=True)
        inventories.append(inventory)
    audit = ParentAudit(inventories)
    print("[interfaces] scanning full parent source for lineage and omitted directed adjacencies", flush=True)
    WayReader(audit).apply_file(str(args.parent_osm), locations=True, idx="sparse_mem_array")
    result = audit.report()
    for row, path in zip(result["extracts"], args.extract_osm):
        with path.open("rb") as handle:
            row["osm_sha256"] = hashlib.file_digest(handle, "sha256").hexdigest()
    with args.parent_osm.open("rb") as handle:
        result["parent_osm_sha256"] = hashlib.file_digest(handle, "sha256").hexdigest()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, sort_keys=True)+"\n")
    print(json.dumps({"release_eligible": False, "parent_modeled_way_count": len(audit.seen),
                      "interfaces": [{k: r[k] for k in ("name", "retained_raw_interface_node_count", "directed_adjacency_counts")} for r in result["extracts"]]}, indent=2))


if __name__ == "__main__":
    main()
