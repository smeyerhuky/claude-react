"""Fixed reference-time research policy, never a route/access attestation."""
from datetime import datetime
import argparse
from functools import lru_cache
import hashlib
from importlib import resources
import json
from pathlib import Path
import re
from zoneinfo import ZoneInfo
import tzdata

ROOT=Path(__file__).resolve().parents[1]
SCENARIO=ROOT/'docs/research/reference-road-scenario/scenario.json'
TZDATA_VERSION='2026.5'
IANA_RELEASE='2026e'
POLICIES=dict(access_time_policy='frozen-at-reference-instant',
              local_clock_policy='convert-reference-utc-at-each-controlled-feature-using-explicit-iana-zone',
              travel_time_policy='modeled-free-flow',traffic_policy='not-modeled',
              waiting_policy='not-modeled',arrival_time_access_policy='not-reevaluated',
              unknown_condition_policy='unsupported-never-assumed-open',
              unknown_clearance_policy='unsupported-until-vehicle-dimensions-are-specified')
VEHICLE=dict(kind='ordinary-private-passenger-car',occupants=1,special_permits=[],
             hov_exemption=False,tolls_allowed=True,height_m=None,width_m=None,length_m=None,mass_kg=None)
FALSE_FLAGS=('old_checkpoint_evaluated_under_scenario','access_verified','release_eligible')


def require(value,message):
    if not value:raise ValueError(message)


def validate(scenario):
    expected={'schema','reference_instant_utc','timezone_data','vehicle',*POLICIES,*FALSE_FLAGS}
    require(isinstance(scenario,dict) and set(scenario)==expected
            and scenario['schema']=='road-reference-scenario-v1','Explicit supported scenario schema required')
    require(all(scenario[k]==v for k,v in POLICIES.items())
            and all(scenario[k] is False for k in FALSE_FLAGS),'No undeclared timing policy or certification')
    require(scenario['vehicle']==VEHICLE and type(scenario['vehicle']['occupants']) is int
            and type(scenario['vehicle']['hov_exemption']) is bool and type(scenario['vehicle']['tolls_allowed']) is bool,
            'Explicit solo-car profile without permits, exemptions or invented dimensions required')
    require(scenario['timezone_data']==dict(package='tzdata',version=TZDATA_VERSION,iana_release=IANA_RELEASE)
            and tzdata.__version__==TZDATA_VERSION and tzdata.IANA_VERSION==IANA_RELEASE,
            'Exact declared timezone data required; no host database fallback')
    raw=scenario['reference_instant_utc']
    require(isinstance(raw,str) and re.fullmatch(r'[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}Z',raw),
            'Unambiguous UTC reference instant required')
    instant=datetime.fromisoformat(raw[:-1]+'+00:00')
    require(2000<=instant.year<=2100,'Bounded reference year required')
    return instant


def digest(scenario):
    validate(scenario)
    return hashlib.sha256(json.dumps(scenario,sort_keys=True,separators=(',',':'),allow_nan=False).encode()).hexdigest()


@lru_cache(maxsize=128)
def declared_zone(zone):
    require(isinstance(zone,str) and len(zone)<=128
            and re.fullmatch(r'[A-Za-z0-9_+-]+(?:/[A-Za-z0-9_+-]+)*',zone),
            'Explicit IANA zone required; no filesystem paths')
    require(tzdata.__version__==TZDATA_VERSION and tzdata.IANA_VERSION==IANA_RELEASE,'Pinned timezone package required')
    path=resources.files('tzdata.zoneinfo').joinpath(*zone.split('/'))
    require(path.is_file(),'Unknown IANA zone is unsupported, never UTC by default')
    with path.open('rb') as handle:return ZoneInfo.from_file(handle,key=zone)


def local_reference(scenario,zone):
    return validate(scenario).astimezone(declared_zone(zone))


def planned_tooltip(scenario):
    instant=validate(scenario);mountain=local_reference(scenario,'America/Denver')
    return (f"Reference: {mountain.strftime('%d %b %Y, %H:%M %Z')} "
            f"({instant.strftime('%H:%M UTC')}). Solo passenger car. Access is frozen at that instant; "
            "free-flow time excludes traffic and waiting. Conditions may change before arrival. "
            "Vehicle, reviewed-anchor and coverage limits apply; unsupported areas remain transparent.")


def load():
    scenario=json.loads(SCENARIO.read_text());validate(scenario);return scenario


def info_projection():
    scenario=load()
    return dict(schema='planned-road-scenario-info-v1',scenario_sha256=digest(scenario),
                reference_instant_utc=scenario['reference_instant_utc'],
                planned_info_tooltip=planned_tooltip(scenario),
                old_checkpoint_evaluated_under_scenario=False,access_verified=False,release_eligible=False)


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--output',type=Path);args=parser.parse_args()
    info=info_projection()
    if args.output:args.output.write_text(json.dumps(info,indent=2,sort_keys=True)+'\n')
    print(json.dumps(info,indent=2))
