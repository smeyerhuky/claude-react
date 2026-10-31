"""Research-only minimum full-cost algebra for a complete declared metro anchor set.

This cannot load/approve connectors or certify that costs are optimal, physically
valid or compatible with a turn-state graph. No production caller is installed.
"""
from fractions import Fraction
import hashlib
import json
import math
import re
from urllib.parse import urlparse

SCHEMA = 'metro-anchor-set-research-v2'
METRICS = {'length': 'meters', 'travel_time': 'seconds'}
DIRECTIONS = {'from_anchor', 'to_anchor'}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def identity(value):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= 256


def digest(value):
    return isinstance(value, str) and re.fullmatch('[0-9a-f]{64}', value) is not None


def registry_digest(registry):
    return hashlib.sha256(json.dumps(registry, sort_keys=True, separators=(',', ':'),
                                    allow_nan=False).encode()).hexdigest()


def validate_registry(registry):
    require(registry.get('schema') == SCHEMA and registry.get('research_only') is True,
            'Versioned research registry required; not an approval ledger')
    require(isinstance(registry.get('cbsa'), str) and re.fullmatch('[0-9]{5}', registry['cbsa'])
            and identity(registry.get('set_version')), 'Explicit CBSA and anchor-set version required')
    source = registry.get('principal_city_source', {})
    url = urlparse(source.get('url', ''))
    require(url.scheme == 'https' and bool(url.hostname) and not url.username and not url.password
            and digest(source.get('sha256')), 'Principal-city source identity required')
    cities = registry.get('principal_city_ids', [])
    require(isinstance(cities, list) and 0 < len(cities) <= 100
            and all(identity(c) for c in cities) and len(set(cities)) == len(cities),
            'Complete unique explicitly sourced principal-city IDs required')
    anchors = registry.get('anchors', [])
    require(isinstance(anchors, list) and 0 < len(anchors) <= 1000,
            'Bounded nonempty declared anchor set required')
    seen = set(); covered = set()
    for anchor in anchors:
        aid = anchor.get('id'); city = anchor.get('principal_city_id')
        require(identity(aid) and aid not in seen and city in cities,
                'Unique anchor identity and declared principal-city membership required')
        seen.add(aid); covered.add(city)
    require(covered == set(cities), 'Every declared principal city needs an expected anchor')
    return seen


def stored_cost(value):
    require(type(value) in (int, float) and (type(value) is int or math.isfinite(value)),
            'Explicit finite numeric cost required')
    require(0 <= value <= 10**15, 'Bounded nonnegative cost required')
    return Fraction(value)


def aggregate(registry, records, *, graph_bundle_sha256, scenario_sha256, sample_id, metric, direction):
    expected = validate_registry(registry)
    require(digest(graph_bundle_sha256) and digest(scenario_sha256) and identity(sample_id)
            and metric in METRICS and direction in DIRECTIONS, 'Explicit query identity required')
    require(isinstance(records, list) and len(records) <= len(expected),
            'One bounded query record per expected anchor required')
    binding = registry_digest(registry); values = {}; unreachable = []; unknown = {}
    for row in records:
        aid = row.get('anchor_id')
        require(aid in expected and aid not in values and aid not in unreachable and aid not in unknown,
                'Unexpected or duplicate anchor record')
        require(row.get('schema') == SCHEMA and row.get('cbsa') == registry['cbsa']
                and row.get('registry_sha256') == binding
                and row.get('graph_bundle_sha256') == graph_bundle_sha256
                and row.get('scenario_sha256') == scenario_sha256
                and row.get('sample_id') == sample_id and row.get('metric') == metric
                and row.get('direction') == direction and row.get('unit') == METRICS[metric],
                'Mixed registry, CBSA, graph, scenario, sample, metric, direction or units')
        status = row.get('status')
        if status == 'finite':
            # Never infer a zero connector from a graph-only route. Direction and
            # metric apply to both components; turn compatibility is a separate gate.
            values[aid] = stored_cost(row.get('graph_cost')) + stored_cost(row.get('connector_cost'))
        else:
            require(row.get('graph_cost') is None and row.get('connector_cost') is None,
                    'Nonfinite result cannot carry fabricated component costs')
            if status == 'modeled_unreachable':
                require(identity(row.get('reason')), 'Modeled unreachable needs an explicit reason')
                unreachable.append(aid)
            else:
                require(status == 'unknown' and identity(row.get('reason')), 'Explicit unknown reason required')
                unknown[aid] = row['reason']
    for aid in sorted(expected - values.keys() - set(unreachable) - unknown.keys()):
        unknown[aid] = 'missing required anchor result'
    best = min(values.values()) if values else None
    winners = sorted(aid for aid, value in values.items() if value == best)
    status = 'unknown' if unknown else ('finite' if best is not None else 'modeled_unreachable')
    def exact(value):
        return None if value is None else [str(value.numerator), str(value.denominator)]
    return dict(schema=SCHEMA, cbsa=registry['cbsa'], registry_sha256=binding,
                graph_bundle_sha256=graph_bundle_sha256, scenario_sha256=scenario_sha256, sample_id=sample_id,
                metric=metric, direction=direction, unit=METRICS[metric], status=status,
                cost=float(best) if status == 'finite' else None,
                exact_stored_cost=exact(best) if status == 'finite' else None,
                minimizing_anchor_ids=winners if status == 'finite' else [],
                finite_subset_upper_bound=float(best) if unknown and best is not None else None,
                exact_finite_subset_upper_bound=exact(best) if unknown else None,
                finite_subset_anchor_ids=winners if unknown else [],
                unknown_anchor_reasons=dict(sorted(unknown.items())),
                modeled_unreachable_anchor_ids=sorted(unreachable),
                expected_anchor_count=len(expected), accounted_anchor_count=len(records),
                research_only=True, anchors_adopted=False, access_verified=False,
                release_eligible=False,
                warning='Algebra on declared costs only; no registry completeness, principal-city selection, turn/connector compatibility, shortest-path, geographic coverage or real-world access certification. Existing #137 approval gate still applies.')
