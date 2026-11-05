const fs=require('fs');
const crypto=require('crypto');
const OpeningHours=require('opening_hours');
if(require('opening_hours/package.json').version!=='3.15.0'||process.env.TZ!=='UTC')throw Error('Pinned independent parser and UTC wall-clock interpretation required');
const data=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const raw=fs.readFileSync('docs/research/fort-collins-entry-context/raw-osm-context.json');
if(data.schema!=='turn-rule-weekly-oracle-v1'||data.access_verified!==false||data.release_eligible!==false||data.topology_compiled!==false)throw Error('Explicit non-certifying clock fixture required');
if(crypto.createHash('sha256').update(raw).digest('hex')!==data.source_context_sha256)throw Error('Exact retained raw source context required');
const relation=JSON.parse(raw).restrictions.find(r=>r.id===data.source_relation_id);
if(!relation||relation.id!==20193102||'restriction' in relation.tags||data.raw_expression!==relation.tags['restriction:conditional'])throw Error('Conditional-only source identity changed');
if(data.raw_expression!=='no_u_turn @ (Th-Sa 19:00-00:00)'||data.declared_zone!=='America/Denver')throw Error('Review changed bounded source schedule');
if(data.minute_count!==10080||data.local_wall_clock_start!=='2026-10-26T00:00:00Z'||!/^[01]{10080}$/.test(data.expected_bits))throw Error('Complete declared local week required');
const independent=new OpeningHours('Th-Sa 19:00-00:00');
const start=Date.parse(data.local_wall_clock_start);
for(let i=0;i<data.minute_count;i++){
 const actual=independent.getState(new Date(start+i*60000))?'1':'0';
 if(actual!==data.expected_bits[i])throw Error('Independent rule-clock mismatch at local minute '+i);
}
console.log(JSON.stringify({independentParser:'opening_hours@3.15.0',rawRelation:20193102,weeklyMinuteComparisons:10080,topologyCompiled:false,accessCertified:false}));
