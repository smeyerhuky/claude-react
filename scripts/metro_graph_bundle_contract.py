"""Research input identity contract; never a graph loader or release approval."""
import argparse
from copy import deepcopy
from datetime import datetime, timezone
import hashlib
import json
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[1]
SCHEMA = 'metro-graph-bundle-inputs-research-v1'
MAX_MANIFEST_BYTES = 1024 * 1024
MAX_SOURCES = 64
MAX_SOURCE_BYTES = 64 * 1024**3
MAX_TOTAL_BYTES = 2 * 1024**4
FALSE_FLAGS = ('access_verified', 'anchors_adopted', 'connector_costs_included',
               'geographic_coverage_certified', 'release_eligible')
FIELDS = {'schema', 'research_only', 'osm_sources', 'bindings', 'historical_scenario',
          'retained_inputs', *FALSE_FLAGS}
BINDINGS = {'graph_model_sha256', 'domains_sha256', 'query_endpoint_set_sha256',
            'native_origin_records_sha256', 'retained_graph_policy_sha256'}
METRICS = {'length': 'meters', 'travel_time': 'seconds'}
DIRECTIONS = {'metro-to-location', 'location-to-metro'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def sha256(value):
    return hashlib.sha256(value).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, separators=(',', ':'), allow_nan=False).encode()


def is_digest(value):
    return isinstance(value, str) and re.fullmatch('[a-f0-9]{64}', value) is not None


def local_name(value):
    return isinstance(value, str) and re.fullmatch(r'[a-z0-9][a-z0-9-]{0,119}\.osm\.pbf', value) is not None


def relative_file(value):
    return (isinstance(value, str) and 0 < len(value) <= 256
            and re.fullmatch('[A-Za-z0-9_./-]+', value) is not None
            and not value.startswith('/') and all(p not in ('', '.', '..') for p in value.split('/')))


def read_document(path):
    def unique(pairs):
        result = {}
        for key, value in pairs:
            require(key not in result, 'Duplicate JSON key is ambiguous')
            result[key] = value
        return result
    with Path(path).open('rb') as handle:
        raw = handle.read(MAX_MANIFEST_BYTES + 1)
    require(len(raw) <= MAX_MANIFEST_BYTES, 'Manifest byte budget exceeded')
    return json.loads(raw, object_pairs_hook=unique,
                      parse_constant=lambda value: require(False, 'Nonfinite JSON is unsupported'))


def validate(bundle):
    require(type(bundle) is dict and set(bundle) == FIELDS and bundle['schema'] == SCHEMA
            and bundle['research_only'] is True, 'Exact research-only bundle schema required')
    require(all(bundle[key] is False for key in FALSE_FLAGS), 'Input accounting cannot assert approval')
    sources = bundle['osm_sources']
    require(type(sources) is list and 0 < len(sources) <= MAX_SOURCES, 'Bounded nonempty OSM input set required')
    names = []; digests = []; total = 0
    for source in sources:
        require(type(source) is dict and set(source) == {'name', 'sha256', 'size_bytes', 'replication_timestamp'},
                'Exact OSM source identity fields required')
        require(local_name(source['name']) and is_digest(source['sha256'])
                and type(source['size_bytes']) is int and 0 < source['size_bytes'] <= MAX_SOURCE_BYTES,
                'Safe basename, SHA-256 and bounded integer source size required')
        stamp = source['replication_timestamp']
        require(isinstance(stamp, str) and re.fullmatch(r'\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z', stamp),
                'Explicit UTC replication timestamp required')
        datetime.strptime(stamp, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=timezone.utc)
        names.append(source['name']); digests.append(source['sha256']); total += source['size_bytes']
    require(names == sorted(set(names)) and len(set(digests)) == len(digests),
            'Sorted unique source names and distinct content identities required')
    require(total <= MAX_TOTAL_BYTES, 'Aggregate OSM byte budget exceeded')
    bindings = bundle['bindings']
    require(type(bindings) is dict and set(bindings) == BINDINGS
            and all(is_digest(value) for value in bindings.values()), 'Complete graph/origin/domain/query bindings required')
    scenario = bundle['historical_scenario']
    require(type(scenario) is dict and set(scenario) == {'scenario_id', 'fixed_reference_scenario_applied',
                                                       'fixed_reference_scenario_sha256'}
            and isinstance(scenario['scenario_id'], str)
            and re.fullmatch('[a-z0-9-]{1,128}', scenario['scenario_id'])
            and scenario['fixed_reference_scenario_applied'] is False
            and scenario['fixed_reference_scenario_sha256'] is None,
            'Historical costs cannot claim the fixed-reference scenario was applied')
    inputs = bundle['retained_inputs']
    require(type(inputs) is dict and 0 < len(inputs) <= 128
            and all(relative_file(path) and is_digest(digest) for path, digest in inputs.items()),
            'Bounded repository-local retained-input fingerprints required')
    require(len(canonical(bundle)) <= MAX_MANIFEST_BYTES, 'Manifest byte budget exceeded')
    return dict(bundle_sha256=sha256(canonical(bundle)), osm_input_files=len(sources),
                declared_osm_bytes=total, source_bytes_verified=False, **{key: False for key in FALSE_FLAGS})


def verify_expected(bundle, expected_bundle_sha256):
    """The expected digest must come from a separately selected retained checkpoint."""
    result = validate(bundle)
    require(is_digest(expected_bundle_sha256) and result['bundle_sha256'] == expected_bundle_sha256,
            'Bundle differs from the independently selected expected identity')
    return result


def verify_retained_inputs(bundle, root=ROOT):
    validate(bundle)
    root = Path(root).resolve()
    for relative, expected in bundle['retained_inputs'].items():
        path = (root / relative).resolve()
        require(path.is_relative_to(root) and path.is_file(), 'Retained input escapes repository or is missing')
        with path.open('rb') as handle:
            actual = hashlib.file_digest(handle, 'sha256').hexdigest()
        require(actual == expected, 'Retained input bytes changed: ' + relative)
    return dict(retained_inputs_verified=len(bundle['retained_inputs']), source_bytes_verified=False,
                release_eligible=False)


def verify_source_bytes(bundle, directory, *, expected_bundle_sha256):
    """All declared originals must match; a partial directory never yields success."""
    verify_expected(bundle, expected_bundle_sha256)
    root = Path(directory).resolve()
    require(root.is_dir(), 'Original-source directory required')
    # Complete preflight before any hashing; never infer success from a subset.
    paths = []
    for source in bundle['osm_sources']:
        path = (root / source['name']).resolve()
        require(path.is_relative_to(root) and path.is_file(), 'Original source missing or outside source directory: ' + source['name'])
        require(path.stat().st_size == source['size_bytes'], 'Original source byte count changed: ' + source['name'])
        paths.append((source, path))
    for source, path in paths:
        digest = hashlib.sha256(); count = 0
        with path.open('rb') as handle:
            while block := handle.read(1024 * 1024):
                count += len(block)
                require(count <= source['size_bytes'], 'Original source grew during verification')
                digest.update(block)
        require(count == source['size_bytes'] and digest.hexdigest() == source['sha256'],
                'Original source fingerprint changed: ' + source['name'])
    return dict(source_bytes_verified=True, verified_osm_input_files=len(paths),
                replication_header_replayed=False, graph_rebuilt=False, access_verified=False,
                anchors_adopted=False, release_eligible=False)


def bind_query(bundle, *, expected_bundle_sha256, bindings, scenario_id, metric, direction):
    verify_expected(bundle, expected_bundle_sha256)
    require(type(bindings) is dict and bindings == bundle['bindings'], 'Query graph/origin/domain/endpoint policy differs')
    require(scenario_id == bundle['historical_scenario']['scenario_id'], 'Query scenario differs')
    require(isinstance(metric, str) and isinstance(direction, str)
            and metric in METRICS and direction in DIRECTIONS, 'Explicit supported metric and direction required')
    return dict(bundle_sha256=expected_bundle_sha256, bindings=deepcopy(bindings), scenario_id=scenario_id,
                metric=metric, direction=direction, unit=METRICS[metric],
                fixed_reference_scenario_applied=False, connector_costs_included=False, release_eligible=False)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('manifest', type=Path)
    parser.add_argument('--expected-sha256', required=True)
    parser.add_argument('--source-dir', type=Path)
    args = parser.parse_args()
    bundle = read_document(args.manifest)
    result = verify_expected(bundle, args.expected_sha256)
    result.update(verify_retained_inputs(bundle))
    if args.source_dir:
        result.update(verify_source_bytes(bundle, args.source_dir, expected_bundle_sha256=args.expected_sha256))
    print(json.dumps(result, indent=2, sort_keys=True))
