"""Measure strict via-way compiler syntax support; never route or approve a state."""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import osmium
from metro_restriction_inventory import Reader,STATES,BASELINE,verify_source,summarize
from road_via_way_compile import compile_relation,UnsupportedViaWay,MAX_WAY_NODES
from stream_osm_roads import direction_flags,SPEED_KPH

MAX_SELECTED_WAYS=20_000
MAX_STORED_NODE_REFS=1_000_000
ROOT=Path(__file__).resolve().parents[1]
REFERENCE=ROOT/'docs/research/state-via-way-compiler-inventory'
RAW_INVENTORY=ROOT/'docs/research/state-restriction-inventory/report.json'


def classify(relation,ways,oversized=()):
    refs={m['ref'] for m in relation['members'] if m['type']=='w'}
    if refs & set(oversized):return dict(status='rejected',reason='Raw member way exceeds declared node budget')
    selected=[ways[wid] for wid in sorted(refs) if wid in ways];arcs=[]
    for way in selected:
        tags=way['tags'];directions=direction_flags(tags)
        if tags.get('highway') not in SPEED_KPH or directions is None:continue
        for index,(a,b) in enumerate(zip(way['nodes'],way['nodes'][1:])):
            for direction,allowed in enumerate(directions):
                if not allowed:continue
                u,v=(a[0],b[0]) if direction==0 else (b[0],a[0])
                # Topological arc identity only: no coordinates, lengths or
                # costs are fabricated, and no shortest-path solver is called.
                arcs.append(dict(id=f"{way['id']}:{index}:{direction}",way=way['id'],**{'from':u,'to':v}))
    try:pattern=compile_relation(relation,selected,arcs)
    except UnsupportedViaWay as error:return dict(status='rejected',reason=str(error))
    return dict(status='compiled_declared_shape',pattern_arc_count=len(pattern['arc_sequence']))


def classify_all(relations,ways,oversized=()):
    if (not isinstance(relations,list) or len(relations)>100_000
            or len({r['id'] for r in relations})!=len(relations)):
        raise ValueError('Bounded unique raw via-way candidate identities required')
    counts=Counter();samples={};compiled=0;total_pattern_arcs=0
    for relation in sorted(relations,key=lambda r:r['id']):
        result=classify(relation,ways,oversized)
        if result['status']=='compiled_declared_shape':
            compiled+=1;total_pattern_arcs+=result['pattern_arc_count'];key='compiled_declared_shape'
        else:key=result['reason'];counts[key]+=1
        sample=samples.setdefault(key,[])
        if len(sample)<3:sample.append(dict(relation_id=relation['id'],**result))
    if compiled+sum(counts.values())!=len(relations):raise AssertionError('Do not drop any selected via-way relation')
    return dict(raw_via_way_relations=len(relations),compiled_declared_shape_count=compiled,
                rejected_relation_count=sum(counts.values()),first_rejection_reason_counts=dict(sorted(counts.items())),
                total_compiled_pattern_arcs=total_pattern_arcs,example_relation_results=dict(sorted(samples.items())))


def inventory(osm_dir):
    baseline=json.loads(BASELINE.read_text());source_by_name={s['name']:s for s in baseline['source_provenance']}
    raw_bytes=RAW_INVENTORY.read_bytes();raw=json.loads(raw_bytes);raw_by_state={r['state']:r for r in raw['states']}
    result=[]
    for state in STATES:
        source=source_by_name[state+'.osm.pbf'];path=osm_dir/source['name'];verify_source(path,source)
        reader=Reader();reader.apply_file(str(path));summary=summarize(reader.rows)
        if (source!=raw_by_state[state]['source']
                or summary['all_selected_relation_projection_sha256']!=raw_by_state[state]['all_selected_relation_projection_sha256']):
            raise ValueError('Exact complete raw relation inventory changed')
        relations=[r for r in reader.rows if any(m['type']=='w' and m['role']=='via' for m in r['members'])]
        wanted={m['ref'] for r in relations for m in r['members'] if m['type']=='w'}
        if len(wanted)>MAX_SELECTED_WAYS:raise ValueError('Selected member-way budget exceeded; no partial inventory')
        class Ways(osmium.SimpleHandler):
            def __init__(self):super().__init__();self.ways={};self.oversized=set();self.stored=0
            def way(self,way):
                if way.id not in wanted:return
                if way.id in self.ways or way.id in self.oversized:raise ValueError('Duplicate selected raw way')
                if len(way.nodes)>MAX_WAY_NODES:self.oversized.add(way.id);return
                self.stored+=len(way.nodes)
                if self.stored>MAX_STORED_NODE_REFS:raise ValueError('Member node-reference budget exceeded; no partial inventory')
                self.ways[way.id]=dict(id=way.id,tags=dict(way.tags),nodes=[[n.ref] for n in way.nodes])
        roads=Ways();roads.apply_file(str(path));verify_source(path,source)
        classified=classify_all(relations,roads.ways,roads.oversized)
        if classified['raw_via_way_relations']!=raw_by_state[state]['overlapping_flag_counts']['via_way']:
            raise ValueError('Every raw via-way relation must remain accounted for')
        result.append(dict(state=state,source=source,selected_member_way_ids=len(wanted),
                           missing_raw_member_way_ids=sorted(wanted-roads.ways.keys()-roads.oversized),
                           oversized_raw_member_way_ids=sorted(roads.oversized),**classified))
        print(dict(state=state,raw_via_way=classified['raw_via_way_relations'],compiled_shapes=classified['compiled_declared_shape_count'],
                   rejected=classified['rejected_relation_count']),flush=True)
    return dict(schema='state-via-way-compiler-inventory-v1',states=result,
                raw_inventory_sha256=hashlib.sha256(raw_bytes).hexdigest(),
                scope='All raw via-way relation candidates in the five declared sources; counts are not applicable-car restriction or route coverage fractions',
                selection='Any type=restriction relation containing a via-way member; mixed or malformed candidates are retained and rejected, never dropped',
                diagnostic_policy='One first compiler rejection reason per rejected candidate; overlapping additional limitations are not exhausted',
                compiled_meaning='Declared strict topological shape accepted; not physically/legal verified, current, complete or approved',
                route_costs_computed=False,anchors_adopted=False,turn_support_certified=False,
                geographic_coverage_certified=False,access_verified=False,release_eligible=False)


if __name__=='__main__':
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--osm-dir',type=Path,required=True)
    p.add_argument('--output',type=Path);p.add_argument('--compare',type=Path);a=p.parse_args();result=inventory(a.osm_dir)
    if a.output:a.output.write_text(json.dumps(result,sort_keys=True,indent=2)+'\n')
    if a.compare and json.loads(a.compare.read_text())!=result:raise ValueError('Retained strict compiler inventory differs')
