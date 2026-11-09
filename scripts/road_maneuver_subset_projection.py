"""Exact maneuver-language projection; never access or geographic graph approval."""
from collections import defaultdict
from road_maneuver_probe import compile_patterns, MAX_ARCS, MAX_MANEUVERS, MAX_MANEUVER_ARCS
from road_turn_aware_probe import _positive_id, _cost
from reference_via_node_compile import canonical_sha, need


def project_to_arc_subset(arcs, maneuvers, allowed_arc_ids, *, max_projected_patterns=MAX_MANEUVERS):
    need(isinstance(arcs,list) and len(arcs)<=MAX_ARCS
         and isinstance(maneuvers,list) and len(maneuvers)<=MAX_MANEUVERS,
         'Bounded explicit context arcs and complete maneuver list required')
    need(type(max_projected_patterns) is int and 0<=max_projected_patterns<=MAX_MANEUVERS,
         'Bounded projected-pattern budget required')
    by_id={}
    for arc in arcs:
        need(isinstance(arc,dict) and isinstance(arc.get('id'),str) and arc['id']
             and arc['id'] not in by_id and all(_positive_id(arc.get(k)) for k in ('way','from','to')),
             'Unique context arc identities and positive endpoints required')
        for key in ('length','travel_time'): _cost(arc[key])
        by_id[arc['id']]=arc
    need(isinstance(allowed_arc_ids,(list,tuple,set)) and len(allowed_arc_ids)<=len(arcs)
         and all(isinstance(a,str) and a in by_id for a in allowed_arc_ids)
         and len(set(allowed_arc_ids))==len(allowed_arc_ids), 'Unique declared subset of context arcs required')
    allowed=set(allowed_arc_ids);original=compile_patterns(maneuvers,by_id)
    outgoing=defaultdict(list)
    for aid in sorted(allowed): outgoing[by_id[aid]['from']].append(aid)
    rules={};omitted=[];total_arcs=0
    def emit(kind,sequence,origin,reason):
        nonlocal total_arcs
        key=(kind,tuple(sequence))
        if key not in rules:
            need(len(rules)<max_projected_patterns,'Projected maneuver budget exceeded; no partial result')
            total_arcs+=len(sequence)
            need(total_arcs<=MAX_MANEUVER_ARCS,'Projected maneuver arc budget exceeded')
            rules[key]=[]
        rules[key].append(dict(source_pattern_id=origin,transformation=reason))
    for pattern in original:
        sequence=pattern['sequence'];origin=pattern['id']
        missing=next((i for i,a in enumerate(sequence) if a not in allowed),None)
        if missing is None:
            emit(pattern['kind'],sequence,origin,'unchanged');continue
        if pattern['kind']=='no' or missing==0:
            omitted.append(dict(source_pattern_id=origin,reason='complete-no-occurrence-impossible' if pattern['kind']=='no' else 'only-activation-arc-omitted'))
            continue
        prefix=sequence[:missing]
        if len(prefix)>=2:emit('only',prefix,origin,'retained-only-prefix-before-first-omitted-arc')
        if len(prefix)==1 and not outgoing[by_id[prefix[-1]]['to']]:
            omitted.append(dict(source_pattern_id=origin,reason='only-prefix-already-terminal-in-subset'))
        # Dropping ONLY here would legalize internal alternatives. A path may
        # end at the prefix's final node, but every remaining departure is NO.
        for following in outgoing[by_id[prefix[-1]]['to']]:
            emit('no',(*prefix,following),origin,'block-internal-continuation-at-omitted-required-arc')
    projected=[];provenance={}
    for index,((kind,sequence),origins) in enumerate(sorted(rules.items())):
        identity=f'subset-rule-{index}'
        projected.append(dict(id=identity,kind=kind,arc_sequence=list(sequence)))
        provenance[identity]=origins
    # Some interacting valid ONLY rules project to a NO inside another ONLY.
    # The existing solver rejects that representation: preserve its guard and
    # fail without a partial projection, rather than relaxing either rule.
    compile_patterns(projected,{aid:by_id[aid] for aid in allowed})
    return dict(schema='declared-maneuver-arc-subset-projection-v1',
        context_sha256=canonical_sha(dict(arcs=arcs,maneuvers=maneuvers)),
        allowed_arc_ids=sorted(allowed),projected_maneuvers=projected,projected_rule_origins=provenance,
        omitted_patterns=omitted,unconstrained_start_and_terminal_prefix_semantics_preserved=True,
        access_verified=False,geographic_coverage_certified=False,anchors_adopted=False,release_eligible=False,
        warning='Constraint-language equivalence for paths entirely in the declared subset only. All original controls must first be completely and correctly compiled. No physical/legal access, missing-control closure, approach history or geographic graph admission is established.')
