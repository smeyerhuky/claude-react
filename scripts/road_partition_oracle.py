"""Bounded two-shard primitive shortest paths; no access/coverage certification."""
from fractions import Fraction
import hashlib
import math

import numpy as np
from scipy.sparse import csr_array
from scipy.sparse.csgraph import dijkstra

from colorado_sparse_parent_oracle import trace_path


def close(a, b):
    return math.isclose(float(a), float(b), abs_tol=.002, rel_tol=1e-9)


def validate(graph):
    n = len(graph.osm_ids)
    limits = graph.report.get('resource_limits', {})
    if (type(limits.get('nodes')) is not int or not n <= limits['nodes'] <= 15000000
            or type(limits.get('arcs')) is not int or not graph.length.nnz <= limits['arcs'] <= 40000000
            or graph.report['unique_directed_pairs'] != graph.length.nnz):
        raise ValueError('Each individual shard must respect unchanged primitive resource caps')
    if (not n or len(graph.node_index) != n or graph.report['nodes'] != n
            or any(graph.report.get(f) is not False for f in ('release_eligible', 'access_certified',
                'road_coverage_certified', 'complete_global_competition', 'turn_restrictions_modeled'))
            or graph.report['routing_model'] != 'static-passenger-car-v2:directed-primitive-sparse-reference'
            or len(graph.longitude) != n or len(graph.latitude) != n
            or not np.all(np.isfinite(graph.longitude)) or not np.all(np.isfinite(graph.latitude))
            or np.any(np.abs(graph.longitude)>180) or np.any(np.abs(graph.latitude)>90)):
        raise ValueError('Complete research-only primitive node-state graph required')
    if any(graph.node_index.get(int(node)) != i for i, node in enumerate(graph.osm_ids)):
        raise ValueError('Primitive node index/identity mismatch')
    for metric in ('length', 'travel_time'):
        a = getattr(graph, metric)
        if (a.shape != (n, n) or not a.has_canonical_format or not a.has_sorted_indices
                or a.dtype != np.float64 or len(a.indices) != len(a.data)
                or a.indptr[0] != 0 or a.indptr[-1] != len(a.data)
                or np.any(a.indptr[1:] < a.indptr[:-1])
                or np.any(a.indices < 0) or np.any(a.indices >= n)
                or not np.all(np.isfinite(a.data)) or np.any(a.data < 0)
                or not np.array_equal(a.indptr, graph.length.indptr)
                or not np.array_equal(a.indices, graph.length.indices)):
            raise ValueError('Sorted finite nonnegative common directed topology required')


class TwoPartitionOracle:
    def __init__(self, prefix, addition, *, max_ports=128):
        if type(max_ports) is not int or not 1 <= max_ports <= 128:
            raise ValueError('Explicit interface budget required')
        for graph in (prefix, addition):
            validate(graph)
        self.graphs = (prefix, addition)
        old = np.fromiter((prefix.node_index.get(int(n), -1) for n in addition.osm_ids),
                          dtype=np.int64, count=len(addition.osm_ids))
        shared = old >= 0
        indices = np.flatnonzero(shared)
        if (not np.array_equal(prefix.longitude[old[indices]], addition.longitude[indices])
                or not np.array_equal(prefix.latitude[old[indices]], addition.latitude[indices])):
            raise ValueError('Shared OSM identity has inconsistent geometry')
        coo = addition.length.tocoo(copy=False)
        incoming = ~shared[coo.row] & shared[coo.col]
        outgoing = shared[coo.row] & ~shared[coo.col]
        ports = set(map(int, coo.col[incoming])) | set(map(int, coo.row[outgoing]))
        improving_pairs = set()
        # Shared/shared arcs dominated in BOTH metrics by an existing prefix arc
        # can be traversed in the prefix. Every other endpoint must be exposed.
        for u in indices:
            left, right = addition.length.indptr[u:u+2]
            for offset in range(left, right):
                v = int(addition.length.indices[offset])
                if not shared[v]:
                    continue
                a, b = int(old[u]), int(old[v])
                x, y = prefix.length.indptr[a:a+2]
                pos = int(x)+int(np.searchsorted(prefix.length.indices[x:y], b))
                present = pos < y and prefix.length.indices[pos] == b
                if not present or any(getattr(addition, m).data[offset] < getattr(prefix, m).data[pos]
                                      for m in ('length', 'travel_time')):
                    ports.update((int(u), v)); improving_pairs.add((int(u), v))
        if len(ports) > max_ports:
            raise ValueError(f'Interface port budget exceeded: {len(ports)} > {max_ports}; never truncate')
        self.ports = sorted(int(addition.osm_ids[i]) for i in ports)
        self.audit = {'shared_vertices': len(indices), 'interface_ports': self.ports,
            'prefix_inbound_directed_pairs': int(incoming.sum()),
            'prefix_outbound_directed_pairs': int(outgoing.sum()),
            'nondominated_shared_directed_pairs': len(improving_pairs),
            'conceptual_union_nodes': len(prefix.osm_ids)+len(addition.osm_ids)-len(indices),
            'flattened_road_union_constructed': False}

    def solve(self, sources, targets, metric, *, reverse=False, keep_paths=False, max_oracles=512):
        if (metric not in ('length', 'travel_time') or type(reverse) is not bool
                or not 1 <= len(sources) <= 32 or not 1 <= len(targets) <= 32
                or len(set(sources)) != len(sources) or len(set(targets)) != len(targets)
                or any(type(n) is not int or not 0 < n <= 2**63-1 for n in [*sources, *targets])
                or type(keep_paths) is not bool
                or len(sources)*len(targets) > 1024
                or type(max_oracles) is not int or not 1 <= max_oracles <= 512):
            raise ValueError('Bounded unique source/target queries and metric required')
        endpoints = sorted(set(self.ports) | set(sources) | set(targets))
        if len(endpoints) > 192 or any(not any(n in g.node_index for g in self.graphs) for n in endpoints):
            raise ValueError('Missing endpoint or overlay budget exceeded')
        lookup = {n: i for i, n in enumerate(endpoints)}
        size = len(endpoints)
        costs = np.full((size, size), np.inf)
        owners = np.full((size, size), -1, dtype=np.int8)
        origins = sorted(set(self.ports) | set(sources))
        calls = 0
        prefix_costs = {}
        matrices = [getattr(g, metric) for g in self.graphs]
        if reverse:
            matrices = [a.transpose().tocsr() for a in matrices]

        def oracle(shard, node, predecessors=False):
            nonlocal calls
            calls += 1
            if calls > max_oracles:
                raise ValueError('Local shortest-path oracle budget exceeded')
            return dijkstra(matrices[shard], directed=True,
                indices=self.graphs[shard].node_index[node], return_predecessors=predecessors)

        for shard, graph in enumerate(self.graphs):
            owned = [n for n in endpoints if n in graph.node_index]
            local = np.array([graph.node_index[n] for n in owned], dtype=np.int64)
            overlay = np.array([lookup[n] for n in owned], dtype=np.int64)
            for node in origins:
                if node not in graph.node_index:
                    continue
                labels = oracle(shard, node)
                values = labels[local]
                if shard == 0 and node in sources:
                    for target in targets:
                        if target in graph.node_index:
                            value = float(labels[graph.node_index[target]])
                            prefix_costs[node, target] = value if math.isfinite(value) else None
                if np.any(np.isnan(values)) or np.any(values < 0):
                    raise ValueError('Invalid local distance label')
                row = lookup[node]
                better = values < costs[row, overlay]
                costs[row, overlay[better]] = values[better]
                owners[row, overlay[better]] = shard
                del labels
        # Explicit coordinate construction retains zero arcs; each pair appears
        # once, so COO->CSR cannot sum parallel alternatives from the shards.
        rows, cols = np.where(np.isfinite(costs))
        small = csr_array((costs[rows, cols], (rows, cols)), shape=(size, size))
        results, required = [], {}
        for source in sources:
            labels, pred = dijkstra(small, directed=True, indices=lookup[source], return_predecessors=True)
            for target in targets:
                value = float(labels[lookup[target]])
                legs = []
                if math.isfinite(value):
                    path, total = trace_path(small, pred, lookup[source], lookup[target])
                    if not close(total, value):
                        raise ValueError('Overlay predecessor replay mismatch')
                    for u, v in zip(path, path[1:]):
                        shard = int(owners[u, v])
                        if shard not in (0, 1):
                            raise ValueError('Overlay edge lacks an owning local route')
                        key = (shard, endpoints[u], endpoints[v])
                        required.setdefault((shard, endpoints[u]), set()).add(endpoints[v])
                        legs.append(key)
                results.append({'source': source, 'target': target,
                    'cost': value if math.isfinite(value) else None, 'segments': legs,
                    'prefix_cost': prefix_costs.get((source, target)),
                    'prefix_cost_status': ('not_computed_endpoint_outside_prefix' if (source, target) not in prefix_costs
                        else 'unreachable_in_prefix' if prefix_costs[source, target] is None else 'computed_in_prefix')})
        replayed = {}
        for (shard, source), destinations in sorted(required.items()):
            graph = self.graphs[shard]; matrix = matrices[shard]
            labels, pred = oracle(shard, source, True)
            for target in sorted(destinations):
                start, end = graph.node_index[source], graph.node_index[target]
                path, total = trace_path(matrix, pred, start, end)
                value = float(labels[end])
                if not close(total, value) or value != costs[lookup[source], lookup[target]]:
                    raise ValueError('Local stored-arc replay disagrees with overlay edge')
                raw = np.asarray(graph.osm_ids[path], dtype='<u8')
                leg = {'shard': shard, 'from': source, 'to': target,
                    'exact_stored_path_cost': [str(total.numerator), str(total.denominator)],
                    'raw_node_count': len(raw), 'solver_path_sha256': hashlib.sha256(raw.tobytes()).hexdigest(),
                    'actual_directed_path_sha256': hashlib.sha256((raw[::-1] if reverse else raw).tobytes()).hexdigest(),
                    'solver_path_orientation': 'reversed_model_graph' if reverse else 'model_graph'}
                if keep_paths:
                    leg['solver_node_path'] = list(map(int, raw))
                replayed[shard, source, target] = leg
            del labels, pred
        finite = 0
        for row in results:
            if row['prefix_cost'] is not None and (row['cost'] is None or
                    row['cost'] > row['prefix_cost']+max(.002, abs(row['prefix_cost'])*1e-9)):
                raise ValueError('Composed query lost a feasible prefix route')
            if row['cost'] is None:
                row['exact_stored_path_cost'] = None
                continue
            total = sum((Fraction(*map(int, replayed[k]['exact_stored_path_cost'])) for k in row['segments']), Fraction(0))
            if not close(total, row['cost']):
                raise ValueError('Composed primitive-arc replay mismatch')
            row['exact_stored_path_cost'] = [str(total.numerator), str(total.denominator)]
            finite += 1
        return {'release_eligible': False, 'access_certified': False, 'road_coverage_certified': False,
            'complete_global_competition': False, 'metric': metric, 'reverse': reverse,
            'results': results, 'legs': list(replayed.values()), 'finite_queries_replayed': finite,
            'local_dijkstra_calls': calls, 'overlay_nodes': size, 'overlay_directed_pairs': int(small.nnz),
            'warning': 'Supplied two-shard static primitive graph only; no connectors, turns/grade, geographic or exterior closure certification. Exact stored-path replay is not independent real-world evidence.'}
