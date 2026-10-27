#!/usr/bin/env python3
"""Research-only directed interfaces against a consistent union of supplied PBFs.

Equal replication timestamps and exact overlapping highway content are required.
Neither a timestamp nor the supplied union establishes geographic completeness.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path

import osmium

from colorado_raw_boundary_interfaces import ParentAudit, RawInventory, fingerprint, supported


def timestamp(value):
    try:
        parsed = datetime.strptime(value, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=timezone.utc)
    except (ValueError, TypeError) as error:
        raise ValueError("Explicit UTC replication timestamp required") from error
    return parsed


def source_metadata(path):
    with osmium.io.Reader(str(path)) as reader:
        stamp = reader.header().get("osmosis_replication_timestamp")
    timestamp(stamp)
    with path.open("rb") as handle:
        digest = hashlib.file_digest(handle, "sha256").hexdigest()
    return {"name": path.name, "sha256": digest, "replication_timestamp": stamp,
            "size_bytes": path.stat().st_size}


def validate_sources(sources):
    if len(sources) < 2 or len({s["name"] for s in sources}) != len(sources):
        raise ValueError("Need at least two distinct named parent sources")
    stamps = {timestamp(s["replication_timestamp"]) for s in sources}
    if len(stamps) != 1:
        raise ValueError("Parent sources have different replication timestamps; do not mix snapshots")
    for source in sources:
        digest = source["sha256"]
        if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
            raise ValueError("Exact parent source SHA256 required")
    if len({s["sha256"] for s in sources}) != len(sources):
        raise ValueError("Repeated parent source bytes cannot establish an expanded source union")


class RetainedInventory(RawInventory):
    """Keep native coordinates to detect inconsistent shared-node attachments."""
    def __init__(self, name):
        super().__init__(name)
        self.coordinates = {}

    def add(self, way, tags, points):
        if not supported(tags):
            return
        super().add(way, tags, points)
        for node, x, y in points:
            old = self.coordinates.setdefault(node, (x, y))
            if old != (x, y):
                raise ValueError("Retained source node coordinates disagree across ways")


class UnionAudit:
    def __init__(self, inventory, sources):
        validate_sources(sources)
        self.inventory, self.sources = inventory, sources
        self.audit = ParentAudit([inventory])
        self.fingerprints, self.current_seen, self.counts = {}, set(), []
        self.index = -1

    def begin_source(self):
        self.index += 1
        if self.index >= len(self.sources):
            raise ValueError("More scans than declared sources")
        self.current_seen = set()
        self.counts.append({"highway_ways": 0, "identical_overlap_highway_ways": 0,
                            "new_highway_ways": 0, "new_modeled_ways": 0})

    def add(self, way, tags, points):
        if self.index < 0:
            raise ValueError("Begin source before scanning")
        if way in self.current_seen:
            raise ValueError("Duplicate highway way within one source")
        self.current_seen.add(way)
        digest = fingerprint(way, tags, points)
        row = self.counts[self.index]
        row["highway_ways"] += 1
        old = self.fingerprints.get(way)
        if old is not None:
            if digest != old:
                raise ValueError("Overlapping source highway geometry/references/tags disagree")
            row["identical_overlap_highway_ways"] += 1
            return
        # Even a different way ID must attach to exactly the retained raw node.
        for node, x, y in points:
            if node in self.inventory.coordinates and self.inventory.coordinates[node] != (x, y):
                raise ValueError("Parent highway shared-node coordinate disagrees with retained source")
        if len(self.fingerprints) >= 5000000:
            raise ValueError("Union highway inventory exceeds memory bound")
        self.fingerprints[way] = digest
        row["new_highway_ways"] += 1
        row["new_modeled_ways"] += int(supported(tags))
        self.audit.add(way, tags, points)

    def report(self):
        if self.index != len(self.sources)-1:
            raise ValueError("Not all declared source scans completed")
        result = self.audit.report()
        result.update({"method": "snapshot-consistent-supplied-source-union-raw-interfaces-v1",
                       "retained_osm_sha256": self.sources[0]["sha256"],
                       "sources": [{**source, **counts} for source, counts in zip(self.sources, self.counts)],
                       "source_union_geographic_coverage_certified": False,
                       "complete_global_competition": False,
                       "limitation": "Only supplied highway-way union, not all adjacent states or a complete road universe. No weighted routes, legal turns, connectors, or source exclusions are established. Matching timestamps do not prove complete/consistent non-overlapping data."})
        return result


class HighwayReader(osmium.SimpleHandler):
    def __init__(self, consumer):
        super().__init__()
        self.consumer = consumer

    def way(self, way):
        # Inspect private and unknown-direction highways too: overlapping sources
        # must not silently disagree on whether the static model supports a way.
        if "highway" not in way.tags or len(way.nodes) < 2:
            return
        if any(not n.location.valid() for n in way.nodes):
            raise ValueError("Missing source highway location")
        self.consumer.add(int(way.id), dict(way.tags),
                          [(int(n.ref), float(n.location.lon), float(n.location.lat)) for n in way.nodes])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--parent-osm", type=Path, nargs="+", required=True,
                        help="Retained parent first, then adjacent supplied parents")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    if not 2 <= len(args.parent_osm) <= 8:
        raise ValueError("Supply retained state and one to seven adjacent parents")
    sources = [source_metadata(path) for path in args.parent_osm]
    validate_sources(sources)
    inventory = RetainedInventory(args.parent_osm[0].name)
    HighwayReader(inventory).apply_file(str(args.parent_osm[0]), locations=True, idx="sparse_mem_array")
    print(f"[union] retained {len(inventory.ways)} modeled ways, {len(inventory.nodes)} raw nodes", flush=True)
    audit = UnionAudit(inventory, sources)
    for path in args.parent_osm:
        audit.begin_source()
        HighwayReader(audit).apply_file(str(path), locations=True, idx="sparse_mem_array")
        print(f"[union] completed {path.name}: {audit.counts[-1]}", flush=True)
    result = audit.report()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, sort_keys=True, indent=2)+"\n")
    row = result["extracts"][0]
    print(json.dumps({"sources": result["sources"], "retained_raw_interface_node_count": row["retained_raw_interface_node_count"],
                      "directed_adjacency_counts": row["directed_adjacency_counts"], "release_eligible": False}, indent=2))


if __name__ == "__main__":
    main()
