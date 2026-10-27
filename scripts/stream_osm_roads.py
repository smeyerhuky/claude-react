"""Build a compact directed road graph from filtered OSM PBF (experimental).

Two passes: find junctions (nodes shared by drivable ways) and way endpoints,
then collapse interior geometry while preserving cumulative length/time.
"""
import math
from collections import Counter
import osmium
import networkx as nx

SPEED_KPH = {"motorway": 100, "motorway_link": 50, "trunk": 80, "trunk_link": 45,
             "primary": 65, "primary_link": 35, "secondary": 55, "secondary_link": 30,
             "tertiary": 45, "tertiary_link": 25, "residential": 30,
             "unclassified": 35, "living_street": 12, "service": 15}

def meters(a, b):
    lon1, lat1 = a
    lon2, lat2 = b
    p1, p2 = math.radians(lat1), math.radians(lat2)
    q = math.sin((p2-p1)/2)**2 + math.cos(p1)*math.cos(p2)*math.sin(math.radians(lon2-lon1)/2)**2
    return 12742000*math.asin(min(1, math.sqrt(q)))

def drivable(w):
    return (w.tags.get("highway") in SPEED_KPH
            and w.tags.get("access") not in ("no", "private")
            and w.tags.get("motor_vehicle") not in ("no", "private")
            and w.tags.get("motorcar") not in ("no", "private"))


def direction_flags(tags):
    """Static passenger-car directions; None means unsupported, not two-way.

    Explicit values override implied motorway/roundabout direction. Time-varying
    and unknown values cannot be interpreted without another routing contract.
    """
    if any(tags.get(key) for key in ("oneway:conditional", "oneway:motor_vehicle:conditional",
                                    "oneway:motorcar:conditional")):
        return None
    value = tags.get("oneway:motorcar", tags.get("oneway:motor_vehicle", tags.get("oneway", ""))).strip().lower()
    if value in ("yes", "true", "1"):
        return True, False
    if value == "-1":
        return False, True
    if value in ("no", "false", "0"):
        return True, True
    if value:
        return None
    if tags.get("junction") == "roundabout" or tags.get("highway") == "motorway":
        return True, False
    return True, True

class JunctionIndex(osmium.SimpleHandler):
    def __init__(self):
        super().__init__()
        self.counts = Counter()
        self.keep = set()
        self.ways = 0

    def way(self, w):
        if not drivable(w): return
        ids = [int(n.ref) for n in w.nodes]
        if len(ids) < 2: return
        self.ways += 1
        self.keep.update((ids[0], ids[-1]))
        # A node repeated within one way is also a junction: collapsing across
        # it would erase a legal turn/shortcut at that repeated coordinate.
        # Count each distinct node once per way for cross-way intersections.
        unique = set(ids)
        seen = set()
        for node_id in ids:
            if node_id in seen:
                self.keep.add(node_id)
            seen.add(node_id)
        self.counts.update(unique)

    def junctions(self):
        return self.keep | {n for n, count in self.counts.items() if count > 1}

class RoadHandler(osmium.SimpleHandler):
    def __init__(self, keep, max_nodes=900000):
        super().__init__()
        self.graph = nx.MultiDiGraph()
        self.keep = keep
        self.ways = 0
        self.max_nodes = max_nodes
        self.graph.graph.update(routing_model="static-passenger-car-v2",
                                unsupported_direction_way_count=0,
                                unsupported_direction_way_ids=[],
                                turn_restrictions_modeled=False,
                                physical_legal_access_certified=False)

    def way(self, w):
        if not drivable(w): return
        directions = direction_flags(w.tags)
        if directions is None:
            self.graph.graph["unsupported_direction_way_count"] += 1
            self.graph.graph["unsupported_direction_way_ids"].append(
                int(w.id) if getattr(w, "id", None) is not None else None)
            return
        if any(not n.location.valid() for n in w.nodes):
            raise ValueError("Missing OSM way node location; refuse invented road chord")
        points = [(int(n.ref), float(n.location.lon), float(n.location.lat))
                  for n in w.nodes]
        if len(points) < 2: return
        speed = SPEED_KPH[w.tags.get("highway")]
        posted = w.tags.get("maxspeed", "").strip().lower()
        part = posted.split(" ")[0] if posted else ""
        if part.isdecimal():
            speed = max(5, min(140, int(part)*(1.609344 if "mph" in posted else 1)))
        oneway = w.tags.get("oneway", "").lower()
        forward, backward = directions
        origin = points[0]
        distance = 0.0
        shape = [origin]
        for a, b in zip(points, points[1:]):
            distance += meters((a[1], a[2]), (b[1], b[2]))
            shape.append(b)
            if b[0] not in self.keep: continue
            u, v = origin[0], b[0]
            if distance > 0:
                self.graph.add_node(u, x=origin[1], y=origin[2])
                self.graph.add_node(v, x=b[1], y=b[2])
                cost = {"length":distance, "travel_time":distance/(speed*1000/3600),
                        "osm_way_id": int(w.id) if getattr(w, "id", None) is not None else None, "highway": w.tags.get("highway"),
                        "geometry": tuple((p[1], p[2]) for p in shape),
                        "osm_node_ids": tuple(p[0] for p in shape),
                        "access": w.tags.get("access", ""),
                        "motor_vehicle": w.tags.get("motor_vehicle", ""),
                        "motorcar": w.tags.get("motorcar", ""),
                        "oneway": oneway, "speed_kph": speed}
                if forward: self.graph.add_edge(u, v, **cost)
                if backward: self.graph.add_edge(v, u, **{**cost,
                    "geometry": tuple(reversed(cost["geometry"])),
                    "osm_node_ids": tuple(reversed(cost["osm_node_ids"]))})
            origin = b
            distance = 0.0
            shape = [b]
        self.ways += 1
        if self.graph.number_of_nodes() > self.max_nodes:
            raise RuntimeError(f"Junction graph exceeded {self.max_nodes:,} nodes; reduce corridor bounds.")

def load_pbf(path, max_nodes=900000):
    print("[graph] Pass 1/2: identifying shared road junctions", flush=True)
    index = JunctionIndex()
    index.apply_file(str(path))
    keep = index.junctions()
    print(f"[graph] {index.ways:,} ways; {len(keep):,} junctions/endpoints; building contracted directed edges", flush=True)
    del index
    handler = RoadHandler(keep, max_nodes=max_nodes)
    handler.apply_file(str(path), locations=True, idx="sparse_mem_array")
    print(f"[graph] Pass 2/2: {handler.graph.number_of_nodes():,} nodes; {handler.graph.number_of_edges():,} edges", flush=True)
    return handler.graph, handler.ways
