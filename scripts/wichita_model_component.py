"""Bounded raw-way closure of one rejected research lead; no access certification."""
import argparse
import csv
import hashlib
import json
from pathlib import Path

from colorado_adjacent_source_interfaces import HighwayReader, source_metadata, validate_sources
from colorado_raw_boundary_interfaces import fingerprint, supported
from metro_scenario_checkpoint import REFERENCE as CENSUS_REFERENCE, load_reference

ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/wichita-model-lead-negative.json'


class IncidentScan:
    def __init__(self,component,coordinates,*,grow=False,max_nodes=1000):
        if type(max_nodes) is not int or not 1<=max_nodes<=1000 or not isinstance(component,set) or not component or len(component)>max_nodes or any(type(n) is not int or not 0<n<=2**63-1 for n in component):raise ValueError('Bounded nonempty component required')
        self.component=component;self.coordinates=coordinates;self.grow=grow;self.max_nodes=max_nodes
        self.rows={};self.references=0;self.failed=False

    def add(self,way,tags,points):
        if self.failed:raise ValueError('Cannot resume a failed incident scan')
        try:self._add(way,tags,points)
        except Exception:
            self.failed=True;raise

    def _add(self,way,tags,points):
        if not any(node in self.component for node,_,_ in points):return
        if len(points)>100000 or len(self.rows)>=10000 or self.references+len(points)>1000000:raise ValueError('Incident raw-way inventory budget exceeded')
        if way in self.rows:raise ValueError('Duplicate incident raw highway within one source')
        digest=fingerprint(way,tags,points).hex();modeled=bool(supported(tags))
        ids=[node for node,_,_ in points]
        if self.grow and modeled:
            self.component.update(ids)
            if len(self.component)>self.max_nodes:raise ValueError('Small component node budget exceeded')
        for node,x,y in points:
            if node in self.component:
                previous=self.coordinates.setdefault(node,[x,y])
                if previous!=[x,y]:raise ValueError('Conflicting native source geometry')
        self.rows[way]=dict(osm_way_id=way,tags=dict(tags),modeled=modeled,node_ids=ids,raw_way_fingerprint_sha256=digest)
        self.references+=len(points)


def derive(paths,source,expected_sources):
    actual=[source_metadata(path) for path in paths];validate_sources(actual)
    if actual!=expected_sources or len(actual)!=6:raise ValueError('Exact ordered six dated sources required')
    if source['cbsa']!='48620' or source['access_verified'] is not False or source['connector_costs_included'] is not False:raise ValueError('Explicit unapproved Wichita candidate required')
    csv_path=ROOT/'public/data/metros-census-2025.csv';csv_raw=csv_path.read_bytes()
    csv_sha=hashlib.sha256(csv_raw).hexdigest()
    if csv_sha!='ecd594584ff6ab074a94fbad5c85ec2506b0c4e0d4c4870120d7e3d0b5b795f8':raise ValueError('Exact original metro CSV required')
    row=next(row for row in csv.DictReader(csv_raw.decode().splitlines()) if row['cbsa']=='48620')
    if source['native_origin_lonlat']!=[float(row['longitude']),float(row['latitude'])]:raise ValueError('Original Census origin changed')
    census=load_reference();probe_ids=sorted(map(int,census['probe_coordinates_lonlat']))
    component={source['node']};coordinates={}
    path=next(path for path in paths if path.name=='kansas.osm.pbf')
    for iteration in range(8):
        before=len(component);scan=IncidentScan(component,coordinates,grow=True)
        HighwayReader(scan).apply_file(str(path),locations=True,idx='sparse_mem_array')
        print('[Wichita discovery]',iteration+1,len(component),'nodes',flush=True)
        if len(component)==before:break
    else:raise ValueError('Bounded component discovery did not converge')
    incident={};counts={}
    for path in paths:
        scan=IncidentScan(component,coordinates)
        HighwayReader(scan).apply_file(str(path),locations=True,idx='sparse_mem_array')
        counts[path.name]=len(scan.rows)
        for way,record in scan.rows.items():
            if record['modeled'] and not set(record['node_ids'])<=component:raise ValueError('Candidate component not closed in supplied six-source model')
            if way in incident and incident[way]!=record:raise ValueError('Cross-source incident raw-way disagreement')
            incident[way]=record
        print('[Wichita incident audit]',path.name,len(scan.rows),'raw ways',flush=True)
    if coordinates.get(source['node'])!=source['node_lonlat'] or set(coordinates)!=component:raise ValueError('Native candidate geometry or component inventory changed')
    if component & set(probe_ids):raise ValueError('A retained probe is inside the candidate component')
    return dict(schema='wichita-static-component-negative-v1',source=dict(source),source_provenance=actual,
                component_node_ids=sorted(component),weak_component_node_count=len(component),native_coordinates={str(k):coordinates[k] for k in sorted(coordinates)},
                incident_raw_highways=[incident[k] for k in sorted(incident)],incident_way_counts_by_source=counts,
                retained_probe_node_ids=probe_ids,all_retained_probes_outside_closed_component=True,
                discovery_passes=iteration+1,component_node_limit=1000,discovery_pass_limit=8,
                metros_csv_sha256=csv_sha,domains_sha256=census['domains_sha256'],
                retained_census_checkpoint_sha256=hashlib.sha256((CENSUS_REFERENCE/'baseline.json').read_bytes()).hexdigest(),
                source_excluded=False,origin_moved=False,road_filter_changed=False,access_verified=False,
                release_eligible=False,road_coverage_certified=False,complete_global_competition=False,
                scope='Exact six supplied PBFs and unchanged static driving filter; weak-component disconnection from all18 retained probes implies model unreachability in either direction. No real-world access or metro-eligibility conclusion.')


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--parent-osm',type=Path,nargs=6,required=True);p.add_argument('--output',type=Path,required=True);args=p.parse_args()
    expected=json.loads(REFERENCE.read_text());actual=derive(args.parent_osm,expected['source'],expected['source_provenance'])
    if actual!=expected:raise ValueError('Pinned Wichita model-negative changed')
    args.output.parent.mkdir(parents=True,exist_ok=True);args.output.write_text(json.dumps(actual,indent=2,sort_keys=True)+'\n')
    print(json.dumps({'weak_component_node_count':actual['weak_component_node_count'],'access_verified':False,'release_eligible':False}))

if __name__=='__main__':main()
