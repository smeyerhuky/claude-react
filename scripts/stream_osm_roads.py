"""Bounded streaming OSM PBF road graph for the Colorado feasibility experiment.

No XML conversion or OSMnx graph_from_xml. Uses pyosmium's on-demand
location index and retains only drivable highway ways. Approximate free-flow
speeds, directed oneway semantics; NOT production navigation routing.
"""
import math
import osmium
import networkx as nx

SPEED_KPH = {"motorway": 100, "motorway_link": 50, "trunk": 80, "trunk_link": 45,
             "primary": 65, "primary_link": 35, "secondary": 55, "secondary_link": 30,
             "tertiary": 45, "tertiary_link": 25, "residential": 30,
             "unclassified": 35, "living_street": 12, "service": 15}

def meters(a, b):
    lon1,lat1=a
    lon2,lat2=b
    p1,p2=math.radians(lat1),math.radians(lat2)
    dlat=p2-p1
    dlon=math.radians(lon2-lon1)
    q=math.sin(dlat/2)**2+math.cos(p1)*math.cos(p2)*math.sin(dlon/2)**2
    return 12742000*math.asin(min(1,math.sqrt(q)))

class RoadHandler(osmium.SimpleHandler):
    def __init__(self, max_nodes=900000):
        super().__init__()
        self.graph=nx.MultiDiGraph()
        self.ways=0
        self.max_nodes=max_nodes

    def way(self, w):
        highway=w.tags.get("highway")
        if highway not in SPEED_KPH or w.tags.get("access") in ("no","private") or w.tags.get("motor_vehicle") in ("no","private") or w.tags.get("motorcar") in ("no","private"):
            return
        points=[]
        for node in w.nodes:
            if node.location.valid():
                points.append((int(node.ref),float(node.location.lon),float(node.location.lat)))
        if len(points)<2:
            return
        speed=SPEED_KPH[highway]
        try:
            posted=w.tags.get("maxspeed","").split(" ")[0]
            if posted.isdecimal():
                speed=max(5,min(140,int(posted)*(1.609344 if "mph" in w.tags.get("maxspeed","") else 1)))
        except (ValueError, TypeError):
            pass
        oneway=w.tags.get("oneway","").lower()
        forward=oneway!="-1"
        backward=oneway not in ("yes","true","1") and w.tags.get("junction")!="roundabout"
        for a,b in zip(points,points[1:]):
            u,lon1,lat1=a
            v,lon2,lat2=b
            if u==v: continue
            length=meters((lon1,lat1),(lon2,lat2))
            if length<=0: continue
            self.graph.add_node(u,x=lon1,y=lat1)
            self.graph.add_node(v,x=lon2,y=lat2)
            cost={"length":length,"travel_time":length/(speed*1000/3600)}
            if forward:self.graph.add_edge(u,v,**cost)
            if backward:self.graph.add_edge(v,u,**cost)
        self.ways+=1
        if self.graph.number_of_nodes()>self.max_nodes:
            raise RuntimeError(f"Graph exceeded node limit {self.max_nodes:,}; use a smaller --bbox, not a larger runner.")

def load_pbf(path,max_nodes=900000):
    handler=RoadHandler(max_nodes=max_nodes)
    handler.apply_file(str(path),locations=True,idx="sparse_mem_array")
    return handler.graph,handler.ways
