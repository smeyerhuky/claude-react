"""Plan state work from audited identities; never certify state or road coverage."""
import argparse
import hashlib
import json
from pathlib import Path

from build_metro_competitor_explorer import lead_scans
from las_vegas_ui_checkpoint import check_frozen, ROOT
from metro_scenario_checkpoint import require

STATES = 'AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY PR'.split()
BETA_ORDER = 'CO NM AZ UT OK KS WY NV'.split()
OUTPUT = ROOT / 'docs/research/state-release-work-queue'


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def project(baseline, domains, membership, ranks, scans, packets):
    ids = set(baseline['source_qualifying_cbsa_ids'])
    index = {r['cbsa']: r for r in domains['domains']}
    native = {r['cbsa']: r for r in membership['rows']}
    modeled = {r['cbsa'] for r in baseline['sources']}
    require(len(ids) == 367 and set(index) == set(native) == ids
            and len(native) == len(membership['rows']) == len(index) == len(domains['domains']), 'Complete unique 367-identity inventory required')
    require(membership['native_crs'] == domains['native_crs'] == 'EPSG:4269', 'Native NAD83 inventory required')
    require(all(baseline.get(k) is False for k in ('access_certified', 'release_eligible', 'complete_global_competition')), 'Unapproved research baseline required')
    require(set(ranks) == ids - modeled, 'Every unrouted competitor must retain a scheduling rank')
    require(not (set(scans) - ids), 'Foreign lead investigation')
    groups = {state: [] for state in STATES}
    for cbsa in sorted(ids):
        row = native[cbsa]
        require(row['native_representative_lonlat'] == index[cbsa]['native_representative_lonlat'], 'Native point changed')
        require(row['membership_status'] == 'unique' and len(row['point_states']) == 1, 'Ambiguous native membership requires separate triage')
        state = row['point_states'][0]['abbreviation']
        require(state in groups and row['access_verified'] is False, 'Foreign state or claimed access')
        cases = [costs[cbsa]['graph_only_cost'] for costs in baseline['cases'].values()] if cbsa in modeled else []
        groups[state].append(dict(cbsa=cbsa, name=index[cbsa]['name'], in_public_csv=index[cbsa]['included_in_existing_csv'],
                                 routed_research_lead=cbsa in modeled, retained_lead_scan=cbsa in scans,
                                 modeled_nodata_costs=sum(v is None for v in cases),
                                 review_packets=packets.get(cbsa, [])))
    def order(state):
        if state in BETA_ORDER: return (0, BETA_ORDER.index(state), state)
        return (1, min((ranks[r['cbsa']] for r in groups[state] if r['cbsa'] in ranks), default=10**9), state)
    rows = []
    for state in sorted(STATES, key=order):
        metros = groups[state]
        unknown = [r['cbsa'] for r in metros if not r['routed_research_lead']]
        rows.append(dict(state=state, work_order=len(rows)+1, native_point_qualifiers=len(metros),
                         routed_research_leads=sum(r['routed_research_lead'] for r in metros),
                         unrouted_cbsa_ids=unknown, modeled_nodata_costs=sum(r['modeled_nodata_costs'] for r in metros),
                         absent_public_csv_cbsa_ids=[r['cbsa'] for r in metros if not r['in_public_csv']],
                         metros=metros, release_eligible=False, geographic_coverage_certified=False,
                         status='blocked_on_access_coverage_and_artifact_gates',
                         next_work=('source_and_anchor_investigation' if unknown else 'independent_anchor_and_destination_access_evidence'),
                         open_release_gates=[137, 138, 139]))
    return dict(schema='state-release-work-queue-v1', jurisdiction_scope='50 states, DC and Puerto Rico; native point grouping only',
                states=rows, qualifying_identities=367, routed_research_leads=len(modeled),
                unrouted_qualifying_identities=len(ids-modeled), modeled_nodata_costs=baseline['unreachable_queries'],
                public_ready_states=0, access_certified=False, release_eligible=False,
                warning='Scheduling only. Native-point state membership is not CBSA extent, extract coverage, exterior-route closure or release approval. Empty native-state groups (including DC) are not vacuously complete. AK, HI, PR and all eight absent-public-CSV qualifiers remain explicit. No omitted competitor is excluded.')


def build():
    from connector_review_packet import validate
    from metro_competitor_review_queue import build as queue, DOMAINS
    ledger_path = ROOT/'scripts/colorado_reviewed_connectors.json'
    ledger = json.loads(ledger_path.read_text())
    require(ledger.get('schema_version') == 1 and ledger.get('approved_evidence') == [],
            'Approval ledger changed; independently review and version the state work queue')
    baseline = check_frozen()
    require(sha(DOMAINS) == baseline['domains_sha256'], 'Exact native domain bytes required')
    domains = json.loads(DOMAINS.read_text())
    state_path = ROOT/'docs/research/native-state-inventory/report.json'
    manifest = json.loads(state_path.with_name('manifest.json').read_text())
    require(sha(state_path) == manifest['report_sha256'], 'Native-state source changed')
    membership = json.loads(state_path.read_text())
    scheduling = queue(baseline, domains)
    ranks = {r['cbsa']: r['investigation_rank'] for r in scheduling['queue']}
    scans, hashes = lead_scans({r['cbsa']: r for r in domains['domains']})
    packets = {}
    inputs = {str(state_path.relative_to(ROOT)): sha(state_path), str(DOMAINS.relative_to(ROOT)): sha(DOMAINS), **hashes}
    for path in sorted((ROOT/'docs/research/connector-reviews').glob('*.json')):
        packet = json.loads(path.read_text()); validate(packet, ROOT)
        packets.setdefault(packet['cbsa'], []).append(dict(path=str(path.relative_to(ROOT)), decision=packet['decision'],
                                                           origin_policy=packet['origin_policy'], sha256=sha(path)))
        inputs[str(path.relative_to(ROOT))] = sha(path)
    result = project(baseline, domains, membership, ranks, scans, packets)
    for name in ('baseline.json', 'manifest.json'):
        p = ROOT/'docs/research/census-33-source-checkpoint'/name; inputs[str(p.relative_to(ROOT))] = sha(p)
    inputs[str(ledger_path.relative_to(ROOT))] = sha(ledger_path)
    result['input_sha256'] = dict(sorted(inputs.items()))
    return result


if __name__ == '__main__':
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--output', type=Path)
    p.add_argument('--check', type=Path)
    a = p.parse_args(); result = build()
    if a.check: require(json.loads(a.check.read_text()) == result, 'State work queue differs from retained evidence')
    if a.output: a.output.parent.mkdir(parents=True, exist_ok=True); a.output.write_text(json.dumps(result, sort_keys=True, indent=2)+'\n')
    print(json.dumps({k: result[k] for k in ('qualifying_identities', 'routed_research_leads', 'unrouted_qualifying_identities', 'modeled_nodata_costs', 'public_ready_states')}, indent=2))
