"""Parse a narrow static lane-indication grammar, never legal maneuver permissions."""
import re
from road_reference_way_permissions import _tags

POLICY='static-lane-indication-metadata-v1'
COUNT_KEYS={'lanes','lanes:forward','lanes:backward'}
TURN_KEYS={'turn:lanes','turn:lanes:forward','turn:lanes:backward'}
INDICATIONS={'left','right','through','slight_left','slight_right','sharp_left','sharp_right','reverse','merge_to_left','merge_to_right'}
MAX_LANES=16


def need(value,reason):
    if not value:raise ValueError(reason)


def parse(tags):
    _tags(tags)
    need(not any(key.startswith('busway') for key in tags),'Bus-lane operation remains unsupported')
    lane_keys={key for key in tags if key=='lanes' or key.startswith('lanes:') or ':lanes' in key}
    need(lane_keys<=COUNT_KEYS|TURN_KEYS,'Lane control outside the supported static indication/count grammar')
    need(not any(key=='turn' or key.startswith('turn:') and key not in TURN_KEYS for key in tags),'Unsupported non-lane/mode/conditional turn indication')
    counts={};raw_counts={}
    for key in sorted(COUNT_KEYS):
        if key not in tags:continue
        raw=tags[key]
        need(bool(re.fullmatch('[0-9]{1,2}',raw)) and (1 if key=='lanes' else 0)<=int(raw)<=MAX_LANES,
             'Explicit bounded static integer lane counts required')
        counts[key]=int(raw);raw_counts[key]=raw
    total=counts.get('lanes');forward=counts.get('lanes:forward');backward=counts.get('lanes:backward')
    if total is not None:
        need(all(value is None or value<=total for value in (forward,backward)),'Directional lane count exceeds total')
        if forward is not None and backward is not None:need(forward+backward==total,'Directional lane counts conflict with total')
    else:
        if forward is not None and backward is not None:need(1<=forward+backward<=MAX_LANES,'Bounded positive directional lane-count sum required')
    static_oneway='forward' if tags.get('oneway') in ('yes','true','1') else 'backward' if tags.get('oneway')=='-1' else None
    need(not ('turn:lanes' in tags and any(key in tags for key in ('turn:lanes:forward','turn:lanes:backward'))),
         'Mixed unqualified/directional indication sources require a separate precedence contract')
    rows={}
    for key in sorted(TURN_KEYS):
        if key not in tags:continue
        direction=key.rsplit(':',1)[1] if key!='turn:lanes' else static_oneway
        need(direction in ('forward','backward'),'Unqualified turn lanes require an explicit static one-way orientation')
        if key=='turn:lanes':
            need(not any(name.startswith('oneway:') for name in tags),'Unqualified guidance with mode/conditional direction context is unsupported')
        expected=counts.get('lanes:'+direction)
        if expected is None and direction==static_oneway:expected=total
        need(expected is not None and expected>0,'An indicated direction requires an explicit positive lane count')
        raw=tags[key];need(len(raw)<=2048,'Bounded raw lane indication string required')
        lanes=raw.split('|');need(len(lanes)==expected,'Lane indication cardinality must match the declared count')
        parsed=[]
        for index,value in enumerate(lanes,1):
            if value in ('','none'):tokens=[]
            else:
                tokens=value.split(';')
                need(len(tokens)<=len(INDICATIONS) and len(tokens)==len(set(tokens)) and set(tokens)<=INDICATIONS,
                     'Unknown, duplicate or ambiguous lane indication token')
            parsed.append(dict(lane_index_left_to_right_in_driving_direction=index,raw_value=value,
                               indications=tokens,indication_absent=not tokens))
        rows[direction]=dict(key=key,raw_value=raw,lanes=parsed)
    return dict(schema=POLICY,raw_lane_keys={key:tags[key] for key in sorted(lane_keys)},raw_counts=raw_counts,
        counts=counts,indications_by_raw_direction=rows,
        indications_create_turn_permissions=False,indications_create_turn_prohibitions=False,
        lane_connectivity_evaluated=False,lane_changes_evaluated=False,lane_level_graph_constructed=False,
        access_verified=False,release_eligible=False,
        scope='Static source indications/counts in the driver-facing lane order for each original raw-way direction. Empty/none means no indication, not a turn ban. No inferred lane links, car-lane occupancy, legal turning rights or absence of independent restrictions.')
