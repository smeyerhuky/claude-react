"""Pin probe computation to the independently replayed parent graph policy."""
import hashlib,json
from importlib.metadata import version
from pathlib import Path
from las_vegas_checkpoint import ROOT,project
from metro_scenario_checkpoint import require
REFERENCE=ROOT/'docs/research/las-vegas-probe-extension'


def verify(path,*,require_current=False):
    manifest=json.loads((REFERENCE/'retained33-manifest.json').read_text());raw=Path(path).read_bytes()
    require(manifest['schema']=='retained33-original-source-replay-v1' and manifest['access_certified'] is False and manifest['release_eligible'] is False,'Research-only independently replayed parent reference required')
    require(hashlib.sha256(raw).hexdigest()==manifest['report_sha256'],'Exact retained independent33-source report required')
    report=json.loads(raw);semantic=project(report)
    require(hashlib.sha256(json.dumps(semantic,sort_keys=True,separators=(',',':')).encode()).hexdigest()==manifest['projection_sha256'],'Retained parent semantic projection changed')
    policy=dict(graph_source_sha256=manifest['graph_source_sha256'],graph_dependency_versions=manifest['graph_dependency_versions'])
    if require_current:
        for name,digest in policy['graph_source_sha256'].items():
            file=(ROOT/name).resolve();require(file.is_relative_to(ROOT) and file.is_file() and hashlib.sha256(file.read_bytes()).hexdigest()==digest,'Graph source differs from the independently replayed parent: '+name)
        for name,expected in policy['graph_dependency_versions'].items():require(version(name)==expected,'Graph dependency differs from independent parent: '+name)
    return report,semantic,hashlib.sha256(json.dumps(policy,sort_keys=True,separators=(',',':')).encode()).hexdigest()
