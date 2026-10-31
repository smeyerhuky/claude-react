"""Resolve a bounded weekly-clock conditional tag; never decide legal car access."""
import argparse
from datetime import datetime,timedelta,timezone
import json
from pathlib import Path
import re
from road_reference_scenario import load,local_reference,digest

POLICY='weekly-clock-conditional-reference-v1'
MAX_EXPRESSION=8192
MAX_CLAUSES=32
MAX_INTERVALS=16
MAX_DAY_TERMS=7
DAYS={'Mo':0,'Tu':1,'We':2,'Th':3,'Fr':4,'Sa':5,'Su':6}
KEYS={'access','vehicle','motor_vehicle','motorcar','hov','oneway','oneway:motor_vehicle',
      'oneway:motorcar','restriction','restriction:motor_vehicle','restriction:motorcar',
      'maxspeed','maxheight','maxwidth','maxlength','maxweight'}


class UnsupportedCondition(ValueError):
    pass


def require(value,message):
    if not value:raise UnsupportedCondition(message)


def clock(text,*,end=False):
    require(re.fullmatch(r'[0-9]{2}:[0-9]{2}',text) is not None,'Explicit 24-hour HH:MM clock required')
    hour,minute=map(int,text.split(':'))
    require(0<=minute<60 and (0<=hour<24 or (end and hour==24 and minute==0)),
            'Clock outside supported daily range')
    return (hour*3600+minute*60)*1_000_000


def parse_condition(raw):
    require(isinstance(raw,str) and 0<len(raw)<=MAX_EXPRESSION,'Bounded weekly-clock condition required')
    text=re.sub(r'\s*,\s*',',',raw.strip())
    parts=text.split()
    require(1<=len(parts)<=2,'Only a weekday set and daily clock intervals are supported')
    if ':' in parts[0]:
        require(len(parts)==1,'Unsupported extra condition selector')
        day_text=None;time_text=parts[0]
    else:
        day_text=parts[0];time_text=parts[1] if len(parts)==2 else None
    if day_text is None:days=set(range(7))
    else:
        terms=day_text.split(',');require(len(terms)<=MAX_DAY_TERMS,'Weekday term budget exceeded')
        days=set()
        for term in terms:
            match=re.fullmatch(r'(Mo|Tu|We|Th|Fr|Sa|Su)(?:-(Mo|Tu|We|Th|Fr|Sa|Su))?',term)
            require(match is not None,'Unsupported holiday, calendar, purpose, weather or weekday selector')
            first=DAYS[match[1]];last=DAYS[match[2] or match[1]]
            days.update((first+step)%7 for step in range((last-first)%7+1))
    if time_text is None:intervals=[(0,24*3600*1_000_000)]
    else:
        values=time_text.split(',');require(len(values)<=MAX_INTERVALS,'Clock interval budget exceeded')
        intervals=[]
        for value in values:
            match=re.fullmatch(r'([0-9]{2}:[0-9]{2})-([0-9]{2}:[0-9]{2})',value)
            require(match is not None,'Unsupported clock expression')
            start,end=clock(match[1]),clock(match[2],end=True)
            require(start!=end,'Equal clock endpoints require explicit 00:00-24:00 or separate review')
            intervals.append((start,end))
    return frozenset(days),tuple(intervals)


def matches(parsed,local):
    days,intervals=parsed
    time=((local.hour*3600+local.minute*60+local.second)*1_000_000+local.microsecond)
    for start,end in intervals:
        if start<end:
            if local.weekday() in days and start<=time<end:return True
        elif ((local.weekday() in days and time>=start)
              or ((local.weekday()-1)%7 in days and time<end)):
            return True
    return False


def parse_expression(raw):
    require(isinstance(raw,str) and 0<len(raw)<=MAX_EXPRESSION,'Bounded nonempty conditional expression required')
    clauses=raw.split(';');require(len(clauses)<=MAX_CLAUSES,'Conditional clause budget exceeded')
    parsed=[]
    for clause in clauses:
        require(clause.count('@')==1,'One value-condition pair per outer clause required')
        value,condition=(part.strip() for part in clause.split('@'))
        require(len(value)<=128 and re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9_. +\-]*',value),
                'Unsupported raw conditional value')
        if condition.startswith('('):
            require(condition.endswith(')'),'Unbalanced conditional parentheses')
            condition=condition[1:-1].strip()
        require('(' not in condition and ')' not in condition,'Nested or unbalanced conditional syntax unsupported')
        # Parse ALL clauses before evaluating any. A matching early clause
        # cannot mask a later unknown condition that could override it.
        parsed.append((value,parse_condition(condition)))
    return parsed


def resolve_tag(tags,key,scenario,zone):
    require(isinstance(tags,dict) and key in KEYS,'Explicit supported raw road tag required')
    base=tags.get(key)
    require(base is None or (isinstance(base,str) and 0<len(base)<=512 and '@' not in base),
            'Missing or explicit nonconditional base required; inline conditionals need separate handling')
    conditional=tags.get(key+':conditional')
    clauses=parse_expression(conditional) if key+':conditional' in tags else []
    local=local_reference(scenario,zone);active=[i for i,(_,condition) in enumerate(clauses) if matches(condition,local)]
    selected=clauses[active[-1]][0] if active else base
    return dict(schema=POLICY,scenario_sha256=digest(scenario),tag_key=key,declared_iana_zone=zone,
                reference_local=local.isoformat(),selected_raw_value=selected,
                value_source='conditional_clause' if active else ('explicit_base' if base is not None else 'missing_explicit_base'),
                matching_clause_indices=active,selected_clause_index=active[-1] if active else None,
                scope='Single raw tag value only; transport hierarchy, direction, lane, purpose and legal/physical access composition not performed',
                tags_mutated=False,route_cost_emitted=False,access_verified=False,release_eligible=False)


def oracle_fixture():
    conditions=['Mo-Fr 06:00-09:00,15:00-19:00','Fr-Mo 20:00-02:00','Mo,We,Fr 08:30-10:15,16:00-24:00']
    start=datetime(2026,10,26,tzinfo=timezone.utc);count=7*24*60;cases=[]
    for condition in conditions:
        parsed=parse_condition(condition)
        bits=''.join('1' if matches(parsed,start+timedelta(minutes=i)) else '0' for i in range(count))
        cases.append(dict(condition=condition,expected_bits=bits))
    return dict(schema='weekly-clock-oracle-fixture-v1',local_wall_clock_start='2026-10-26T00:00:00Z',
                minute_count=count,cases=cases,
                scope='Synthetic wall-clock schedule comparison, not actual UTC route/access or geographic truth',
                access_verified=False,release_eligible=False)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--oracle-fixture',type=Path);args=parser.parse_args()
    if args.oracle_fixture:
        result=oracle_fixture();args.oracle_fixture.write_text(json.dumps(result,sort_keys=True)+'\n')
        print(json.dumps(dict(conditions=len(result['cases']),minute_count=result['minute_count'],access_verified=False)))
    else:
        print(json.dumps(resolve_tag({'motor_vehicle':'yes','motor_vehicle:conditional':'no @ (Mo-Fr 06:00-09:00,15:00-19:00)'},
                                     'motor_vehicle',load(),'America/Phoenix'),indent=2))
