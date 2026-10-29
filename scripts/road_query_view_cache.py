"""Session-owned interruption cache, never independent source or access evidence.

Only numeric NPY arrays and bounded JSON are read. Independent CI must still
rebuild from original PBFs. A cache binding/hash is not an attestation.
"""
import hashlib
import json
from pathlib import Path
import shutil
import tempfile
import numpy as np
from scipy.sparse import csr_array
from road_primitive_sparse import PrimitiveSparseGraph
from road_partition_oracle import validate

MAX_BYTES=2000000000
FIELDS=('osm_ids','longitude','latitude','length.data','length.indices','length.indptr','travel_time.data','travel_time.indices','travel_time.indptr')


def digest(path):
    with Path(path).open('rb') as f:return hashlib.file_digest(f,'sha256').hexdigest()


def save(graphs,root,binding,context):
    root=Path(root)
    if len(graphs)!=2:raise ValueError('Exactly two query views required')
    for g in graphs:
        validate(g)
        if 'query_view_policy' not in g.report:raise ValueError('Protected query views required')
    if root.exists():raise ValueError('Choose a fresh cache path; never replace an existing cache')
    root.parent.mkdir(parents=True,exist_ok=True);temp=Path(tempfile.mkdtemp(prefix='.query-cache-',dir=root.parent))
    try:
        manifest=dict(schema='session-query-view-cache-v1',binding=binding,context=context,graphs=[],files={},independent_evidence=False,release_eligible=False)
        total=0
        for k,g in enumerate(graphs):
            manifest['graphs'].append(g.report)
            for field in FIELDS:
                value=g
                for key in field.split('.'):value=getattr(value,key)
                name=f'{k}-{field}.npy';path=temp/name
                np.save(path,value,allow_pickle=False);size=path.stat().st_size;total+=size
                if total>MAX_BYTES:raise ValueError('Session cache exceeds its2GB budget')
                manifest['files'][name]=dict(size_bytes=size,sha256=digest(path))
        (temp/'manifest.json').write_text(json.dumps(manifest,sort_keys=True)+'\n')
        (temp/'manifest.sha256').write_text(digest(temp/'manifest.json')+'\n');temp.rename(root)
    finally:
        if temp.exists():shutil.rmtree(temp)


def load(root,binding):
    root=Path(root).resolve();path=root/'manifest.json'
    if path.is_symlink() or path.stat().st_size>1000000:raise ValueError('Bounded cache manifest required')
    checksum=root/'manifest.sha256'
    if checksum.is_symlink() or checksum.stat().st_size>100 or digest(path)!=checksum.read_text().strip():raise ValueError('Cache metadata changed')
    manifest=json.loads(path.read_text())
    if (manifest.get('schema')!='session-query-view-cache-v1' or manifest.get('binding')!=binding or
            manifest.get('independent_evidence') is not False or manifest.get('release_eligible') is not False or len(manifest['graphs'])!=2):raise ValueError('Exact non-certifying cache binding required')
    names={f'{k}-{field}.npy' for k in [0,1] for field in FIELDS}
    if set(manifest['files'])!=names or sum(r['size_bytes'] for r in manifest['files'].values())>MAX_BYTES:raise ValueError('Complete bounded numeric cache required')
    arrays={}
    for name,record in manifest['files'].items():
        p=root/name
        if (p.is_symlink() or not p.is_file() or p.stat().st_size!=record['size_bytes'] or digest(p)!=record['sha256']):raise ValueError('Cache bytes changed')
        a=np.load(p,mmap_mode='r',allow_pickle=False)
        if a.ndim!=1 or a.dtype.kind not in 'uif' or a.dtype.itemsize>8:raise ValueError('Numeric cache vectors required')
        arrays[name]=a
    graphs=[]
    for k,report in enumerate(manifest['graphs']):
        if type(report['nodes']) is not int or not 0<=report['nodes']<=15000000:raise ValueError('Original graph node budget required')
        get=lambda f:arrays[f'{k}-{f}.npy']
        ids=get('osm_ids');n=len(ids)
        if ids.dtype.kind not in 'ui' or n!=report['nodes']:raise ValueError('Native integer identities required')
        matrices={}
        for metric in ['length','travel_time']:
            data,indices,indptr=[get(metric+'.'+f) for f in ['data','indices','indptr']]
            if len(data)>40000000 or len(indptr)!=n+1 or indices.dtype.kind not in 'ui' or indptr.dtype.kind not in 'ui':raise ValueError('Original CSR budgets/types required')
            matrices[metric]=csr_array((data,indices,indptr),shape=(n,n))
        g=PrimitiveSparseGraph({int(node):i for i,node in enumerate(ids)},ids,get('longitude'),get('latitude'),matrices['length'],matrices['travel_time'],report)
        validate(g);graphs.append(g)
    return tuple(graphs),manifest['context']
